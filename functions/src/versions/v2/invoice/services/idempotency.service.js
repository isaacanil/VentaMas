import { db, FieldValue } from '../../../../core/config/firebase.js';

function idempotencyDocRef(businessId, key) {
  return db.doc(`businesses/${businessId}/idempotency/${key}`);
}

export async function getIdempotency(businessId, key) {
  const ref = idempotencyDocRef(businessId, key);
  const snap = await ref.get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

export async function upsertIdempotency({ businessId, key, invoiceId, payloadHash, status = 'pending' }) {
  const ref = idempotencyDocRef(businessId, key);
  await ref.set(
    {
      key,
      invoiceId,
      payloadHash,
      status,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return { key, invoiceId, status };
}

export function getIdempotencyRef(businessId, key) {
  return idempotencyDocRef(businessId, key);
}

