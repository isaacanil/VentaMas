import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import {
  db,
  FieldPath,
  FieldValue,
} from '../../../core/config/firebase.js';

const CRON_SCHEDULE =
  process.env.AR_PENDING_RECONCILE_CRON || '0 3 * * *';
const CRON_TIMEZONE =
  process.env.AR_PENDING_RECONCILE_TZ || 'America/Santo_Domingo';
const CRON_REGION = process.env.AR_PENDING_RECONCILE_REGION || 'us-central1';
const QUERY_BATCH_SIZE = Number(
  process.env.AR_PENDING_RECONCILE_BATCH || '500',
);

const numberOrZero = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

async function collectActiveAccounts(businessId) {
  const totalsByClient = new Map();
  const accountsRef = db
    .collection(`businesses/${businessId}/accountsReceivable`)
    .where('isActive', '==', true)
    .orderBy(FieldPath.documentId());

  let cursor = null;
  while (true) {
    let query = accountsRef.limit(QUERY_BATCH_SIZE);
    if (cursor) {
      query = query.startAfter(cursor);
    }
    const snap = await query.get();
    if (snap.empty) break;

    snap.docs.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const clientIdRaw = data.clientId;
      const clientId =
        typeof clientIdRaw === 'string' ? clientIdRaw.trim() : '';
      if (!clientId) return;

      const arBalance = numberOrZero(data.arBalance);
      totalsByClient.set(
        clientId,
        numberOrZero(totalsByClient.get(clientId)) + arBalance,
      );
    });

    cursor = snap.docs[snap.docs.length - 1];
    if (snap.size < QUERY_BATCH_SIZE) break;
  }

  return totalsByClient;
}

async function writeClientPendingBalances(businessId, totalsByClient) {
  if (totalsByClient.size === 0) return;

  let batch = db.batch();
  let writes = 0;

  for (const [clientId, pending] of totalsByClient.entries()) {
    const clientRef = db.doc(
      `businesses/${businessId}/clients/${clientId}`,
    );
    batch.set(
      clientRef,
      { client: { pendingBalance: pending } },
      { merge: true },
    );
    writes += 1;
    if (writes === 400) {
      await batch.commit();
      batch = db.batch();
      writes = 0;
    }
  }

  if (writes > 0) {
    await batch.commit();
  }
}

async function resetZeroBalances(businessId, activeClientIds) {
  const clientsRef = db.collection(
    `businesses/${businessId}/clients`,
  );
  const staleSnap = await clientsRef
    .where('client.pendingBalance', '>', 0)
    .select('client.pendingBalance')
    .get();

  if (staleSnap.empty) return;

  let batch = db.batch();
  let writes = 0;
  const touched = new Set();

  for (const docSnap of staleSnap.docs) {
    const clientId = docSnap.id;
    if (activeClientIds.has(clientId)) continue;
    const clientRef = docSnap.ref;
    batch.set(
      clientRef,
      { client: { pendingBalance: FieldValue.delete() } },
      { merge: true },
    );
    touched.add(clientId);
    writes += 1;
    if (writes === 400) {
      await batch.commit();
      batch = db.batch();
      writes = 0;
    }
  }

  if (writes > 0) {
    await batch.commit();
  }

  if (touched.size > 0) {
    logger.info('Pending balance reset for clients', {
      businessId,
      clientCount: touched.size,
    });
  }
}

async function reconcileBusiness(businessId) {
  const totalsByClient = await collectActiveAccounts(businessId);
  await writeClientPendingBalances(businessId, totalsByClient);
  await resetZeroBalances(businessId, new Set(totalsByClient.keys()));
  logger.info('Reconciled pending balances', {
    businessId,
    clientCount: totalsByClient.size,
  });
}

export const reconcilePendingBalanceCron = onSchedule(
  {
    schedule: CRON_SCHEDULE,
    timeZone: CRON_TIMEZONE,
    region: CRON_REGION,
    memory: '256MiB',
    timeoutSeconds: 540,
  },
  async () => {
    const businessesSnap = await db.collection('businesses').get();
    for (const businessDoc of businessesSnap.docs) {
      try {
        await reconcileBusiness(businessDoc.id);
      } catch (err) {
        logger.error('Error reconciling pending balances', {
          businessId: businessDoc.id,
          err,
        });
      }
    }
  },
);
