import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/https";
import { nanoid } from "nanoid";

import { db, FieldValue } from "../../../../../core/config/firebase.js";
import { updateBatchStatusForProductStock } from "../../batch/services/batch.service.js";
import { MovementReason, MovementType } from "../../inventoryMovements/types/inventoryMovements.js";


// Divide un array en subarrays de tamaño máximo `size`
function chunkArray(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size)  out.push(array.slice(i, i + size));
  return out;
}

/**
 * Ejecuta commits con un “pool” de tamaño fijo.
 * @param {WriteBatch[]} batches
 * @param {number} limit - número máximo de commits en paralelo
 */
export async function executeBatchesWithConcurrency(batches, limit = 5) {
  const pool = new Set();

  for (const batch of batches) {
    const commit = batch.commit().finally(() => pool.delete(commit));
    pool.add(commit);

    if (pool.size >= limit) await Promise.race(pool);
  }

  await Promise.all(pool);
}



export async function handleUpdateProductsStock({ businessID, products, sale }) {
  logger.info('[handleUpdateProductsStock] sale completo:', sale);
  logger.info('[handleUpdateProductsStock] sale.userID:', sale.userID);
  logger.info('Actualizando stock', JSON.stringify({ saleId: sale.id }));
  logger.info('Productos', JSON.stringify({ saleId: sale.id, products }));
  logger.info('Negocio', JSON.stringify({ saleId: sale.id, businessID }));
  if (!sale.userID) {
    throw new HttpsError(
      'failed-precondition',
      `Falta userID en invoice ${sale.id}`
    );
  }
  if (!businessID || !Array.isArray(products) || !products.length) {
    throw new HttpsError('invalid-argument', 'Parámetros inválidos para actualizar stock');
  }
  if (products.some((p) => !p.id || typeof p.amountToBuy !== 'number')) {
    throw new HttpsError('invalid-argument', `Producto inválido en invoice ${sale.id}`);
  }

  const BATCH_LIMIT = 500;        // Firestore WriteBatch limit
  const CONCURRENCY_LIMIT = 5;    // commits paralelos
  const productChunks = chunkArray(products, Math.floor(BATCH_LIMIT / 4)); // ≈4 writes/prod

  /** almacena meta-info para movements sin lecturas extra */
  const movementMetaMap = new Map();

  /***************** 1️⃣ – transacción por producto *****************/
  //   ⚠ lanzamos las transacciones en paralelo pero con el mismo pool
  await executeBatchesWithConcurrency(
    products.map((product) => ({
      commit: () =>
        db.runTransaction(async (tx) => {
          if (!(product.trackInventory && product.productStockId && product.batchId)) return;

          const stockRef = db
            .collection('businesses')
            .doc(businessID)
            .collection('productsStock')
            .doc(product.productStockId);
          const batchRef = db
            .collection('businesses')
            .doc(businessID)
            .collection('batches')
            .doc(product.batchId);
          const productRef = db
            .collection('businesses')
            .doc(businessID)
            .collection('products')
            .doc(product.id);

          const [stockSnap, batchSnap] = await Promise.all([tx.get(stockRef), tx.get(batchRef)]);

          const amount = Number(product.amountToBuy || 0);
          const currentStock = stockSnap.data()?.quantity ?? 0;
          const toReduce = Math.min(currentStock, amount);
          const backorderQty = amount - toReduce;

          tx.update(productRef, { stock: FieldValue.increment(-toReduce) });
          tx.update(batchRef, { quantity: FieldValue.increment(-toReduce) });
          tx.update(stockRef, {
            quantity: FieldValue.increment(-toReduce),
            status: currentStock - toReduce <= 0 ? 'inactive' : 'active',
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: sale.userID,
          });

          // guarda meta info para movimiento
          movementMetaMap.set(product.id, {
            backorderQty,
            sourceLocation: stockSnap.get('location') ?? null,
            batchNumberId: batchSnap.get('numberId') ?? null,
          });
        }),
    })),
    CONCURRENCY_LIMIT,
  );

  /***************** 2️⃣ – movements + backorders en WriteBatch *****************/
  const batches = [];
  for (const chunk of productChunks) {
    const batch = db.batch();

    for (const product of chunk) {
      const amount = Number(product.amountToBuy || 0);
      const meta = movementMetaMap.get(product.id) ?? {
        backorderQty: 0,
        sourceLocation: null,
        batchNumberId: null,
      };

      /* Backorder */
      if (meta.backorderQty > 0) {
        const backorderId = nanoid();
        batch.set(
          db
            .collection('businesses')
            .doc(businessID)
            .collection('backOrders')
            .doc(backorderId),
          {
            id: backorderId,
            productId: product.id,
            productStockId: product.productStockId,
            saleId: sale.id,
            initialQuantity: meta.backorderQty,
            pendingQuantity: meta.backorderQty,
            status: 'pending',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
        );
      }

      /* Movement */
      const movementRef = db
        .collection('businesses')
        .doc(businessID)
        .collection('movements')
        .doc(nanoid());

      batch.set(movementRef, {
        id: movementRef.id,
        saleId: sale.id,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: sale.userID,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: sale.userID,
        batchId: product.batchId ?? null,
        batchNumberId: meta.batchNumberId,
        productId: product.id,
        productName: product.name,
        sourceLocation: meta.sourceLocation,
        destinationLocation: null,
        quantity: amount,
        movementType: MovementType.Exit,
        movementReason: MovementReason.Sale,
        isDeleted: false,
      });
    }

    batches.push(batch);
  }

  await executeBatchesWithConcurrency(batches, CONCURRENCY_LIMIT);

  /***************** 3️⃣ – update Batch status una sola vez por batchId *****************/
  const uniqueBatchIds = [...new Set(products.map((p) => p.batchId).filter(Boolean))];
  await Promise.all(
    uniqueBatchIds.map((batchId) =>
      updateBatchStatusForProductStock(businessID, batchId, null /* productId no necesario */),
    ),
  );

  logger.info({ saleId: sale.id, message: 'Stock actualizado' });
}