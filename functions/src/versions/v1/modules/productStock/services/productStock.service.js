import { nanoid } from 'nanoid';

// import { MovementReason, MovementType } from '../../../models/Warehouse/Movement.js';
import { db, FieldValue } from '../../../../../core/config/firebase.js';
import { checkAndDeleteEmptyBatch } from '../../batch/services/batch.service.js';
import {
  MovementReason,
  MovementType,
} from '../../inventoryMovements/types/inventoryMovements.js';

// Referencia a la colección productsStock de un negocio
function getProductStockCollection(businessID) {
  return db
    .collection('businesses')
    .doc(businessID)
    .collection('productsStock');
}

/**
 * Crea un nuevo registro de stock de producto.
 * @param {{ uid: string, businessID: string }} user
 * @param {Object} stockData
 * @returns {Promise<Object>}
 */
export async function createProductStock(user, stockData) {
  const id = nanoid();
  const stockRef = getProductStockCollection(user.businessID).doc(id);
  const now = FieldValue.serverTimestamp();

  const record = {
    id,
    ...stockData,
    quantity: stockData.quantity || 0,
    location: stockData.location || '',
    isDeleted: false,
    status: 'active',
    createdAt: now,
    createdBy: user.uid,
    updatedAt: now,
    updatedBy: user.uid,
  };

  await stockRef.set(record);
  return record;
}

/**
 * Obtiene todos los registros de stock para un negocio.
 * @param {{ businessID: string }} user
 * @returns {Promise<Array>}
 */
export async function getAllProductStocks(user) {
  const col = getProductStockCollection(user.businessID);
  const snaps = await col.where('isDeleted', '==', false).get();
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Actualiza un registro de stock existente.
 * @param {{ uid: string, businessID: string }} user
 * @param {Object} data - Debe contener id y campos a actualizar
 * @returns {Promise<Object>}
 */
export async function updateProductStock(user, data) {
  const { id, ...rest } = data;
  const ref = getProductStockCollection(user.businessID).doc(id);
  const updates = {
    ...rest,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: user.uid,
  };
  await ref.update(updates);
  return { id, ...rest };
}

/**
 * Elimina todos los stocks asociados a un batch y registra movimientos.
 * @param {{ uid: string, businessID: string }} user
 * @param {string} batchId
 * @param {Object} movementInfo
 * @returns {Promise<Object>} resumen de operación
 */
export async function deleteAllProductStocksByBatch(
  user,
  batchId,
  movementInfo,
) {
  const col = getProductStockCollection(user.businessID);
  const snaps = await col
    .where('batchId', '==', batchId)
    .where('isDeleted', '==', false)
    .get();

  const results = [];
  for (const doc of snaps.docs) {
    const stock = doc.data();
    const info = {
      ...movementInfo,
      quantity: stock.quantity,
      reason: movementInfo?.reason,
      notes: `${movementInfo?.notes || ''} - Batch ${batchId}`,
    };
    await deleteProductStock(user, doc.id, info);
    results.push(doc.id);
  }

  return {
    batchId,
    deletedCount: results.length,
  };
}

/**
 * Elimina un registro de stock, ajusta producto y batch, y crea movimiento.
 * @param {{ uid: string, businessID: string }} user
 * @param {string} stockId
 * @param {Object} movementInfo
 * @returns {Promise<string>} id del stock eliminado
 */

/**
 * Obtiene stocks filtrados por batch, producto o ubicación.
 * @param {{ businessID: string }} user
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
export async function getProductStockByBatch(
  user,
  { productId, batchId, location } = {},
) {
  let q = getProductStockCollection(user.businessID).where(
    'isDeleted',
    '==',
    false,
  );
  if (batchId) q = q.where('batchId', '==', batchId);
  if (productId) q = q.where('productId', '==', productId);
  if (location) q = q.where('location', '==', location);

  const snaps = await q.get();
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Obtiene stocks activos de un producto específico.
 * @param {{ businessID: string }} user
 * @param {string} productId
 * @returns {Promise<Array>}
 */
export async function getProductStockByProductId(user, productId) {
  const q = getProductStockCollection(user.businessID)
    .where('isDeleted', '==', false)
    .where('productId', '==', productId)
    .where('status', '==', 'active');

  const snaps = await q.get();
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Obtiene un stock por su ID.
 * @param {{ businessID: string }} user
 * @param {string} stockId
 * @returns {Promise<Object|null>}
 */
export async function getProductStockById(businessID, stockId) {
  if (!stockId) return null;
  const docRef = getProductStockCollection(businessID).doc(stockId);
  const snap = await docRef.get();
  return snap.exists ? snap.data() : null;
}

export async function deleteProductStock(user, stockId, movementInfo = {}) {
  const stockRef = getProductStockCollection(user.businessID).doc(stockId);
  const snap = await stockRef.get();
  if (!snap.exists) {
    return null;
  }

  const stock = snap.data();

  await stockRef.update({
    isDeleted: true,
    deletedAt: FieldValue.serverTimestamp(),
    deletedBy: user.uid,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: user.uid,
  });

  if (stock.batchId) {
    await checkAndDeleteEmptyBatch(user, stock.batchId);
  }

  const movementRef = db
    .collection('businesses')
    .doc(user.businessID)
    .collection('movements')
    .doc(nanoid());

  await movementRef.set({
    id: movementRef.id,
    productId: stock.productId,
    productName: stock.productName ?? '',
    productStockId: stockId,
    batchId: stock.batchId ?? null,
    movementType: MovementType.Exit,
    movementReason: movementInfo.reason ?? MovementReason.Adjustment,
    quantity: movementInfo.quantity ?? stock.quantity ?? 0,
    notes: movementInfo.notes ?? '',
    createdAt: FieldValue.serverTimestamp(),
    createdBy: user.uid,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: user.uid,
  });

  return stockId;
}
