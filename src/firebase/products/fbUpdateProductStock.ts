import {
  doc,
  increment,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import type { WriteBatch } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import { MovementReason, MovementType } from '@/models/Warehouse/Movement';
import { validateUser } from '@/utils/userValidation';
import type { ProductRecord } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';

type UserWithBusinessAndUid = UserWithBusiness & { uid: string };
type StockUpdateProduct = ProductRecord & {
  id: string;
  amountToBuy?: number | string;
  trackInventory?: boolean;
  batchId?: string | null;
  productStockId?: string | null;
  hasExpirationDate?: boolean;
  batch?: { numberId?: string | number };
  stock?: number | { location?: string };
  name?: string;
};

// Función para dividir el array en subarrays de tamaño máximo size
function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// Función para ejecutar batches con límite de concurrencia
async function executeBatchesWithConcurrency(
  batches: WriteBatch[],
  concurrencyLimit: number,
): Promise<void> {
  const executing: Array<Promise<void>> = [];
  const results: Array<Promise<void>> = [];

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

export async function fbUpdateProductsStock(
  products: StockUpdateProduct[],
  user: UserWithBusinessAndUid,
): Promise<void> {
  try {
    validateUser(user);
    const { businessID } = user;

    // Crear batches de operaciones
    const BATCH_LIMIT = 500;
    const CONCURRENCY_LIMIT = 5; // Puedes ajustar este valor según tus necesidades
    const productChunks = chunkArray(products, Math.floor(BATCH_LIMIT / 3)); // Estimación conservadora
    const batches: WriteBatch[] = [];

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
        const batchId = product.batchId;
        const productStockId = product.productStockId;
        const amountToBuy = Number(product.amountToBuy ?? 0);

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
          const productStock =
            typeof product.stock === 'object' && product.stock
              ? product.stock
              : { location: 'N/A' };

          const movement = {
            ...baseFields,
            id: movementId,
            batchId: batchId,
            productName: product.name ?? '',
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
