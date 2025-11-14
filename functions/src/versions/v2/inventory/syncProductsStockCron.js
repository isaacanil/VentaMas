import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { db, serverTimestamp } from '../../../core/config/firebase.js';

const CRON_SCHEDULE = process.env.INVENTORY_SYNC_CRON || '0 3 * * *';
const CRON_TIMEZONE = process.env.INVENTORY_SYNC_TZ || 'America/Santo_Domingo';
const CRON_REGION = process.env.INVENTORY_SYNC_REGION || 'us-central1';

const includeInactiveEnv = /^true$/i.test(
  process.env.INVENTORY_SYNC_INCLUDE_INACTIVE || '',
);
const FILTER_ACTIVE_DEFAULT = includeInactiveEnv ? false : true; // true -> solo activos, false -> incluye inactivos

const NEGATIVE_FIX_ACTOR = 'system:inventory-negative-cron';
const NEGATIVE_FIX_ORIGIN = 'inventory-negative-correction';
const ZERO_STOCK_FIX_ACTOR = 'system:inventory-zero-cron';
const ZERO_STOCK_FIX_ORIGIN = 'inventory-zero-quantity-correction';

const number = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// batchId simple: no vacío, string, sin "/"
const isValidBatchId = (value) =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  !value.includes('/');

async function syncBusinessProductsStock(
  businessId,
  { filterActive = FILTER_ACTIVE_DEFAULT } = {},
) {
  if (!businessId || typeof businessId !== 'string') {
    throw new Error('Invalid businessId');
  }

  const businessRef = db.collection('businesses').doc(businessId);

  const stockCollection = businessRef.collection('productsStock');
  let stockQuery = stockCollection.where('isDeleted', '==', false);
  if (filterActive) {
    stockQuery = stockQuery.where('status', '==', 'active');
  }

  const stockSnap = await stockQuery
    .select('productId', 'quantity', 'status', 'batchId')
    .get();

  const totalsByProduct = new Map();
  const invalidStockDocs = [];
  let invalidStockCount = 0;
  const negativeStockRecords = [];
  const negativeShortageByProduct = new Map();
  const batchesToDeactivate = new Map();
  const batchQuantities = new Map(); // { batchId: { totalQuantity, activeStockCount, inactiveStockCount, stockIds } }
  const zeroQuantityStockRecords = [];

  stockSnap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const productIdRaw = data.productId;
    const productId =
      typeof productIdRaw === 'string' ? productIdRaw.trim() : '';
    if (!productId) {
      invalidStockCount += 1;
      if (invalidStockDocs.length < 50) {
        invalidStockDocs.push(docSnap.id);
      }
      return;
    }

    const quantity = number(data.quantity);
    const batchIdRaw = data.batchId;
    let batchId = typeof batchIdRaw === 'string' ? batchIdRaw.trim() : '';
    const stockStatus = data.status;

    // Validar que el batchId sea usable como ID de documento
    if (batchId && !isValidBatchId(batchId)) {
      invalidStockCount += 1;
      if (invalidStockDocs.length < 50) {
        invalidStockDocs.push(docSnap.id);
      }

      // Log del stock con batchId raro (para que puedas buscarlo a mano)
      logger.warn(
        '[syncProductsStockCron] batchId inválido en productsStock, se omite para sync',
        {
          businessId,
          stockId: docSnap.id,
          rawBatchId: batchIdRaw,
        },
      );

      batchId = ''; // no lo usamos en batchQuantities ni en batchesToDeactivate
    }

    // Rastrear cantidades por batch
    if (batchId) {
      if (!batchQuantities.has(batchId)) {
        batchQuantities.set(batchId, {
          totalQuantity: 0,
          activeStockCount: 0,
          inactiveStockCount: 0,
          stockIds: [],
        });
      }
      const batchMeta = batchQuantities.get(batchId);
      batchMeta.totalQuantity += quantity;
      if (stockStatus === 'active' && quantity > 0) {
        batchMeta.activeStockCount += 1;
      } else if (stockStatus === 'inactive') {
        batchMeta.inactiveStockCount += 1;
      }
      if (batchMeta.stockIds.length < 10) {
        batchMeta.stockIds.push(docSnap.id);
      }
    }

    if (quantity < 0) {
      const shortage = Math.abs(quantity);
      negativeStockRecords.push({
        docRef: docSnap.ref,
        docId: docSnap.id,
        productId,
        batchId,
        shortage,
        previousQuantity: quantity,
      });
      negativeShortageByProduct.set(
        productId,
        (negativeShortageByProduct.get(productId) || 0) + shortage,
      );

      if (batchId) {
        const current = batchesToDeactivate.get(batchId) || {
          shortage: 0,
          stockIds: [],
        };
        current.shortage += shortage;
        if (current.stockIds.length < 10) {
          current.stockIds.push(docSnap.id);
        }
        batchesToDeactivate.set(batchId, current);
      }

      return;
    }

    if (quantity === 0) {
      zeroQuantityStockRecords.push({
        docRef: docSnap.ref,
        docId: docSnap.id,
        productId,
        batchId,
      });
      return;
    }

    totalsByProduct.set(
      productId,
      (totalsByProduct.get(productId) || 0) + quantity,
    );
  });

  const productsSnap = await businessRef
    .collection('products')
    .select('stock', 'name', 'isDeleted')
    .get();

  // Obtener datos de todos los batches únicos (solo IDs limpios)
  const uniqueBatchIds = Array.from(
    new Set([
      ...Array.from(batchQuantities.keys()),
      ...Array.from(batchesToDeactivate.keys()),
    ]),
  ).filter(Boolean);

  const batchesToSync = [];
  const missingBatchIds = [];
  const batchGetErrors = [];

  if (uniqueBatchIds.length > 0) {
    const batchPromises = uniqueBatchIds.map(async (batchId) => {
      if (!isValidBatchId(batchId)) {
        // Esto no debería pasar ya, pero por si acaso
        batchGetErrors.push({
          batchId,
          error: 'batchId inválido detectado en uniqueBatchIds',
        });
        return;
      }

      try {
        const batchRef = businessRef.collection('batches').doc(batchId);
        const batchSnap = await batchRef.get();

        if (!batchSnap.exists) {
          // Aquí está el caso "no encontrado" para que lo veas en logs
          missingBatchIds.push(batchId);
          return;
        }

        const batchData = batchSnap.data() || {};
        const batchStatus = batchData.status;
        const batchQuantity = number(batchData.quantity);
        const meta = batchQuantities.get(batchId);
        const hasNegativeDeactivation = batchesToDeactivate.has(batchId);

        if (meta) {
          // Caso 1: Batch inactivo pero tiene productStocks activos con cantidad > 0
          if (
            batchStatus === 'inactive' &&
            meta.activeStockCount > 0 &&
            meta.totalQuantity > 0
          ) {
            batchesToSync.push({
              batchId,
              ref: batchRef,
              reason: 'inactive-batch-with-active-stocks',
              action: 'activate',
              totalQuantity: meta.totalQuantity,
              activeStockCount: meta.activeStockCount,
              stockIds: meta.stockIds,
            });
          }
          // Caso 2: Batch activo pero sin productStocks activos o cantidad total = 0
          else if (
            batchStatus === 'active' &&
            (meta.activeStockCount === 0 || meta.totalQuantity <= 0) &&
            !hasNegativeDeactivation
          ) {
            batchesToSync.push({
              batchId,
              ref: batchRef,
              reason: 'active-batch-without-active-stocks',
              action: 'deactivate',
              totalQuantity: meta.totalQuantity,
              activeStockCount: meta.activeStockCount,
              inactiveStockCount: meta.inactiveStockCount,
              stockIds: meta.stockIds,
            });
          }
          // Caso 3: Cantidad del batch no coincide con la suma de productStocks
          else if (
            !hasNegativeDeactivation &&
            Math.abs(batchQuantity - meta.totalQuantity) > 0.01
          ) {
            batchesToSync.push({
              batchId,
              ref: batchRef,
              reason: 'quantity-mismatch',
              action: 'update-quantity',
              batchQuantity,
              calculatedQuantity: meta.totalQuantity,
              difference: meta.totalQuantity - batchQuantity,
              stockIds: meta.stockIds,
            });
          }
        }
      } catch (err) {
        // NO logueamos aquí; solo acumulamos y logueamos una vez al final
        batchGetErrors.push({
          batchId,
          error: err?.message || String(err),
        });
      }
    });

    await Promise.all(batchPromises);

    // Un solo log con todos los batch problemáticos
    if (missingBatchIds.length > 0 || batchGetErrors.length > 0) {
      logger.warn(
        '[syncProductsStockCron] Problemas al obtener batches para negocio',
        {
          businessId,
          missingBatchIds: missingBatchIds.slice(0, 50),
          missingBatchIdsCount: missingBatchIds.length,
          batchGetErrors: batchGetErrors.slice(0, 20),
          batchGetErrorsCount: batchGetErrors.length,
        },
      );
    }
  }

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
      if (!batchId || !isValidBatchId(batchId)) {
        // No intentamos desactivar batches con IDs dañados
        logger.warn(
          '[syncProductsStockCron] batchId inválido al desactivar por negativos, se omite',
          {
            businessId,
            batchId,
            meta,
          },
        );
        continue;
      }
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

      writer.set(batchRef, batchPayload, { merge: true });
    }
  }

  if (zeroQuantityStockRecords.length > 0) {
    for (const record of zeroQuantityStockRecords) {
      const ts = serverTimestamp();
      writer.update(record.docRef, {
        quantity: 0,
        status: 'inactive',
        updatedAt: ts,
        updatedBy: ZERO_STOCK_FIX_ACTOR,
        lastZeroQuantityCorrectionAt: ts,
        lastZeroQuantityCorrectionSource: ZERO_STOCK_FIX_ORIGIN,
      });
    }
  }

  // Sincronizar batches desincronizados
  if (batchesToSync.length > 0) {
    for (const syncTask of batchesToSync) {
      const ts = serverTimestamp();
      const updatePayload = {
        updatedAt: ts,
        updatedBy: 'system:inventory-batch-sync-cron',
        lastBatchSyncAt: ts,
        lastBatchSyncSource: 'inventory-sync-cron',
        lastBatchSyncReason: syncTask.reason,
      };

      if (syncTask.action === 'activate') {
        updatePayload.status = 'active';
        updatePayload.quantity = syncTask.totalQuantity;
        updatePayload.lastBatchSyncAction = 'reactivated';
      } else if (syncTask.action === 'deactivate') {
        updatePayload.status = 'inactive';
        updatePayload.quantity = 0;
        updatePayload.lastBatchSyncAction = 'deactivated';
      } else if (syncTask.action === 'update-quantity') {
        updatePayload.quantity = syncTask.calculatedQuantity;
        updatePayload.lastBatchSyncAction = 'quantity-updated';
        updatePayload.lastBatchSyncQuantityDifference = syncTask.difference;
      }

      writer.set(syncTask.ref, updatePayload, { merge: true });
    }
  }

  const timestampISO = new Date().toISOString();
  const batchesDeactivatedIds = Array.from(batchesToDeactivate.keys());
  const summary = {
    updatedProducts: 0,
    zeroedProducts: 0,
    backOrders: 0,
    invalidProducts: 0,
    invalidStockCount,
    invalidStockDocs,
    orphanTotals: [],
    negativeStocksProcessed: negativeStockRecords.length,
    negativeStockQuantity: negativeStockRecords.reduce(
      (sum, record) => sum + record.shortage,
      0,
    ),
    negativeStockDocIds: negativeStockRecords
      .slice(0, 50)
      .map((record) => record.docId),
    batchesDeactivated: batchesDeactivatedIds.slice(0, 50),
    batchesDeactivatedCount: batchesDeactivatedIds.length,
    batchesSynced: batchesToSync.length,
    batchesSyncDetails: batchesToSync.slice(0, 50).map((task) => ({
      batchId: task.batchId,
      reason: task.reason,
      action: task.action,
    })),
    backOrdersFromNegativeStocks: 0,
    orphanNegativeProducts: [],
    zeroQuantityStocksProcessed: zeroQuantityStockRecords.length,
    zeroQuantityStockDocIds: zeroQuantityStockRecords
      .slice(0, 50)
      .map((record) => record.docId),

    // Info extra para depurar batches
    missingBatchIds: missingBatchIds.slice(0, 50),
    missingBatchIdsCount: missingBatchIds.length,
    batchGetErrors: batchGetErrors.slice(0, 20),
    batchGetErrorsCount: batchGetErrors.length,
  };

  for (const productDoc of productsSnap.docs) {
    const productId = productDoc.id;
    const data = productDoc.data() || {};

    if (!productId) {
      summary.invalidProducts += 1;
      continue;
    }

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
        origin:
          shortageFromNegatives > 0 && shortageFromTotals === 0
            ? NEGATIVE_FIX_ORIGIN
            : 'inventory-sync-cron',
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
      zeroQuantityStockDocs: 0,
      batchesDeactivated: 0,
      batchesSynced: 0,
      errors: 0,
    };

    try {
      const businessSnap = await db
        .collection('businesses')
        .select('isDeleted')
        .get();

      for (const docSnap of businessSnap.docs) {
        const businessId = docSnap.id;
        const data = docSnap.data() || {};

        if (!businessId) continue;
        if (data?.isDeleted === true) continue;

        try {
          const summary = await syncBusinessProductsStock(businessId, {
            filterActive: FILTER_ACTIVE_DEFAULT,
          });
          result.processedBusinesses += 1;
          result.updatedProducts += summary.updatedProducts;
          result.zeroedProducts += summary.zeroedProducts;
          result.backOrders += summary.backOrders;
          result.backOrdersFromNegativeStocks +=
            summary.backOrdersFromNegativeStocks;
          result.invalidProducts += summary.invalidProducts;
          result.invalidStockDocs += summary.invalidStockCount;
          result.negativeStockDocs += summary.negativeStocksProcessed;
          result.negativeStockQuantity += summary.negativeStockQuantity;
          result.zeroQuantityStockDocs += summary.zeroQuantityStocksProcessed;
          result.batchesDeactivated += summary.batchesDeactivatedCount;
          result.batchesSynced += summary.batchesSynced;

          if (summary.invalidStockDocs.length) {
            logger.warn(
              '[syncProductsStockCron] Inventario con productId inválido',
              {
                businessId,
                sample: summary.invalidStockDocs,
              },
            );
          }

          if (summary.orphanTotals.length) {
            logger.warn(
              '[syncProductsStockCron] productsStock sin producto asociado',
              {
                businessId,
                sample: summary.orphanTotals,
              },
            );
          }

          if (summary.negativeStocksProcessed > 0) {
            logger.warn(
              '[syncProductsStockCron] Corrección de stocks negativos',
              {
                businessId,
                correctedDocs: summary.negativeStockDocIds,
                batchesDeactivated: summary.batchesDeactivated,
                quantity: summary.negativeStockQuantity,
                backOrdersCreated: summary.backOrdersFromNegativeStocks,
                orphanNegativeProducts: summary.orphanNegativeProducts,
              },
            );
          }

          if (summary.zeroQuantityStocksProcessed > 0) {
            logger.info('[syncProductsStockCron] Corrección de stocks en cero', {
              businessId,
              total: summary.zeroQuantityStocksProcessed,
              sample: summary.zeroQuantityStockDocIds,
            });
          }

          if (summary.batchesSynced > 0) {
            logger.info('[syncProductsStockCron] Sincronización de batches', {
              businessId,
              batchesSynced: summary.batchesSynced,
              details: summary.batchesSyncDetails,
            });
          }

          // Si quieres podrías loguear aquí también missingBatchIdsCount,
          // pero ya se están logueando dentro de syncBusinessProductsStock.
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
  },
);
