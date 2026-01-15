import {
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { db } from '@/firebase/firebaseconfig';
import { getNextID } from '@/firebase/Tools/getNextID';
import { createBatch } from '@/firebase/warehouse/batchService';
import { createProductStock } from '@/firebase/warehouse/productStockService';
import {
  getDefaultWarehouse,
  getWarehouse,
} from '@/firebase/warehouse/warehouseService';
import { BatchStatus } from '@/models/Warehouse/Batch';
import { MovementReason, MovementType } from '@/models/Warehouse/Movement';
import { safeTimestamp } from '@/firebase/utils/firestoreDates';
import { toMillis } from '@/utils/date/toMillis';
import { toValidDate } from '@/utils/date/toValidDate';
import type { UserIdentity } from '@/types/users';
import type {
  Purchase,
  PurchaseReplenishment,
} from '@/utils/purchase/types';
import { syncPurchaseAttachments } from './attachmentService';

interface WarehouseRecord {
  id?: string;
  [key: string]: unknown;
}

interface PurchaseBatchGroup {
  productId: string;
  productName: string;
  expirationDate: PurchaseReplenishment['expirationDate'];
  items: PurchaseReplenishment[];
}

const resolveProviderId = (provider: Purchase['provider']): string => {
  if (typeof provider === 'string') return provider;
  if (provider && typeof provider === 'object') {
    const possibleId = (provider as { id?: unknown }).id;
    if (typeof possibleId === 'string') return possibleId;
  }
  return '';
};

const updatePurchaseWarehouseStock = async (
  user: UserIdentity,
  purchase: Purchase,
  destinationWarehouse: WarehouseRecord,
) => {
  if (!destinationWarehouse?.id) {
    throw new Error('No se encontró un almacén válido para completar la compra.');
  }

  const productBatches: Record<string, PurchaseBatchGroup> = {};
  const businessID = user.businessID as string;
  const auditFields = {
    createdAt: serverTimestamp(),
    createdBy: user.uid,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
  };
  const batchBaseFields = {
    createdBy: user.uid,
    updatedBy: user.uid,
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
  };

  const replenishments = purchase.replenishments || [];

  for (const replenishment of replenishments) {
    const productId = replenishment.id || replenishment.productId;
    if (!productId) continue;

    const expirationMillis = toMillis(replenishment.expirationDate);
    const expirationKey =
      typeof expirationMillis === 'number' && Number.isFinite(expirationMillis)
        ? String(expirationMillis)
        : 'no-expiration';
    const key = `${productId}_${expirationKey}`;

    if (!productBatches[key]) {
      productBatches[key] = {
        productId,
        productName: replenishment.name || 'Producto sin nombre',
        expirationDate: replenishment.expirationDate,
        items: [],
      };
    }

    productBatches[key].items.push(replenishment);
  }

  for (const key of Object.keys(productBatches)) {
    const batch = productBatches[key];
    const totalStock = batch.items.reduce((acc, item) => {
      const qty = Number(item.quantity ?? item.purchaseQuantity ?? 0);
      return acc + (Number.isFinite(qty) ? qty : 0);
    }, 0);

    const expirationMillis = toMillis(batch.expirationDate) ?? 0;
    const batchId = `${purchase.id}_${batch.productId}_${expirationMillis}`;

    const productRef = doc(
      db,
      'businesses',
      businessID,
      'products',
      batch.productId,
    );

    await runTransaction(db, async (transaction) => {
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists()) {
        throw new Error(
          `Producto ${batch.productId} no encontrado durante la compra ${purchase.id}`,
        );
      }

      const currentStock = Number(productSnap.data()?.stock ?? 0);
      const nextStock = Math.max(0, currentStock + totalStock);
      const updateProductData: Record<string, unknown> = {
        stock: nextStock,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };

      if (nextStock <= 0) {
        updateProductData.status = 'inactive';
      } else if (productSnap.data()?.status === 'inactive') {
        updateProductData.status = 'active';
      }

      transaction.update(productRef, updateProductData);
    });

    const expirationDate = toValidDate(batch.expirationDate);
    const shortDate = expirationDate
      ? expirationDate.toISOString().split('T')[0]
      : 'sin-fecha';

    const providerId = resolveProviderId(purchase.provider);
    const batchData = await createBatch(user as any, {
      ...batchBaseFields,
      productId: batch.productId,
      purchaseId: purchase.id,
      numberId: await getNextID(user as any, 'batches'),
      shortName: `${batch.productName}_${shortDate}`,
      batchNumber: batchId,
      status: totalStock === 0 ? BatchStatus.Inactive : BatchStatus.Active,
      receivedDate: new Date(),
      providerId,
      quantity: totalStock,
      initialQuantity: totalStock,
    } as any);
    const batchNumberId = (batchData as { numberId?: string | number }).numberId;

    const productStockData = {
      ...auditFields,
      batchId: batchData.id,
      batchNumberId: batchNumberId ?? null,
      location: {
        warehouse: destinationWarehouse.id,
      },
      productId: batch.productId,
      productName: batch.productName,
      quantity: totalStock,
      status: totalStock === 0 ? BatchStatus.Inactive : BatchStatus.Active,
      initialQuantity: totalStock,
      expirationDate,
    };

    await createProductStock(user as any, productStockData);

    const movementId = nanoid();
    const movementRef = doc(
      db,
      'businesses',
      businessID,
      'movements',
      movementId,
    );
    const movement = {
      ...auditFields,
      id: movementId,
      batchId: batchData.id,
      productName: batch.productName,
      batchNumberId: batchNumberId ?? null,
      destinationLocation: destinationWarehouse.id,
      sourceLocation: null,
      productId: batch.productId,
      quantity: totalStock,
      movementType: MovementType.Entry,
      movementReason: MovementReason.Purchase,
    };

    await setDoc(movementRef, movement);

    const replenishmentsWithBackOrders = batch.items.filter(
      (item) => item.selectedBackOrders && item.selectedBackOrders.length > 0,
    );

    if (replenishmentsWithBackOrders.length > 0) {
      const writeBatchOp = writeBatch(db);

      for (const replenishment of replenishmentsWithBackOrders) {
        for (const backOrder of replenishment.selectedBackOrders || []) {
          const backOrderRef = doc(
            db,
            'businesses',
            businessID,
            'backOrders',
            backOrder.id,
          );
          writeBatchOp.update(backOrderRef, {
            status: 'completed',
            completedAt: serverTimestamp(),
            completedBy: user.uid,
            completedWithPurchaseId: purchase.id,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
            pendingQuantity: 0,
          });
        }
      }

      await writeBatchOp.commit();
    }
  }
};

interface CompletePurchaseParams {
  user: UserIdentity;
  purchase: Purchase;
  localFiles?: Purchase['attachmentUrls'];
  setLoading?: (value: boolean) => void;
  warehouseId?: string | null;
}

export const fbCompletePurchase = async ({
  user,
  purchase,
  localFiles = [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setLoading = () => { },
  warehouseId = null,
}: CompletePurchaseParams) => {
  try {
    setLoading(true);

    if (!user?.businessID) {
      throw new Error('No user or businessID provided');
    }
    if (!purchase?.id) {
      throw new Error('No purchase id provided');
    }

    const purchaseRef = doc(
      db,
      'businesses',
      user.businessID as string,
      'purchases',
      purchase.id,
    );

    let destinationWarehouse: WarehouseRecord | null = null;
    if (warehouseId) {
      try {
        destinationWarehouse = (await getWarehouse(user as any, warehouseId)) as
          | WarehouseRecord
          | null;
      } catch (error) {
        console.warn(
          'No se pudo obtener el almacén seleccionado, se usará el predeterminado.',
          error,
        );
      }
    }

    if (!destinationWarehouse) {
      destinationWarehouse = (await getDefaultWarehouse(user as any)) as
        | WarehouseRecord
        | null;
    }

    if (!destinationWarehouse?.id) {
      throw new Error('No se encontró un almacén válido para completar la compra.');
    }

    const updatedAttachments = await syncPurchaseAttachments({
      user,
      purchaseId: purchase.id,
      currentAttachments: purchase.attachmentUrls,
      localFiles,
    });

    const updatedData = {
      ...purchase,
      status: 'completed',
      updatedAt: serverTimestamp(),
      deliveryAt: safeTimestamp(purchase.deliveryAt, 'server'),
      paymentAt: safeTimestamp(purchase.paymentAt, 'server'),
      completedAt: purchase.completedAt
        ? safeTimestamp(purchase.completedAt, 'server')
        : null,
      attachmentUrls: updatedAttachments,
      destinationWarehouseId: destinationWarehouse.id,
    };

    await updateDoc(purchaseRef, updatedData);
    await updatePurchaseWarehouseStock(user, purchase, destinationWarehouse);

    setLoading(false);
    return updatedData;
  } catch (error) {
    setLoading(false);
    console.error('Error completing purchase:', error);
    throw error;
  }
};

