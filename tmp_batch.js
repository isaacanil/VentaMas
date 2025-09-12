import admin from 'firebase-admin';
import { nanoid } from 'nanoid';
// import { deleteAllProductStocksByBatch } from './productStockService.js';
import { deleteAllProductStocksByBatch } from '../../productStock/services/productStock.service.js';
import { db, FieldValue } from '../../../../../core/config/firebase.js';

// Inicializa Firebase Admin si no está hecho

// const db = admin.firestore();
// const FieldValue = admin.firestore.FieldValue;

// Referencia a la colección de batches de un negocio
function getBatchCollection(businessID) {
  return db.collection('businesses').doc(businessID).collection('batches');
}

/**
 * Crea un nuevo batch en Firestore.
 * @param {{ uid: string, businessID: string }} user
 * @param {Object} batchData
 * @returns {Promise<Object>}
 */
export async function createBatch(user, batchData) {
  const id = nanoid();
  const batchRef = getBatchCollection(user.businessID).doc(id);
  const now = FieldValue.serverTimestamp();

  const batch = {
    ...batchData,
    id,
    isDeleted: false,
    status: 'active',
    createdAt: now,
    createdBy: user.uid,
    updatedAt: now,
    updatedBy: user.uid
  };

  await batchRef.set(batch);
  return batch;
}

/**
 * Obtiene un batch por ID.
 * @param {{ businessID: string }} user
 * @param {string} batchId
 * @returns {Promise<Object|null>}
 */
export async function getBatchById(businessID, batchId) {
  if (!batchId) return null;
  const docRef = getBatchCollection(businessID).doc(batchId);
  const snap = await docRef.get();
  return snap.exists ? snap.data() : null;
}

/**
 * Obtiene todos los batches, opcionalmente filtrados por productId.
 * @param {{ businessID: string }} user
 * @param {string|null} productId
 * @returns {Promise<Object[]>}
 */
export async function getAllBatches(user, productId = null) {
  let q = getBatchCollection(user.businessID).where('isDeleted', '==', false);
  if (productId) {
    q = q.where('productId', '==', productId)
         .where('status', '==', 'active');
  }

  const snaps = await q.get();
  return snaps.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Actualiza un batch existente.
 * @param {{ uid: string, businessID: string }} user
 * @param {Object} data - Debe contener la propiedad `id`.
 * @returns {Promise<Object>}
 */
export async function updateBatch(user, data) {
  const { id, ...rest } = data;
  const docRef = getBatchCollection(user.businessID).doc(id);
  const updates = {
    ...rest,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: user.uid
  };

  await docRef.update(updates);
  return { id, ...rest };
}

/**
 * Verifica el stock en productsStock y actualiza el estado del batch si no tiene cantidad.
 * @param {string} businessID
 * @param {string} batchId
 * @param {string} productId
 * @returns {Promise<void>}
 */
export async function updateBatchStatusForProductStock(businessID, batchId, productId) {
  const stockCol = db.collection('businesses').doc(businessID).collection('productsStock');
  const q = stockCol
    .where('batchId', '==', batchId)
    .where('productId', '==', productId)
    .where('isDeleted', '==', false)
    .where('status', '==', 'active')
    .where('quantity', '>', 0);

  const snaps = await q.get();
  const totalQty = snaps.docs.reduce((sum, d) => sum + (d.data().quantity || 0), 0);
  const batchRef = getBatchCollection(businessID).doc(batchId);

  if (totalQty <= 0) {
    await batchRef.update({
      quantity: 0,
      status: 'inactive',
      updatedAt: FieldValue.serverTimestamp()
    });
  }
}

/**
 * Marca un batch como eliminado y elimina sus productStocks asociados.
 * @param {{ uid: string, businessID: string }} user
 * @param {string} batchId
 * @param {Object} movement  // opcional: datos para registrar movimiento
 * @returns {Promise<Object>}  // datos del batch eliminado
 */
export async function deleteBatch(user, batchId, movement) {
  const batchRef = getBatchCollection(user.businessID).doc(batchId);
  const snap = await batchRef.get();
  if (!snap.exists) throw new Error('Batch no encontrado');
  const data = snap.data();

  // Eliminar stock asociado
  await deleteAllProductStocksByBatch(user, batchId, movement);

  // Marcar eliminado
  await batchRef.update({
    isDeleted: true,
    deletedAt: FieldValue.serverTimestamp(),
    deletedBy: user.uid
  });

  return data;
}

/**
 * Verifica y borra un batch sin stock.
 * @param {{ uid: string, businessID: string }} user
 * @param {string} batchId
 * @param {FirebaseFirestore.Transaction} [transaction]
 * @returns {Promise<Object>} resultado con success y mensaje
 */
export async function checkAndDeleteEmptyBatch(user, batchId, transaction = null) {
  const batchRef = getBatchCollection(user.businessID).doc(batchId);

  // Obtener batch y stocks en transacción o fuera
  const [batchSnap, stockDocs] = transaction
    ? await Promise.all([
        transaction.get(batchRef),
        transaction.get(
          db.collection('businesses').doc(user.businessID).collection('productsStock')
            .where('batchId', '==', batchId)
            .where('isDeleted', '==', false)
        )
      ])
    : await Promise.all([
        batchRef.get(),
        db.collection('businesses').doc(user.businessID).collection('productsStock')
          .where('batchId', '==', batchId)
          .where('isDeleted', '==', false)
          .get()
      ]);

  if (!batchSnap.exists) throw new Error('Batch no encontrado');

  if (stockDocs.empty) {
    const update = {
      isDeleted: true,
      deletedAt: FieldValue.serverTimestamp(),
      deletedBy: user.uid
    };
    if (transaction) transaction.update(batchRef, update);
    else await batchRef.update(update);

    return { success: true, message: 'Batch eliminado por no tener stock' };
  }

  return { success: false, message: 'Batch aún tiene stock', remaining: stockDocs.size };
}
