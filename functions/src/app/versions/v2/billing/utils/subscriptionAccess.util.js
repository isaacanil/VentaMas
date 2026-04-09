import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';

import { db } from '../../../../core/config/firebase.js';
import { resolveSubscriptionOperationAccess } from '../config/limitOperations.config.js';
import { resolveEffectiveSubscriptionForBusiness } from '../services/subscriptionSnapshot.service.js';
import { assertUsageCanIncrease, getBusinessUsageSnapshot } from '../services/usage.service.js';
import { asRecord, toCleanString } from './billingCommon.util.js';
import { normalizePlanEntitlements } from './planEntitlements.util.js';

const ACTIVE_STATUSES = new Set(['active', 'trialing']);
const BLOCKED_WRITE_STATUSES = new Set(['past_due', 'canceled', 'unpaid']);
const STRICT_LIMIT_PLANS = new Set(['demo', 'plus']);
const INACTIVE_MEMBERSHIP_STATUSES = new Set(['inactive', 'suspended', 'revoked']);
const LIMIT_ENFORCEMENT_MODE = String(
  process.env.BILLING_LIMIT_ENFORCEMENT_MODE || 'enforce',
)
  .trim()
  .toLowerCase();
const IS_LIMIT_OBSERVE_MODE = LIMIT_ENFORCEMENT_MODE === 'observe';

const normalizeSubscriptionStatus = (value) =>
  toCleanString(value)?.toLowerCase() || null;

const resolveBusinessLevelSubscription = (businessData) => {
  const root = asRecord(businessData);
  const nestedBusiness = asRecord(root.business);
  const nestedSubscription = asRecord(nestedBusiness.subscription);
  const rootSubscription = asRecord(root.subscription);

  if (Object.keys(rootSubscription).length > 0) return rootSubscription;
  if (Object.keys(nestedSubscription).length > 0) return nestedSubscription;
  return {};
};

const normalizeLimitMetricKey = (rawMetricKey) => {
  const metricKey = toCleanString(rawMetricKey);
  if (!metricKey) return null;
  return metricKey;
};

const normalizeEntitlementKey = (rawKey) => toCleanString(rawKey) || null;

const resolveRequiredEntitlement = ({
  explicitValue,
  operationValue,
}) => normalizeEntitlementKey(explicitValue) || normalizeEntitlementKey(operationValue);

const assertEntitlementAccess = ({
  entitlementType,
  entitlementKey,
  enabledValues,
}) => {
  const normalizedEntitlementKey = normalizeEntitlementKey(entitlementKey);
  if (!normalizedEntitlementKey) return null;

  const enabled = asRecord(enabledValues)[normalizedEntitlementKey] === true;
  if (enabled) {
    return {
      key: normalizedEntitlementKey,
      enabled: true,
    };
  }

  const entitlementLabel =
    entitlementType === 'addon' ? 'add-on' : 'módulo';
  throw new HttpsError(
    'permission-denied',
    `Tu suscripción no tiene habilitado el ${entitlementLabel} ${normalizedEntitlementKey}.`,
  );
};

const resolveOwnerUidFromBusiness = (businessData) => {
  const root = asRecord(businessData);
  const businessNode = asRecord(root.business);
  return (
    toCleanString(root.ownerUid) ||
    toCleanString(businessNode.ownerUid) ||
    toCleanString(root.billingContactUid) ||
    toCleanString(businessNode.billingContactUid) ||
    null
  );
};

const normalizeUserRoleFromMembership = ({ membership, userData }) => {
  const roleFromMembership = toCleanString(membership?.role)?.toLowerCase() || null;
  if (roleFromMembership) return roleFromMembership;
  return (
    toCleanString(userData?.activeRole)?.toLowerCase() ||
    null
  );
};

const isPlatformDev = (userData) => {
  const root = asRecord(userData);
  const platformRoles = asRecord(root.platformRoles);
  return (
    platformRoles.dev === true ||
    toCleanString(root.activeRole)?.toLowerCase() === 'dev'
  );
};

export const assertBillingAccessForBusiness = async ({
  businessId,
  actorUserId,
  allowRoles = ['owner', 'admin'],
  allowReadForAnyMember = false,
}) => {
  const normalizedBusinessId = toCleanString(businessId);
  const normalizedActorUserId = toCleanString(actorUserId);
  if (!normalizedBusinessId || !normalizedActorUserId) {
    throw new HttpsError('invalid-argument', 'businessId y actorUserId son requeridos');
  }

  const [businessSnap, memberSnap, userSnap] = await Promise.all([
    db.doc(`businesses/${normalizedBusinessId}`).get(),
    db.doc(`businesses/${normalizedBusinessId}/members/${normalizedActorUserId}`).get(),
    db.doc(`users/${normalizedActorUserId}`).get(),
  ]);
  if (!businessSnap.exists) {
    throw new HttpsError('not-found', 'Negocio no encontrado');
  }

  const userData = userSnap.exists ? userSnap.data() || {} : {};
  if (isPlatformDev(userData)) {
    return {
      allowed: true,
      role: 'dev',
      policy: 'platform-dev',
    };
  }

  const businessData = businessSnap.data() || {};
  const ownerUid = resolveOwnerUidFromBusiness(businessData);
  if (ownerUid && ownerUid === normalizedActorUserId) {
    return {
      allowed: true,
      role: 'owner',
      policy: 'business-owner',
    };
  }

  if (!memberSnap.exists) {
    throw new HttpsError(
      'permission-denied',
      'No tienes membresía activa para este negocio',
    );
  }

  const membership = memberSnap.data() || {};
  const status = toCleanString(membership.status)?.toLowerCase() || 'active';
  if (INACTIVE_MEMBERSHIP_STATUSES.has(status)) {
    throw new HttpsError('permission-denied', 'Membresía inactiva para este negocio');
  }

  const role = normalizeUserRoleFromMembership({ membership, userData }) || 'cashier';
  if (allowReadForAnyMember) {
    return { allowed: true, role, policy: 'any-active-member' };
  }

  const allowedRoleSet = new Set(
    (allowRoles || []).map((roleItem) => toCleanString(roleItem)?.toLowerCase()).filter(Boolean),
  );
  if (!allowedRoleSet.has(role)) {
    throw new HttpsError(
      'permission-denied',
      'No tienes permisos para administrar suscripción/pagos',
    );
  }

  return { allowed: true, role, policy: 'membership-role' };
};

export const getBusinessSubscriptionSnapshot = async (businessId) => {
  const normalizedBusinessId = toCleanString(businessId);
  if (!normalizedBusinessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }

  const businessRef = db.doc(`businesses/${normalizedBusinessId}`);
  const businessSnap = await businessRef.get();
  if (!businessSnap.exists) {
    throw new HttpsError('not-found', 'Negocio no encontrado');
  }

  const businessData = businessSnap.data() || {};
  const localSubscription = resolveBusinessLevelSubscription(businessData);
  const hasLocalSubscription = Object.keys(localSubscription).length > 0;

  const resolvedSubscription = hasLocalSubscription
    ? localSubscription
    : await resolveEffectiveSubscriptionForBusiness(normalizedBusinessId);

  const status =
    normalizeSubscriptionStatus(resolvedSubscription.status) ||
    normalizeSubscriptionStatus(localSubscription.status) ||
    null;
  const planId =
    toCleanString(resolvedSubscription.planId) ||
    toCleanString(localSubscription.planId) ||
    null;
  const entitlements = normalizePlanEntitlements(resolvedSubscription);
  const normalizedRaw = {
    ...asRecord(resolvedSubscription),
    ...entitlements,
  };

  return {
    businessId: normalizedBusinessId,
    exists: Boolean(status),
    status,
    planId,
    limits: asRecord(resolvedSubscription.limits),
    ...entitlements,
    raw: normalizedRaw,
  };
};

export const assertBusinessSubscriptionAccess = async ({
  businessId,
  action = 'write',
  operation = null,
  usageDelta = null,
  requiredModule = null,
  requiredAddon = null,
}) => {
  const snapshot = await getBusinessSubscriptionSnapshot(businessId);
  const status = snapshot.status;

  // Legacy businesses without subscription node remain allowed during migration.
  if (!status) {
    return {
      ...snapshot,
      allowed: true,
      policy: 'no-subscription-node',
    };
  }

  if (action === 'read') {
    return {
      ...snapshot,
      allowed: true,
      policy: 'read-allowed',
    };
  }

  if (!ACTIVE_STATUSES.has(status)) {
    if (BLOCKED_WRITE_STATUSES.has(status)) {
      throw new HttpsError(
        'failed-precondition',
        `La suscripción del negocio está en estado ${status}. Contacta soporte para reactivar el servicio.`,
      );
    }

    throw new HttpsError(
      'failed-precondition',
      `No se permite esta operación con la suscripción en estado ${status}.`,
    );
  }

  const normalizedPlanId = toCleanString(snapshot.planId)?.toLowerCase() || null;
  const usageConfig = asRecord(usageDelta);
  const operationAccess =
    resolveSubscriptionOperationAccess(operation) || {};
  const resolvedRequiredModule = resolveRequiredEntitlement({
    explicitValue: requiredModule,
    operationValue: operationAccess.requiredModule,
  });
  const resolvedRequiredAddon = resolveRequiredEntitlement({
    explicitValue: requiredAddon,
    operationValue: operationAccess.requiredAddon,
  });

  const moduleCheck = assertEntitlementAccess({
    entitlementType: 'module',
    entitlementKey: resolvedRequiredModule,
    enabledValues: snapshot.modules,
  });
  const addonCheck = assertEntitlementAccess({
    entitlementType: 'addon',
    entitlementKey: resolvedRequiredAddon,
    enabledValues: snapshot.addons,
  });

  if (action === 'read') {
    return {
      ...snapshot,
      allowed: true,
      policy:
        moduleCheck || addonCheck
          ? 'read-allowed-with-entitlement-check'
          : 'read-allowed',
      operation: toCleanString(operation) || null,
      module: moduleCheck,
      addon: addonCheck,
      enforcementMode: LIMIT_ENFORCEMENT_MODE,
    };
  }

  const metricKey = normalizeLimitMetricKey(
    usageConfig.metricKey ||
      usageConfig.metric ||
      operationAccess.metricKey,
  );
  const incrementBy = Number(
    usageConfig.incrementBy ??
      usageConfig.delta ??
      operationAccess.incrementBy ??
      1,
  );

  if (
    normalizedPlanId &&
    STRICT_LIMIT_PLANS.has(normalizedPlanId) &&
    metricKey &&
    Number.isFinite(incrementBy) &&
    incrementBy > 0
  ) {
    const usage = await getBusinessUsageSnapshot({ businessId });
    const currentValue = Number(
      usage.monthly[metricKey] ?? usage.current[metricKey] ?? 0,
    );
    let limitCheck = null;
    try {
      limitCheck = assertUsageCanIncrease({
        subscription: snapshot.raw,
        metricKey,
        currentValue,
        incrementBy,
        planId: normalizedPlanId,
      });
    } catch (error) {
      const isLimitExhaustedError =
        error instanceof HttpsError && error.code === 'resource-exhausted';
      if (!IS_LIMIT_OBSERVE_MODE || !isLimitExhaustedError) {
        throw error;
      }
      logger.warn('billing limit exceeded in observe mode', {
        businessId,
        action,
        operation: toCleanString(operation) || null,
        planId: normalizedPlanId,
        metricKey,
        currentValue,
        incrementBy,
        mode: LIMIT_ENFORCEMENT_MODE,
      });
      limitCheck = {
        ok: true,
        limit: null,
        nextValue: currentValue + incrementBy,
        remaining: null,
      };
    }

    return {
      ...snapshot,
      allowed: true,
      policy: IS_LIMIT_OBSERVE_MODE
        ? 'active-write-allowed-with-observe-limit-check'
        : 'active-write-allowed-with-limit-check',
      operation: toCleanString(operation) || null,
      module: moduleCheck,
      addon: addonCheck,
      enforcementMode: LIMIT_ENFORCEMENT_MODE,
      usage: {
        metricKey,
        currentValue,
        incrementBy,
        limit: limitCheck.limit,
        nextValue: limitCheck.nextValue,
        remaining: limitCheck.remaining,
      },
    };
  }

  return {
    ...snapshot,
    allowed: true,
    operation: toCleanString(operation) || null,
    module: moduleCheck,
    addon: addonCheck,
    enforcementMode: LIMIT_ENFORCEMENT_MODE,
    policy: 'active-write-allowed',
  };
};
