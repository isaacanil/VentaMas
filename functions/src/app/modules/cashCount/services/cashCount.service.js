import { https, logger } from 'firebase-functions';

import { db } from '../../../core/config/firebase.js';
import { upsertSaleToCashCountInTransaction } from './cashCountSales.service.js';

/**
 * Añade la referencia de una factura al cuadre de caja abierto del cajero.
 * @param {{ uid: string, businessID: string }} user      – datos mínimos del usuario
 * @param {admin.firestore.DocumentReference}  invoiceRef – referencia al documento de la factura
 * @returns {Promise<string|null>}  ID del cash‑count actualizado o null si no se encontró
 */
export async function addBillToOpenCashCount(user, invoiceRef) {
  if (!user || !user.businessID || !user.uid) return null;

  const cashCountsCol = db.collection(
    `businesses/${user.businessID}/cashCounts`,
  );
  const userRef = db.doc(`users/${user.uid}`);

  try {
    // 1. Busca el cuadre abierto del cajero (index recomendado)
    const snap = await cashCountsCol
      .where('cashCount.state', '==', 'open')
      .where('cashCount.opening.employee', '==', userRef)
      .limit(1)
      .get();

    if (snap.empty) {
      throw new Error(`No hay cuadre abierto para uid ${user.uid}`);
    }

    const cashCountDoc = snap.docs[0];

    // 2. Actualiza en transacción para evitar colisiones
    await db.runTransaction(async (tx) => {
      const docSnap = await tx.get(cashCountDoc.ref);
      upsertSaleToCashCountInTransaction({
        tx,
        businessId: user.businessID,
        cashCountId: cashCountDoc.id,
        cashCountRef: cashCountDoc.ref,
        invoiceId: invoiceRef.id,
        invoiceRef,
        cashCountSnap: docSnap,
        createdBy: user.uid,
        source: {
          type: 'cashCount.service',
        },
      });
    });

    return cashCountDoc.id;
  } catch (err) {
    console.error('Error al añadir la factura al cuadre:', err);
    return null;
  }
}

export async function addBillToCashCountById(
  tx,
  user,
  invoiceRef,
  cashCountSnap,
) {
  if (!user?.businessID || !user?.uid) {
    throw new https.HttpsError(
      'invalid-argument',
      'Usuario no válido o sin businessID',
    );
  }

  const cashCountRef = cashCountSnap.ref;
  const fallbackCashCountId = cashCountSnap.id || cashCountRef.id || 'unknown';

  if (!cashCountSnap.exists) {
    throw new https.HttpsError(
      'not-found',
      `CashCount ${fallbackCashCountId} no existe`,
    );
  }

  const cashCount = cashCountSnap.data().cashCount;
  const cashCountId = cashCount?.id;

  if (!cashCountId) {
    throw new https.HttpsError(
      'failed-precondition',
      'El cuadre de caja no contiene un identificador válido',
    );
  }
  const state = cashCount.state;
  const sales = cashCount.sales || [];

  if (state !== 'open') {
    throw new https.HttpsError(
      'failed-precondition',
      `CashCount ${cashCountId} no está abierto (estado=${state})`,
    );
  }

  if (sales.some((ref) => ref.path === invoiceRef.path)) {
    throw new https.HttpsError(
      'failed-precondition',
      `Factura ya registrada en el cuadre de caja ${cashCountId}`,
    );
  }
  upsertSaleToCashCountInTransaction({
    tx,
    businessId: user.businessID,
    cashCountId,
    cashCountRef,
    invoiceId: invoiceRef.id,
    invoiceRef,
    cashCountSnap,
    createdBy: user.uid,
    source: {
      type: 'cashCount.service',
    },
  });

  logger.info(
    `Factura ${invoiceRef.id} añadida al cuadre ${cashCountId} (tx)`,
    {
      uid: user.uid,
      cashCountId,
    },
  );
}
