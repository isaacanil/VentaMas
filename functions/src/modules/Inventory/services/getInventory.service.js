// src/inventory/utils/inventoryQueries.js
import { https } from 'firebase-functions';

import { db } from '../../../core/config/firebase.js';

/**
 * Devuelve el DocumentSnapshot de stock de producto dentro de tx.
 * @param {FirebaseFirestore.Transaction} tx
 * @param {string} businessID
 * @param {string} productId
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
 */
export async function getProductStockDocFromTx(tx, businessID, productId) {
  const ref = db.doc(`businesses/${businessID}/products/${productId}`);
  const snap = await tx.get(ref);
  if (!snap.exists) {
    throw new https.HttpsError(
      'not-found',
      `Producto ${productId} no encontrado`,
    );
  }
  return snap;
}

/**
 * Devuelve el DocumentSnapshot de un lote dentro de tx.
 * @param {FirebaseFirestore.Transaction} tx
 * @param {string} businessID
 * @param {string} batchId
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
 */
export async function getBatchDocFromTx(tx, businessID, batchId) {
  const ref = db.doc(`businesses/${businessID}/batches/${batchId}`);
  const snap = await tx.get(ref);
  if (!snap.exists) {
    throw new https.HttpsError('not-found', `Lote ${batchId} no encontrado`);
  }
  return snap;
}

const getInventory = {
  getProductStockDocFromTx,
  getBatchDocFromTx,
};
export default getInventory;

/**
 * Recoge TODOS los DocumentSnapshot de stock y lote
 * para cada producto que haya que trackear.
 *
 * @param {FirebaseFirestore.Transaction} tx
 * @param {{ uid:string, businessID:string }} user
 * @param {Array<{ id:string; trackInventory:boolean; productStockId?:string; batchId?:string }>} products
 * @returns {Promise<Array<{ prod:object; stockSnap:DocumentSnapshot; batchSnap:DocumentSnapshot }>>}
 */
export async function collectInventoryPrereqs(tx, { user, products }) {
  const prereqs = [];
  for (const prod of products) {
    if (prod.trackInventory && prod.productStockId && prod.batchId) {
      const stockSnap = await getProductStockDocFromTx(
        tx,
        user.businessID,
        prod.id,
      );
      const batchSnap = await getBatchDocFromTx(
        tx,
        user.businessID,
        prod.batchId,
      );
      prereqs.push({ prod, stockSnap, batchSnap });
    }
  }
  return prereqs;
}
