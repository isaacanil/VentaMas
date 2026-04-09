import { https, logger } from 'firebase-functions';
import { nanoid } from 'nanoid';

import { db, serverTimestamp } from '../../../core/config/firebase.js';

import { MovementType, MovementReason } from './movementEnums.js';

/**
 * Ajusta inventario de productos usando BulkWriter de Admin SDK.
 * Reemplaza batching manual y concurrencia por back‑off automático.
 *
 * @param {{ uid: string; businessID: string }} user
 * @param {Array<{ id: string; name: string; amountToBuy: number; trackInventory: boolean; productStockId?: string; batchId?: string }>} products
 * @param {{ id: string }} sale
 */
export async function adjustProductInventory(
  tx,
  { user, products, sale, inventoryPrevreqs },
) {
  if (!user?.businessID || !user?.uid) {
    throw new https.HttpsError(
      'invalid-argument',
      'Usuario no válido o sin businessID',
    );
  }
  if (!Array.isArray(products) || products.length === 0) {
    throw new https.HttpsError(
      'invalid-argument',
      'Se requiere un array de productos',
    );
  }
  if (!sale?.id) {
    throw new https.HttpsError('invalid-argument', 'Sale.id requerido');
  }

  const { businessID, uid } = user;
  const saleId = sale.id;
  const prereqMap = new Map(
    (inventoryPrevreqs || []).map((entry) => [entry.index, entry]),
  );
  const productAdjustments = new Map();
  const batchAdjustments = new Map();
  const skippedProducts = [];

  const registerBackorder = ({ productId, productStockId, pendingQty }) => {
    if (!pendingQty || pendingQty <= 0) return;
    const backorderId = nanoid();
    const ts = serverTimestamp();
    tx.set(db.doc(`businesses/${businessID}/backorders/${backorderId}`), {
      id: backorderId,
      productId,
      quantity: pendingQty,
      productStockId: productStockId || null,
      saleId,
      initialQuantity: pendingQty,
      pendingQuantity: pendingQty,
      status: 'pending',
      createdAt: ts,
      createdBy: uid,
      updatedAt: ts,
      updatedBy: uid,
    });
  };

  const registerMovement = ({
    productId,
    productName,
    batchId,
    batchNumberId,
    quantityMoved,
    sourceLocation,
    requestedQuantity,
  }) => {
    if (!quantityMoved || quantityMoved <= 0) return;
    const movementId = nanoid();
    const ts = serverTimestamp();
    tx.set(
      db.doc(`businesses/${businessID}/movements/${movementId}`),
      {
        id: movementId,
        saleId,
        createdAt: ts,
        createdBy: uid,
        updatedAt: ts,
        updatedBy: uid,
        batchId: batchId || null,
        batchNumberId: batchNumberId || null,
        productId,
        productName,
        sourceLocation: sourceLocation || null,
        destinationLocation: null,
        quantity: quantityMoved,
        requestedQuantity: requestedQuantity ?? quantityMoved,
        movementType: MovementType.Exit,
        movementReason: MovementReason.Sale,
        isDeleted: false,
      },
      { merge: false },
    );
  };

  for (let index = 0; index < products.length; index += 1) {
    const prod = products[index];
    if (!prod?.trackInventory) continue;

    const {
      id: productId,
      name: productName,
      amountToBuy,
      productStockId,
      batchId,
    } = prod;

    const quantityRequested = Math.max(Number(amountToBuy) || 0, 0);
    if (quantityRequested === 0) continue;

    const prereq = prereqMap.get(index);
    if (!prereq) {
      logger.error('Inventario sin prerequisitos resueltos', {
        productId,
        saleId,
        businessID,
      });
      throw new https.HttpsError(
        'failed-precondition',
        `No se pudieron resolver los prerequisitos de inventario para ${productName || productId}`,
      );
    }

    if (prereq.skipped) {
      skippedProducts.push({ productId, reason: prereq.reason });
      registerBackorder({
        productId,
        productStockId: productStockId || null,
        pendingQty: quantityRequested,
      });
      continue;
    }

    const productStockSnap = prereq.productStockSnap;
    const batchSnap = prereq.batchSnap;
    const productSnap = prereq.productSnap;

    const rawAvailable = Number(productStockSnap?.get('quantity'));
    const availableStock = Number.isFinite(rawAvailable)
      ? Math.max(rawAvailable, 0)
      : 0;
    const qtyToConsume = Math.min(quantityRequested, availableStock);
    const backorderQty = quantityRequested - qtyToConsume;
    const remainingStock = Math.max(availableStock - qtyToConsume, 0);
    const batchNumberId = batchSnap?.get('numberId') || null;
    const sourceLocation = productStockSnap?.get('location') || null;

    const stockPayload = {
      quantity: remainingStock,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    };
    if (remainingStock <= 0) {
      stockPayload.status = 'inactive';
    }
    tx.update(productStockSnap.ref, stockPayload);

    if (qtyToConsume > 0) {
      const productEntry = productAdjustments.get(productId) || {
        ref: productSnap.ref,
        snap: productSnap,
        consumed: 0,
      };
      productEntry.consumed += qtyToConsume;
      productAdjustments.set(productId, productEntry);

      if (batchId) {
        const batchEntry = batchAdjustments.get(batchId) || {
          ref: batchSnap.ref,
          snap: batchSnap,
          consumed: 0,
        };
        batchEntry.consumed += qtyToConsume;
        batchAdjustments.set(batchId, batchEntry);
      }

      registerMovement({
        productId,
        productName,
        batchId,
        batchNumberId,
        quantityMoved: qtyToConsume,
        requestedQuantity: quantityRequested,
        sourceLocation,
      });
    }

    if (backorderQty > 0) {
      registerBackorder({
        productId,
        productStockId,
        pendingQty: backorderQty,
      });
    }
  }

  const ts = serverTimestamp();

  for (const [productId, data] of productAdjustments.entries()) {
    if (!data?.ref) continue;
    const currentStock = Number(data.snap?.get('stock')) || 0;
    const nextStock = Math.max(currentStock - data.consumed, 0);
    tx.update(data.ref, {
      stock: nextStock,
      updatedAt: ts,
      updatedBy: uid,
    });
    logger.debug('Stock de producto actualizado', {
      productId,
      consumed: data.consumed,
      nextStock,
      saleId,
    });
  }

  for (const [batchKey, data] of batchAdjustments.entries()) {
    if (!data?.ref) continue;
    const currentQty = Number(data.snap?.get('quantity')) || 0;
    const nextQty = Math.max(currentQty - data.consumed, 0);
    const payload = {
      quantity: nextQty,
      updatedAt: ts,
      updatedBy: uid,
    };
    if (nextQty <= 0) {
      payload.status = 'inactive';
    }
    tx.update(data.ref, payload);
    logger.debug('Batch actualizado', {
      batchId: batchKey,
      consumed: data.consumed,
      nextQty,
      saleId,
    });
  }

  if (skippedProducts.length > 0) {
    logger.info('Productos con inventario omitido por falta de referencia', {
      saleId,
      skippedProducts,
    });
  }

  logger.info(`Movimientos de inventario ajustados para la venta ${saleId}`, {
    traceId: saleId,
    user: uid,
  });
}
