// src/taxReceipt/utils/taxReceiptQueries.js
import { https, logger } from 'firebase-functions';

import { db } from '../../../core/config/firebase.js';

/**
 * Construye y ejecuta la consulta para obtener el recibo fiscal
 * dentro de una transacción.
 *
 * @param {FirebaseFirestore.Transaction} tx
 * @param {{ uid:string, businessID:string }} user
 * @param {string} taxReceiptName
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
 */
export async function getTaxReceiptDocFromTx(tx, user, taxReceiptName) {
  if (!user?.businessID || !user?.uid || !taxReceiptName) {
    throw new https.HttpsError(
      'invalid-argument',
      'Parámetros inválidos en getTaxReceiptDocFromTx',
    );
  }

  const receiptsCol = db
    .collection('businesses')
    .doc(user.businessID)
    .collection('taxReceipts')
    .where('data.name', '==', taxReceiptName)
    .limit(1);

  const snap = await tx.get(receiptsCol);

  if (snap.empty) {
    logger.error(`Recibo fiscal "${taxReceiptName}" no encontrado.`);
    throw new https.HttpsError('not-found', 'Recibo fiscal no encontrado');
  }
  return snap.docs[0];
}

const getTaxReceipt = {
  getTaxReceiptDocFromTx,
};
export default getTaxReceipt;
