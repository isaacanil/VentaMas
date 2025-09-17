import { logger } from 'firebase-functions';
import { firestore } from 'firebase-functions/v1';
import { db, FieldValue } from '../../../../core/config/firebase.js';
let depsPromise;
async function loadDeps() {
  if (!depsPromise) {
    depsPromise = Promise.all([
      import('../services/compensation.service.js'),
      import('../services/audit.service.js'),
    ]).then(([compensationService, auditService]) => ({
      compensateAR: compensationService.compensateAR,
      compensateCreditNotes: compensationService.compensateCreditNotes,
      markNcfVoidedIfPending: compensationService.markNcfVoidedIfPending,
      deleteCanonicalInvoice: compensationService.deleteCanonicalInvoice,
      detachFromCashCount: compensationService.detachFromCashCount,
      auditTx: auditService.auditTx,
      auditSafe: auditService.auditSafe,
    }));
  }
  return depsPromise;
}


export const processInvoiceCompensation = firestore
  .document('businesses/{businessId}/invoicesV2/{invoiceId}/compensations/{compId}')
  .onCreate(async (snap, context) => {
    const { businessId, invoiceId, compId } = context.params;
    const comp = snap.data() || {};
    const type = comp?.type;
    const status = comp?.status;
    const compRef = snap.ref;
    const invoiceRef = db.doc(`businesses/${businessId}/invoicesV2/${invoiceId}`);

    if (status !== 'pending') return null;

    const {
      compensateAR,
      compensateCreditNotes,
      markNcfVoidedIfPending,
      deleteCanonicalInvoice,
      detachFromCashCount,
      auditTx,
      auditSafe,
    } = await loadDeps();

    try {
      await db.runTransaction(async (tx) => {
        const cSnap = await tx.get(compRef);
        const cData = cSnap.data();
        if (!cData || cData.status !== 'pending') return;

        const invoiceSnap = await tx.get(invoiceRef);
        if (!invoiceSnap.exists) return;
        const invoice = invoiceSnap.data();

        auditTx(tx, { businessId, invoiceId, event: 'compensation_start', data: { compId, type } });

        if (type === 'setupAR') {
          const arId = cData?.result?.arId || null;
          await compensateAR(tx, { businessId, arId });
        } else if (type === 'consumeCreditNotes') {
          const creditNotes = cData?.payload?.creditNotes || [];
          const applicationIds = cData?.result?.applicationIds || [];
          await compensateCreditNotes(tx, { businessId, invoiceId, creditNotes, applicationIds });
        } else if (type === 'updateInventory') {
          // Por seguridad no revertimos inventario automáticamente en v2 Fase 6 inicial.
          // Se puede implementar un compensador específico más adelante.
          logger.warn('Compensación de inventario marcada para manejo manual', { invoiceId, compId });
        } else if (type === 'setupInsuranceAR') {
          const arId = cData?.result?.arId || null;
          await compensateAR(tx, { businessId, arId });
        } else if (type === 'createCanonicalInvoice') {
          await deleteCanonicalInvoice(tx, { businessId, invoiceId });
        } else if (type === 'attachToCashCount') {
          const userId = cData?.payload?.userId;
          await detachFromCashCount(tx, { businessId, invoiceId, userId });
        } else if (type === 'closePreorder') {
          // No-op compensación: solo historial/status. Podemos dejar evidencia con otro entry si se requiere.
          // Aquí marcamos un entry de 'reverted' si el documento existe.
          const canonRef = db.doc(`businesses/${businessId}/invoices/${invoiceId}`);
          const canonSnap = await tx.get(canonRef);
          if (canonSnap.exists) {
            tx.set(
              canonRef,
              { data: { history: FieldValue.arrayUnion({ type: 'invoice', status: 'reverted', date: FieldValue.serverTimestamp() }) } },
              { merge: true }
            );
          }
        }

        // Marcar NCF como voided si sigue en pending
        await markNcfVoidedIfPending(tx, { businessId, invoice });

        tx.set(
          compRef,
          {
            status: 'done',
            attempts: (cData.attempts || 0) + 1,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        auditTx(tx, { businessId, invoiceId, event: 'compensation_done', data: { compId, type } });
      });
    } catch (err) {
      logger.error('processInvoiceCompensation error', { invoiceId, compId, error: err });
      try {
        await snap.ref.set(
          {
            status: 'failed',
            lastError: err?.message || String(err),
            attempts: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        await auditSafe({ businessId, invoiceId, event: 'compensation_failed', level: 'error', data: { compId, type, error: err?.message || String(err) } });
      } catch {}
    }
    return null;
  });

