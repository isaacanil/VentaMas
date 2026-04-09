import { HttpsError } from 'firebase-functions/v2/https';

import { db, FieldValue, Timestamp } from '../../../../core/config/firebase.js';
import {
  BILLING_DEFAULT_PROVIDER,
  PLAN_NOTICE_WINDOWS,
  PLAN_NOTICE_WINDOW_DEFAULT,
} from '../config/planCatalog.constants.js';
import {
  asRecord,
  toCleanString,
  toMillis,
  toFiniteNumber,
} from '../utils/billingCommon.util.js';
import { normalizePlanEntitlements } from '../utils/planEntitlements.util.js';
import {
  ensureBillingAccountForOwner,
  getBusinessOwnerUid,
  linkBusinessToBillingAccount,
  readBusinessOwnerUidFromData,
  resolveBillingAccountIdForOwner,
} from './billingAccount.service.js';
import {
  assertPlanCatalogAssignable,
  resolvePlanVersionSnapshot,
} from './planCatalog.service.js';

const SUBSCRIPTIONS_SUBCOLLECTION = 'subscriptions';
const BUSINESS_LINKS_SUBCOLLECTION = 'businessLinks';
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);
const DEFAULT_ONBOARDING_PLAN_CODE = 'demo';
const DEFAULT_ONBOARDING_TRIAL_DAYS = Math.max(
  1,
  Number(process.env.BILLING_ONBOARDING_TRIAL_DAYS) || 14,
);
const NOTICE_WINDOW_SET = new Set(PLAN_NOTICE_WINDOWS);
const ENTITLEMENT_RECORD_KEYS = ['modules', 'addons', 'features', 'moduleAccess'];

const buildLimitsWithUsage = (limits = {}, usage = {}) => ({
  ...asRecord(limits),
  usage: asRecord(usage),
});

const resolveNoticeWindowDaysOrDefault = (rawValue) => {
  if (rawValue == null) return PLAN_NOTICE_WINDOW_DEFAULT;
  const numeric = Math.trunc(Number(rawValue));
  return NOTICE_WINDOW_SET.has(numeric) ? numeric : PLAN_NOTICE_WINDOW_DEFAULT;
};

const hasPopulatedRecord = (value) => Object.keys(asRecord(value)).length > 0;

const shouldHydrateSubscriptionSnapshot = (subscription) => {
  const current = asRecord(subscription);
  const planId = toCleanString(current.planId);
  if (!planId) return false;

  return ENTITLEMENT_RECORD_KEYS.some((key) => !hasPopulatedRecord(current[key]));
};

const resolveScopeOrDefault = (rawScope) => {
  try {
    return normalizeScope(rawScope);
  } catch {
    return 'account';
  }
};

const buildRefreshedSubscriptionSnapshot = ({
  currentSubscription,
  planSnapshot,
  updatedAt = FieldValue.serverTimestamp(),
}) => {
  const current = asRecord(currentSubscription);
  const resolvedPlan = asRecord(planSnapshot);
  const entitlements = normalizePlanEntitlements(resolvedPlan);
  const currentLimits = asRecord(current.limits);

  return {
    planVersion: resolvedPlan.version || current.planVersion || 'v1',
    displayName:
      toCleanString(resolvedPlan.displayName) ||
      toCleanString(current.displayName) ||
      'Plan',
    billingCycle:
      toCleanString(resolvedPlan.billingCycle) ||
      toCleanString(current.billingCycle) ||
      'monthly',
    currency:
      toCleanString(resolvedPlan.currency) ||
      toCleanString(current.currency) ||
      'DOP',
    priceMonthly: toFiniteNumber(
      resolvedPlan.priceMonthly,
      toFiniteNumber(current.priceMonthly, 0),
    ),
    noticeWindowDays: resolveNoticeWindowDaysOrDefault(
      resolvedPlan.noticeWindowDays ?? current.noticeWindowDays,
    ),
    limits: buildLimitsWithUsage(resolvedPlan.limits, currentLimits.usage),
    ...entitlements,
    updatedAt,
  };
};

const hydrateSubscriptionSnapshotFromPlan = async (currentSubscription) => {
  const current = asRecord(currentSubscription);
  if (!shouldHydrateSubscriptionSnapshot(current)) {
    return current;
  }

  const planId = toCleanString(current.planId);
  if (!planId) return current;

  const atMillis =
    toMillis(current.effectiveAt) ||
    toMillis(current.periodStart) ||
    Date.now();

  let planSnapshot;
  try {
    planSnapshot = await resolvePlanVersionSnapshot({
      planCode: planId,
      atMillis,
      allowInactiveFallback: true,
    });
  } catch {
    return current;
  }

  const hydratedSnapshot = buildRefreshedSubscriptionSnapshot({
    currentSubscription: current,
    planSnapshot,
    updatedAt: current.updatedAt || Timestamp.now(),
  });

  return {
    ...current,
    ...hydratedSnapshot,
    status: toCleanString(current.status)?.toLowerCase() || 'active',
    planId,
    provider: toCleanString(current.provider) || BILLING_DEFAULT_PROVIDER,
    scope: resolveScopeOrDefault(current.scope),
    source: toCleanString(current.source) || 'catalog_hydrated_runtime',
    effectiveAt: current.effectiveAt || Timestamp.fromMillis(atMillis),
    periodStart:
      current.periodStart ||
      current.effectiveAt ||
      Timestamp.fromMillis(atMillis),
    periodEnd: current.periodEnd || null,
    trialEndsAt: current.trialEndsAt || null,
    note: toCleanString(current.note) || null,
  };
};

const normalizeScope = (rawScope) => {
  const scope = toCleanString(rawScope)?.toLowerCase() || 'account';
  if (scope !== 'account' && scope !== 'business') {
    throw new HttpsError('invalid-argument', 'scope debe ser account o business');
  }
  return scope;
};

export const buildSubscriptionSnapshot = ({
  planSnapshot,
  status = 'active',
  provider = BILLING_DEFAULT_PROVIDER,
  scope = 'account',
  source = 'billing_system',
  periodStartMs = Date.now(),
  periodEndMs = null,
  trialEndsAtMs = null,
  note = null,
}) => {
  const snapshot = asRecord(planSnapshot);
  const effectiveAt = toMillis(snapshot.effectiveAt) || Date.now();
  const entitlements = normalizePlanEntitlements(snapshot);

  return {
    status: toCleanString(status)?.toLowerCase() || 'active',
    planId: toCleanString(snapshot.planCode) || null,
    planVersion: snapshot.version || 'v1',
    displayName:
      toCleanString(snapshot.displayName) ||
      toCleanString(snapshot.planCode) ||
      'Plan',
    billingCycle: toCleanString(snapshot.billingCycle) || 'monthly',
    currency: toCleanString(snapshot.currency) || 'DOP',
    priceMonthly: toFiniteNumber(snapshot.priceMonthly, 0),
    noticeWindowDays: resolveNoticeWindowDaysOrDefault(snapshot.noticeWindowDays),
    provider: toCleanString(provider) || BILLING_DEFAULT_PROVIDER,
    scope: normalizeScope(scope),
    source: toCleanString(source) || 'billing_system',
    effectiveAt: Timestamp.fromMillis(effectiveAt),
    periodStart: Timestamp.fromMillis(periodStartMs),
    periodEnd: periodEndMs != null ? Timestamp.fromMillis(periodEndMs) : null,
    trialEndsAt:
      trialEndsAtMs != null ? Timestamp.fromMillis(trialEndsAtMs) : null,
    limits: buildLimitsWithUsage(snapshot.limits, snapshot.usage),
    ...entitlements,
    note: toCleanString(note) || null,
    updatedAt: FieldValue.serverTimestamp(),
  };
};

export const getActiveSubscriptionForBillingAccount = async (billingAccountId) => {
  const normalizedBillingAccountId = toCleanString(billingAccountId);
  if (!normalizedBillingAccountId) {
    throw new HttpsError('invalid-argument', 'billingAccountId es requerido');
  }
  const accountRef = db.doc(`billingAccounts/${normalizedBillingAccountId}`);
  const subscriptionsSnap = await accountRef
    .collection(SUBSCRIPTIONS_SUBCOLLECTION)
    .orderBy('updatedAt', 'desc')
    .limit(20)
    .get();

  const subscriptions = subscriptionsSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  const now = Date.now();
  const active =
    subscriptions.find((item) => {
      const status = toCleanString(item.status)?.toLowerCase();
      if (!ACTIVE_SUBSCRIPTION_STATUSES.has(status)) return false;
      const effectiveAt = toMillis(item.effectiveAt);
      if (effectiveAt == null) return true;
      return effectiveAt <= now;
    }) ||
    subscriptions.find((item) => {
      const status = toCleanString(item.status)?.toLowerCase();
      if (status !== 'scheduled') return false;
      const effectiveAt = toMillis(item.effectiveAt);
      return effectiveAt != null && effectiveAt <= now;
    }) ||
    subscriptions[0] ||
    null;

  if (!active) return null;

  return hydrateSubscriptionSnapshotFromPlan(active);
};

const applySnapshotToBusiness = async ({ businessId, subscriptionSnapshot }) => {
  const normalizedBusinessId = toCleanString(businessId);
  if (!normalizedBusinessId) return;

  const businessRef = db.doc(`businesses/${normalizedBusinessId}`);
  const businessSnap = await businessRef.get();
  if (!businessSnap.exists) return;

  const root = businessSnap.data() || {};
  const businessNode = asRecord(root.business);

  await businessRef.set(
    {
      subscription: subscriptionSnapshot,
      business: {
        ...businessNode,
        subscription: subscriptionSnapshot,
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
};

const listAccountBusinessIds = async (billingAccountId) => {
  const normalizedBillingAccountId = toCleanString(billingAccountId);
  if (!normalizedBillingAccountId) return [];

  const linksSnap = await db
    .doc(`billingAccounts/${normalizedBillingAccountId}`)
    .collection(BUSINESS_LINKS_SUBCOLLECTION)
    .get();

  return linksSnap.docs.map((docSnap) => docSnap.id);
};

export const assignSubscriptionToBillingAccount = async ({
  billingAccountId,
  planCode,
  status = 'active',
  scope = 'account',
  targetBusinessId = null,
  effectiveAt = null,
  provider = BILLING_DEFAULT_PROVIDER,
  actorUserId = null,
  note = null,
  source = 'developer_panel',
  periodStartMs = null,
  periodEndMs = null,
  trialEndsAtMs = null,
}) => {
  const normalizedBillingAccountId = toCleanString(billingAccountId);
  if (!normalizedBillingAccountId) {
    throw new HttpsError('invalid-argument', 'billingAccountId es requerido');
  }
  await assertPlanCatalogAssignable(planCode);

  const normalizedScope = normalizeScope(scope);
  const normalizedTargetBusinessId = toCleanString(targetBusinessId);
  if (normalizedScope === 'business' && !normalizedTargetBusinessId) {
    throw new HttpsError(
      'invalid-argument',
      'targetBusinessId es requerido para scope=business',
    );
  }

  const planSnapshot = await resolvePlanVersionSnapshot({ planCode });
  const effectiveAtMs = toMillis(effectiveAt) || Date.now();
  const subscriptionSnapshot = buildSubscriptionSnapshot({
    planSnapshot,
    status,
    provider,
    scope: normalizedScope,
    source,
    periodStartMs: periodStartMs ?? effectiveAtMs,
    periodEndMs,
    trialEndsAtMs,
    note,
  });
  subscriptionSnapshot.effectiveAt = Timestamp.fromMillis(effectiveAtMs);

  const subscriptionId = `sub_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
  const accountRef = db.doc(`billingAccounts/${normalizedBillingAccountId}`);
  const subscriptionRef = accountRef
    .collection(SUBSCRIPTIONS_SUBCOLLECTION)
    .doc(subscriptionId);

  await subscriptionRef.set(
    {
      subscriptionId,
      ...subscriptionSnapshot,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: actorUserId,
      targetBusinessId: normalizedTargetBusinessId || null,
    },
    { merge: true },
  );
  await accountRef.set(
    {
      activeSubscriptionId: subscriptionId,
      provider: toCleanString(provider) || BILLING_DEFAULT_PROVIDER,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actorUserId,
    },
    { merge: true },
  );

  if (normalizedScope === 'business' && normalizedTargetBusinessId) {
    await applySnapshotToBusiness({
      businessId: normalizedTargetBusinessId,
      subscriptionSnapshot,
    });
  } else {
    const businessIds = await listAccountBusinessIds(normalizedBillingAccountId);
    await Promise.allSettled(
      businessIds.map((businessId) =>
        applySnapshotToBusiness({
          businessId,
          subscriptionSnapshot,
        })),
    );
  }

  return {
    ok: true,
    billingAccountId: normalizedBillingAccountId,
    subscriptionId,
    scope: normalizedScope,
    targetBusinessId: normalizedTargetBusinessId,
    subscription: subscriptionSnapshot,
  };
};

export const refreshSubscriptionsForPlanCode = async ({
  planCode,
  actorUserId = null,
  atMillis = Date.now(),
}) => {
  const normalizedPlanCode = toCleanString(planCode)?.toLowerCase();
  if (!normalizedPlanCode) {
    throw new HttpsError('invalid-argument', 'planCode es requerido');
  }

  let planSnapshot;
  try {
    planSnapshot = await resolvePlanVersionSnapshot({
      planCode: normalizedPlanCode,
      atMillis,
    });
  } catch {
    return {
      ok: true,
      planCode: normalizedPlanCode,
      updatedAccounts: 0,
      mirroredBusinesses: 0,
    };
  }

  const accountsSnap = await db.collection('billingAccounts').get();
  let updatedAccounts = 0;
  let mirroredBusinesses = 0;

  for (const accountDoc of accountsSnap.docs) {
    const activeSubscription = await getActiveSubscriptionForBillingAccount(
      accountDoc.id,
    );
    if (!activeSubscription) continue;

    const activePlanCode =
      toCleanString(activeSubscription.planId)?.toLowerCase() || null;
    if (activePlanCode !== normalizedPlanCode) continue;

    const refreshedSnapshot = buildRefreshedSubscriptionSnapshot({
      currentSubscription: activeSubscription,
      planSnapshot,
    });

    await accountDoc.ref
      .collection(SUBSCRIPTIONS_SUBCOLLECTION)
      .doc(activeSubscription.id)
      .set(
        {
          ...refreshedSnapshot,
          updatedBy: actorUserId,
        },
        { merge: true },
      );

    const nextSubscriptionSnapshot = {
      ...activeSubscription,
      ...refreshedSnapshot,
    };
    const targetBusinessId = toCleanString(activeSubscription.targetBusinessId);
    const businessIds =
      toCleanString(activeSubscription.scope) === 'business' && targetBusinessId
        ? [targetBusinessId]
        : await listAccountBusinessIds(accountDoc.id);
    await Promise.allSettled(
      businessIds.map((businessId) =>
        applySnapshotToBusiness({
          businessId,
          subscriptionSnapshot: nextSubscriptionSnapshot,
        }),
      ),
    );

    updatedAccounts += 1;
    mirroredBusinesses += businessIds.length;
  }

  return {
    ok: true,
    planCode: normalizedPlanCode,
    updatedAccounts,
    mirroredBusinesses,
  };
};

export const ensureBusinessOnboardingSubscription = async ({
  businessId,
  actorUserId = null,
}) => {
  const normalizedBusinessId = toCleanString(businessId);
  if (!normalizedBusinessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }

  const ownerUid = await getBusinessOwnerUid(normalizedBusinessId);
  const { billingAccountId } = await ensureBillingAccountForOwner({
    ownerUid,
    actorUserId,
  });

  await linkBusinessToBillingAccount({
    billingAccountId,
    businessId: normalizedBusinessId,
    ownerUid,
    actorUserId,
  });

  const activeSubscription = await getActiveSubscriptionForBillingAccount(
    billingAccountId,
  );
  if (activeSubscription) {
    await applySnapshotToBusiness({
      businessId: normalizedBusinessId,
      subscriptionSnapshot: activeSubscription,
    });
    return {
      ok: true,
      billingAccountId,
      ownerUid,
      created: false,
      subscription: activeSubscription,
    };
  }

  const now = Date.now();
  const trialEndsAtMs = now + DEFAULT_ONBOARDING_TRIAL_DAYS * 24 * 60 * 60 * 1000;

  const seededSubscription = await assignSubscriptionToBillingAccount({
    billingAccountId,
    planCode: DEFAULT_ONBOARDING_PLAN_CODE,
    status: 'trialing',
    scope: 'account',
    targetBusinessId: normalizedBusinessId,
    provider: BILLING_DEFAULT_PROVIDER,
    actorUserId,
    source: 'onboarding_initial_demo',
    periodStartMs: now,
    periodEndMs: trialEndsAtMs,
    trialEndsAtMs,
    note: `Onboarding inicial con demo de ${DEFAULT_ONBOARDING_TRIAL_DAYS} dias`,
  });

  return {
    ok: true,
    billingAccountId,
    ownerUid,
    created: true,
    subscription: seededSubscription.subscription,
  };
};

export const syncBillingAccountSubscriptionMirrors = async (billingAccountId) => {
  const normalizedBillingAccountId = toCleanString(billingAccountId);
  if (!normalizedBillingAccountId) {
    throw new HttpsError('invalid-argument', 'billingAccountId es requerido');
  }

  const accountRef = db.doc(`billingAccounts/${normalizedBillingAccountId}`);
  const subscriptionsSnap = await accountRef
    .collection(SUBSCRIPTIONS_SUBCOLLECTION)
    .orderBy('effectiveAt', 'asc')
    .get();
  if (subscriptionsSnap.empty) {
    return { ok: true, billingAccountId: normalizedBillingAccountId, patched: 0 };
  }

  const now = Date.now();
  const subscriptions = subscriptionsSnap.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .sort((a, b) => (toMillis(a.effectiveAt) || 0) - (toMillis(b.effectiveAt) || 0));

  const dueSubscription =
    subscriptions
      .slice()
      .reverse()
      .find((item) => {
        const status = toCleanString(item.status)?.toLowerCase();
        if (!ACTIVE_SUBSCRIPTION_STATUSES.has(status) && status !== 'scheduled') {
          return false;
        }
        const effectiveAtMs = toMillis(item.effectiveAt);
        return effectiveAtMs == null || effectiveAtMs <= now;
      }) || subscriptions[subscriptions.length - 1];

  if (!dueSubscription) {
    return { ok: true, billingAccountId: normalizedBillingAccountId, patched: 0 };
  }

  const activeId = toCleanString(dueSubscription.id);
  const updates = subscriptions.map(async (subscription) => {
    const status = toCleanString(subscription.status)?.toLowerCase() || 'active';
    if (subscription.id === activeId) {
      if (!ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
        await accountRef
          .collection(SUBSCRIPTIONS_SUBCOLLECTION)
          .doc(subscription.id)
          .set(
            {
              status: 'active',
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
      }
      return;
    }
    if (subscription.id !== activeId && ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
      await accountRef
        .collection(SUBSCRIPTIONS_SUBCOLLECTION)
        .doc(subscription.id)
        .set(
          {
            status: 'deprecated',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
    }
  });
  await Promise.allSettled(updates);

  await accountRef.set(
    {
      activeSubscriptionId: activeId,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const businessIds = await listAccountBusinessIds(normalizedBillingAccountId);
  await Promise.allSettled(
    businessIds.map((businessId) =>
      applySnapshotToBusiness({
        businessId,
        subscriptionSnapshot: dueSubscription,
      })),
  );

  return {
    ok: true,
    billingAccountId: normalizedBillingAccountId,
    activeSubscriptionId: activeId,
    patched: businessIds.length,
  };
};

export const ensureBusinessBillingSetup = async ({
  businessId,
  actorUserId = null,
}) => {
  const normalizedBusinessId = toCleanString(businessId);
  if (!normalizedBusinessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }

  const ownerUid = await getBusinessOwnerUid(normalizedBusinessId);
  const { billingAccountId } = await ensureBillingAccountForOwner({
    ownerUid,
    actorUserId,
  });

  await linkBusinessToBillingAccount({
    billingAccountId,
    businessId: normalizedBusinessId,
    ownerUid,
    actorUserId,
  });

  const activeSubscription = await getActiveSubscriptionForBillingAccount(
    billingAccountId,
  );
  if (activeSubscription) {
    await applySnapshotToBusiness({
      businessId: normalizedBusinessId,
      subscriptionSnapshot: activeSubscription,
    });
    return {
      ok: true,
      billingAccountId,
      ownerUid,
      subscription: activeSubscription,
    };
  }

  return {
    ok: true,
    billingAccountId,
    ownerUid,
    subscription: null,
  };
};

export const resolveEffectiveSubscriptionForBusiness = async (businessId) => {
  const normalizedBusinessId = toCleanString(businessId);
  if (!normalizedBusinessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }

  const businessSnap = await db.doc(`businesses/${normalizedBusinessId}`).get();
  if (!businessSnap.exists) {
    throw new HttpsError('not-found', 'Negocio no encontrado');
  }
  const businessData = businessSnap.data() || {};
  const rootSubscription = asRecord(businessData.subscription);
  const nestedSubscription = asRecord(asRecord(businessData.business).subscription);

  const hasRootSubscription = Object.keys(rootSubscription).length > 0;
  const hasNestedSubscription = Object.keys(nestedSubscription).length > 0;
  if (hasRootSubscription || hasNestedSubscription) {
    const currentSubscription = hasRootSubscription ? rootSubscription : nestedSubscription;
    const hydratedSubscription = await hydrateSubscriptionSnapshotFromPlan(
      currentSubscription,
    );

    if (hydratedSubscription !== currentSubscription) {
      await applySnapshotToBusiness({
        businessId: normalizedBusinessId,
        subscriptionSnapshot: hydratedSubscription,
      });
    }

    return hydratedSubscription;
  }

  const ownerUid = readBusinessOwnerUidFromData(businessData);
  if (!ownerUid) {
    return {};
  }

  const billingAccountId =
    toCleanString(businessData.billingAccountId) ||
    resolveBillingAccountIdForOwner(ownerUid);
  const activeSubscription =
    await getActiveSubscriptionForBillingAccount(billingAccountId);

  if (activeSubscription) return activeSubscription;

  return {};
};
