// src/cashCount/utils/cashCountQueries.js
import { https } from 'firebase-functions';

import { db } from '../../../core/config/firebase.js';

function buildOpenCashCountQuery(user) {
  const employeeRef = db.collection('users').doc(user.uid);
  return db
    .collection(`businesses/${user.businessID}/cashCounts`)
    .where('cashCount.state', 'in', ['open', 'closing'])
    .where('cashCount.opening.employee', '==', employeeRef)
    .limit(1);
}

/**
 * Ejecuta la query PASÁNDOLA al tx (lectura dentro de transacción).
 * Lanza HttpsError si está vacía.
 *
 * @param {FirebaseFirestore.Transaction} tx
 * @param {{ uid:string, businessID:string }} user
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
 */
export async function getOpenCashCountDocFromTx(tx, user) {
  const q = buildOpenCashCountQuery(user);
  const snap = await tx.get(q);
  if (snap.empty) {
    throw new https.HttpsError(
      'failed-precondition',
      'No hay cuadre de caja abierto',
    );
  }
  return snap.docs[0];
}

/**
 * Ejecuta la misma query FUERA de transacción.
 * Lanza HttpsError si está vacía.
 *
 * @param {{ uid:string, businessID:string }} user
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
 */
export async function getOpenCashCountDoc(user) {
  const q = buildOpenCashCountQuery(user);
  const snap = await q.get();
  if (snap.empty) {
    throw new https.HttpsError(
      'failed-precondition',
      'No hay cuadre de caja abierto',
    );
  }

  return snap.docs[0];
}

/**
 * Devuelve el DocumentSnapshot de un cashCount por ID dentro de tx.
 * @param {FirebaseFirestore.Transaction} tx
 * @param {{ uid:string, businessID:string }} user
 * @param {string} cashCountId
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
 */

export async function getCashCountDocByIdFromTx(tx, user, cashCountId) {
  const ref = db.doc(`businesses/${user.businessID}/cashCounts/${cashCountId}`);
  const doc = await tx.get(ref);
  if (!doc.exists) {
    throw new https.HttpsError(
      'not-found',
      `CashCount ${cashCountId} no existe`,
    );
  }
  return doc;
}

const getCashCount = {
  getOpenCashCountDoc,
  getOpenCashCountDocFromTx,
  getCashCountDocByIdFromTx,
};

export default getCashCount;
