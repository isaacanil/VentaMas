import { https, logger } from 'firebase-functions';

import { db, serverTimestamp } from '../../../core/config/firebase.js';
import { buildAccountingEvent } from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import { isAccountingRolloutEnabledForBusiness } from '../../../versions/v2/accounting/utils/accountingRollout.util.js';

import { MovementType, MovementReason } from './movementEnums.js';
import {
  buildSaleUnitMovementSnapshot,
  resolveInventoryBaseQuantity,
} from '../utils/saleUnitQuantity.util.js';
import { isSupportedWeightUnit } from '../utils/weightUnit.util.js';

const BACK_ORDERS_COLLECTION = 'backOrders';

const sanitizeDocIdPart = (value, fallback = 'none') => {
  const raw =
    value === null || value === undefined || value === ''
      ? fallback
      : String(value).trim();
  return raw.replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 90) || fallback;
};

const resolveInventoryLineId = (product, index) =>
  product?.lineId || product?.cid || product?.cartLineId || `line-${index}`;

const buildInventorySideEffectId = ({
  type,
  saleId,
  product,
  index,
  productStockId,
  batchId,
}) =>
  [
    type,
    saleId,
    resolveInventoryLineId(product, index),
    product?.id,
    productStockId || 'no-stock',
    batchId || 'no-batch',
  ]
    .map((part) => sanitizeDocIdPart(part))
    .join('__');

const resolveInventorySideEffectState = ({
  businessID,
  prereq,
  saleId,
  product,
  index,
  productStockId,
  batchId,
}) => {
  const movementId =
    prereq?.movementId ||
    buildInventorySideEffectId({
      type: 'movement',
      saleId,
      product,
      index,
      productStockId,
      batchId,
    });
  const backorderId =
    prereq?.backorderId ||
    buildInventorySideEffectId({
      type: 'backorder',
      saleId,
      product,
      index,
      productStockId,
      batchId,
    });

  return {
    movementId,
    movementRef:
      prereq?.movementRef ||
      db.doc(`businesses/${businessID}/movements/${movementId}`),
    movementExists: prereq?.movementSnap?.exists === true,
    backorderId,
    backorderRef:
      prereq?.backorderRef ||
      db.doc(
        `businesses/${businessID}/${BACK_ORDERS_COLLECTION}/${backorderId}`,
      ),
    backorderExists: prereq?.backorderSnap?.exists === true,
  };
};

const getPhysicalStockQuantity = (productStockSnap) => {
  const rawQuantity = productStockSnap?.get?.('quantity');
  const quantity = Number(rawQuantity);
  if (
    rawQuantity !== undefined &&
    rawQuantity !== null &&
    Number.isFinite(quantity)
  ) {
    return Math.max(quantity, 0);
  }

  const legacyStock = Number(productStockSnap?.get?.('stock'));
  return Number.isFinite(legacyStock) ? Math.max(legacyStock, 0) : 0;
};

const hasSelectedPhysicalStock = (product) =>
  Boolean(product?.productStockId && product?.batchId);

const shouldAdjustInventoryLine = (product) =>
  Boolean(product?.trackInventory) || hasSelectedPhysicalStock(product);

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const assertSupportedWeightInventoryLine = (product) => {
  if (product?.weightDetail?.isSoldByWeight !== true) return;

  const weightUnit = toCleanString(product?.weightDetail?.weightUnit);
  if (!weightUnit || isSupportedWeightUnit(weightUnit)) return;

  throw new https.HttpsError(
    'failed-precondition',
    `Unidad de peso no soportada para ${
      product?.name || product?.id || 'producto'
    }: ${weightUnit}`,
  );
};

const roundMoney = (value) => Math.round((safeNumber(value) ?? 0) * 100) / 100;

const readSnapshotField = (snapshot, fieldPath) => {
  if (!snapshot || !fieldPath) return null;
  if (typeof snapshot.get === 'function') {
    try {
      const value = snapshot.get(fieldPath);
      if (value !== undefined) return value;
    } catch {
      // Fall back to data() for lightweight test doubles.
    }
  }

  const data = asRecord(snapshot.data?.());
  return fieldPath.split('.').reduce((current, key) => {
    const record = asRecord(current);
    return record[key];
  }, data);
};

const resolvePositiveNumber = (...values) => {
  for (const value of values) {
    const number = safeNumber(value);
    if (number != null && number > 0) {
      return number;
    }
  }

  return null;
};

const resolveInventoryUnitCost = ({
  batchSnap,
  productSnap,
  productStockSnap,
}) =>
  resolvePositiveNumber(
    readSnapshotField(productStockSnap, 'unitCost'),
    readSnapshotField(productStockSnap, 'cost'),
    readSnapshotField(productStockSnap, 'pricing.cost'),
    readSnapshotField(productStockSnap, 'cost.unit'),
    readSnapshotField(batchSnap, 'unitCost'),
    readSnapshotField(batchSnap, 'cost'),
    readSnapshotField(batchSnap, 'pricing.cost'),
    readSnapshotField(batchSnap, 'cost.unit'),
    readSnapshotField(productSnap, 'pricing.cost'),
    readSnapshotField(productSnap, 'cost.unit'),
    readSnapshotField(productSnap, 'cost'),
  );

const shouldWriteAccountingEvents = (settings, businessId) =>
  settings?.generalAccountingEnabled === true &&
  isAccountingRolloutEnabledForBusiness(businessId, settings);

const writeInventoryCogsAccountingEvent = ({
  accountingSettings,
  businessID,
  cogsLines,
  saleId,
  tx,
  uid,
}) => {
  const totalCost = roundMoney(
    cogsLines.reduce((sum, line) => sum + line.totalCost, 0),
  );
  if (totalCost <= 0) return;

  const now = serverTimestamp();
  const functionalCurrency = accountingSettings?.functionalCurrency || 'DOP';
  const accountingEvent = buildAccountingEvent({
    businessId: businessID,
    eventType: 'inventory.cogs.recorded',
    sourceType: 'invoice_inventory',
    sourceId: saleId,
    sourceDocumentType: 'invoice',
    sourceDocumentId: saleId,
    currency: functionalCurrency,
    functionalCurrency,
    monetary: {
      amount: totalCost,
      functionalAmount: totalCost,
    },
    payload: {
      documentNature: 'inventory',
      lineCount: cogsLines.length,
      lines: cogsLines,
      inventoryMovementSource: 'sale',
    },
    occurredAt: now,
    recordedAt: now,
    idempotencyKey: `inventory-cogs:${saleId}`,
    createdAt: now,
    createdBy: uid,
  });

  tx.set(
    db.doc(`businesses/${businessID}/accountingEvents/${accountingEvent.id}`),
    accountingEvent,
  );
};

/**
 * Ajusta inventario de productos usando BulkWriter de Admin SDK.
 * Reemplaza batching manual y concurrencia por back‑off automático.
 *
 * @param {{ uid: string; businessID: string }} user
 * @param {Array<{ id: string; name: string; amountToBuy: number; trackInventory: boolean; productStockId?: string; batchId?: string }>} products
 * @param {{ id: string }} sale
 * @param {object|null} accountingSettings
 */
export async function adjustProductInventory(
  tx,
  { user, products, sale, inventoryPrevreqs, accountingSettings = null },
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
  const productStockAdjustments = new Map();
  const batchAdjustments = new Map();
  const skippedProducts = [];
  const normalizedAccountingSettings = asRecord(accountingSettings);
  const accountingEnabled = shouldWriteAccountingEvents(
    normalizedAccountingSettings,
    businessID,
  );
  const cogsLines = [];

  const registerBackorder = ({
    productId,
    productName,
    productStockId,
    batchId,
    pendingQty,
    requestedQuantity,
    saleUnitSnapshot,
    lineId,
    backorderId,
    backorderRef,
  }) => {
    if (!pendingQty || pendingQty <= 0) return;
    const ts = serverTimestamp();
    tx.set(
      backorderRef ||
        db.doc(
          `businesses/${businessID}/${BACK_ORDERS_COLLECTION}/${backorderId}`,
        ),
      {
        id: backorderId,
        productId,
        productName: productName || null,
        quantity: pendingQty,
        baseQuantity: pendingQty,
        productStockId: productStockId || null,
        batchId: batchId || null,
        saleId,
        lineId: lineId || null,
        requestedQuantity: requestedQuantity ?? pendingQty,
        requestedBaseQuantity: requestedQuantity ?? pendingQty,
        initialQuantity: pendingQty,
        pendingQuantity: pendingQty,
        pendingBaseQuantity: pendingQty,
        saleUnit: saleUnitSnapshot,
        status: 'pending',
        createdAt: ts,
        createdBy: uid,
        updatedAt: ts,
        updatedBy: uid,
      },
    );
  };

  const registerMovement = ({
    productId,
    productName,
    batchId,
    batchNumberId,
    quantityMoved,
    sourceLocation,
    productStockId,
    requestedQuantity,
    saleUnitSnapshot,
    lineId,
    movementId,
    movementRef,
  }) => {
    if (!quantityMoved || quantityMoved <= 0) return null;
    const ts = serverTimestamp();
    tx.set(
      movementRef || db.doc(`businesses/${businessID}/movements/${movementId}`),
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
        productStockId: productStockId || null,
        lineId: lineId || null,
        sourceLocation: sourceLocation || null,
        destinationLocation: null,
        quantity: quantityMoved,
        requestedQuantity: requestedQuantity ?? quantityMoved,
        saleUnit: saleUnitSnapshot,
        movementType: MovementType.Exit,
        movementReason: MovementReason.Sale,
        isDeleted: false,
      },
      { merge: false },
    );
    return movementId;
  };

  for (let index = 0; index < products.length; index += 1) {
    const prereq = prereqMap.get(index);
    const prod = prereq?.prod || products[index];
    if (!shouldAdjustInventoryLine(prod)) continue;
    assertSupportedWeightInventoryLine(prod);

    const {
      id: productId,
      name: productName,
      productStockId,
      batchId,
      cid,
      lineId: rawLineId,
    } = prod;

    const quantityRequested = resolveInventoryBaseQuantity(prod);
    if (quantityRequested === 0) continue;
    const saleUnitSnapshot = buildSaleUnitMovementSnapshot(prod);
    const lineId = rawLineId || cid || null;
    const sideEffectState = resolveInventorySideEffectState({
      businessID,
      prereq,
      saleId,
      product: prod,
      index,
      productStockId,
      batchId,
    });

    if (sideEffectState.movementExists || sideEffectState.backorderExists) {
      skippedProducts.push({
        productId,
        reason: 'inventory-side-effect-already-exists',
      });
      continue;
    }

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
        productName,
        productStockId: productStockId || null,
        batchId,
        pendingQty: quantityRequested,
        requestedQuantity: quantityRequested,
        saleUnitSnapshot,
        lineId,
        backorderId: sideEffectState.backorderId,
        backorderRef: sideEffectState.backorderRef,
      });
      continue;
    }

    const productStockSnap = prereq.productStockSnap;
    const batchSnap = prereq.batchSnap;
    const productSnap = prereq.productSnap;

    const productStockKey =
      productStockSnap?.ref?.path || productStockId || `line-${index}`;
    const productStockEntry = productStockAdjustments.get(productStockKey) || {
      ref: productStockSnap.ref,
      snap: productStockSnap,
      available: getPhysicalStockQuantity(productStockSnap),
      consumed: 0,
    };
    const availableStock = Math.max(
      productStockEntry.available - productStockEntry.consumed,
      0,
    );
    const qtyToConsume = Math.min(quantityRequested, availableStock);
    const backorderQty = quantityRequested - qtyToConsume;
    const batchNumberId = batchSnap?.get('numberId') || null;
    const sourceLocation = productStockSnap?.get('location') || null;

    if (prod.restrictSaleWithoutStock === true && backorderQty > 0) {
      throw new https.HttpsError(
        'failed-precondition',
        `Stock insuficiente para ${
          productName || productId
        }. Disponible ${availableStock}, solicitado ${quantityRequested}.`,
      );
    }

    if (qtyToConsume > 0) {
      productStockEntry.consumed += qtyToConsume;
      productStockAdjustments.set(productStockKey, productStockEntry);

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

      const movementId = registerMovement({
        productId,
        productName,
        batchId,
        batchNumberId,
        quantityMoved: qtyToConsume,
        productStockId,
        requestedQuantity: quantityRequested,
        sourceLocation,
        saleUnitSnapshot,
        lineId,
        movementId: sideEffectState.movementId,
        movementRef: sideEffectState.movementRef,
      });

      if (accountingEnabled) {
        const unitCost = resolveInventoryUnitCost({
          batchSnap,
          productSnap,
          productStockSnap,
        });
        if (unitCost != null) {
          cogsLines.push({
            productId,
            productName: productName || null,
            productStockId: productStockId || null,
            batchId: batchId || null,
            movementId,
            lineId: lineId || null,
            quantity: qtyToConsume,
            saleUnit: saleUnitSnapshot,
            unitCost: roundMoney(unitCost),
            totalCost: roundMoney(unitCost * qtyToConsume),
          });
        }
      }
    }

    if (backorderQty > 0) {
      registerBackorder({
        productId,
        productName,
        productStockId,
        batchId,
        pendingQty: backorderQty,
        requestedQuantity: quantityRequested,
        saleUnitSnapshot,
        lineId,
        backorderId: sideEffectState.backorderId,
        backorderRef: sideEffectState.backorderRef,
      });
    }
  }

  const ts = serverTimestamp();

  for (const [productStockKey, data] of productStockAdjustments.entries()) {
    if (!data?.ref) continue;
    const nextStock = Math.max(data.available - data.consumed, 0);
    const stockPayload = {
      quantity: nextStock,
      stock: nextStock,
      updatedAt: ts,
      updatedBy: uid,
    };
    if (nextStock <= 0) {
      stockPayload.status = 'inactive';
    }
    tx.update(data.ref, stockPayload);
    logger.debug('Existencia fisica actualizada', {
      productStockId: productStockKey,
      consumed: data.consumed,
      nextStock,
      saleId,
    });
  }

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

  if (accountingEnabled) {
    writeInventoryCogsAccountingEvent({
      accountingSettings: normalizedAccountingSettings,
      businessID,
      cogsLines,
      saleId,
      tx,
      uid,
    });
  }

  logger.info(`Movimientos de inventario ajustados para la venta ${saleId}`, {
    traceId: saleId,
    user: uid,
  });
}
