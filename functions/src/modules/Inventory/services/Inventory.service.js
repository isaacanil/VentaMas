import { https, logger } from 'firebase-functions';
import { nanoid } from 'nanoid';

import {
  db,
  increment,
  serverTimestamp,
} from '../../../core/config/firebase.js';

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

  for (const prod of products) {
    const {
      id: productId,
      name: productName,
      amountToBuy,
      productStockId,
      batchId,
    } = prod;

    const quantityRequested = Number(amountToBuy) || 0;
    const prereq = inventoryPrevreqs.find(
      (item) => item?.prod?.id === productId,
    );

    if (!prereq) {
      logger.warn('Inventario sin prerequisitos calculados', {
        productId,
        saleId,
        businessID,
      });
      continue;
    }

    const { stockSnap, batchSnap } = prereq;
    const currentStock = Number(stockSnap?.get('stock')) || 0;
    let decrement = -quantityRequested;
    let backorderQty = 0;

    if (currentStock < quantityRequested) {
      decrement = -currentStock;
      backorderQty = quantityRequested - currentStock;
    }

    const incDelta = increment(decrement);
    const stockRef = stockSnap?.ref;
    const batchRef = batchSnap?.ref;
    const batchNumberId = batchSnap?.get('numberId') || null;

    if (stockRef) {
      tx.update(stockRef, { stock: incDelta });
    }

    if (batchRef) {
      tx.update(batchRef, { quantity: incDelta });
    }

    const stockRecRef = db.doc(
      `businesses/${businessID}/productsStock/${productStockId}`,
    );

    if (currentStock + decrement <= 0) {
      tx.update(stockRecRef, {
        quantity: 0,
        status: 'inactive',
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    } else {
      tx.update(stockRecRef, { quantity: incDelta });
    }

    if (backorderQty > 0) {
      const backorderId = nanoid();
      tx.set(db.doc(`businesses/${businessID}/backorders/${backorderId}`), {
        id: backorderId,
        productId,
        quantity: backorderQty,
        productStockId,
        saleId,
        initialQuantity: backorderQty,
        pendingQuantity: backorderQty,
        status: 'pending',
        createdAt: serverTimestamp(),
        createdBy: uid,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    }

    const movementId = nanoid();
    const movementRef = db.doc(
      `businesses/${businessID}/movements/${movementId}`,
    );
    tx.set(movementRef, {
      id: movementId,
      saleId,
      createdAt: serverTimestamp(),
      createdBy: uid,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
      batchId: batchId || null,
      batchNumberId,
      productId,
      productName,
      sourceLocation: stockSnap?.get('location') || null,
      destinationLocation: null,
      quantity: quantityRequested,
      movementType: MovementType.Exit,
      movementReason: MovementReason.Sale,
      isDeleted: false,
    });
  }
  logger.info(`Movimientos de inventario ajustados para la venta ${saleId}`, {
    traceId: saleId,
    user: uid,
  });
}
