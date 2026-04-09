import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { db, FieldValue } from '../../../core/config/firebase.js';
import { activateDueScheduledPlanVersions } from './services/planCatalog.service.js';
import {
  ensureBusinessBillingSetup,
  refreshSubscriptionsForPlanCode,
  syncBillingAccountSubscriptionMirrors,
} from './services/subscriptionSnapshot.service.js';
import { resolveMonthKey } from './utils/billingCommon.util.js';

export const activateScheduledBillingPlansCron = onSchedule(
  {
    schedule: 'every day 01:05',
    timeZone: 'America/Santo_Domingo',
    retryCount: 0,
  },
  async () => {
    const result = await activateDueScheduledPlanVersions();
    let refreshedAccounts = 0;
    let mirroredBusinesses = 0;

    for (const planCode of result.activatedPlanCodes || []) {
      const refreshResult = await refreshSubscriptionsForPlanCode({
        planCode,
        actorUserId: 'system:activateScheduledBillingPlansCron',
      });
      refreshedAccounts += Number(refreshResult.updatedAccounts || 0);
      mirroredBusinesses += Number(refreshResult.mirroredBusinesses || 0);
    }

    logger.info('activateScheduledBillingPlansCron completed', {
      ...result,
      refreshedAccounts,
      mirroredBusinesses,
    });
  },
);

export const reconcileBillingSubscriptionsCron = onSchedule(
  {
    schedule: 'every day 01:20',
    timeZone: 'America/Santo_Domingo',
    retryCount: 0,
  },
  async () => {
    const businessesSnap = await db.collection('businesses').get();
    let ensured = 0;
    let failed = 0;

    for (const businessDoc of businessesSnap.docs) {
      try {
        await ensureBusinessBillingSetup({
          businessId: businessDoc.id,
          actorUserId: 'system:reconcileBillingSubscriptionsCron',
        });
        ensured += 1;
      } catch (error) {
        failed += 1;
        logger.warn('reconcileBillingSubscriptionsCron business failed', {
          businessId: businessDoc.id,
          error,
        });
      }
    }

    const accountsSnap = await db.collection('billingAccounts').get();
    let mirrored = 0;
    for (const accountDoc of accountsSnap.docs) {
      try {
        const mirrorResult = await syncBillingAccountSubscriptionMirrors(accountDoc.id);
        mirrored += Number(mirrorResult.patched || 0);
      } catch (error) {
        logger.warn('reconcileBillingSubscriptionsCron mirror failed', {
          billingAccountId: accountDoc.id,
          error,
        });
      }
    }

    logger.info('reconcileBillingSubscriptionsCron completed', {
      totalBusinesses: businessesSnap.size,
      ensured,
      failed,
      totalAccounts: accountsSnap.size,
      mirroredBusinesses: mirrored,
    });
  },
);

export const resetMonthlyBillingUsageCron = onSchedule(
  {
    // Primer día de cada mes a las 00:10
    schedule: '0 0 1 * *',
    timeZone: 'America/Santo_Domingo',
    retryCount: 0,
  },
  async () => {
    const businessesSnap = await db.collection('businesses').get();
    const monthKey = resolveMonthKey();
    let reset = 0;

    const updates = businessesSnap.docs.map(async (businessDoc) => {
      const currentUsageRef = businessDoc.ref.collection('usage').doc('current');
      const monthlyRef = businessDoc.ref
        .collection('usage')
        .doc('monthly')
        .collection('entries')
        .doc(monthKey);

      await Promise.all([
        currentUsageRef.set(
          {
            businessId: businessDoc.id,
            monthKey,
            monthlyInvoices: 0,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        ),
        monthlyRef.set(
          {
            businessId: businessDoc.id,
            month: monthKey,
            monthlyInvoices: 0,
            resetAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        ),
      ]);
      reset += 1;
    });

    await Promise.allSettled(updates);

    logger.info('resetMonthlyBillingUsageCron completed', {
      monthKey,
      totalBusinesses: businessesSnap.size,
      reset,
    });
  },
);

export const processBillingDunningCron = onSchedule(
  {
    schedule: 'every day 02:10',
    timeZone: 'America/Santo_Domingo',
    retryCount: 0,
  },
  async () => {
    const accountsSnap = await db.collection('billingAccounts').get();
    const now = Date.now();
    const graceWindowMs = 7 * 24 * 60 * 60 * 1000;
    let pastDueMarked = 0;
    let canceled = 0;

    for (const accountDoc of accountsSnap.docs) {
      const subscriptionsSnap = await accountDoc.ref
        .collection('subscriptions')
        .orderBy('updatedAt', 'desc')
        .limit(20)
        .get();
      if (subscriptionsSnap.empty) continue;

      const activeDoc =
        subscriptionsSnap.docs.find(
          (docSnap) =>
            String(docSnap.get('status') || '').toLowerCase() === 'active',
        ) || subscriptionsSnap.docs[0];
      if (!activeDoc) continue;

      const status = String(activeDoc.get('status') || '').toLowerCase();
      const dunning = activeDoc.get('dunning') || {};
      const paymentFailures = Number(dunning.paymentFailures || 0);
      const pastDueAtMs = Number(dunning.pastDueAtMs || 0);

      if (status === 'active' && paymentFailures >= 3) {
        await activeDoc.ref.set(
          {
            status: 'past_due',
            dunning: {
              ...dunning,
              paymentFailures,
              pastDueAtMs: now,
              graceEndsAtMs: now + graceWindowMs,
              updatedAt: FieldValue.serverTimestamp(),
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        pastDueMarked += 1;
        continue;
      }

      if (status === 'past_due' && pastDueAtMs > 0 && now - pastDueAtMs > graceWindowMs) {
        await activeDoc.ref.set(
          {
            status: 'canceled',
            dunning: {
              ...dunning,
              canceledAtMs: now,
              updatedAt: FieldValue.serverTimestamp(),
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        canceled += 1;
      }
    }

    logger.info('processBillingDunningCron completed', {
      totalAccounts: accountsSnap.size,
      pastDueMarked,
      canceled,
    });
  },
);
