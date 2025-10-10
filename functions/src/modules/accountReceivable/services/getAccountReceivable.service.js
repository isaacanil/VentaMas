// src/accountsReceivable/utils/receivableAccountQueries.js
import { https } from 'firebase-functions';

import { db } from '../../../core/config/firebase.js';
import { getNextIDTransactionalSnap } from '../../../core/utils/getNextID.js';
import { getInsurance } from '../../insurance/services/insurance.service.js';

/**
 * Devuelve el DocumentSnapshot de una cuenta por cobrar dentro de tx.
 * @param {FirebaseFirestore.Transaction} tx
 * @param {string} businessID
 * @param {string} accountReceivableId
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
 */
export async function getAccountReceivableDocFromTx(tx, businessID, accountReceivableId) {
  const ref = db.doc(`businesses/${businessID}/accountsReceivable/${accountReceivableId}`);
  const snap = await tx.get(ref);
  if (!snap.exists) {
    throw new https.HttpsError('not-found', `Cuenta por cobrar ${accountReceivableId} no encontrada`);
  }
  return snap;
}

/**
 * Devuelve el DocumentSnapshot de una cuota de cuenta por cobrar dentro de tx.
 * @param {FirebaseFirestore.Transaction} tx
 * @param {string} businessID
 * @param {string} installmentId
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
 */
export async function getInstallmentReceivableDocFromTx(tx, businessID, installmentId) {
  const ref = db.doc(`businesses/${businessID}/accountsReceivableInstallments/${installmentId}`);
  const snap = await tx.get(ref);
  if (!snap.exists) {
    throw new https.HttpsError('not-found', `Cuota ${installmentId} no encontrada`);
  }
  return snap;
}

const receivableQueries = {
  getAccountReceivableDocFromTx,
  getInstallmentReceivableDocFromTx,
};
export default receivableQueries;

/**
 * Recoge TODOS los DocumentSnapshot de cuentas por cobrar y sus cuotas
 * para cada entrada que haya que procesar.
 *
 * @param {FirebaseFirestore.Transaction} tx
 * @param {{ uid:string, businessID:string }} user
 * @param {Array<{ id:string; installmentIds?:string[] }>} accountsReceivable
 * @returns {Promise<Array<{ ar:object; arSnap:DocumentSnapshot; installmentSnaps:FirebaseFirestore.DocumentSnapshot[] }>>}
 */
export async function collectReceivablePrereqs(tx, { user, insuranceId }) {

  const accountReceivableNextIDSnap = await getNextIDTransactionalSnap(tx, user, 'lastAccountReceivableId');
  const insurance = getInsurance(tx, {user, insuranceId});

  return {
    accountReceivableNextIDSnap,
    insurance,
  }
}

