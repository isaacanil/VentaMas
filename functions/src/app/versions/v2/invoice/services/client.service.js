import { db, FieldValue } from '../../../../core/config/firebase.js';
import {
  buildClientWritePayload,
  CLIENT_ROOT_FIELDS,
  extractNormalizedClient,
} from '../../../../modules/client/utils/clientNormalizer.js';

export async function upsertClientTx(tx, { businessId, client }) {
  if (!client || !client.id) return null;
  const ref = db.doc(`businesses/${businessId}/clients/${client.id}`);
  const snap = await tx.get(ref);
  const exists = snap.exists;
  const snapshotData = exists ? snap.data() || {} : {};
  const existingClient = exists ? extractNormalizedClient(snapshotData) : {};

  const mergedClient = {
    ...existingClient,
    ...client,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (!exists) {
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

  tx.set(ref, { ...payload, ...extras }, { merge: true });
  return { id: client.id };
}
