import { db, FieldValue } from '../../../../core/config/firebase.js';

/**
 * Consume notas de crédito y crea registros de aplicación en una transacción.
 * creditNotes: [{ id, amountUsed, ncf?, originalAmount? }]
 */
export async function consumeCreditNotesTx(
  tx,
  { businessId, userId, invoiceId, creditNotes = [], invoiceSnapshot = {} },
) {
  if (!Array.isArray(creditNotes) || creditNotes.length === 0)
    return { applicationIds: [] };

  const createdApplicationIds = [];

  for (const note of creditNotes) {
    if (!note?.id || !(Number(note?.amountUsed) > 0)) continue;

    const cnRef = db.doc(`businesses/${businessId}/creditNotes/${note.id}`);
    const cnSnap = await tx.get(cnRef);
    if (!cnSnap.exists) {
      throw new Error(`Nota de crédito ${note.id} no encontrada`);
    }
    const cnData = cnSnap.data();
    const currentAvailable = Number(
      cnData?.availableAmount ?? cnData?.totalAmount ?? 0,
    );
    const amountToConsume = Number(note.amountUsed);
    if (currentAvailable < amountToConsume) {
      throw new Error(
        `Saldo insuficiente en nota de crédito ${cnData?.ncf || cnData?.number || note.id}`,
      );
    }
    const newAvailable = currentAvailable - amountToConsume;

    // Update credit note balance and status
    tx.update(cnRef, {
      availableAmount: newAvailable,
      status: newAvailable === 0 ? 'fully_used' : 'applied',
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Create application record
    const appRef = db
      .collection('businesses')
      .doc(businessId)
      .collection('creditNoteApplications')
      .doc();

    const application = {
      id: appRef.id,
      creditNoteId: note.id,
      creditNoteNcf: note.ncf || cnData?.ncf || null,
      invoiceId,
      invoiceNcf:
        invoiceSnapshot?.snapshot?.ncf?.code ||
        invoiceSnapshot?.snapshot?.ncf ||
        null,
      invoiceNumber: invoiceSnapshot?.snapshot?.numberID || null,
      clientId:
        invoiceSnapshot?.snapshot?.client?.id || cnData?.client?.id || null,
      amountApplied: amountToConsume,
      previousBalance: currentAvailable,
      newBalance: newAvailable,
      appliedAt: FieldValue.serverTimestamp(),
      appliedBy: { uid: userId },
      createdAt: FieldValue.serverTimestamp(),
    };
    tx.set(appRef, application);
    createdApplicationIds.push(appRef.id);
  }
  return { applicationIds: createdApplicationIds };
}
