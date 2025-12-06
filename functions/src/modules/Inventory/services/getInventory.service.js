// src/inventory/utils/inventoryQueries.js
import { https } from 'firebase-functions';

import { db } from '../../../core/config/firebase.js';

/**
 * Devuelve el DocumentSnapshot del producto dentro de la transacción.
 * @param {FirebaseFirestore.Transaction} tx
 * @param {string} businessID
 * @param {string} productId
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
 */
export async function getProductDocFromTx(tx, businessID, productId) {
  if (!productId) {
    throw new https.HttpsError(
      'invalid-argument',
      'Se requiere el identificador del producto',
    );
  }
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
 * Devuelve el DocumentSnapshot de un registro de productsStock dentro de tx.
 * @param {FirebaseFirestore.Transaction} tx
 * @param {string} businessID
 * @param {string} productStockId
 * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
 */
export async function getProductStockRecordFromTx(
  tx,
  businessID,
  productStockId,
) {
  if (!productStockId) {
    throw new https.HttpsError(
      'invalid-argument',
      'Se requiere el identificador del registro de stock',
    );
  }
  const ref = db.doc(
    `businesses/${businessID}/productsStock/${productStockId}`,
  );
  const snap = await tx.get(ref);
  if (!snap.exists) {
    throw new https.HttpsError(
      'not-found',
      `Registro de stock ${productStockId} no encontrado`,
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
  if (!batchId) {
    throw new https.HttpsError(
      'invalid-argument',
      'Se requiere el identificador del lote',
    );
  }
  const ref = db.doc(`businesses/${businessID}/batches/${batchId}`);
  const snap = await tx.get(ref);
  if (!snap.exists) {
    throw new https.HttpsError('not-found', `Lote ${batchId} no encontrado`);
  }
  return snap;
}

const getInventory = {
  getProductDocFromTx,
  getProductStockRecordFromTx,
  getBatchDocFromTx,
};
export default getInventory;

/**
 * Recoge los DocumentSnapshot necesarios (producto, productsStock y batch)
 * para cada línea del carrito que requiera control de inventario.
 *
 * @param {FirebaseFirestore.Transaction} tx
 * @param {{ uid:string, businessID:string }} user
 * @param {Array<{ id:string; trackInventory:boolean; productStockId?:string; batchId?:string; restrictSaleWithoutStock?:boolean }>} products
 * @returns {Promise<Array<{ index:number; prod:object; skipped?:boolean; reason?:string; productSnap?:DocumentSnapshot; productStockSnap?:DocumentSnapshot; batchSnap?:DocumentSnapshot }>>}
 */
export async function collectInventoryPrereqs(tx, { user, products }) {
  if (!user?.businessID) {
    throw new https.HttpsError(
      'invalid-argument',
      'Se requiere el businessID del usuario para resolver inventario',
    );
  }
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  const prereqs = [];
  const productCache = new Map();
  const batchCache = new Map();
  const stockCache = new Map();

  for (let index = 0; index < products.length; index += 1) {
    const prod = products[index];
    if (!prod?.trackInventory) continue;

    const productId = prod.id;
    if (!productId) {
      throw new https.HttpsError(
        'invalid-argument',
        'Todos los productos con inventario deben tener un id',
      );
    }

    let productSnap = productCache.get(productId);
    if (!productSnap) {
      productSnap = await getProductDocFromTx(tx, user.businessID, productId);
      productCache.set(productId, productSnap);
    }

    const restrictSale =
      Boolean(prod?.restrictSaleWithoutStock) ||
      Boolean(productSnap.get('restrictSaleWithoutStock'));

    const productStockId = prod.productStockId;
    const batchId = prod.batchId;

    if (!productStockId || !batchId) {
      if (restrictSale) {
        throw new https.HttpsError(
          'failed-precondition',
          `El producto ${
            prod?.name || productId
          } requiere seleccionar una existencia física antes de facturar.`,
        );
      }

      prereqs.push({
        index,
        prod: { ...prod, restrictSaleWithoutStock: restrictSale },
        skipped: true,
        reason: 'missing-stock-reference',
      });
      continue;
    }

    let productStockSnap = stockCache.get(productStockId);
    if (!productStockSnap) {
      productStockSnap = await getProductStockRecordFromTx(
        tx,
        user.businessID,
        productStockId,
      );
      stockCache.set(productStockId, productStockSnap);
    }

    let batchSnap = batchCache.get(batchId);
    if (!batchSnap) {
      batchSnap = await getBatchDocFromTx(tx, user.businessID, batchId);
      batchCache.set(batchId, batchSnap);
    }

    prereqs.push({
      index,
      prod,
      productSnap,
      productStockSnap,
      batchSnap,
    });
  }

  return prereqs;
}
