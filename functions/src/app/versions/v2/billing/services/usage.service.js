import { HttpsError } from 'firebase-functions/v2/https';

import { db, FieldValue } from '../../../../core/config/firebase.js';
import {
  isUnlimitedLimit,
  normalizeLimitValue,
  resolveMonthKey,
  toCleanString,
} from '../utils/billingCommon.util.js';

const resolveUsageRefs = (businessId, monthKey = resolveMonthKey()) => {
  const normalizedBusinessId = toCleanString(businessId);
  if (!normalizedBusinessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }
  const businessRef = db.doc(`businesses/${normalizedBusinessId}`);
  const currentRef = businessRef.collection('usage').doc('current');
  const monthlyEntryRef = businessRef
    .collection('usage')
    .doc('monthly')
    .collection('entries')
    .doc(monthKey);
  return { normalizedBusinessId, currentRef, monthlyEntryRef };
};

const toLimitKey = (metricKey) => {
  const normalizedMetric = toCleanString(metricKey);
  if (!normalizedMetric) return null;
  const first = normalizedMetric.charAt(0).toUpperCase();
  return `max${first}${normalizedMetric.slice(1)}`;
};

export const getBusinessUsageSnapshot = async ({
  businessId,
  monthKey = resolveMonthKey(),
}) => {
  const { currentRef, monthlyEntryRef } = resolveUsageRefs(businessId, monthKey);
  const [currentSnap, monthlySnap] = await Promise.all([
    currentRef.get(),
    monthlyEntryRef.get(),
  ]);
  return {
    monthKey,
    current: currentSnap.exists ? currentSnap.data() || {} : {},
    monthly: monthlySnap.exists ? monthlySnap.data() || {} : {},
  };
};

export const assertUsageCanIncrease = ({
  subscription,
  metricKey,
  currentValue,
  incrementBy,
  planId,
}) => {
  const normalizedMetric = toCleanString(metricKey);
  if (!normalizedMetric) {
    throw new HttpsError('invalid-argument', 'metricKey es requerido');
  }

  const delta = Math.max(0, Number(incrementBy || 0));
  if (!delta) {
    return {
      ok: true,
      limit: null,
      nextValue: Number(currentValue || 0),
      remaining: null,
    };
  }

  const limits = subscription?.limits || {};
  const directLimit = normalizeLimitValue(limits[normalizedMetric]);
  const fallbackLimit = normalizeLimitValue(limits[toLimitKey(normalizedMetric)]);
  const limit = directLimit ?? fallbackLimit;

  if (limit == null || isUnlimitedLimit(limit)) {
    return {
      ok: true,
      limit,
      nextValue: Number(currentValue || 0) + delta,
      remaining: null,
    };
  }

  const current = Math.max(0, Number(currentValue || 0));
  const nextValue = current + delta;
  const remaining = limit - current;
  if (nextValue > limit) {
    throw new HttpsError(
      'resource-exhausted',
      `Límite excedido para ${normalizedMetric}. Plan ${planId || 'actual'} permite ${limit}.`,
    );
  }

  return {
    ok: true,
    limit,
    nextValue,
    remaining: Math.max(0, remaining - delta),
  };
};

export const incrementBusinessUsageMetric = async ({
  businessId,
  metricKey,
  incrementBy = 1,
  monthKey = resolveMonthKey(),
  tx = null,
}) => {
  const normalizedMetric = toCleanString(metricKey);
  if (!normalizedMetric) {
    throw new HttpsError('invalid-argument', 'metricKey es requerido');
  }
  const delta = Number(incrementBy);
  if (!Number.isFinite(delta) || delta === 0) {
    return { ok: true, skipped: true };
  }

  const { normalizedBusinessId, currentRef, monthlyEntryRef } = resolveUsageRefs(
    businessId,
    monthKey,
  );

  const buildIncrementPayload = (extraFields) => ({
    ...extraFields,
    [normalizedMetric]: FieldValue.increment(delta),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const applyWithTransaction = async (transaction) => {
    transaction.set(
      currentRef,
      buildIncrementPayload({
        businessId: normalizedBusinessId,
        monthKey,
      }),
      { merge: true },
    );
    transaction.set(
      monthlyEntryRef,
      buildIncrementPayload({
        businessId: normalizedBusinessId,
        month: monthKey,
      }),
      { merge: true },
    );

    return {
      ok: true,
      businessId: normalizedBusinessId,
      metricKey: normalizedMetric,
      currentValue: null,
      monthlyValue: null,
      monthKey,
    };
  };

  if (tx) {
    return applyWithTransaction(tx);
  }

  return db.runTransaction(async (transaction) => applyWithTransaction(transaction));
};

export const resetMonthlyInvoiceUsage = async ({
  businessId,
  monthKey = resolveMonthKey(),
}) => {
  const { normalizedBusinessId, currentRef, monthlyEntryRef } = resolveUsageRefs(
    businessId,
    monthKey,
  );
  await Promise.all([
    currentRef.set(
      {
        businessId: normalizedBusinessId,
        monthlyInvoices: 0,
        monthKey,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    ),
    monthlyEntryRef.set(
      {
        businessId: normalizedBusinessId,
        month: monthKey,
        monthlyInvoices: 0,
        resetAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    ),
  ]);
};
