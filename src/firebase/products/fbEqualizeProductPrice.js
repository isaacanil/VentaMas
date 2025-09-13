import { doc, writeBatch, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseconfig';

/**
 * Igualar el precio de un producto: pricing.price = pricing.listPrice
 * @param {Object} user - Usuario actual con businessID
 * @param {string} productID - ID del producto
 * @param {number} listPrice - Valor de listPrice a aplicar en price
 */
export async function fbEqualizeProductPrice(user, productID, listPrice) {
  if (!user?.businessID || !productID) return;
  const businessID = String(user.businessID);
  const ref = doc(db, 'businesses', businessID, 'products', String(productID));
  const lp = Number(listPrice) || 0;
  await updateDoc(ref, { 'pricing.price': lp });
}

/**
 * Igualar el precio de múltiples productos en batch.
 * @param {Object} user - Usuario actual con businessID
 * @param {Array<{id: string, listPrice: number}>} items - Productos a igualar
 * @returns {Promise<number>} - Cantidad actualizada
 */
export async function fbEqualizeProductsPrice(user, items = []) {
  if (!user?.businessID || !Array.isArray(items) || items.length === 0) return 0;
  const businessID = String(user.businessID);
  const batch = writeBatch(db);
  let updated = 0;

  items.forEach((it) => {
    if (!it?.id) return;
    const lp = Number(it.listPrice) || 0;
    const ref = doc(db, 'businesses', businessID, 'products', String(it.id));
    batch.update(ref, { 'pricing.price': lp });
    updated += 1;
  });

  if (updated > 0) {
    await batch.commit();
  }
  return updated;
}

/**
 * Igualar el precio de TODOS los productos del negocio a su listPrice.
 * Por defecto, solo actualiza los que están desalineados (price !== listPrice).
 * Maneja límites de batch de Firestore (500 por batch).
 * @param {Object} user - Usuario actual con businessID
 * @param {{ onlyMismatch?: boolean }} options
 * @returns {Promise<number>} - Cantidad actualizada
 */
export async function fbEqualizeAllProductsPrice(user, options = {}) {
  const { onlyMismatch = true } = options;
  if (!user?.businessID) return 0;
  const businessID = String(user.businessID);

  const productsRef = collection(db, 'businesses', businessID, 'products');
  const snapshot = await getDocs(productsRef);
  if (snapshot.empty) return 0;

  // Construir lista de items a actualizar
  const items = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const lp = Number(data?.pricing?.listPrice) || 0;
    const p = Number(data?.pricing?.price) || 0;
    if (!onlyMismatch || lp !== p) {
      items.push({ id: docSnap.id, listPrice: lp });
    }
  });

  if (items.length === 0) return 0;

  // Procesar en lotes de hasta 500
  const BATCH_LIMIT = 500;
  let totalUpdated = 0;
  for (let i = 0; i < items.length; i += BATCH_LIMIT) {
    const slice = items.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    slice.forEach((it) => {
      const ref = doc(db, 'businesses', businessID, 'products', String(it.id));
      batch.update(ref, { 'pricing.price': Number(it.listPrice) || 0 });
    });
    await batch.commit();
    totalUpdated += slice.length;
  }

  return totalUpdated;
}
