// @ts-nocheck
import {
  doc,
  increment,
  writeBatch,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import {
  getBatchById,
  updateBatchStatusForProductStock,
} from '@/firebase/warehouse/batchService';
import { getProductStockById } from '@/firebase/warehouse/productStockService';
import { MovementReason, MovementType } from '@/models/Warehouse/Movement';
import { validateUser } from '@/utils/userValidation';

// Función para dividir el array en subarrays de tamaño máximo size
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// Función para ejecutar batches con límite de concurrencia
async function executeBatchesWithConcurrency(batches, concurrencyLimit) {
  const executing = [];
  const results = [];

  for (const batch of batches) {
    const p = batch.commit();
    results.push(p);

    if (concurrencyLimit <= batches.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= concurrencyLimit) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(results);
}

export async function fbUpdateProductsStock(products, user, sale) {
  try {
    validateUser(user);
    const { businessID } = user;

    // Crear batches de operaciones
    const BATCH_LIMIT = 500;
    const CONCURRENCY_LIMIT = 5;
    const productChunks = chunkArray(products, Math.floor(BATCH_LIMIT / 3));
    const batches = [];

    for (const chunk of productChunks) {
      const batch = writeBatch(db);
      for (const product of chunk) {
        const movementId = nanoid();
        const amountToBuy = Number(product?.amountToBuy);
        let productStock = null;
        let productBatch = null;
        let backorderQuantity = amountToBuy;

        if (product?.trackInventory) {
          const productStockId = product?.productStockId;
          const batchId = product?.batchId;
          let currentStock = 0;

          if (productStockId && batchId) {
            productStock = await getProductStockById(user, productStockId);
            if (productStock) {
              currentStock = productStock.quantity || 0;
            }
            productBatch = await getBatchById(user, batchId);

            let stockReduction = -amountToBuy;
            backorderQuantity = 0;

            if (currentStock < amountToBuy) {
              stockReduction = -currentStock;
              backorderQuantity = amountToBuy - currentStock;
            }

            const stockUpdateValue = increment(stockReduction);
            const newStockQuantity = currentStock + stockReduction;

            // Actualizar stock del producto
            const productRef = doc(
              db,
              'businesses',
              businessID,
              'products',
              product.id,
            );
            batch.update(productRef, { stock: stockUpdateValue });

            // Actualizar batch y productStock
            const productBatchRef = doc(
              db,
              'businesses',
              businessID,
              'batches',
              batchId,
            );
            const productStockRef = doc(
              db,
              'businesses',
              businessID,
              'productsStock',
              productStockId,
            );
            batch.update(productBatchRef, { quantity: stockUpdateValue });
            if (newStockQuantity <= 0) {
              batch.update(productStockRef, {
                quantity: 0,
                status: 'inactive',
                updatedAt: serverTimestamp(),
                updatedBy: user.uid,
              });
            } else {
              batch.update(productStockRef, { quantity: stockUpdateValue });
            }

            // Actualizar estado del batch
            await updateBatchStatusForProductStock(
              businessID,
              batchId,
              product.id,
            );
          }

          // Registrar backorder si hay cantidad pendiente
          if (backorderQuantity > 0) {
            const backorderId = nanoid();
            const backorderRef = doc(
              db,
              'businesses',
              businessID,
              'backOrders',
              backorderId,
            );
            const backorderDoc = {
              id: backorderId,
              productId: product.id,
              productStockId: productStockId || null,
              saleId: sale.id,
              initialQuantity: backorderQuantity,
              pendingQuantity: backorderQuantity,
              status: 'pending',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(backorderRef, backorderDoc);
          }
        }

        // Registrar movimiento siempre, independientemente de backorder, productStock o batch
        const movementRef = doc(
          db,
          'businesses',
          businessID,
          'movements',
          movementId,
        );
        const movementDoc = {
          id: movementId,
          saleId: sale.id,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
          batchId: product?.batchId || null,
          batchNumberId: productBatch ? productBatch.numberId : null,
          productId: product.id,
          productName: product.name,
          sourceLocation: productStock ? productStock.location : null,
          destinationLocation: null,
          quantity: amountToBuy,
          movementType: MovementType.Exit,
          movementReason: MovementReason.Sale,
          isDeleted: false,
        };
        await setDoc(movementRef, movementDoc);
      }
      batches.push(batch);
    }

    // Ejecutar los batches con límite de concurrencia
    await executeBatchesWithConcurrency(batches, CONCURRENCY_LIMIT);
  } catch (error) {
    console.error('Error al actualizar el stock de los productos:', error);
    throw new Error('No se pudo actualizar el stock de los productos');
  }
}
