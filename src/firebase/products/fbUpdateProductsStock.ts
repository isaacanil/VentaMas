import {
  doc,
  increment,
  writeBatch,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import type { WriteBatch } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import {
  getBatchById,
  updateBatchStatusForProductStock,
} from '@/firebase/warehouse/batchService';
import { getProductStockById } from '@/firebase/warehouse/productStockService';
import { MovementReason, MovementType } from '@/models/Warehouse/Movement';
import { validateUser } from '@/utils/userValidation';
import type { ProductRecord } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';

type UserWithBusinessAndUid = UserWithBusiness & { uid: string };
type StockUpdateProduct = ProductRecord & {
  id: string;
  amountToBuy?: number | string;
  trackInventory?: boolean;
  productStockId?: string | null;
  batchId?: string | null;
  name?: string;
};
type SaleLike = { id: string };
type ProductStockLike = { quantity?: number; location?: string };
type BatchLike = { numberId?: string | number };

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
  sale: SaleLike,
): Promise<void> {
  try {
    validateUser(user);
    const { businessID } = user;

    // Crear batches de operaciones
    const BATCH_LIMIT = 500;
    const CONCURRENCY_LIMIT = 5;
    const productChunks = chunkArray(products, Math.floor(BATCH_LIMIT / 3));
    const batches: WriteBatch[] = [];

    for (const chunk of productChunks) {
      const batch = writeBatch(db);
      for (const product of chunk) {
        const movementId = nanoid();
        const amountToBuy = Number(product.amountToBuy ?? 0);
        let productStock: ProductStockLike | null = null;
        let productBatch: BatchLike | null = null;
        let backorderQuantity = amountToBuy;

        if (product?.trackInventory) {
          const productStockId = product.productStockId;
          const batchId = product.batchId;
          let currentStock = 0;

          if (productStockId && batchId) {
            productStock = (await getProductStockById(
              user,
              productStockId,
            )) as ProductStockLike | null;
            if (productStock) {
              currentStock = productStock.quantity || 0;
            }
            productBatch = (await getBatchById(
              user,
              batchId,
            )) as BatchLike | null;

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
          batchId: product.batchId ?? null,
          batchNumberId: productBatch ? productBatch.numberId : null,
          productId: product.id,
          productName: product.name ?? '',
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
