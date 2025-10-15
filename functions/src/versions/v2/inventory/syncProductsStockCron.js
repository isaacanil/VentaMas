import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { db, serverTimestamp } from '../../../core/config/firebase.js';

const CRON_SCHEDULE = process.env.INVENTORY_SYNC_CRON || '0 3 * * *';
const CRON_TIMEZONE = process.env.INVENTORY_SYNC_TZ || 'America/Santo_Domingo';
const CRON_REGION = process.env.INVENTORY_SYNC_REGION || 'us-central1';
const FILTER_ACTIVE_DEFAULT = /^false$/i.test(process.env.INVENTORY_SYNC_INCLUDE_INACTIVE || '') ? false : true;

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

  const stockSnap = await stockQuery.select('productId', 'quantity', 'status').get();

  const totalsByProduct = new Map();
  const invalidStockDocs = [];

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

  const timestampISO = new Date().toISOString();
  const summary = {
    updatedProducts: 0,
    zeroedProducts: 0,
    backOrders: 0,
    invalidProducts: 0,
    invalidStockDocs,
    orphanTotals: [],
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
    let shortage = 0;

    if (computed < 0) {
      shortage = Math.abs(computed);
      computed = 0;
    }

    if (declared !== computed) {
      writer.update(productDoc.ref, {
        stock: computed,
        lastStockSyncFromProductsStock: timestampISO,
        lastStockSyncCron: timestampISO,
        lastStockSyncCronAt: serverTimestamp(),
        lastStockSyncSource: 'inventory-sync-cron',
      });
      summary.updatedProducts += 1;
      if (computed === 0 && shortage > 0) {
        summary.zeroedProducts += 1;
      }
    } else if (computed === 0 && shortage > 0) {
      summary.zeroedProducts += 1;
    }

    if (shortage > 0) {
      const backOrderRef = businessRef.collection('backOrders').doc();
      writer.set(backOrderRef, {
        id: backOrderRef.id,
        productId,
        productName: data.name || null,
        initialQuantity: shortage,
        pendingQuantity: shortage,
        status: 'pending',
        origin: 'inventory-sync-cron',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      summary.backOrders += 1;
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
      invalidProducts: 0,
      invalidStockDocs: 0,
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
          result.invalidProducts += summary.invalidProducts;
          result.invalidStockDocs += summary.invalidStockDocs.length;

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
