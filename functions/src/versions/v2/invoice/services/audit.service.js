import { db, FieldValue } from '../../../../core/config/firebase.js';

function auditCollectionRef(businessId, invoiceId) {
  return db.collection(
    `businesses/${businessId}/invoicesV2/${invoiceId}/audit`,
  );
}

export function auditTx(
  tx,
  { businessId, invoiceId, event, level = 'info', data = {} },
) {
  try {
    const col = auditCollectionRef(businessId, invoiceId);
    const ref = col.doc();
    tx.set(ref, {
      id: ref.id,
      event,
      level,
      data: sanitize(data),
      at: FieldValue.serverTimestamp(),
    });
  } catch {
    // ignore audit failures inside tx to not break business flow
  }
}

export async function auditSafe({
  businessId,
  invoiceId,
  event,
  level = 'info',
  data = {},
}) {
  try {
    const col = auditCollectionRef(businessId, invoiceId);
    const ref = col.doc();
    await ref.set({
      id: ref.id,
      event,
      level,
      data: sanitize(data),
      at: FieldValue.serverTimestamp(),
    });
  } catch {
    // swallow
  }
}

function sanitize(obj) {
  try {
    if (!obj || typeof obj !== 'object') return obj;
    const clone = JSON.parse(JSON.stringify(obj));
    // Limit big arrays
    for (const k of Object.keys(clone)) {
      if (Array.isArray(clone[k]) && clone[k].length > 10) {
        clone[k] = { length: clone[k].length, sample: clone[k].slice(0, 3) };
      }
    }
    return clone;
  } catch {
    return { note: 'unable to sanitize' };
  }
}
