import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { db } from '@/firebase/firebaseconfig';
import { getNextID } from '@/firebase/Tools/getNextID';
import {
  createBatch,
  getAllBatches,
  updateBatch,
} from '@/firebase/warehouse/batchService';
import {
  createProductStock,
  getProductStockByBatch,
  updateProductStock,
} from '@/firebase/warehouse/productStockService';
import {
  getDefaultWarehouse,
  getWarehouse,
} from '@/firebase/warehouse/warehouseService';
import { BatchStatus } from '@/models/Warehouse/Batch';
import { MovementReason, MovementType } from '@/models/Warehouse/Movement';
import { safeTimestamp } from '@/firebase/utils/firestoreDates';
import { toMillis } from '@/utils/date/toMillis';
import { toValidDate } from '@/utils/date/toValidDate';
import {
  resolveMonetarySnapshotForBusiness,
} from '@/utils/accounting/monetary';
import type { UserIdentity } from '@/types/users';
import type { Purchase, PurchaseReplenishment } from '@/utils/purchase/types';
import {
  resolvePurchaseMonetaryTotals,
  resolvePurchasePaymentState,
  resolvePurchasePaymentTerms,
} from '@/utils/purchase/financials';
import {
  canCompletePurchase,
  resolveLegacyPurchaseStatus,
  resolvePurchaseReceiptChanges,
  resolvePurchaseWorkflowStatus,
} from '@/utils/purchase/workflow';
import { buildPurchaseReceiptHistory } from '@/utils/purchase/receiptHistory';
import { syncVendorBillFromPurchase } from '@/firebase/vendorBills/fbUpsertVendorBill';
import { syncPurchaseAttachments } from './attachmentService';
import { assertPurchaseCompletionAccountingPeriodOpen } from './utils/purchaseAccountingPeriod';

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

const resolvePurchaseMonetarySnapshot = async (
  businessId: string,
  purchase: Purchase,
  capturedBy: string | null | undefined,
): Promise<Record<string, unknown> | null> => {
  const totals = resolvePurchaseMonetaryTotals(purchase);
  if (totals.total == null) {
    return null;
  }
  const paymentTerms = resolvePurchasePaymentTerms(purchase);
  const paymentState = resolvePurchasePaymentState({
    purchase: { ...purchase, paymentTerms },
    total: totals.total,
  });

  return resolveMonetarySnapshotForBusiness({
    businessId,
    monetary: purchase.monetary,
    operationType: 'purchase',
    source: purchase,
    totals: {
      subtotal: totals.subtotal || undefined,
      taxes: totals.taxes || undefined,
      total: totals.total,
      paid: paymentState?.paid ?? 0,
      balance: paymentState?.balance ?? totals.total,
    },
    capturedBy: capturedBy ?? null,
  });
};

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
  completedBackOrderIds: string[] = [],
) => {
  if (!destinationWarehouse?.id) {
    throw new Error(
      'No se encontró un almacén válido para completar la compra.',
    );
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
    if (totalStock <= 0) {
      continue;
    }

    const expirationMillis = toMillis(batch.expirationDate) ?? 0;
    const batchNumber = `${purchase.id}_${batch.productId}_${expirationMillis}`;

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
    const existingBatches = await getAllBatches(user as any, batch.productId);
    const existingBatch = existingBatches.find(
      (item) =>
        item.purchaseId === purchase.id &&
        item.batchNumber === batchNumber &&
        item.isDeleted !== true,
    ) as (Record<string, unknown> & { id?: string; numberId?: string | number }) | undefined;

    const batchData = existingBatch?.id
      ? await updateBatch(user as any, {
          ...existingBatch,
          id: existingBatch.id,
          shortName: existingBatch.shortName || `${batch.productName}_${shortDate}`,
          providerId,
          status: BatchStatus.Active,
          quantity: Number(existingBatch.quantity ?? 0) + totalStock,
          initialQuantity: Number(existingBatch.initialQuantity ?? 0) + totalStock,
          receivedDate: new Date(),
        } as any)
      : await createBatch(
          user as any,
          {
            ...batchBaseFields,
            productId: batch.productId,
            purchaseId: purchase.id,
            numberId: await getNextID(user as any, 'batches'),
            shortName: `${batch.productName}_${shortDate}`,
            batchNumber,
            status: BatchStatus.Active,
            receivedDate: new Date(),
            providerId,
            quantity: totalStock,
            initialQuantity: totalStock,
          } as any,
        );
    const batchNumberId = (batchData as { numberId?: string | number })
      .numberId;

    const batchStocks = await getProductStockByBatch(user as any, {
      batchId: batchData.id,
      location: {
        warehouse: destinationWarehouse.id,
      },
    });
    const activeBatchStock = batchStocks.find(
      (item) => item.id && item.isDeleted !== true,
    ) as (Record<string, unknown> & { id?: string }) | undefined;

    if (activeBatchStock?.id) {
      await updateProductStock(user as any, {
        ...activeBatchStock,
        id: activeBatchStock.id,
        batchNumberId: batchNumberId ?? activeBatchStock.batchNumberId ?? null,
        productName: batch.productName,
        quantity: Number(activeBatchStock.quantity ?? 0) + totalStock,
        initialQuantity:
          Number(activeBatchStock.initialQuantity ?? 0) + totalStock,
        status: BatchStatus.Active,
        expirationDate,
      } as any);
    } else {
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
        status: BatchStatus.Active,
        initialQuantity: totalStock,
        expirationDate,
      };

      await createProductStock(user as any, productStockData);
    }

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

  }

  if (completedBackOrderIds.length > 0) {
    const writeBatchOp = writeBatch(db);

    for (const backOrderId of completedBackOrderIds) {
      const backOrderRef = doc(
        db,
        'businesses',
        businessID,
        'backOrders',
        backOrderId,
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

    await writeBatchOp.commit();
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
  // eslint_disable-next-line @typescript-eslint/no-empty-function
  setLoading = () => {},
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
    const storedPurchaseSnap = await getDoc(purchaseRef);
    if (!storedPurchaseSnap.exists()) {
      throw new Error('Compra no encontrada');
    }
    const storedPurchase = storedPurchaseSnap.data() as Purchase;
    if (!canCompletePurchase(storedPurchase)) {
      throw new Error(
        'Solo se pueden registrar recepciones sobre compras pendientes o parciales.',
      );
    }

    let destinationWarehouse: WarehouseRecord | null = null;
    if (warehouseId) {
      try {
        destinationWarehouse = (await getWarehouse(
          user as any,
          warehouseId,
        )) as WarehouseRecord | null;
      } catch (error) {
        console.warn(
          'No se pudo obtener el almacén seleccionado, se usará el predeterminado.',
          error,
        );
      }
    }

    if (!destinationWarehouse) {
      destinationWarehouse = (await getDefaultWarehouse(
        user as any,
      )) as WarehouseRecord | null;
    }

    if (!destinationWarehouse?.id) {
      throw new Error(
        'No se encontró un almacén válido para completar la compra.',
      );
    }

    const receiptChanges = resolvePurchaseReceiptChanges(
      storedPurchase.replenishments,
      purchase.replenishments,
    );
    const workflowStatus = resolvePurchaseWorkflowStatus({
      ...purchase,
      replenishments: receiptChanges.nextReplenishments,
    });
    if (receiptChanges.receiptReplenishments.length === 0) {
      throw new Error(
        'Debes registrar al menos una cantidad recibida para continuar.',
      );
    }
    const nextPurchase: Purchase = {
      ...storedPurchase,
      ...purchase,
      workflowStatus,
      replenishments: receiptChanges.nextReplenishments,
      status: resolveLegacyPurchaseStatus(workflowStatus),
      completedAt:
        workflowStatus === 'completed'
          ? purchase.completedAt ?? Date.now()
          : null,
    };
    await assertPurchaseCompletionAccountingPeriodOpen({
      businessId: user.businessID,
      purchase: nextPurchase,
    });

    const updatedAttachments = await syncPurchaseAttachments({
      user,
      purchaseId: purchase.id,
      currentAttachments: purchase.attachmentUrls,
      localFiles,
    });
    const receiptHistory = buildPurchaseReceiptHistory({
      currentHistory: storedPurchase.receiptHistory,
      nextReplenishments: receiptChanges.nextReplenishments,
      receiptReplenishments: receiptChanges.receiptReplenishments,
      user,
      warehouse: destinationWarehouse,
      workflowStatusAfter: workflowStatus,
    });
    const paymentTerms = resolvePurchasePaymentTerms(nextPurchase);
    const paymentState = resolvePurchasePaymentState({
      purchase: { ...nextPurchase, paymentTerms },
      total: resolvePurchaseMonetaryTotals(nextPurchase).total,
    });
    const pilotMonetarySnapshot = await resolvePurchaseMonetarySnapshot(
      user.businessID,
      { ...nextPurchase, paymentTerms, paymentState },
      user.uid,
    );

    const updatedData = {
      ...nextPurchase,
      status: resolveLegacyPurchaseStatus(workflowStatus),
      updatedAt: serverTimestamp(),
      deliveryAt: safeTimestamp(purchase.deliveryAt, 'server'),
      paymentAt: safeTimestamp(purchase.paymentAt, 'server'),
      completedAt:
        workflowStatus === 'completed'
          ? purchase.completedAt
            ? safeTimestamp(purchase.completedAt, 'server')
            : serverTimestamp()
          : null,
      attachmentUrls: updatedAttachments,
      receiptHistory,
      workflowStatus,
      replenishments: receiptChanges.nextReplenishments,
      destinationWarehouseId: destinationWarehouse.id,
      paymentTerms,
      paymentState,
    };
    if (pilotMonetarySnapshot || purchase.monetary) {
      updatedData.monetary = pilotMonetarySnapshot ?? purchase.monetary ?? null;
    }

    await updateDoc(purchaseRef, updatedData);
    await syncVendorBillFromPurchase({
      user,
      purchase: updatedData,
    });
    await updatePurchaseWarehouseStock(
      user,
      {
        ...nextPurchase,
        replenishments: receiptChanges.receiptReplenishments,
      },
      destinationWarehouse,
      receiptChanges.completedBackOrderIds,
    );

    setLoading(false);
    return updatedData;
  } catch (error) {
    setLoading(false);
    console.error('Error completing purchase:', error);
    throw error;
  }
};
