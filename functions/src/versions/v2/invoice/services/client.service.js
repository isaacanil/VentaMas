import { db, FieldValue } from '../../../../core/config/firebase.js';

export async function upsertClientTx(tx, { businessId, client }) {
  if (!client || !client.id) return null;
  const ref = db.doc(`businesses/${businessId}/clients/${client.id}`);
  const snap = await tx.get(ref);
  const exists = snap.exists;
  const existing = exists ? snap.data() || {} : {};
  const payload = {
    ...existing,
    ...client,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (!exists) {
    payload.createdAt = FieldValue.serverTimestamp();
  }
  tx.set(ref, payload, { merge: true });
  return { id: client.id };
}

