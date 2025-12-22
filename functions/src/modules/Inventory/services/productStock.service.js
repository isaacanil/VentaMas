import { db } from '../../../core/config/firebase.js';

/**
 * Busca en Firestore el documento de productsStock y devuelve sus datos.
 *
 * @param {{ businessID: string }} user  – Objeto usuario con businessID.
 * @param {string} productStockId       – ID del documento productsStock.
 * @returns {Promise<ProductStock|null>} El objeto de stock o null si no existe o no se proporcionó ID.
 * @throws {TypeError} Si `user.businessID` no es válido o `productStockId` no es string.
 * @throws {Error} Para cualquier error de I/O en Firestore.
 */
export async function getProductStockById(user, productStockId) {
  // — Validaciones —
  if (!user || typeof user.businessID !== 'string' || !user.businessID) {
    throw new TypeError(
      'getProductStockById: se requiere user.businessID válido',
    );
  }
  if (productStockId == null) {
    return null;
  }
  if (typeof productStockId !== 'string') {
    throw new TypeError(
      'getProductStockById: productStockId debe ser un string',
    );
  }

  try {
    // Con Admin SDK, .doc() devuelve un DocumentReference
    const ref = db.doc(
      `businesses/${user.businessID}/productsStock/${productStockId}`,
    );
    const snap = await ref.get();

    if (!snap.exists) {
      return null;
    }
    return /** @type {ProductStock} */ (snap.data());
  } catch (err) {
    console.error('getProductStockById error:', {
      businessID: user.businessID,
      productStockId,
      message: err.message,
    });
    throw new Error(
      `No se pudo leer productsStock/${productStockId}: ${err.message}`,
    );
  }
}
