import { db, serverTimestamp } from '../../../core/config/firebase.js';

/**
 * Obtiene un documento de `batches` por su ID.
 *
 * @param {{ businessID: string }} user    – Objeto usuario con businessID.
 * @param {string}             batchId    – ID del documento en `batches`.
 * @returns {Promise<Batch|null>}          El objeto batch o null si no existe o no se pasó ID.
 * @throws {TypeError} Si `user.businessID` no es válido o `batchId` no es string.
 * @throws {Error}     Para cualquier error de I/O en Firestore.
 */
export async function getBatchById(user, batchId) {
  // — Validaciones —
  if (!user || typeof user.businessID !== 'string' || !user.businessID) {
    throw new TypeError('getBatchById: se requiere user.businessID válido');
  }
  if (batchId == null) {
    // No hay ID, devolvemos null
    return null;
  }
  if (typeof batchId !== 'string') {
    throw new TypeError('getBatchById: batchId debe ser un string');
  }

  try {
    // Admin SDK: usa ref.get()
    const ref = db.doc(`businesses/${user.businessID}/batches/${batchId}`);
    const snap = await ref.get();

    if (!snap.exists) {
      return null;
    }
    return /** @type {Batch} */ (snap.data());
  } catch (err) {
    console.error('getBatchById error:', {
      businessID: user.businessID,
      batchId,
      message: err.message,
    });
    throw new Error(`No se pudo leer batches/${batchId}: ${err.message}`);
  }
}

/**
 * Recalcula y actualiza el estado del batch según el stock activo de sus productStock asociados.
 *
 * @param {string} businessID – ID del negocio.
 * @param {string} batchId    – ID del documento batch.
 * @param {string} productId  – ID del producto al que pertenece el batch.
 * @returns {Promise<void>}
 * @throws {TypeError} Si alguno de los IDs no es string válido.
 * @throws {Error}     Para errores de lectura/escritura en Firestore.
 */

export async function updateBatchStatusForProductStock(
  businessID,
  batchId,
  productId,
) {
  // — Validaciones tempranas —
  if (typeof businessID !== 'string' || !businessID) {
    throw new TypeError(
      'updateBatchStatusForProductStock: businessID debe ser string no vacío',
    );
  }
  if (typeof batchId !== 'string' || !batchId) {
    throw new TypeError(
      'updateBatchStatusForProductStock: batchId debe ser string no vacío',
    );
  }
  if (typeof productId !== 'string' || !productId) {
    throw new TypeError(
      'updateBatchStatusForProductStock: productId debe ser string no vacío',
    );
  }

  try {
    // Lee todos los productosStock activos para este batch/producto
    const snapshot = await db
      .collection('businesses')
      .doc(businessID)
      .collection('productsStock')
      .where('isDeleted', '==', false)
      .where('status', '==', 'active')
      .where('batchId', '==', batchId)
      .where('productId', '==', productId)
      .where('quantity', '>', 0)
      .get();

    let totalQuantity = 0;
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      totalQuantity += typeof data.quantity === 'number' ? data.quantity : 0;
    });

    // Referencia al documento batch
    const batchRef = db
      .collection('businesses')
      .doc(businessID)
      .collection('batches')
      .doc(batchId);

    // Si no queda stock, marcamos el batch como inactivo
    if (totalQuantity <= 0) {
      await batchRef.update({
        quantity: 0,
        status: 'inactive',
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error('updateBatchStatusForProductStock error:', {
      businessID,
      batchId,
      productId,
      message: err.message,
    });
    throw new Error(
      `No se pudo actualizar el estado de batches/${batchId}: ${err.message}`,
    );
  }
}
