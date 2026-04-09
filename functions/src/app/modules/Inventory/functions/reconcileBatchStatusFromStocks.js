import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import {
  assertUserAccess,
  MEMBERSHIP_ROLE_GROUPS,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { assertBusinessSubscriptionAccess } from '../../../versions/v2/billing/utils/subscriptionAccess.util.js';

let firebaseModulePromise = null;

const getFirebase = async () => {
  if (!firebaseModulePromise) {
    firebaseModulePromise = import('../../../core/config/firebase.js');
  }
  return firebaseModulePromise;
};

const MAX_IN_FILTER = 10;

const sanitizeQuantity = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
};

const chunkArray = (items = [], size = 10) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const ensureEntry = (map, batchId) => {
  if (!map.has(batchId)) {
    map.set(batchId, {
      batchId,
      totalChildren: 0,
      activeChildren: 0,
      activeQuantity: 0,
      productIds: new Set(),
    });
  }
  return map.get(batchId);
};

const processStockDoc = (doc, perBatch, stats) => {
  const data = doc.data() || {};
  const batchId = data.batchId;
  if (!batchId) {
    stats.skippedWithoutBatch += 1;
    return;
  }

  const entry = ensureEntry(perBatch, batchId);
  entry.totalChildren += 1;

  if (data.productId) {
    entry.productIds.add(data.productId);
  }

  const isDeleted = data.isDeleted === true;
  const isActive = data.status === 'active' && !isDeleted;
  const qty = sanitizeQuantity(data.quantity);

  if (isActive) {
    entry.activeChildren += 1;
    entry.activeQuantity += qty;
  }
};

const streamStocks = async ({ query, perBatch, stats, limit }) => {
  const stream = query.stream();
  for await (const doc of stream) {
    stats.processedStocks += 1;
    processStockDoc(doc, perBatch, stats);
    if (limit && stats.processedStocks >= limit) {
      break;
    }
  }
};

const fetchBatchSnapshots = async (db, refs, chunkSize = 300) => {
  const snaps = [];
  for (let i = 0; i < refs.length; i += chunkSize) {
    const chunk = refs.slice(i, i + chunkSize);
    if (!chunk.length) continue;
    const batchSnaps = await db.getAll(...chunk);
    snaps.push(...batchSnaps);
  }
  return snaps;
};

export const reconcileBatchStatusFromStocks = onCall(
  { timeoutSeconds: 540, minInstances: 0 },
  async (req) => {
    const { db, serverTimestamp } = await getFirebase();
    const {
      businessId: payloadBusinessId,
      batchIds = [],
      limit,
      dryRun = false,
      user: userPayload,
    } = req.data || {};

    const authUid = req.auth?.uid || null;
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado.');
    }

    const businessId =
      payloadBusinessId ||
      req.data?.businessID ||
      userPayload?.businessID ||
      userPayload?.businessId ||
      null;

    if (!businessId || typeof businessId !== 'string') {
      throw new HttpsError(
        'invalid-argument',
        'El campo businessId es requerido.',
      );
    }

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.MAINTENANCE,
    });

    await assertBusinessSubscriptionAccess({
      businessId,
      action: 'write',
      requiredModule: 'inventory',
    });

    if (limit && (!Number.isFinite(limit) || limit <= 0)) {
      throw new HttpsError(
        'invalid-argument',
        'El campo limit debe ser numérico y mayor que cero.',
      );
    }

    const resolvedActorUid = authUid;

    const stats = {
      businessId,
      processedStocks: 0,
      skippedWithoutBatch: 0,
      batchesEvaluated: 0,
      batchesUpdated: 0,
      missingBatches: 0,
      activatedBatches: 0,
      deactivatedBatches: 0,
      quantityAdjusted: 0,
      dryRun: Boolean(dryRun),
      actorUid: resolvedActorUid,
    };

    const perBatch = new Map();
    const productStockCol = db
      .collection('businesses')
      .doc(businessId)
      .collection('productsStock');

    if (Array.isArray(batchIds) && batchIds.length) {
      const cleanIds = Array.from(
        new Set(batchIds.filter((id) => typeof id === 'string' && id.trim())),
      );

      if (!cleanIds.length) {
        throw new HttpsError(
          'invalid-argument',
          'batchIds debe contener identificadores válidos.',
        );
      }

      for (const chunk of chunkArray(cleanIds, MAX_IN_FILTER)) {
        const q = productStockCol
          .where('batchId', 'in', chunk)
          .select('batchId', 'status', 'quantity', 'isDeleted', 'productId');
        const snap = await q.get();
        snap.forEach((doc) => {
          stats.processedStocks += 1;
          processStockDoc(doc, perBatch, stats);
        });
        for (const id of chunk) {
          ensureEntry(perBatch, id);
        }
      }
    } else {
      const q = productStockCol
        .select('batchId', 'status', 'quantity', 'isDeleted', 'productId')
        .orderBy('__name__');
      await streamStocks({ query: q, perBatch, stats, limit });
    }

    stats.batchesEvaluated = perBatch.size;

    if (!perBatch.size) {
      return stats;
    }

    const batchRefs = Array.from(perBatch.keys()).map((batchId) =>
      db
        .collection('businesses')
        .doc(businessId)
        .collection('batches')
        .doc(batchId),
    );

    const batchSnaps = await fetchBatchSnapshots(db, batchRefs);
    const snapMap = new Map(batchSnaps.map((snap) => [snap.id, snap]));

    const writer = dryRun ? null : db.bulkWriter();
    if (writer) {
      writer.onWriteError((err) => {
        logger.error('BulkWriter error', err);
        return false;
      });
    }

    for (const [batchId, entry] of perBatch.entries()) {
      const snap = snapMap.get(batchId);
      if (!snap || !snap.exists) {
        stats.missingBatches += 1;
        continue;
      }

      const data = snap.data() || {};
      const expectedStatus = entry.activeChildren > 0 ? 'active' : 'inactive';
      const expectedQty = entry.activeChildren > 0 ? entry.activeQuantity : 0;

      const updates = {};
      if (data.status !== expectedStatus) {
        updates.status = expectedStatus;
        if (expectedStatus === 'active') stats.activatedBatches += 1;
        else stats.deactivatedBatches += 1;
      }

      const currentQty = sanitizeQuantity(data.quantity);
      if (currentQty !== expectedQty) {
        updates.quantity = expectedQty;
        stats.quantityAdjusted += 1;
      }

      if (!Object.keys(updates).length) continue;

      updates.updatedAt = serverTimestamp();
      updates.updatedBy = resolvedActorUid;

      stats.batchesUpdated += 1;

      if (!dryRun && writer) {
        writer.update(snap.ref, updates);
      }
    }

    if (writer) {
      await writer.close();
    }

    logger.info('reconcileBatchStatusFromStocks summary', stats);
    return stats;
  },
);
