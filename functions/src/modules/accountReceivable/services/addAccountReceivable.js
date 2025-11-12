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
  };

  // Convert ms timestamps to Firestore Timestamps
  const arData = {
    ...arRecord,
    createdAt: Timestamp.fromMillis(ar.createdAt),
    updatedAt: Timestamp.fromMillis(ar.updatedAt),
    paymentDate: Timestamp.fromMillis(ar.paymentDate),
    lastPaymentDate: null,
  };

  // Persist via full path
  await tx.set(arRef, arData);

  return arRecord;
}
