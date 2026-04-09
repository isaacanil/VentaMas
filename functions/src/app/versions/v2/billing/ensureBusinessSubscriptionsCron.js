import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';

import { db } from '../../../core/config/firebase.js';

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const resolveExistingSubscription = (businessData) => {
  const root = asRecord(businessData);
  const nestedBusiness = asRecord(root.business);
  const rootSubscription = asRecord(root.subscription);
  const nestedSubscription = asRecord(nestedBusiness.subscription);

  const status =
    toCleanString(rootSubscription.status)?.toLowerCase() ||
    toCleanString(nestedSubscription.status)?.toLowerCase() ||
    null;
  const planId =
    toCleanString(rootSubscription.planId) ||
    toCleanString(nestedSubscription.planId) ||
    null;

  return { status, planId };
};

export const ensureBusinessSubscriptionsCron = onSchedule(
  {
    schedule: 'every day 03:15',
    timeZone: 'America/Santo_Domingo',
    retryCount: 0,
  },
  async () => {
    const businessesSnap = await db.collection('businesses').get();

    let missing = 0;
    let alreadyConfigured = 0;

    for (const businessDoc of businessesSnap.docs) {
      const data = businessDoc.data() || {};
      const existing = resolveExistingSubscription(data);
      if (existing.status) {
        alreadyConfigured += 1;
        continue;
      }
      missing += 1;
    }

    logger.info('ensureBusinessSubscriptionsCron completed', {
      total: businessesSnap.size,
      missing,
      alreadyConfigured,
      action: 'noop_missing_subscriptions',
    });
  },
);
