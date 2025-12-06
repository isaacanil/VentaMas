import { https, logger } from 'firebase-functions';

import { db } from '../../../core/config/firebase.js';

/**
 * Obtiene el documento de un cliente dentro de una transacción.
 * @param {FirebaseFirestore.Transaction} tx
 * @param {{ uid: string, businessID: string }} user
 * @param {string} clientId
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
 */
export async function getClientDocFromTx(tx, user, clientId) {
  if (!user?.businessID || !user?.uid || !clientId) {
    throw new https.HttpsError(
      'invalid-argument',
      'Parámetros inválidos en getClientDocFromTx',
    );
  }
  const clientRef = db
    .collection('businesses')
    .doc(user.businessID)
    .collection('clients')
    .doc(clientId);

  const docSnap = await tx.get(clientRef);
  if (!docSnap.exists) {
    logger.error(`Cliente "${clientId}" no encontrado.`, { uid: user.uid });
    throw new https.HttpsError('not-found', 'Cliente no encontrado');
  }
  return docSnap;
}

const getClient = { getClientDocFromTx };
export default getClient;
