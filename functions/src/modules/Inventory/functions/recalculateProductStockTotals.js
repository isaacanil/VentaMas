import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, serverTimestamp } from '../../../core/config/firebase.js';

const sanitizeQty = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
};

export const recalculateProductStockTotals = onCall(
  {
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async (req) => {
    const {
      user: payloadUser = {},
      productIds = [],
      dryRun = false,
    } = req.data || {};

    const businessId =
      payloadUser?.businessID ||
      payloadUser?.businessId ||
      req.auth?.token?.businessID ||
      req.auth?.token?.businessId ||
      null;

    if (!businessId || typeof businessId !== 'string') {
      throw new HttpsError(
        'invalid-argument',
        'El campo businessID es requerido para recalcular stock.',
      );
    }

    const actorUid =
      payloadUser?.uid ||
      payloadUser?.userId ||
      req.auth?.uid ||
      'system';

    const stats = {
      businessId,
      dryRun: Boolean(dryRun),
      processedStocks: 0,
      skippedWithoutProduct: 0,
      skippedDeleted: 0,
      productsEvaluated: 0,
      productsUpdated: 0,
      limited: false,
    };

    const perProduct = new Map();
    const seenProducts = new Set();

    const productStockCol = db
      .collection('businesses')
      .doc(businessId)
      .collection('productsStock');

    let query = productStockCol.select(
      'productId',
      'quantity',
      'status',
      'isDeleted',
    );

    if (Array.isArray(productIds) && productIds.length > 0) {
      const cleanIds = Array.from(
        new Set(
          productIds
            .filter((id) => typeof id === 'string' && id.trim().length > 0)
            .map((id) => id.trim()),
        ),
      );
      if (!cleanIds.length) {
        throw new HttpsError(
          'invalid-argument',
          'productIds debe contener identificadores válidos.',
        );
      }
      // Firestore solo permite hasta 10 elementos por cláusula "in".
      if (cleanIds.length > 10) {
        stats.limited = true;
      }
      query = query.where('productId', 'in', cleanIds.slice(0, 10));
    }

    try {
      const stream = query.stream();
      for await (const docSnap of stream) {
        stats.processedStocks += 1;
        const data = docSnap.data() || {};
        const productId = data.productId;
        if (!productId) {
          stats.skippedWithoutProduct += 1;
          continue;
        }
        seenProducts.add(productId);
        if (data.isDeleted) {
          stats.skippedDeleted += 1;
          continue;
        }
        if (data.status !== 'active') continue;
        const qty = sanitizeQty(data.quantity);
        if (!qty) continue;
        perProduct.set(productId, (perProduct.get(productId) || 0) + qty);
      }
    } catch (err) {
      logger.error('[recalculateProductStockTotals] stream error', {
        businessId,
        message: err?.message,
      });
      throw new HttpsError(
        'internal',
        err?.message || 'Error leyendo productsStock para recalcular stock.',
      );
    }

    if (!seenProducts.size) {
      logger.info('[recalculateProductStockTotals] No hay productsStock', {
        businessId,
      });
      return stats;
    }

    const writer = dryRun ? null : db.bulkWriter();
    if (writer) {
      writer.onWriteError((error) => {
        logger.error('[recalculateProductStockTotals] BulkWriter error', {
          code: error.code,
          path: error.documentRef?.path,
          message: error.message,
        });
        return false;
      });
    }

    const timestamp = serverTimestamp();

    for (const productId of seenProducts) {
      const sum = Math.max(0, perProduct.get(productId) || 0);
      stats.productsEvaluated += 1;
      stats.productsUpdated += 1;
      if (!writer) continue;
      const productRef = db
        .collection('businesses')
        .doc(businessId)
        .collection('products')
        .doc(productId);
      writer.update(productRef, {
        stock: sum,
        status: sum > 0 ? 'active' : 'inactive',
        updatedAt: timestamp,
        updatedBy: actorUid,
      });
    }

    if (writer) {
      await writer.close();
    }

    logger.info('[recalculateProductStockTotals] Finalizado', stats);
    return stats;
  },
);
