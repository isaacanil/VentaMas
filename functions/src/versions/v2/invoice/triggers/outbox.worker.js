import { logger } from 'firebase-functions';
import { firestore } from 'firebase-functions/v1';
import { db, FieldValue } from '../../../../core/config/firebase.js';
import { Timestamp } from '../../../../core/config/firebase.js';

let depsPromise;
async function loadDeps() {
  if (!depsPromise) {
    depsPromise = Promise.all([
      import('../../../../modules/Inventory/services/getInventory.service.js'),
      import('../../../../modules/Inventory/services/Inventory.service.js'),
      import('../../../../modules/accountReceivable/services/getAccountReceivable.service.js'),
      import('../../../../modules/accountReceivable/services/addAccountReceivable.js'),
      import('../../../../modules/accountReceivable/services/addInstallmentsAccountReceivable.js'),
      import('../services/creditNotes.service.js'),
      import('../services/finalize.service.js'),
      import('../../../../modules/cashCount/utils/cashCountQueries.js'),
      import('../../../../modules/cashCount/utils/cashCountCheck.js'),
      import('../../../../core/utils/getNextID.js'),
      import('../services/client.service.js'),
      import('../../../../modules/insurance/services/insurance.service.js'),
      import('../../../../modules/accountReceivable/services/insuranceAuth.js'),
      import('../services/audit.service.js'),
    ]).then(([inventoryQueries, inventoryService, receivablePrereqs, addAccountReceivableMod, addInstallmentMod, creditNotesService, finalizeService, cashCountQueries, cashCountCheckMod, nextIdMod, clientService, insuranceService, insuranceAuthMod, auditService]) => {
      const cashCountHelpers = cashCountQueries?.default ?? cashCountQueries;
      return {
        collectInventoryPrereqs: inventoryQueries.collectInventoryPrereqs,
        adjustProductInventory: inventoryService.adjustProductInventory,
        collectReceivablePrereqs: receivablePrereqs.collectReceivablePrereqs,
        addAccountReceivable: addAccountReceivableMod.addAccountReceivable,
        addInstallmentReceivable: addInstallmentMod.addInstallmentReceivable,
        consumeCreditNotesTx: creditNotesService.consumeCreditNotesTx,
        attemptFinalizeInvoice: finalizeService.attemptFinalizeInvoice,
        getCashCount: cashCountHelpers,
        checkOpenCashCount: cashCountCheckMod.checkOpenCashCount,
        getNextIDTransactionalSnap: nextIdMod.getNextIDTransactionalSnap,
        applyNextIDTransactional: nextIdMod.applyNextIDTransactional,
        upsertClientTx: clientService.upsertClientTx,
        getInsurance: insuranceService.getInsurance,
        addInsuranceAuth: insuranceAuthMod.addInsuranceAuth,
        auditTx: auditService.auditTx,
        auditSafe: auditService.auditSafe,
      };
    });
  }
  return depsPromise;
}

export const processInvoiceOutbox = firestore
  .document('businesses/{businessId}/invoicesV2/{invoiceId}/outbox/{taskId}')
  .onCreate(async (snap, context) => {
    const { businessId, invoiceId, taskId } = context.params;
    const task = snap.data() || {};
    const type = task?.type;
    const status = task?.status;
    const taskRef = snap.ref;
    const invoiceRef = db.doc(`businesses/${businessId}/invoicesV2/${invoiceId}`);

    if (status !== 'pending') {
      logger.info('Outbox task not pending, skipping', { invoiceId, taskId, status });
      return null;
    }

    const {
      collectInventoryPrereqs,
      adjustProductInventory,
      collectReceivablePrereqs,
      addAccountReceivable,
      addInstallmentReceivable,
      consumeCreditNotesTx,
      attemptFinalizeInvoice,
      getCashCount,
      checkOpenCashCount,
      getNextIDTransactionalSnap,
      applyNextIDTransactional,
      upsertClientTx,
      getInsurance,
      addInsuranceAuth,
      auditTx,
      auditSafe,
    } = await loadDeps();

    try {
      await db.runTransaction(async (tx) => {
        const taskSnap = await tx.get(taskRef);
        const t = taskSnap.data();
        if (!t || t.status !== 'pending') {
          return;
        }
        const invoiceSnap = await tx.get(invoiceRef);
        if (!invoiceSnap.exists) {
          tx.set(
            taskRef,
            {
              status: 'failed',
              lastError: 'Invoice document not found',
              attempts: (t.attempts || 0) + 1,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          return;
        }

        const invoice = invoiceSnap.data();
        auditTx(tx, { businessId, invoiceId, event: 'task_start', data: { taskId, type, attempts: t.attempts || 0 } });
        if (invoice.status === 'pending') {
          tx.update(invoiceRef, {
            status: 'committing',
            statusTimeline: FieldValue.arrayUnion({ status: 'committing', at: FieldValue.serverTimestamp() }),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        const payload = t.payload || {};
        const user = { uid: payload.userId, businessID: payload.businessId || businessId };

        if (type === 'updateInventory') {
          const products = Array.isArray(payload.products) ? payload.products : [];
          if (products.length > 0) {
            const prereqs = await collectInventoryPrereqs(tx, { user, products });
            await adjustProductInventory(tx, { user, products, sale: { id: invoiceId }, inventoryPrevreqs: prereqs });
          }
          tx.update(invoiceRef, {
            statusTimeline: FieldValue.arrayUnion({ status: 'inventory_done', at: FieldValue.serverTimestamp() }),
            updatedAt: FieldValue.serverTimestamp(),
          });
          auditTx(tx, { businessId, invoiceId, event: 'task_success', data: { taskId, type } });
        } else if (type === 'createCanonicalInvoice') {
          // Idempotencia: si ya existe la factura canónica, marcar done
          const canonRef = db.doc(`businesses/${businessId}/invoices/${invoiceId}`);
          const canonSnap = await tx.get(canonRef);
          if (!canonSnap.exists) {
            // Validar cashCount abierto y obtener ID
            const ccSnap = await getCashCount.getOpenCashCountDocFromTx(tx, user);
            const { cashCount, cashCountId } = await checkOpenCashCount({ cashCountSnap: ccSnap, user });

            // Generar numberID
            const nextIdSnap = await getNextIDTransactionalSnap(tx, user, 'lastInvoiceId');
            const numberID = applyNextIDTransactional(tx, nextIdSnap, 1);

            const userRef = db.doc(`users/${user.uid}`);
            const ncfCode = invoice?.snapshot?.ncf?.code || null;
            const cart = payload.cart || {};
            const client = payload.client || invoice?.snapshot?.client || null;
            // Upsert cliente si corresponde
            if (client?.id) {
              await upsertClientTx(tx, { businessId, client });
            }
            const dueDateMs = payload?.dueDate || null;
            const dueDate = dueDateMs ? Timestamp.fromMillis(dueDateMs) : null;
            const bill = {
              ...cart,
              id: invoiceId,
              NCF: ncfCode,
              client,
              cashCountId: cashCountId,
              date: FieldValue.serverTimestamp(),
              numberID,
              userID: user.uid,
              user: userRef,
              status: 'completed',
              ...(dueDate ? { dueDate, hasDueDate: true } : {}),
            };
            if (payload?.invoiceComment) {
              bill.invoiceComment = payload.invoiceComment;
            }
            tx.set(canonRef, { data: bill }, { merge: true });
          }
          tx.update(invoiceRef, {
            statusTimeline: FieldValue.arrayUnion({ status: 'invoice_doc_done', at: FieldValue.serverTimestamp() }),
            updatedAt: FieldValue.serverTimestamp(),
          });
          auditTx(tx, { businessId, invoiceId, event: 'task_success', data: { taskId, type } });
        } else if (type === 'closePreorder') {
          // Añadir entrada de historial y asegurar status 'completed'
          const canonRef = db.doc(`businesses/${businessId}/invoices/${invoiceId}`);
          const historyEntry = {
            type: 'invoice',
            status: 'completed',
            date: FieldValue.serverTimestamp(),
            userID: user.uid,
          };
          // Usar merge para no pisar otros campos
          tx.set(
            canonRef,
            {
              data: {
                status: 'completed',
                history: FieldValue.arrayUnion(historyEntry),
              },
            },
            { merge: true }
          );
          tx.update(invoiceRef, {
            statusTimeline: FieldValue.arrayUnion({ status: 'preorder_closed', at: FieldValue.serverTimestamp() }),
            updatedAt: FieldValue.serverTimestamp(),
          });
          auditTx(tx, { businessId, invoiceId, event: 'task_success', data: { taskId, type } });
        } else if (type === 'attachToCashCount') {
          const ccSnap = await getCashCount.getOpenCashCountDocFromTx(tx, user);
          const { cashCountId } = await checkOpenCashCount({ cashCountSnap: ccSnap, user });
          const ccRef = ccSnap.ref;
          const ccData = ccSnap.data();
          const sales = ccData?.cashCount?.sales || [];
          const invoiceDocRef = db.doc(`businesses/${businessId}/invoices/${invoiceId}`);
          const already = Array.isArray(sales) && sales.some((r) => r.path === invoiceDocRef.path);
          if (!already) {
            tx.update(ccRef, {
              'cashCount.sales': FieldValue.arrayUnion(invoiceDocRef),
            });
          }
          tx.update(invoiceRef, {
            statusTimeline: FieldValue.arrayUnion({ status: 'cash_count_done', at: FieldValue.serverTimestamp() }),
            updatedAt: FieldValue.serverTimestamp(),
          });
          auditTx(tx, { businessId, invoiceId, event: 'task_success', data: { taskId, type } });
        } else if (type === 'setupAR') {
          const ar = payload.ar || null;
          if (ar && Number(ar?.totalInstallments) > 0) {
            const { accountReceivableNextIDSnap } = await collectReceivablePrereqs(tx, { user, accountsReceivable: ar });
            const arRecord = await addAccountReceivable(tx, { user, ar, accountReceivableNextIDSnap });
            await addInstallmentReceivable(tx, { user, ar: arRecord });
            tx.set(taskRef, { result: { arId: arRecord.id } }, { merge: true });
          }
          tx.update(invoiceRef, {
            statusTimeline: FieldValue.arrayUnion({ status: 'ar_done', at: FieldValue.serverTimestamp() }),
            updatedAt: FieldValue.serverTimestamp(),
          });
          auditTx(tx, { businessId, invoiceId, event: 'task_success', data: { taskId, type } });
        } else if (type === 'consumeCreditNotes') {
          const creditNotes = Array.isArray(payload.creditNotes) ? payload.creditNotes : [];
          if (creditNotes.length > 0) {
            const res = await consumeCreditNotesTx(tx, {
              businessId,
              userId: user.uid,
              invoiceId,
              creditNotes,
              invoiceSnapshot: invoice,
            });
            if (res?.applicationIds?.length) {
              tx.set(taskRef, { result: { applicationIds: res.applicationIds } }, { merge: true });
            }
          }
          tx.update(invoiceRef, {
            statusTimeline: FieldValue.arrayUnion({ status: 'credit_notes_done', at: FieldValue.serverTimestamp() }),
            updatedAt: FieldValue.serverTimestamp(),
          });
          auditTx(tx, { businessId, invoiceId, event: 'task_success', data: { taskId, type } });
        } else if (type === 'setupInsuranceAR') {
          const insAR = payload.insuranceAR || null;
          const insAuth = payload.insuranceAuth || null;
          const clientId = payload.clientId || invoice?.snapshot?.client?.id || null;
          if (insAR && insAuth && clientId && Number(insAR?.totalInstallments) > 0) {
            // Obtener nextID para AR
            const { accountReceivableNextIDSnap } = await collectReceivablePrereqs(tx, { user, accountsReceivable: insAR });
            // Obtener datos del seguro
            const insuranceData = await getInsurance(tx, { user, insuranceId: insAuth.insuranceId });
            const insuranceName = insuranceData?.name || insuranceData?.insuranceName || 'Seguro';
            // Crear auth de seguro
            const authId = await addInsuranceAuth(tx, { user, authData: insAuth, clientId });

            // Normalizar AR de seguros
            const nowMs = Date.now();
            const normalizedAR = {
              ...insAR,
              invoiceId,
              clientId,
              paymentFrequency: insAR.paymentFrequency || 'monthly',
              totalInstallments: Number(insAR.totalInstallments) || 1,
              installmentAmount: Number(insAR.installmentAmount) || 0,
              totalReceivable: Number(insAR.totalReceivable) || 0,
              currentBalance: Number(insAR.currentBalance || insAR.totalReceivable) || 0,
              createdAt: insAR.createdAt || nowMs,
              updatedAt: insAR.updatedAt || nowMs,
              paymentDate: insAR.paymentDate || null,
              isActive: insAR.isActive !== undefined ? insAR.isActive : true,
              isClosed: insAR.isClosed !== undefined ? insAR.isClosed : false,
              type: 'insurance',
              insurance: {
                authId,
                name: insuranceName,
                insuranceId: insAuth.insuranceId,
                authNumber: insAuth.authNumber,
              },
              comments: insAR.comments || '',
            };

            const arRecord = await addAccountReceivable(tx, { user, ar: normalizedAR, accountReceivableNextIDSnap });
            await addInstallmentReceivable(tx, { user, ar: arRecord });
            tx.set(taskRef, { result: { arId: arRecord.id, authId } }, { merge: true });
          }
          tx.update(invoiceRef, {
            statusTimeline: FieldValue.arrayUnion({ status: 'insurance_ar_done', at: FieldValue.serverTimestamp() }),
            updatedAt: FieldValue.serverTimestamp(),
          });
          auditTx(tx, { businessId, invoiceId, event: 'task_success', data: { taskId, type } });
        } else {
          // Unsupported types: mark as done to avoid deadlocks
          logger.info('Unsupported outbox type, marking done', { taskId, type });
        }

        tx.set(
          taskRef,
          {
            status: 'done',
            processedAt: FieldValue.serverTimestamp(),
            attempts: (t.attempts || 0) + 1,
            lastError: null,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });
      // Intentar commit final post-tarea (si quedan pendientes, no hará nada)
      try {
        await attemptFinalizeInvoice({ businessId, invoiceId });
      } catch (e) {
        logger.error('attemptFinalizeInvoice error', { invoiceId, taskId, error: e });
      }
    } catch (err) {
      logger.error('processInvoiceOutbox error', { invoiceId, taskId, error: err });
      try {
        await taskRef.set(
          {
            status: 'failed',
            lastError: err?.message || String(err),
            attempts: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        await auditSafe({ businessId, invoiceId, event: 'task_failed', level: 'error', data: { taskId, type, error: err?.message || String(err) } });
      } catch {}
    }
    return null;
  });

