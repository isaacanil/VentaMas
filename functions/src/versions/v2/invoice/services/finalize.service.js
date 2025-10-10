import { db, FieldValue, Timestamp } from '../../../../core/config/firebase.js';

import { auditTx } from './audit.service.js';
import { scheduleCompensationsInTx } from './compensation.service.js';

async function consumeNcfIfReserved(tx, { businessId, invoice, invoiceId }) {
  const ncf = invoice?.snapshot?.ncf;
  const usageId = ncf?.usageId;
  if (!usageId) return;
  const usageRef = db.doc(`businesses/${businessId}/ncfUsage/${usageId}`);
  const usageSnap = await tx.get(usageRef);
  if (!usageSnap.exists) return;
  const data = usageSnap.data();
  if (data.status === 'used') return; // idempotente
  if (data.status === 'voided') return; // no consumir si fue anulado
  tx.update(usageRef, {
    status: 'used',
    usedAt: FieldValue.serverTimestamp(),
    invoiceId: invoiceId || invoice.id || null,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function attemptFinalizeInvoice({ businessId, invoiceId }) {
  const invoiceRef = db.doc(`businesses/${businessId}/invoicesV2/${invoiceId}`);
  const outboxCol = invoiceRef.collection('outbox');

  await db.runTransaction(async (tx) => {
    const invSnap = await tx.get(invoiceRef);
    if (!invSnap.exists) return;
    const inv = invSnap.data();
    if (inv.status === 'committed' || inv.status === 'failed') return; // idempotente

    const pendingSnap = await tx.get(outboxCol.where('status', '==', 'pending').limit(1));
    if (!pendingSnap.empty) return; // aun pendientes

    const failedSnap = await tx.get(outboxCol.where('status', '==', 'failed').limit(1));
    if (!failedSnap.empty) {
      // Programar compensaciones para tareas completadas
      await scheduleCompensationsInTx(tx, { businessId, invoiceId });
      auditTx(tx, { businessId, invoiceId, event: 'finalize_failed', level: 'warn', data: { failed: true } });
      tx.update(invoiceRef, {
        status: 'failed',
        statusTimeline: FieldValue.arrayUnion({ status: 'failed', at: Timestamp.now() }),
        updatedAt: FieldValue.serverTimestamp(),
      });
      // Opcional: marcar idempotency como failed
      if (inv.idempotencyKey) {
        const idemRef = db.doc(`businesses/${businessId}/idempotency/${inv.idempotencyKey}`);
        tx.set(
          idemRef,
          { status: 'failed', updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
      }
      return;
    }

    // Todas las tareas finalizadas -> consumir NCF (si reservado) y marcar committed
    await consumeNcfIfReserved(tx, { businessId, invoice: inv, invoiceId });

    tx.update(invoiceRef, {
      status: 'committed',
      committedAt: FieldValue.serverTimestamp(),
      statusTimeline: FieldValue.arrayUnion({ status: 'committed', at: Timestamp.now() }),
      updatedAt: FieldValue.serverTimestamp(),
    });
    auditTx(tx, { businessId, invoiceId, event: 'finalize_committed', data: { committed: true } });

    if (inv.idempotencyKey) {
      const idemRef = db.doc(`businesses/${businessId}/idempotency/${inv.idempotencyKey}`);
      tx.set(
        idemRef,
        { status: 'committed', updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
  });
}
