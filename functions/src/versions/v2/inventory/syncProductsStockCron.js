import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { db, serverTimestamp } from '../../../core/config/firebase.js';

const CRON_SCHEDULE = process.env.INVENTORY_SYNC_CRON || '0 3 * * *';
const CRON_TIMEZONE = process.env.INVENTORY_SYNC_TZ || 'America/Santo_Domingo';
const CRON_REGION = process.env.INVENTORY_SYNC_REGION || 'us-central1';
const FILTER_ACTIVE_DEFAULT = /^false$/i.test(process.env.INVENTORY_SYNC_INCLUDE_INACTIVE || '') ? false : true;
const NEGATIVE_FIX_ACTOR = 'system:inventory-negative-cron';
const NEGATIVE_FIX_ORIGIN = 'inventory-negative-correction';

const number = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

async function syncBusinessProductsStock(businessId, { filterActive = FILTER_ACTIVE_DEFAULT } = {}) {
  if (!businessId || typeof businessId !== 'string') {
    throw new Error('Invalid businessId');
  }

  const businessRef = db.collection('businesses').doc(businessId);

  const stockCollection = businessRef.collection('productsStock');
  let stockQuery = stockCollection.where('isDeleted', '==', false);
  if (filterActive) {
    stockQuery = stockQuery.where('status', '==', 'active');
  }

  const stockSnap = await stockQuery.select('productId', 'quantity', 'status', 'batchId').get();

  const totalsByProduct = new Map();
  const invalidStockDocs = [];
  const negativeStockRecords = [];
  const negativeShortageByProduct = new Map();
  const batchesToDeactivate = new Map();

  stockSnap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const productIdRaw = data.productId;
    const productId = typeof productIdRaw === 'string' ? productIdRaw.trim() : '';
    if (!productId) {
      if (invalidStockDocs.length < 50) {
        invalidStockDocs.push(docSnap.id);
      }
      return;
    }

    const quantity = number(data.quantity);
    if (quantity < 0) {
      const shortage = Math.abs(quantity);
      const batchIdRaw = data.batchId;
      const batchId = typeof batchIdRaw === 'string' ? batchIdRaw.trim() : '';
      negativeStockRecords.push({
        docRef: docSnap.ref,
        docId: docSnap.id,
        productId,
        batchId,
        shortage,
        previousQuantity: quantity,
      });
      negativeShortageByProduct.set(productId, (negativeShortageByProduct.get(productId) || 0) + shortage);

      if (batchId) {
        const current = batchesToDeactivate.get(batchId) || { shortage: 0, stockIds: [] };
        current.shortage += shortage;
        if (current.stockIds.length < 10) {
          current.stockIds.push(docSnap.id);
        }
        batchesToDeactivate.set(batchId, current);
      }

      return;
    }

    totalsByProduct.set(productId, (totalsByProduct.get(productId) || 0) + quantity);
  });

  const productsSnap = await businessRef
    .collection('products')
    .select('stock', 'name', 'isDeleted')
    .get();

  const writer = db.bulkWriter();

  writer.onWriteError((err) => {
    if (err.failedAttempts < 3) {
      return true;
    }
    logger.error('[syncProductsStockCron] BulkWriter error', {
      businessId,
      path: err.documentRef?.path,
      code: err.code,
      message: err.message,
    });
    return false;
  });

  if (negativeStockRecords.length > 0) {
    for (const record of negativeStockRecords) {
      const ts = serverTimestamp();
      writer.update(record.docRef, {
        quantity: 0,
        status: 'inactive',
        updatedAt: ts,
        updatedBy: NEGATIVE_FIX_ACTOR,
        lastNegativeCorrectionAt: ts,
        lastNegativeCorrectionSource: NEGATIVE_FIX_ORIGIN,
        lastNegativeCorrectionQuantity: record.previousQuantity,
        lastNegativeCorrectionShortage: record.shortage,
      });
    }

    for (const [batchId, meta] of batchesToDeactivate.entries()) {
      if (!batchId) continue;
      const ts = serverTimestamp();
      const batchRef = businessRef.collection('batches').doc(batchId);
      const batchPayload = {
        status: 'inactive',
        quantity: 0,
        updatedAt: ts,
        updatedBy: NEGATIVE_FIX_ACTOR,
        lastInactiveSource: NEGATIVE_FIX_ORIGIN,
        lastInactiveAt: ts,
        lastInactiveShortage: meta?.shortage || 0,
      };

      if (Array.isArray(meta?.stockIds) && meta.stockIds.length > 0) {
        batchPayload.lastInactiveStockIds = meta.stockIds;
      }

      writer.set(
        batchRef,
        batchPayload,
        { merge: true }
      );
    }
  }

  const timestampISO = new Date().toISOString();
  const summary = {
    updatedProducts: 0,
    zeroedProducts: 0,
    backOrders: 0,
    invalidProducts: 0,
    invalidStockDocs,
    orphanTotals: [],
    negativeStocksProcessed: negativeStockRecords.length,
    negativeStockQuantity: negativeStockRecords.reduce((sum, record) => sum + record.shortage, 0),
    negativeStockDocIds: negativeStockRecords.slice(0, 50).map((record) => record.docId),
    batchesDeactivated: Array.from(batchesToDeactivate.keys()).slice(0, 50),
    backOrdersFromNegativeStocks: 0,
    orphanNegativeProducts: [],
  };

  const productsSeen = new Set();

  for (const productDoc of productsSnap.docs) {
    const productId = productDoc.id;
    const data = productDoc.data() || {};

    if (!productId) {
      summary.invalidProducts += 1;
      continue;
    }

    productsSeen.add(productId);

    if (data?.isDeleted === true) {
      continue;
    }

    const declared = number(data.stock);
    const rawComputed = totalsByProduct.get(productId);
    totalsByProduct.delete(productId);

    let computed = number(rawComputed);
    let shortageFromTotals = 0;

    if (computed < 0) {
      shortageFromTotals = Math.abs(computed);
      computed = 0;
    }

    const shortageFromNegatives = negativeShortageByProduct.get(productId) || 0;
    negativeShortageByProduct.delete(productId);
    const totalShortage = shortageFromTotals + shortageFromNegatives;

    if (declared !== computed) {
      writer.update(productDoc.ref, {
        stock: computed,
        lastStockSyncFromProductsStock: timestampISO,
        lastStockSyncCron: timestampISO,
        lastStockSyncCronAt: serverTimestamp(),
        lastStockSyncSource: 'inventory-sync-cron',
      });
      summary.updatedProducts += 1;
      if (computed === 0 && totalShortage > 0) {
        summary.zeroedProducts += 1;
      }
    } else if (computed === 0 && totalShortage > 0) {
      summary.zeroedProducts += 1;
    }

    if (totalShortage > 0) {
      const backOrderRef = businessRef.collection('backOrders').doc();
      const ts = serverTimestamp();
      const backOrderPayload = {
        id: backOrderRef.id,
        productId,
        productName: data.name || null,
        initialQuantity: totalShortage,
        pendingQuantity: totalShortage,
        status: 'pending',
        origin: shortageFromNegatives > 0 && shortageFromTotals === 0 ? NEGATIVE_FIX_ORIGIN : 'inventory-sync-cron',
        createdAt: ts,
        updatedAt: ts,
      };

      const correctionMeta = {};
      if (shortageFromNegatives > 0) {
        correctionMeta.fromNegativeStock = shortageFromNegatives;
      }
      if (shortageFromTotals > 0) {
        correctionMeta.fromTotalsMismatch = shortageFromTotals;
      }

      if (Object.keys(correctionMeta).length > 0) {
        backOrderPayload.correctionMeta = correctionMeta;
      }

      writer.set(backOrderRef, backOrderPayload);
      summary.backOrders += 1;
      if (shortageFromNegatives > 0) {
        summary.backOrdersFromNegativeStocks += 1;
      }
    }
  }

  if (negativeShortageByProduct.size > 0) {
    for (const [productId, shortage] of negativeShortageByProduct.entries()) {
      if (!productId || shortage <= 0) {
        continue;
      }

      const backOrderRef = businessRef.collection('backOrders').doc();
      const ts = serverTimestamp();

      writer.set(backOrderRef, {
        id: backOrderRef.id,
        productId,
        productName: null,
        initialQuantity: shortage,
        pendingQuantity: shortage,
        status: 'pending',
        origin: NEGATIVE_FIX_ORIGIN,
        createdAt: ts,
        updatedAt: ts,
        correctionMeta: {
          fromNegativeStock: shortage,
          note: 'product-document-missing',
        },
      });

      summary.backOrders += 1;
      summary.backOrdersFromNegativeStocks += 1;
      summary.invalidProducts += 1;

      if (summary.orphanNegativeProducts.length < 50) {
        summary.orphanNegativeProducts.push({ productId, shortage });
      }
    }
  }

  if (totalsByProduct.size > 0) {
    const leftovers = [];
    for (const [productId, computed] of totalsByProduct.entries()) {
      if (leftovers.length >= 50) break;
      leftovers.push({ productId, computed });
    }
    summary.orphanTotals = leftovers;
  }

  await writer.close();

  return summary;
}

export const syncProductsStockCron = onSchedule(
  {
    schedule: CRON_SCHEDULE,
    timeZone: CRON_TIMEZONE,
    region: CRON_REGION,
    timeoutSeconds: 540,
    memory: '1GiB',
  },
  async () => {
    const startedAt = Date.now();
    const result = {
      processedBusinesses: 0,
      updatedProducts: 0,
      zeroedProducts: 0,
      backOrders: 0,
      backOrdersFromNegativeStocks: 0,
      invalidProducts: 0,
      invalidStockDocs: 0,
      negativeStockDocs: 0,
      negativeStockQuantity: 0,
      batchesDeactivated: 0,
      errors: 0,
    };

    try {
      const businessSnap = await db.collection('businesses').select('isDeleted').get();

      for (const docSnap of businessSnap.docs) {
        const businessId = docSnap.id;
        const data = docSnap.data() || {};

        if (!businessId) continue;
        if (data?.isDeleted === true) continue;

        try {
          const summary = await syncBusinessProductsStock(businessId, { filterActive: FILTER_ACTIVE_DEFAULT });
          result.processedBusinesses += 1;
          result.updatedProducts += summary.updatedProducts;
          result.zeroedProducts += summary.zeroedProducts;
          result.backOrders += summary.backOrders;
          result.backOrdersFromNegativeStocks += summary.backOrdersFromNegativeStocks;
          result.invalidProducts += summary.invalidProducts;
          result.invalidStockDocs += summary.invalidStockDocs.length;
          result.negativeStockDocs += summary.negativeStocksProcessed;
          result.negativeStockQuantity += summary.negativeStockQuantity;
          result.batchesDeactivated += summary.batchesDeactivated.length;

          if (summary.invalidStockDocs.length) {
            logger.warn('[syncProductsStockCron] Inventario con productId inválido', {
              businessId,
              sample: summary.invalidStockDocs,
            });
          }

          if (summary.orphanTotals.length) {
            logger.warn('[syncProductsStockCron] productsStock sin producto asociado', {
              businessId,
              sample: summary.orphanTotals,
            });
          }

          if (summary.negativeStocksProcessed > 0) {
            logger.warn('[syncProductsStockCron] Corrección de stocks negativos', {
              businessId,
              correctedDocs: summary.negativeStockDocIds,
              batchesDeactivated: summary.batchesDeactivated,
              quantity: summary.negativeStockQuantity,
              backOrdersCreated: summary.backOrdersFromNegativeStocks,
              orphanNegativeProducts: summary.orphanNegativeProducts,
            });
          }
        } catch (err) {
          result.errors += 1;
          logger.error('[syncProductsStockCron] Error procesando negocio', {
            businessId,
            message: err?.message,
            stack: err?.stack,
          });
        }
      }
    } catch (err) {
      result.errors += 1;
      logger.error('[syncProductsStockCron] Error obteniendo negocios', {
        message: err?.message,
        stack: err?.stack,
      });
    }

    const durationMs = Date.now() - startedAt;
    logger.info('[syncProductsStockCron] Finalizado', {
      ...result,
      durationMs,
    });
  }
);
