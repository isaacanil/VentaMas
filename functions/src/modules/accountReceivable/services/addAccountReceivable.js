import { https } from 'firebase-functions';
import { nanoid } from 'nanoid';

import { db, Timestamp } from '../../../core/config/firebase.js';
import { applyNextIDTransactional } from '../../../core/utils/getNextID.js';

/**
 * Adds an Accounts Receivable record under a business.
 * @param {Object} user - Contains uid and businessID
 * @param {Object} ar - Data for AR: totalReceivable, createdAt, updatedAt, paymentDate in ms
 * @returns {Promise<Object>} The created AR record.
 */
export async function addAccountReceivable(
  tx,
  { user, ar, accountReceivableNextIDSnap },
) {
  if (!user?.businessID || !user?.uid) {
    throw new https.HttpsError(
      'invalid-argument',
      'Usuario no válido o sin businessID',
    );
  }
  if (!ar) {
    throw new https.HttpsError(
      'invalid-argument',
      'Datos de cuentas por cobrar requeridos',
    );
  }
  const normalizeMillis = (value, { fallback = null } = {}) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (value instanceof Date) {
      const ms = value.getTime();
      return Number.isFinite(ms) ? ms : fallback;
    }
    if (value && typeof value.toMillis === 'function') {
      const ms = value.toMillis();
      return Number.isFinite(ms) ? ms : fallback;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  };

  const createdAtMs = normalizeMillis(ar.createdAt, { fallback: Date.now() });
  const updatedAtMs = normalizeMillis(ar.updatedAt, {
    fallback: createdAtMs,
  });
  const paymentDateMs = normalizeMillis(ar.paymentDate);
  const lastPaymentDateMs = normalizeMillis(ar.lastPaymentDate);

  // Generate unique ID and serial number
  const id = nanoid();
  // const numberId = await getNextIDTransactional(tx, user, 'lastAccountReceivableId');
  const numberId = applyNextIDTransactional(tx, accountReceivableNextIDSnap);
  const arRef = db.doc(
    `businesses/${user.businessID}/accountsReceivable/${id}`,
  );

  // Construct the AR payload
  const arRecord = {
    ...ar,
    arBalance: ar.totalReceivable,
    numberId,
    id,
    createdBy: user.uid,
    updatedBy: user.uid,
    createdAt: createdAtMs,
    updatedAt: updatedAtMs,
    paymentDate: paymentDateMs,
    lastPaymentDate: lastPaymentDateMs,
  };

  // Convert ms timestamps to Firestore Timestamps
  const arData = {
    ...arRecord,
    createdAt: Timestamp.fromMillis(createdAtMs),
    updatedAt: Timestamp.fromMillis(updatedAtMs),
    paymentDate: paymentDateMs != null ? Timestamp.fromMillis(paymentDateMs) : null,
    lastPaymentDate:
      lastPaymentDateMs != null ? Timestamp.fromMillis(lastPaymentDateMs) : null,
  };

  // Persist via full path
  await tx.set(arRef, arData);

  return arRecord;
}
