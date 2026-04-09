import { https, logger } from 'firebase-functions';

/**
 * Comprueba si hay un cuadre de caja abierto para el negocio.
 * Si recibe `tx`, usa `tx.get()` (lectura dentro de la transacción);
 * si no, hace la lectura normal con `q.get()`.
 *
 * @param {{ uid: string, businessID: string }} user
 * @returns {Promise<{ state: string, cashCount: object|null }>}
 * @throws {https.HttpsError}
 */

export async function checkOpenCashCount({ cashCountSnap, user }) {
  if (!user?.businessID || !user?.uid) {
    logger.warn('Usuario sin datos completos para cuadre', { uid: user?.uid });
    throw new https.HttpsError('invalid-argument', 'user-no-valid');
  }

  if (cashCountSnap.empty) {
    logger.warn('No hay cuadre de caja', { uid: user.uid });
    throw new https.HttpsError('failed-precondition', 'cashCount-none');
  }

  const cashCount = cashCountSnap.data().cashCount;

  switch (cashCount.state) {
  case 'open':
    logger.info('Cuadre de caja abierto', {
      uid: user.uid,
      cashCountId: cashCount.id,
    });
    return {
      state: 'open',
      cashCount,
      cashCountId: cashCountSnap.id || cashCount?.id,
    };
  case 'closing':
    logger.info('Cuadre de caja en proceso de cierre', {
      uid: user.uid,
      cashCountId: cashCountSnap.id || cashCount?.id,
    });
    throw new https.HttpsError('failed-precondition', 'cashCount-closing');
  case 'closed':
    logger.info('Cuadre de caja cerrado', {
      uid: user.uid,
      cashCountId: cashCountSnap.id || cashCount?.id,
    });
    throw new https.HttpsError('failed-precondition', 'cashCount-closed');
  default:
    logger.error('Estado inesperado en checkOpenCashCount', {
      uid: user.uid,
      state: cashCount.state,
    });
    throw new https.HttpsError('failed-precondition', 'cashCount-none');
  }
}
