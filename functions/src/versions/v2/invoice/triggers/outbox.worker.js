import { logger } from 'firebase-functions';
import { firestore } from 'firebase-functions/v1';

import { db, FieldValue, Timestamp } from '../../../../core/config/firebase.js';
import {
  buildClientWritePayload,
  CLIENT_ROOT_FIELDS,
  extractNormalizedClient,
} from '../../../../modules/client/utils/clientNormalizer.js';

let depsPromise;
async function loadDeps() {
  if (!depsPromise) {
    depsPromise = Promise.all([
      import('../../../../modules/Inventory/services/getInventory.service.js'),
      import('../../../../modules/Inventory/services/Inventory.service.js'),
      import(
        '../../../../modules/accountReceivable/services/getAccountReceivable.service.js'
      ),
      import(
        '../../../../modules/accountReceivable/services/addAccountReceivable.js'
      ),
      import(
        '../../../../modules/accountReceivable/services/addInstallmentsAccountReceivable.js'
      ),
      import('../services/creditNotes.service.js'),
      import('../services/finalize.service.js'),
      import('../../../../modules/cashCount/utils/cashCountQueries.js'),
      import('../../../../modules/cashCount/utils/cashCountCheck.js'),
      import('../../../../core/utils/getNextID.js'),
      import('../../../../modules/insurance/services/insurance.service.js'),
      import('../../../../modules/accountReceivable/services/insuranceAuth.js'),
      import('../services/audit.service.js'),
    ]).then(
      ([
        inventoryQueries,
        inventoryService,
        receivablePrereqs,
        addAccountReceivableMod,
        addInstallmentMod,
        creditNotesService,
        finalizeService,
        cashCountQueries,
        cashCountCheckMod,
        nextIdMod,
        insuranceService,
        insuranceAuthMod,
        auditService,
      ]) => {
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
          getInsurance: insuranceService.getInsurance,
          addInsuranceAuth: insuranceAuthMod.addInsuranceAuth,
          auditTx: auditService.auditTx,
          auditSafe: auditService.auditSafe,
        };
      },
    );
  }
  return depsPromise;
}

const normalizeTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Timestamp) return value;
  if (typeof value.toMillis === 'function') {
    return Timestamp.fromMillis(value.toMillis());
  }
  if (value instanceof Date) {
    return Timestamp.fromMillis(value.getTime());
  }
  if (typeof value.toDate === 'function') {
    const dateValue = value.toDate();
    if (dateValue instanceof Date) {
      return Timestamp.fromMillis(dateValue.getTime());
    }
  }
  if (typeof value === 'number') {
    return Timestamp.fromMillis(value);
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return Timestamp.fromMillis(parsed);
    }
    return null;
  }
  if (typeof value === 'object') {
    const seconds =
      typeof value.seconds === 'number'
        ? value.seconds
        : typeof value._seconds === 'number'
          ? value._seconds
          : null;
    const nanos =
      typeof value.nanoseconds === 'number'
        ? value.nanoseconds
        : typeof value._nanoseconds === 'number'
          ? value._nanoseconds
          : null;
    if (seconds != null && nanos != null) {
      return new Timestamp(seconds, nanos);
    }
  }
  return null;
};

export const processInvoiceOutbox = firestore
  .document('businesses/{businessId}/invoicesV2/{invoiceId}/outbox/{taskId}')
  .onCreate(async (snap, context) => {
    const { businessId, invoiceId, taskId } = context.params;
    const task = snap.data() || {};
    const type = task?.type;
    const status = task?.status;
    const taskRef = snap.ref;
    const invoiceRef = db.doc(
      `businesses/${businessId}/invoicesV2/${invoiceId}`,
    );

    if (status !== 'pending') {
      logger.info('Outbox task not pending, skipping', {
        invoiceId,
        taskId,
        status,
      });
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
            { merge: true },
          );
          return;
        }

        const invoice = invoiceSnap.data();
        let invoiceStatus = invoice?.status || null;
        const ensureTaskStart = (() => {
          let logged = false;
          return () => {
            if (logged) return;
            logged = true;
            auditTx(tx, {
              businessId,
              invoiceId,
              event: 'task_start',
              data: { taskId, type, attempts: t.attempts || 0 },
            });
            if (invoiceStatus === 'pending') {
              tx.update(invoiceRef, {
                status: 'committing',
                statusTimeline: FieldValue.arrayUnion({
                  status: 'committing',
                  at: Timestamp.now(),
                }),
                updatedAt: FieldValue.serverTimestamp(),
              });
              invoiceStatus = 'committing';
            }
          };
        })();

        const payload = t.payload || {};
        const user = {
          uid: payload.userId,
          businessID: payload.businessId || businessId,
        };

        if (type === 'updateInventory') {
          const products = Array.isArray(payload.products)
            ? payload.products
            : [];
          let inventoryPrereqs = [];
          if (products.length > 0) {
            inventoryPrereqs = await collectInventoryPrereqs(tx, {
              user,
              products,
            });
          }
          ensureTaskStart();
          if (products.length > 0) {
            await adjustProductInventory(tx, {
              user,
              products,
              sale: { id: invoiceId },
              inventoryPrevreqs: inventoryPrereqs,
            });
          }
          tx.update(invoiceRef, {
            statusTimeline: FieldValue.arrayUnion({
              status: 'inventory_done',
              at: Timestamp.now(),
            }),
            updatedAt: FieldValue.serverTimestamp(),
          });
          auditTx(tx, {
            businessId,
            invoiceId,
            event: 'task_success',
            data: { taskId, type },
          });
        } else if (type === 'createCanonicalInvoice') {
          const canonRef = db.doc(
            `businesses/${businessId}/invoices/${invoiceId}`,
          );
          const canonSnap = await tx.get(canonRef);
          const existingCanon = canonSnap.exists
            ? canonSnap.data()?.data || {}
            : {};
          const cart = payload.cart || {};
          const client = payload.client || invoice?.snapshot?.client || null;
          const userRef = db.doc(`users/${user.uid}`);
          const dueDateMs = payload?.dueDate || null;
          const dueDateTs = dueDateMs ? Timestamp.fromMillis(dueDateMs) : null;
          const ncfCode =
            invoice?.snapshot?.ncf?.code ||
            cart?.NCF ||
            existingCanon?.NCF ||
            null;

          const alreadyFrontendReady =
            invoiceStatus === 'frontend_ready' ||
            Boolean(invoice?.frontendReadyAt);

          let clientRef = null;
          let clientSnap = null;
          if (client?.id) {
            clientRef = db.doc(`businesses/${businessId}/clients/${client.id}`);
            clientSnap = await tx.get(clientRef);
          }

          const preferredCashCountId =
            payload?.preferredCashCountId ||
            payload?.cashCountId ||
            payload?.cart?.cashCountId ||
            invoice?.snapshot?.meta?.cashCount?.intendedCashCountId ||
            null;

          let cashCountId =
            existingCanon?.cashCountId ||
            cart?.cashCountId ||
            preferredCashCountId ||
            null;
          if (!cashCountId) {
            const ccSnap = await getCashCount.getOpenCashCountDocFromTx(
              tx,
              user,
            );
            const openCashCount = await checkOpenCashCount({
              cashCountSnap: ccSnap,
              user,
            });
            cashCountId = openCashCount?.cashCountId || null;
          }

          let numberID = existingCanon?.numberID || cart?.numberID || null;
          if (!numberID) {
            const nextIdSnap = await getNextIDTransactionalSnap(
              tx,
              user,
              'lastInvoiceId',
            );
            numberID = applyNextIDTransactional(tx, nextIdSnap, 1);
          }

          ensureTaskStart();

          if (clientRef) {
            const snapshotData = clientSnap?.exists
              ? clientSnap.data() || {}
              : {};
            const existingClient = clientSnap?.exists
              ? extractNormalizedClient(snapshotData)
              : {};
            const mergedClient = {
              ...existingClient,
              ...client,
              updatedAt: FieldValue.serverTimestamp(),
            };
            if (!clientSnap?.exists) {
              mergedClient.createdAt = FieldValue.serverTimestamp();
            }

            const { payload } = buildClientWritePayload(mergedClient);
            const extras = {};
            for (const [key, value] of Object.entries(snapshotData)) {
              if (key === 'client') continue;
              if (!CLIENT_ROOT_FIELDS.has(key)) {
                extras[key] = value;
              }
            }

            tx.set(clientRef, { ...payload, ...extras }, { merge: true });
          }

          const historyFromCart = Array.isArray(cart?.history)
            ? cart.history
            : [];
          const historyExisting = Array.isArray(existingCanon?.history)
            ? existingCanon.history
            : [];
          const mergedHistory = (() => {
            const result = [];
            const dedupe = new Set();
            for (const entry of [...historyFromCart, ...historyExisting]) {
              if (!entry || typeof entry !== 'object') continue;
              const key = JSON.stringify(entry);
              if (dedupe.has(key)) continue;
              dedupe.add(key);
              result.push(entry);
            }
            return result;
          })();

          const statusCandidates = [cart?.status, existingCanon?.status].filter(
            Boolean,
          );
          const resolvedStatus =
            statusCandidates.find((status) => status && status !== 'pending') ||
            'completed';
          const canonicalDateTs = normalizeTimestamp(existingCanon?.date);
          const cartDateTs = normalizeTimestamp(cart?.date);
          const snapshotDateTs = normalizeTimestamp(invoice?.snapshot?.createdAt);
          const payloadSnapshotDateTs = normalizeTimestamp(
            payload?.cart?.createdAt,
          );
          const invoiceCreatedTs = normalizeTimestamp(invoice?.createdAt);
          const fallbackDate =
            cartDateTs ||
            snapshotDateTs ||
            payloadSnapshotDateTs ||
            invoiceCreatedTs ||
            null;
          let resolvedDate = canonicalDateTs || fallbackDate;
          if (
            canonicalDateTs &&
            fallbackDate &&
            fallbackDate.toMillis() < canonicalDateTs.toMillis()
          ) {
            resolvedDate = fallbackDate;
          }
          if (!resolvedDate) {
            resolvedDate = FieldValue.serverTimestamp();
          }
          const resolvedDueDate = dueDateTs || existingCanon?.dueDate || null;
          const resolvedInvoiceComment =
            payload?.invoiceComment ??
            existingCanon?.invoiceComment ??
            cart?.invoiceComment ??
            null;
          const resolvedClient =
            client || existingCanon?.client || cart?.client || null;
          const resolvedNcf =
            ncfCode || existingCanon?.NCF || cart?.NCF || null;
          const resolvedCashCountId =
            cashCountId ||
            existingCanon?.cashCountId ||
            cart?.cashCountId ||
            preferredCashCountId ||
            null;

          // Logic: payment.value (cart payment) -> totalPaid (explicit) -> 0 (default)
          // We avoid falling back to totalPurchase.value to correctly handle credit sales where paid < total.
          const rawTotalPaid = Number(cart?.payment?.value ?? cart?.totalPaid ?? 0);
          const initialTotalPaid = Number.isFinite(rawTotalPaid) ? rawTotalPaid : 0;

          const canonicalData = {
            ...cart,
            id: invoiceId,
            status: resolvedStatus,
            userID: user.uid,
            user: userRef,
            date: resolvedDate,
            accumulatedPaid: existingCanon.accumulatedPaid ?? initialTotalPaid,
            paymentHistory: existingCanon.paymentHistory ?? [],
          };

          if (resolvedNcf) {
            canonicalData.NCF = resolvedNcf;
          }

          if (resolvedClient) {
            canonicalData.client = resolvedClient;
          }

          if (resolvedCashCountId) {
            canonicalData.cashCountId = resolvedCashCountId;
          }

          if (numberID != null) {
            canonicalData.numberID = numberID;
          }

          if (resolvedDueDate) {
            canonicalData.dueDate = resolvedDueDate;
            canonicalData.hasDueDate = true;
          }

          if (
            resolvedInvoiceComment !== undefined &&
            resolvedInvoiceComment !== null
          ) {
            canonicalData.invoiceComment = resolvedInvoiceComment;
          }

          if (mergedHistory.length > 0) {
            canonicalData.history = mergedHistory;
          }

          if (
            canonicalData.preorderDetails &&
            typeof canonicalData.preorderDetails === 'object'
          ) {
            canonicalData.preorderDetails = {
              ...canonicalData.preorderDetails,
              status: resolvedStatus,
            };
          }

          const sanitizedCanonicalData = Object.fromEntries(
            Object.entries(canonicalData).filter(
              ([, value]) => value !== undefined,
            ),
          );

          tx.set(canonRef, { data: sanitizedCanonicalData }, { merge: true });

          const timelineEntries = [
            { status: 'invoice_doc_done', at: Timestamp.now() },
          ];
          if (!alreadyFrontendReady) {
            timelineEntries.push({
              status: 'frontend_ready',
              at: Timestamp.now(),
            });
          }

          const updatePayload = {
            statusTimeline: FieldValue.arrayUnion(...timelineEntries),
            updatedAt: FieldValue.serverTimestamp(),
          };

          if (!alreadyFrontendReady) {
            updatePayload.status = 'frontend_ready';
            updatePayload.frontendReadyAt = FieldValue.serverTimestamp();
          }

          tx.update(invoiceRef, updatePayload);

          if (!alreadyFrontendReady) {
            invoiceStatus = 'frontend_ready';
          }

          if (!alreadyFrontendReady && invoice?.idempotencyKey) {
            const idemRef = db.doc(
              `businesses/${businessId}/idempotency/${invoice.idempotencyKey}`,
            );
            tx.set(
              idemRef,
              {
                status: 'frontend_ready',
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
          }
          auditTx(tx, {
            businessId,
            invoiceId,
            event: 'task_success',
            data: { taskId, type },
          });
        } else if (type === 'closePreorder') {
          ensureTaskStart();
          const canonRef = db.doc(
            `businesses/${businessId}/invoices/${invoiceId}`,
          );
          const historyEntry = {
            type: 'invoice',
            status: 'completed',
            date: Timestamp.now(),
            userID: user.uid,
          };
          tx.set(
            canonRef,
            {
              data: {
                status: 'completed',
                history: FieldValue.arrayUnion(historyEntry),
              },
            },
            { merge: true },
          );
          tx.update(invoiceRef, {
            statusTimeline: FieldValue.arrayUnion({
              status: 'preorder_closed',
              at: Timestamp.now(),
            }),
            updatedAt: FieldValue.serverTimestamp(),
          });
          auditTx(tx, {
            businessId,
            invoiceId,
            event: 'task_success',
            data: { taskId, type },
          });
        } else if (type === 'attachToCashCount') {
          const metaCashCount = invoice?.snapshot?.meta?.cashCount || {};
          const normalizeCashCountId = (value) => {
            if (!value) return null;
            if (typeof value === 'string') {
              const trimmed = value.trim();
              return trimmed || null;
            }
            if (typeof value === 'object') {
              if (typeof value.id === 'string' && value.id.trim()) {
                return value.id.trim();
              }
              if (typeof value.path === 'string' && value.path.trim()) {
                const segments = value.path.split('/');
                return segments[segments.length - 1] || null;
              }
            }
            return null;
          };
          const invoiceDocRef = db.doc(
            `businesses/${businessId}/invoices/${invoiceId}`,
          );
          const cashCountsCol = db.collection(
            `businesses/${businessId}/cashCounts`,
          );
          let ccSnap = null;
          let usedPreferred = false;

          try {
            const existingLinkSnap = await tx.get(
              cashCountsCol
                .where('cashCount.sales', 'array_contains', invoiceDocRef)
                .limit(1),
            );
            if (!existingLinkSnap.empty) {
              ccSnap = existingLinkSnap.docs[0];
              logger.info('Invoice already linked to cash count', {
                businessId,
                invoiceId,
                cashCountId: ccSnap.id,
              });
            }
          } catch (existingLinkError) {
            logger.error('Failed to verify existing cash count link', {
              businessId,
              invoiceId,
              error: existingLinkError?.message || String(existingLinkError),
            });
          }

          const candidateIdsRaw = [
            payload?.preferredCashCountId,
            payload?.cashCountId,
            payload?.cart?.cashCountId,
            metaCashCount?.resolvedCashCountId,
            metaCashCount?.intendedCashCountId,
            metaCashCount?.cashCountId,
            invoice?.snapshot?.cashCountIdHint,
          ];
          try {
            const canonicalSnap = await tx.get(invoiceDocRef);
            if (canonicalSnap.exists) {
              const canonicalData = canonicalSnap.data()?.data || {};
              candidateIdsRaw.push(
                canonicalData?.cashCountId ||
                  canonicalData?.cashCountID ||
                  canonicalData?.cashCount?.id ||
                  null,
              );
            }
          } catch (canonError) {
            logger.warn('Unable to read canonical invoice for cash count hint', {
              businessId,
              invoiceId,
              error: canonError?.message || String(canonError),
            });
          }

          const seenCashCountIds = new Set();
          const candidateIds = candidateIdsRaw
            .map((candidate) => normalizeCashCountId(candidate))
            .filter((candidate) => {
              if (!candidate) return false;
              if (seenCashCountIds.has(candidate)) {
                return false;
              }
              seenCashCountIds.add(candidate);
              return true;
            });

          if (!ccSnap) {
            for (const candidateId of candidateIds) {
              try {
                ccSnap = await getCashCount.getCashCountDocByIdFromTx(
                  tx,
                  user,
                  candidateId,
                );
                usedPreferred = true;
                break;
              } catch (error) {
                logger.warn('Candidate cash count unavailable', {
                  businessId,
                  invoiceId,
                  candidateId,
                  error: error?.message || String(error),
                });
              }
            }
          }

          if (!ccSnap) {
            try {
              const fallbackSnap =
                await getCashCount.getOpenCashCountDocFromTx(tx, user);
              await checkOpenCashCount({
                cashCountSnap: fallbackSnap,
                user,
              });
              ccSnap = fallbackSnap;
              logger.info('Fallback cash count resolved for invoice', {
                businessId,
                invoiceId,
                cashCountId: ccSnap?.id || null,
              });
            } catch (fallbackError) {
              logger.error('Fallback cash count lookup failed', {
                businessId,
                invoiceId,
                error: fallbackError?.message || String(fallbackError),
              });
            }
          }

          if (!ccSnap) {
            throw new Error('cash_count_not_found');
          }

          ensureTaskStart();
          const ccRef = ccSnap.ref;
          const ccData = ccSnap.data();
          const ccPayload = ccData?.cashCount || {};
          const ccState = ccPayload?.state || null;
          const resolvedCashCountId =
            ccPayload?.id || ccPayload?.cashCountId || ccRef.id;
          const sales = ccPayload?.sales || [];
          const already =
            Array.isArray(sales) &&
            sales.some((r) => r.path === invoiceDocRef.path);
          if (!already) {
            tx.update(ccRef, {
              'cashCount.sales': FieldValue.arrayUnion(invoiceDocRef),
            });
          }
          const timelineEntries = [
            {
              status: 'cash_count_done',
              at: Timestamp.now(),
            },
          ];
          if (usedPreferred && ccState && ccState !== 'open') {
            timelineEntries.push({
              status: 'cash_count_relinked',
              at: Timestamp.now(),
            });
          }
          const cashCountUpdate = {
            statusTimeline: FieldValue.arrayUnion(...timelineEntries),
            updatedAt: FieldValue.serverTimestamp(),
          };
          if (resolvedCashCountId) {
            cashCountUpdate['snapshot.meta.cashCount.resolvedCashCountId'] =
              resolvedCashCountId;
            cashCountUpdate['snapshot.meta.cashCount.resolvedState'] = ccState;
            cashCountUpdate['snapshot.meta.cashCount.relinkedAt'] =
              FieldValue.serverTimestamp();
          }
          tx.update(invoiceRef, cashCountUpdate);
          auditTx(tx, {
            businessId,
            invoiceId,
            event: 'task_success',
            data: { taskId, type },
          });
        } else if (type === 'setupAR') {
          const ar = payload.ar || null;
          const totalInstallments = Number(ar?.totalInstallments) || 0;
          let existingArId = null;
          if (totalInstallments > 0 && invoiceId) {
            try {
              const existingQuery = db
                .collection(`businesses/${businessId}/accountsReceivable`)
                .where('invoiceId', '==', invoiceId)
                .limit(1);
              const existingSnap = await tx.get(existingQuery);
              if (!existingSnap.empty) {
                existingArId = existingSnap.docs[0].id;
                logger.info('Invoice already has accounts receivable, skipping creation', {
                  businessId,
                  invoiceId,
                  existingArId,
                });
              }
            } catch (lookupError) {
              logger.error('Failed to verify existing accounts receivable', {
                businessId,
                invoiceId,
                error: lookupError?.message || String(lookupError),
              });
            }
          }
          let accountReceivableNextIDSnap = null;
          if (totalInstallments > 0 && !existingArId) {
            const prereqs = await collectReceivablePrereqs(tx, {
              user,
              accountsReceivable: ar,
            });
            accountReceivableNextIDSnap =
              prereqs?.accountReceivableNextIDSnap || null;
          }
          ensureTaskStart();
          if (
            totalInstallments > 0 &&
            accountReceivableNextIDSnap &&
            !existingArId
          ) {
            const normalizedAr = {
              ...ar,
              invoiceId,
            };
            const arRecord = await addAccountReceivable(tx, {
              user,
              ar: normalizedAr,
              accountReceivableNextIDSnap,
            });
            await addInstallmentReceivable(tx, { user, ar: arRecord });
            tx.set(taskRef, { result: { arId: arRecord.id } }, { merge: true });
            existingArId = arRecord.id;
          } else if (existingArId) {
            tx.set(
              taskRef,
              { result: { arId: existingArId }, skipped: true },
              { merge: true },
            );
            auditTx(tx, {
              businessId,
              invoiceId,
              event: 'task_skip',
              data: { taskId, type, reason: 'receivable_already_exists', existingArId },
            });
          }
          tx.update(invoiceRef, {
            statusTimeline: FieldValue.arrayUnion({
              status: 'ar_done',
              at: Timestamp.now(),
            }),
            updatedAt: FieldValue.serverTimestamp(),
          });
          auditTx(tx, {
            businessId,
            invoiceId,
            event: 'task_success',
            data: { taskId, type },
          });
        } else if (type === 'consumeCreditNotes') {
          const creditNotes = Array.isArray(payload.creditNotes)
            ? payload.creditNotes
            : [];
          let consumeResult = null;
          if (creditNotes.length > 0) {
            consumeResult = await consumeCreditNotesTx(tx, {
              businessId,
              userId: user.uid,
              invoiceId,
              creditNotes,
              invoiceSnapshot: invoice,
            });
          }
          ensureTaskStart();
          if (consumeResult?.applicationIds?.length) {
            tx.set(
              taskRef,
              { result: { applicationIds: consumeResult.applicationIds } },
              { merge: true },
            );
          }
          tx.update(invoiceRef, {
            statusTimeline: FieldValue.arrayUnion({
              status: 'credit_notes_done',
              at: Timestamp.now(),
            }),
            updatedAt: FieldValue.serverTimestamp(),
          });
          auditTx(tx, {
            businessId,
            invoiceId,
            event: 'task_success',
            data: { taskId, type },
          });
        } else if (type === 'setupInsuranceAR') {
          const insAR = payload.insuranceAR || null;
          const insAuth = payload.insuranceAuth || null;
          const clientId =
            payload.clientId || invoice?.snapshot?.client?.id || null;
          let accountReceivableNextIDSnap = null;
          let insuranceData = null;
          let authId = null;
          if (
            insAR &&
            insAuth &&
            clientId &&
            Number(insAR?.totalInstallments) > 0
          ) {
            const prereqs = await collectReceivablePrereqs(tx, {
              user,
              accountsReceivable: insAR,
            });
            accountReceivableNextIDSnap =
              prereqs?.accountReceivableNextIDSnap || null;
            insuranceData = await getInsurance(tx, {
              user,
              insuranceId: insAuth.insuranceId,
            });
            authId = await addInsuranceAuth(tx, {
              user,
              authData: insAuth,
              clientId,
            });
            ensureTaskStart();
            const insuranceName =
              insuranceData?.name || insuranceData?.insuranceName || 'Seguro';
            const nowMs = Date.now();
            const normalizedAR = {
              ...insAR,
              invoiceId,
              clientId,
              paymentFrequency: insAR.paymentFrequency || 'monthly',
              totalInstallments: Number(insAR.totalInstallments) || 1,
              installmentAmount: Number(insAR.installmentAmount) || 0,
              totalReceivable: Number(insAR.totalReceivable) || 0,
              currentBalance:
                Number(insAR.currentBalance || insAR.totalReceivable) || 0,
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
            if (accountReceivableNextIDSnap) {
              const arRecord = await addAccountReceivable(tx, {
                user,
                ar: normalizedAR,
                accountReceivableNextIDSnap,
              });
              await addInstallmentReceivable(tx, { user, ar: arRecord });
              tx.set(
                taskRef,
                { result: { arId: arRecord.id, authId } },
                { merge: true },
              );
            }
          } else {
            ensureTaskStart();
          }
          tx.update(invoiceRef, {
            statusTimeline: FieldValue.arrayUnion({
              status: 'insurance_ar_done',
              at: Timestamp.now(),
            }),
            updatedAt: FieldValue.serverTimestamp(),
          });
          auditTx(tx, {
            businessId,
            invoiceId,
            event: 'task_success',
            data: { taskId, type },
          });
        } else {
          ensureTaskStart();
          logger.info('Unsupported outbox type, marking done', {
            taskId,
            type,
          });
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
          { merge: true },
        );
      });
      try {
        await attemptFinalizeInvoice({ businessId, invoiceId });
      } catch (e) {
        logger.error('attemptFinalizeInvoice error', {
          invoiceId,
          taskId,
          error: e,
        });
      }
    } catch (err) {
      logger.error('processInvoiceOutbox error', {
        invoiceId,
        taskId,
        error: err,
      });
      try {
        await taskRef.set(
          {
            status: 'failed',
            lastError: err?.message || String(err),
            attempts: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        await auditSafe({
          businessId,
          invoiceId,
          event: 'task_failed',
          level: 'error',
          data: { taskId, type, error: err?.message || String(err) },
        });
      } catch {
        /* suppress audit failure to keep worker running */
      }
    }
    return null;
  });
