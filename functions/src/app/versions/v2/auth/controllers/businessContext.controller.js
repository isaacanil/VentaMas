import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db, FieldValue, Timestamp } from '../../../../core/config/firebase.js';
import {
  ROLE,
  normalizeRole,
} from '../../../../core/constants/roles.constants.js';
import {
  assertBusinessCreationLimit,
  provisionBusinessCoreInTransaction,
  runBusinessPostProvisioning,
} from '../../../../modules/business/functions/createBusiness.js';
import {
  assertActiveMembershipForBusiness,
  getDistinctActiveBusinesses,
  normalizeMembershipEntries,
  toCleanString,
} from '../utils/membershipContext.util.js';
import {
  resolveUserIdFromSessionToken,
  toMillis,
} from '../utils/sessionAuth.util.js';
import {
  upsertAccessControlEntry,
} from '../utils/membershipMirror.util.js';
import {
  ensureBusinessOnboardingSubscription,
} from '../../billing/services/subscriptionSnapshot.service.js';
import { incrementBusinessUsageMetric } from '../../billing/services/usage.service.js';

const USERS_COLLECTION = 'users';
const DEV_IMPERSONATION_AUDIT_COLLECTION = 'devBusinessImpersonationAudit';
const DEV_IMPERSONATION_MIN_TTL_MINUTES = 5;
const DEV_IMPERSONATION_MAX_TTL_MINUTES = 240;
const DEV_IMPERSONATION_DEFAULT_TTL_MINUTES =
  Number(process.env.DEV_BUSINESS_IMPERSONATION_TTL_MINUTES) || 30;
const INACTIVE_MEMBERSHIP_STATUSES = new Set(['inactive', 'suspended', 'revoked']);

const usersCol = db.collection(USERS_COLLECTION);
const devImpersonationAuditCol = db.collection(DEV_IMPERSONATION_AUDIT_COLLECTION);

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const resolveCanonicalMembershipForBusiness = async ({ userId, businessId }) => {
  if (!userId || !businessId) return null;
  const snap = await db.doc(`businesses/${businessId}/members/${userId}`).get();
  if (!snap.exists) return null;

  const status =
    toCleanString(snap.get('status')) ||
    (snap.get('active') === false ? 'inactive' : 'active');
  const normalizedStatus = String(status).toLowerCase();
  if (INACTIVE_MEMBERSHIP_STATUSES.has(normalizedStatus)) {
    throw new HttpsError(
      'permission-denied',
      'No tienes acceso activo al negocio seleccionado',
    );
  }

  const role =
    normalizeRole(snap.get('role') || snap.get('activeRole') || ROLE.CASHIER) ||
    ROLE.CASHIER;

  return {
    businessId,
    role,
    status: normalizedStatus,
  };
};

const resolveCurrentBusinessId = (userData) =>
  toCleanString(userData?.activeBusinessId) ||
  toCleanString(userData?.businessID) ||
  toCleanString(userData?.businessId) ||
  null;

const resolveDevRole = (userData) => {
  const raw = asRecord(userData);
  return normalizeRole(raw.activeRole || raw.role || '') || '';
};

const hasDevPrivileges = (userData) => {
  const raw = asRecord(userData);
  const platformRoles = asRecord(raw.platformRoles);
  const platformNode = asRecord(raw.platform);
  return (
    resolveDevRole(raw) === ROLE.DEV ||
    raw.isDev === true ||
    platformRoles.dev === true ||
    platformNode.dev === true
  );
};

const resolveTtlMinutes = (rawValue) => {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return DEV_IMPERSONATION_DEFAULT_TTL_MINUTES;
  return Math.max(
    DEV_IMPERSONATION_MIN_TTL_MINUTES,
    Math.min(DEV_IMPERSONATION_MAX_TTL_MINUTES, Math.floor(parsed)),
  );
};

const resolveDevSimulation = (userData) => {
  const raw = asRecord(userData?.devBusinessSimulation);
  if (!Object.keys(raw).length) return null;

  const originalBusinessId = toCleanString(raw.originalBusinessId);
  const overrideBusinessId = toCleanString(raw.overrideBusinessId);
  const startedBy = toCleanString(raw.startedBy);
  const startedAt = raw.startedAt || null;
  const endedAt = raw.endedAt || null;
  const expiresAt = raw.expiresAt || null;
  const ttlMinutes = Number(raw.ttlMinutes);
  const isActive = raw.isActive === true;

  return {
    isActive,
    originalBusinessId,
    overrideBusinessId,
    startedBy,
    startedAt,
    endedAt,
    expiresAt,
    expiresAtMs: toMillis(expiresAt),
    ttlMinutes: Number.isFinite(ttlMinutes) ? ttlMinutes : null,
  };
};

const buildRawRequestContext = (request) => ({
  ipAddress:
    request?.rawRequest?.headers?.['x-forwarded-for'] ||
    request?.rawRequest?.ip ||
    null,
  userAgent: request?.rawRequest?.headers?.['user-agent'] || null,
});

const writeDevImpersonationAudit = async ({
  userId,
  action,
  originalBusinessId,
  overrideBusinessId,
  restoredBusinessId = null,
  reason = null,
  ttlMinutes = null,
  expiresAt = null,
  requestContext = {},
}) => {
  if (!userId || !action) return;
  try {
    await devImpersonationAuditCol.add({
      userId,
      action,
      originalBusinessId: originalBusinessId || null,
      overrideBusinessId: overrideBusinessId || null,
      restoredBusinessId: restoredBusinessId || null,
      reason: reason || null,
      ttlMinutes: Number.isFinite(Number(ttlMinutes))
        ? Number(ttlMinutes)
        : null,
      expiresAt: expiresAt || null,
      requestContext: asRecord(requestContext),
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('dev impersonation audit log error:', error);
  }
};

const setUserBusinessContext = async ({
  userRef,
  businessId,
  devBusinessSimulation,
}) => {
  await userRef.set(
    {
      activeBusinessId: businessId,
      lastSelectedBusinessId: businessId,
      updatedAt: FieldValue.serverTimestamp(),
      devBusinessSimulation,
    },
    { merge: true },
  );
};

const stopDevImpersonation = async ({
  userRef,
  userId,
  simulation,
  reason = 'manual-stop',
  requestContext = {},
}) => {
  if (!simulation?.isActive) {
    return { restored: false, businessId: null };
  }

  const restoreBusinessId = simulation.originalBusinessId;
  if (!restoreBusinessId) {
    throw new HttpsError(
      'failed-precondition',
      'No se pudo determinar el negocio original de la simulación',
    );
  }

  const nextSimulation = {
    isActive: false,
    originalBusinessId: simulation.originalBusinessId,
    overrideBusinessId: simulation.overrideBusinessId,
    startedBy: simulation.startedBy || userId,
    startedAt: simulation.startedAt || null,
    endedAt: FieldValue.serverTimestamp(),
    endReason: reason,
    ttlMinutes: simulation.ttlMinutes || null,
    expiresAt: simulation.expiresAt || null,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await setUserBusinessContext({
    userRef,
    businessId: restoreBusinessId,
    devBusinessSimulation: nextSimulation,
  });

  await writeDevImpersonationAudit({
    userId,
    action: reason === 'expired' ? 'expired' : 'stop',
    originalBusinessId: simulation.originalBusinessId,
    overrideBusinessId: simulation.overrideBusinessId,
    restoredBusinessId: restoreBusinessId,
    reason,
    ttlMinutes: simulation.ttlMinutes,
    expiresAt: simulation.expiresAt,
    requestContext,
  });

  return { restored: true, businessId: restoreBusinessId };
};

const getActiveDevSimulationState = async ({
  userRef,
  userData,
  userId,
  requestContext = {},
}) => {
  const simulation = resolveDevSimulation(userData);
  if (!simulation || !simulation.isActive) {
    return { active: false, simulation: null, expired: false };
  }

  const now = Date.now();
  if (simulation.expiresAtMs && simulation.expiresAtMs <= now) {
    const stopResult = await stopDevImpersonation({
      userRef,
      userId,
      simulation,
      reason: 'expired',
      requestContext,
    });
    return {
      active: false,
      simulation,
      expired: true,
      restoredBusinessId: stopResult.businessId,
    };
  }

  return {
    active: true,
    simulation,
    expired: false,
    remainingMs: simulation.expiresAtMs ? simulation.expiresAtMs - now : null,
  };
};

const resolveUserIdFromSession = async (request) => {
  return resolveUserIdFromSessionToken({
    sessionToken: toCleanString(request?.data?.sessionToken),
    normalizeUserId: toCleanString,
    createAuthError: (message) =>
      new HttpsError('unauthenticated', message),
  });
};

const resolveAuthUserId = async (request) => {
  const fromSession = await resolveUserIdFromSession(request);
  return fromSession || request?.auth?.uid || null;
};

export const clientCreateBusinessForCurrentAccount = onCall(async (request) => {
  const payload = asRecord(request?.data);
  const business = asRecord(payload.business);
  if (!Object.keys(business).length) {
    throw new HttpsError('invalid-argument', 'business es requerido');
  }

  const userId = await resolveAuthUserId(request);
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const userRef = usersCol.doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Usuario no encontrado');
  }

  const userData = userSnap.data() || {};
  const entries = normalizeMembershipEntries(userData, { includeBusinessName: true });
  const activeBusinessIds = getDistinctActiveBusinesses(entries);
  const hasBusinesses = activeBusinessIds.length > 0;
  const currentRole =
      normalizeRole(userData.activeRole || userData.role || ROLE.CASHIER) ||
      ROLE.CASHIER;
  const isDevActor = hasDevPrivileges(userData);

  const canCreateForCurrentAccount =
      isDevActor ||
      !hasBusinesses ||
      currentRole === ROLE.OWNER ||
      currentRole === ROLE.ADMIN;

  if (!canCreateForCurrentAccount) {
    throw new HttpsError(
      'permission-denied',
      'Solo usuarios owner/admin/dev pueden crear mas negocios en esta cuenta',
    );
  }

  await assertBusinessCreationLimit({ ownerUid: userId });

  const requestedBusinessId = toCleanString(business.id);
  const businessId = requestedBusinessId || nanoid();
  const businessNode = asRecord(business.business);
  const businessName =
      toCleanString(business.name) ||
      toCleanString(businessNode.name) ||
      null;

  let hasMultipleBusinesses = false;
  let resultingRole = ROLE.OWNER;

  await db.runTransaction(async (tx) => {
    const freshUserSnap = await tx.get(userRef);
    if (!freshUserSnap.exists) {
      throw new HttpsError('not-found', 'Usuario no encontrado');
    }

    const freshUserData = freshUserSnap.data() || {};
    const isPlatformDevActor = hasDevPrivileges(freshUserData);
    const freshEntries = normalizeMembershipEntries(freshUserData, {
      includeBusinessName: true,
    });
    const mergedEntries = upsertAccessControlEntry(freshEntries, {
      businessId,
      role: ROLE.OWNER,
      status: 'active',
      businessName,
    });

    const nextActiveBusinessIds = getDistinctActiveBusinesses(mergedEntries);
    hasMultipleBusinesses = nextActiveBusinessIds.length > 1;

    await provisionBusinessCoreInTransaction({
      tx,
      businessId,
      business,
      createdBy: userId,
      requireNewBusiness: true,
    });

    const memberRef = db.doc(`businesses/${businessId}/members/${userId}`);
    tx.set(
      memberRef,
      {
        uid: userId,
        userId,
        businessId,
        role: ROLE.OWNER,
        status: 'active',
        isOwner: true,
        source: 'self_service_create_business',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const userUpdatePayload = {
      accessControl: mergedEntries,
      activeBusinessId: businessId,
      lastSelectedBusinessId: businessId,
      hasMultipleBusinesses,
      updatedAt: FieldValue.serverTimestamp(),
      ...(isPlatformDevActor ? {} : { activeRole: ROLE.OWNER }),
    };

    tx.set(userRef, userUpdatePayload, { merge: true });
    resultingRole = isPlatformDevActor ? ROLE.DEV : ROLE.OWNER;

    await incrementBusinessUsageMetric({
      businessId,
      metricKey: 'usersTotal',
      incrementBy: 1,
      tx,
    });
  });

  await runBusinessPostProvisioning({ businessId, actorUserId: userId });

  let onboardingSubscriptionStatus = 'ready';
  let onboardingSubscription = null;
  try {
    const onboardingResult = await ensureBusinessOnboardingSubscription({
      businessId,
      actorUserId: userId,
    });
    onboardingSubscription = onboardingResult?.subscription || null;
  } catch (error) {
    onboardingSubscriptionStatus = 'pending';
    console.error('business onboarding subscription setup failed:', {
      businessId,
      userId,
      error: error instanceof Error ? error.message : error,
    });
  }

  return {
    ok: true,
    id: businessId,
    businessId,
    businessName,
    role: resultingRole,
    hasMultipleBusinesses,
    onboardingSubscriptionStatus,
    subscriptionStatus: toCleanString(onboardingSubscription?.status)?.toLowerCase() || null,
    subscriptionPlanId: toCleanString(onboardingSubscription?.planId),
  };
});

export const clientSelectActiveBusiness = onCall(async (request) => {
  const businessId = toCleanString(request?.data?.businessId);
  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }

  const userId = await resolveAuthUserId(request);
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const userRef = usersCol.doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Usuario no encontrado');
  }

  const userData = userSnap.data() || {};
  const entries = normalizeMembershipEntries(userData, { includeBusinessName: true });
  const canonicalMembership = await resolveCanonicalMembershipForBusiness({
    userId,
    businessId,
  });

  const selectedMembership = canonicalMembership ||
    assertActiveMembershipForBusiness(
      entries,
      businessId,
      'No tienes acceso activo al negocio seleccionado',
    );

  let nextEntries = entries;
  const cachedEntry = entries.find((entry) => entry?.businessId === businessId) || null;
  const cacheNeedsSync =
    !!canonicalMembership &&
    (
      !cachedEntry ||
      normalizeRole(cachedEntry.role || '') !== normalizeRole(selectedMembership.role || '') ||
      String(cachedEntry.status || 'active').toLowerCase() !==
        String(selectedMembership.status || 'active').toLowerCase()
    );

  if (cacheNeedsSync) {
    nextEntries = upsertAccessControlEntry(entries, {
      businessId,
      role: selectedMembership.role,
      status: selectedMembership.status || 'active',
      businessName: cachedEntry?.businessName || null,
    });
  }

  const activeBusinessIds = getDistinctActiveBusinesses(nextEntries);

  await userRef.set(
    {
      ...(cacheNeedsSync
        ? {
          accessControl: nextEntries,
        }
        : {}),
      lastSelectedBusinessId: businessId,
      activeBusinessId: businessId,
      activeRole: selectedMembership.role,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return {
    ok: true,
    businessId,
    role: selectedMembership.role,
    hasMultipleBusinesses: activeBusinessIds.length > 1,
  };
});

export const clientStartBusinessImpersonation = onCall(async (request) => {
  const targetBusinessId =
    toCleanString(request?.data?.targetBusinessId) ||
    toCleanString(request?.data?.businessId);
  if (!targetBusinessId) {
    throw new HttpsError('invalid-argument', 'targetBusinessId es requerido');
  }

  const userId = await resolveAuthUserId(request);
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const userRef = usersCol.doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Usuario no encontrado');
  }

  const userData = userSnap.data() || {};
  if (!hasDevPrivileges(userData)) {
    throw new HttpsError(
      'permission-denied',
      'Solo usuarios dev pueden iniciar impersonación de negocio',
    );
  }

  const businessSnap = await db.doc(`businesses/${targetBusinessId}`).get();
  if (!businessSnap.exists) {
    throw new HttpsError('not-found', 'Negocio no encontrado');
  }

  const requestContext = buildRawRequestContext(request);
  const activeState = await getActiveDevSimulationState({
    userRef,
    userData,
    userId,
    requestContext,
  });

  let nextUserData = userData;
  if (activeState.expired) {
    const refreshedSnap = await userRef.get();
    nextUserData = refreshedSnap.exists ? refreshedSnap.data() || {} : userData;
  }

  const currentBusinessId = resolveCurrentBusinessId(nextUserData);
  const previousSimulation = resolveDevSimulation(nextUserData);
  const originalBusinessId =
    previousSimulation?.isActive && previousSimulation?.originalBusinessId
      ? previousSimulation.originalBusinessId
      : currentBusinessId;

  if (!originalBusinessId) {
    throw new HttpsError(
      'failed-precondition',
      'No se pudo determinar el negocio original del usuario',
    );
  }

  const ttlMinutes = resolveTtlMinutes(request?.data?.ttlMinutes);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  const expiresAtTimestamp = Timestamp.fromDate(expiresAt);

  const nextSimulation = {
    isActive: true,
    originalBusinessId,
    overrideBusinessId: targetBusinessId,
    startedBy: userId,
    startedAt: previousSimulation?.startedAt || FieldValue.serverTimestamp(),
    ttlMinutes,
    expiresAt: expiresAtTimestamp,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await setUserBusinessContext({
    userRef,
    businessId: targetBusinessId,
    devBusinessSimulation: nextSimulation,
  });

  await writeDevImpersonationAudit({
    userId,
    action: 'start',
    originalBusinessId,
    overrideBusinessId: targetBusinessId,
    ttlMinutes,
    expiresAt: expiresAtTimestamp,
    requestContext,
  });

  return {
    ok: true,
    active: true,
    originalBusinessId,
    overrideBusinessId: targetBusinessId,
    ttlMinutes,
    expiresAtMs: expiresAt.getTime(),
  };
});

export const clientStopBusinessImpersonation = onCall(async (request) => {
  const userId = await resolveAuthUserId(request);
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const userRef = usersCol.doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Usuario no encontrado');
  }

  const userData = userSnap.data() || {};
  if (!hasDevPrivileges(userData)) {
    throw new HttpsError(
      'permission-denied',
      'Solo usuarios dev pueden detener impersonación de negocio',
    );
  }

  const requestContext = buildRawRequestContext(request);
  const activeState = await getActiveDevSimulationState({
    userRef,
    userData,
    userId,
    requestContext,
  });

  if (!activeState.active) {
    const currentBusinessId = resolveCurrentBusinessId(userData);
    return {
      ok: true,
      restored: false,
      active: false,
      expired: activeState.expired === true,
      businessId: currentBusinessId,
    };
  }

  const stopResult = await stopDevImpersonation({
    userRef,
    userId,
    simulation: activeState.simulation,
    reason: 'manual-stop',
    requestContext,
  });

  return {
    ok: true,
    restored: stopResult.restored,
    active: false,
    businessId: stopResult.businessId,
    originalBusinessId: activeState.simulation?.originalBusinessId || null,
    overrideBusinessId: activeState.simulation?.overrideBusinessId || null,
  };
});

export const clientGetBusinessImpersonationStatus = onCall(async (request) => {
  const userId = await resolveAuthUserId(request);
  if (!userId) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const userRef = usersCol.doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Usuario no encontrado');
  }

  const userData = userSnap.data() || {};
  if (!hasDevPrivileges(userData)) {
    throw new HttpsError(
      'permission-denied',
      'Solo usuarios dev pueden consultar estado de impersonación',
    );
  }

  const requestContext = buildRawRequestContext(request);
  const activeState = await getActiveDevSimulationState({
    userRef,
    userData,
    userId,
    requestContext,
  });

  if (!activeState.active) {
    const refreshedSnap =
      activeState.expired === true ? await userRef.get() : userSnap;
    const refreshedUserData =
      refreshedSnap.exists ? refreshedSnap.data() || {} : userData;
    const simulation = resolveDevSimulation(refreshedUserData);
    return {
      ok: true,
      active: false,
      expired: activeState.expired === true,
      currentBusinessId: resolveCurrentBusinessId(refreshedUserData),
      originalBusinessId: simulation?.originalBusinessId || null,
      overrideBusinessId: simulation?.overrideBusinessId || null,
      expiresAtMs: simulation?.expiresAtMs || null,
      ttlMinutes: simulation?.ttlMinutes || null,
    };
  }

  return {
    ok: true,
    active: true,
    currentBusinessId: resolveCurrentBusinessId(userData),
    originalBusinessId: activeState.simulation?.originalBusinessId || null,
    overrideBusinessId: activeState.simulation?.overrideBusinessId || null,
    expiresAtMs: activeState.simulation?.expiresAtMs || null,
    ttlMinutes: activeState.simulation?.ttlMinutes || null,
    remainingMs: activeState.remainingMs || null,
  };
});
