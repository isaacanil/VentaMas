import {
  doc,
  increment,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { MovementReason, MovementType } from '../../models/Warehouse/Movement';
import { validateUser } from '../../utils/userValidation';
import { db } from '../firebaseconfig';

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

export async function fbUpdateProductsStock(products, user) {
  try {
    validateUser(user);
    const { businessID } = user;

    // Crear batches de operaciones
    const BATCH_LIMIT = 500;
    const CONCURRENCY_LIMIT = 5; // Puedes ajustar este valor según tus necesidades
    const productChunks = chunkArray(products, Math.floor(BATCH_LIMIT / 3)); // Estimación conservadora
    const batches = [];

    for (const chunk of productChunks) {
      const batch = writeBatch(db);
      for (const product of chunk) {
        if (!product?.trackInventory) continue;

        const productRef = doc(
          db,
          'businesses',
          businessID,
          'products',
          product.id,
        );
        const batchId = product?.batchId;
        const productStockId = product?.productStockId;
        const amountToBuy = Number(product?.amountToBuy);

        if (isNaN(amountToBuy) || amountToBuy <= 0) {
          console.warn(`Cantidad inválida para el producto ${product.id}`);
          continue;
        }

        const stockUpdateValue = increment(-amountToBuy);

        batch.update(productRef, { stock: stockUpdateValue });

        if (product?.hasExpirationDate && batchId && productStockId) {
          const movementId = nanoid();
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
          const movementRef = doc(
            db,
            'businesses',
            businessID,
            'movements',
            movementId,
          );
          batch.update(productBatchRef, { quantity: stockUpdateValue });
          batch.update(productStockRef, { quantity: stockUpdateValue });

          const baseFields = {
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            quantity: amountToBuy,
          };

          const productBatch = product.batch || { numberId: 'N/A' };
          const productStock = product.stock || { location: 'N/A' };

          const movement = {
            ...baseFields,
            id: movementId,
            batchId: batchId,
            productName: product.name,
            batchNumberId: productBatch.numberId,
            destinationLocation: null,
            sourceLocation: productStock.location,
            productId: product.id,
            movementType: MovementType.Exit,
            movementReason: MovementReason.Sale,
          };
          batch.set(movementRef, movement);
        }
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
