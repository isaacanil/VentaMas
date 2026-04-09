import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

import { db, FieldValue, Timestamp } from '../../../../core/config/firebase.js';
import {
  areOnlyNonBlockingFailures,
  buildNonBlockingFailureSummary,
  summarizeOutboxTasks,
} from '../services/failurePolicy.service.js';

let depsPromise;
async function loadDeps() {
  if (!depsPromise) {
    depsPromise = Promise.all([
      import('../services/compensation.service.js'),
      import('../services/audit.service.js'),
    ]).then(([compensationService, auditService]) => ({
      compensateAR: compensationService.compensateAR,
      compensateCreditNotes: compensationService.compensateCreditNotes,
      deleteCanonicalInvoice: compensationService.deleteCanonicalInvoice,
      detachFromCashCount: compensationService.detachFromCashCount,
      auditTx: auditService.auditTx,
      auditSafe: auditService.auditSafe,
    }));
  }
  return depsPromise;
}

export const processInvoiceCompensation = onDocumentCreated(
  {
    document:
      'businesses/{businessId}/invoicesV2/{invoiceId}/compensations/{compId}',
    region: 'us-central1',
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      logger.warn('processInvoiceCompensation missing snapshot');
      return null;
    }

    const { businessId, invoiceId, compId } = event.params;
    const comp = snap.data() || {};
    const type = comp?.type;
    const status = comp?.status;
    const compRef = snap.ref;
    const invoiceRef = db.doc(
      `businesses/${businessId}/invoicesV2/${invoiceId}`,
    );

    if (status !== 'pending') return null;

    const {
      compensateAR,
      compensateCreditNotes,
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

        const usageId = invoice?.snapshot?.ncf?.usageId;
        let usageSnap = null;
        if (usageId) {
          const usageRef = db.doc(
            `businesses/${businessId}/ncfUsage/${usageId}`,
          );
          usageSnap = await tx.get(usageRef);
        }

        const ensureCompStart = (() => {
          let logged = false;
          return () => {
            if (logged) return;
            logged = true;
            auditTx(tx, {
              businessId,
              invoiceId,
              event: 'compensation_start',
              data: { compId, type },
            });
          };
        })();

        if (type === 'setupAR') {
          const arId = cData?.result?.arId || null;
          await compensateAR(tx, { businessId, arId });
        } else if (type === 'consumeCreditNotes') {
          const creditNotes = cData?.payload?.creditNotes || [];
          const applicationIds = cData?.result?.applicationIds || [];
          await compensateCreditNotes(tx, {
            businessId,
            invoiceId,
            creditNotes,
            applicationIds,
          });
        } else if (type === 'updateInventory') {
          logger.warn('Compensacion de inventario marcada para manejo manual', {
            invoiceId,
            compId,
          });
        } else if (type === 'setupInsuranceAR') {
          const arId = cData?.result?.arId || null;
          await compensateAR(tx, { businessId, arId });
        } else if (type === 'createCanonicalInvoice') {
          const failedTasksSnap = await tx.get(
            invoiceRef.collection('outbox').where('status', '==', 'failed'),
          );
          const failedTasks = summarizeOutboxTasks(failedTasksSnap.docs);
          if (areOnlyNonBlockingFailures(failedTasks)) {
            const summary = buildNonBlockingFailureSummary(failedTasks);
            ensureCompStart();
            tx.set(
              compRef,
              {
                status: 'skipped',
                attempts: (cData.attempts || 0) + 1,
                updatedAt: FieldValue.serverTimestamp(),
                skipReason: 'non_blocking_failure_preserves_canonical',
              },
              { merge: true },
            );
            auditTx(tx, {
              businessId,
              invoiceId,
              event: 'compensation_skipped',
              data: {
                compId,
                type,
                reason: 'non_blocking_failure_preserves_canonical',
                failedTaskTypes: summary.taskTypes,
              },
            });
            return;
          }
          await deleteCanonicalInvoice(tx, { businessId, invoiceId });
        } else if (type === 'attachToCashCount') {
          const userId = cData?.payload?.userId;
          await detachFromCashCount(tx, { businessId, invoiceId, userId });
        } else if (type === 'closePreorder') {
          const canonRef = db.doc(
            `businesses/${businessId}/invoices/${invoiceId}`,
          );
          const canonSnap = await tx.get(canonRef);
          if (canonSnap.exists) {
            ensureCompStart();
            tx.set(
              canonRef,
              {
                data: {
                  history: FieldValue.arrayUnion({
                    type: 'invoice',
                    status: 'reverted',
                    date: Timestamp.now(),
                  }),
                },
              },
              { merge: true },
            );
          }
        }

        if (usageSnap && usageSnap.exists) {
          const usageData = usageSnap.data() || {};
          if (usageData.status === 'pending') {
            ensureCompStart();
            tx.update(usageSnap.ref, {
              status: 'voided',
              voidedAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }

        ensureCompStart();
        tx.set(
          compRef,
          {
            status: 'done',
            attempts: (cData.attempts || 0) + 1,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        auditTx(tx, {
          businessId,
          invoiceId,
          event: 'compensation_done',
          data: { compId, type },
        });
      });
    } catch (err) {
      logger.error('processInvoiceCompensation error', {
        invoiceId,
        compId,
        error: err,
      });
      try {
        await snap.ref.set(
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
          event: 'compensation_failed',
          level: 'error',
          data: { compId, type, error: err?.message || String(err) },
        });
      } catch {
        /* suppress audit failures to avoid retries loops */
      }
    }
    return null;
  },
);
