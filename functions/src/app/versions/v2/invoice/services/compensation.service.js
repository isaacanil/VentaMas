import { db, FieldValue } from '../../../../core/config/firebase.js';
import { unlinkSaleFromCashCountInTransaction } from '../../../../modules/cashCount/services/cashCountSales.service.js';

export async function scheduleCompensationsInTx(tx, { businessId, invoiceId }) {
  const invoiceRef = db.doc(`businesses/${businessId}/invoicesV2/${invoiceId}`);
  const outboxCol = invoiceRef.collection('outbox');
  const compCol = invoiceRef.collection('compensations');

  // Obtener tareas completadas para compensar en orden inverso
  const doneSnap = await tx.get(outboxCol.where('status', '==', 'done'));
  const tasks = doneSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Orden inverso por createdAt (aprox. orden de ejecución)
  tasks.sort(
    (a, b) =>
      (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0),
  );

  for (const t of tasks) {
    const compRef = compCol.doc();
    tx.set(compRef, {
      id: compRef.id,
      taskId: t.id,
      type: t.type,
      status: 'pending',
      attempts: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      payload: t.payload || {},
      result: t.result || {},
    });
  }
}

// Helpers de compensación
export async function compensateAR(tx, { businessId, arId }) {
  if (!arId) return;
  const arRef = db.doc(`businesses/${businessId}/accountsReceivable/${arId}`);
  const arSnap = await tx.get(arRef);
  if (!arSnap.exists) return;
  // Marcar AR como voided y cerrar
  tx.update(arRef, {
    isActive: false,
    isClosed: true,
    status: 'voided',
    updatedAt: FieldValue.serverTimestamp(),
  });
  // Opcional: borrar cuotas o marcarlas voided
  // Aquí por simplicidad marcamos installments como voided si existen
  const instCol = db.collection(
    `businesses/${businessId}/accountsReceivableInstallments`,
  );
  const instSnap = await tx.get(instCol.where('arId', '==', arId));
  instSnap.forEach((doc) => {
    tx.update(doc.ref, {
      isActive: false,
      isClosed: true,
      status: 'voided',
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function compensateCreditNotes(
  tx,
  { businessId, invoiceId, creditNotes = [], applicationIds = [] },
) {
  // Reacreditar saldos y eliminar aplicaciones si las conocemos
  for (const note of creditNotes) {
    if (!note?.id || !(Number(note?.amountUsed) > 0)) continue;
    const cnRef = db.doc(`businesses/${businessId}/creditNotes/${note.id}`);
    const cnSnap = await tx.get(cnRef);
    if (!cnSnap.exists) continue;
    const cnData = cnSnap.data();
    const currentAvailable = Number(
      cnData?.availableAmount ?? cnData?.totalAmount ?? 0,
    );
    const amount = Number(note.amountUsed);
    tx.update(cnRef, {
      availableAmount: currentAvailable + amount,
      status: 'applied', // o 'issued' si vuelve al saldo original, aquí mantenemos 'applied'
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  if (Array.isArray(applicationIds) && applicationIds.length > 0) {
    for (const appId of applicationIds) {
      const appRef = db.doc(
        `businesses/${businessId}/creditNoteApplications/${appId}`,
      );
      const appSnap = await tx.get(appRef);
      if (appSnap.exists) {
        tx.delete(appRef);
      }
    }
  } else {
    // Fallback: borrar por consulta si no hay IDs
    const appsCol = db.collection(
      `businesses/${businessId}/creditNoteApplications`,
    );
    const appsSnap = await tx.get(appsCol.where('invoiceId', '==', invoiceId));
    appsSnap.forEach((doc) => tx.delete(doc.ref));
  }
}

export async function markNcfVoidedIfPending(tx, { businessId, invoice }) {
  const usageId = invoice?.snapshot?.ncf?.usageId;
  if (!usageId) return;
  const usageRef = db.doc(`businesses/${businessId}/ncfUsage/${usageId}`);
  const usageSnap = await tx.get(usageRef);
  if (!usageSnap.exists) return;
  const data = usageSnap.data();
  if (data.status !== 'pending') return; // si ya fue usado, no revertimos
  tx.update(usageRef, {
    status: 'voided',
    voidedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteCanonicalInvoice(tx, { businessId, invoiceId }) {
  const canonRef = db.doc(`businesses/${businessId}/invoices/${invoiceId}`);
  const canonSnap = await tx.get(canonRef);
  if (canonSnap.exists) {
    tx.delete(canonRef);
  }
}

export async function detachFromCashCount(
  tx,
  { businessId, invoiceId, userId },
) {
  // Find linked cash counts through the new read model first, then legacy array fallback.
  const cashCountsCol = db.collection(`businesses/${businessId}/cashCounts`);
  const cashCountSalesCol = db.collection(
    `businesses/${businessId}/cashCountSales`,
  );
  const userRef = db.doc(`users/${userId}`);
  const invoiceDocRef = db.doc(
    `businesses/${businessId}/invoices/${invoiceId}`,
  );
  const seenCashCountIds = new Set();

  const salesSnap = await cashCountSalesCol
    .where('invoiceId', '==', invoiceId)
    .get();
  salesSnap.forEach((doc) => {
    const data = doc.data() || {};
    const cashCountId = data.cashCountId || data.cashCountRef?.id || null;
    if (!cashCountId || seenCashCountIds.has(cashCountId)) return;
    seenCashCountIds.add(cashCountId);
    unlinkSaleFromCashCountInTransaction({
      tx,
      businessId,
      cashCountId,
      invoiceId,
      invoiceRef: invoiceDocRef,
    });
  });

  // Legacy fallback: still remove from cashCount.sales for historical docs.
  const snap = await cashCountsCol
    .where('cashCount.opening.employee', '==', userRef)
    .where('cashCount.sales', 'array-contains-any', [
      invoiceDocRef,
    ])
    .get();
  snap.forEach((doc) => {
    if (seenCashCountIds.has(doc.id)) return;
    seenCashCountIds.add(doc.id);
    unlinkSaleFromCashCountInTransaction({
      tx,
      businessId,
      cashCountId: doc.id,
      invoiceId,
      cashCountRef: doc.ref,
      invoiceRef: invoiceDocRef,
    });
  });
}
