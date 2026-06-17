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
} from '../../../../modules/business/services/businessProvisioning.service.js';
import { resolveCallableAuthUid } from '../../../../core/utils/callableSessionAuth.util.js';
import {
  assertActiveMembershipForBusiness,
  getDistinctActiveBusinesses,
  normalizeMembershipEntries,
  toCleanString,
} from '../utils/membershipContext.util.js';
import { toMillis } from '../utils/sessionAuth.util.js';
import { upsertAccessControlEntry } from '../utils/membershipMirror.util.js';
import {
  assertBusinessAllowsMemberRead,
  assertUserAccountActive,
} from '../utils/accountAccessPolicy.util.js';
import { ensureBusinessOnboardingSubscription } from '../../billing/services/subscriptionSnapshot.service.js';
import { incrementBusinessUsageMetric } from '../../billing/services/usage.service.js';

const USERS_COLLECTION = 'users';
const SESSION_COLLECTION = 'sessionTokens';
const DEV_IMPERSONATION_AUDIT_COLLECTION = 'devBusinessImpersonationAudit';
const BUSINESS_ACCESS_AUDIT_COLLECTION = 'businessAccessAudit';
const BUSINESS_ACCESS_SOURCE = 'clientUpdateBusinessAccess';
const DEV_IMPERSONATION_MIN_TTL_MINUTES = 5;
const DEV_IMPERSONATION_MAX_TTL_MINUTES = 240;
const DEV_IMPERSONATION_DEFAULT_TTL_MINUTES =
  Number(process.env.DEV_BUSINESS_IMPERSONATION_TTL_MINUTES) || 30;
const BUSINESS_ACCESS_BATCH_LIMIT = 400;
const INACTIVE_MEMBERSHIP_STATUSES = new Set([
  'inactive',
  'suspended',
  'revoked',
  'disabled',
]);
const BLOCKING_BUSINESS_ACCESS_STATUSES = new Set([
  'inactive',
  'suspended',
  'offboarded',
  'closed',
  'disabled',
  'blocked',
]);
const READ_ONLY_BUSINESS_ACCESS_STATUSES = new Set(['read_only', 'readonly']);
const ALLOWED_BUSINESS_ACCESS_STATUSES = new Set([
  'active',
  'read_only',
  'suspended',
  'inactive',
  'offboarded',
  'closed',
]);
const BUSINESS_ACCESS_STATUS_LABELS = {
  active: 'Activo',
  read_only: 'Solo lectura',
  suspended: 'Suspendido',
  inactive: 'Inactivo',
  offboarded: 'Offboarding',
  closed: 'Cerrado',
};

const usersCol = db.collection(USERS_COLLECTION);
const sessionsCol = db.collection(SESSION_COLLECTION);
const devImpersonationAuditCol = db.collection(
  DEV_IMPERSONATION_AUDIT_COLLECTION,
);
const businessAccessAuditCol = db.collection(BUSINESS_ACCESS_AUDIT_COLLECTION);

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeBusinessAccessStatus = (value, fallback = 'active') =>
  (toCleanString(value) || fallback).toLowerCase();

const isBlockingBusinessAccessStatus = (status) =>
  BLOCKING_BUSINESS_ACCESS_STATUSES.has(normalizeBusinessAccessStatus(status));

const isReadOnlyBusinessAccessStatus = (status) =>
  READ_ONLY_BUSINESS_ACCESS_STATUSES.has(normalizeBusinessAccessStatus(status));

const resolveBusinessIdFromEntry = (entry) => {
  const record = asRecord(entry);
  const businessNode = asRecord(record.business);
  return (
    toCleanString(record.businessId) ||
    toCleanString(record.businessID) ||
    toCleanString(businessNode.id) ||
    toCleanString(businessNode.businessId) ||
    toCleanString(businessNode.businessID) ||
    null
  );
};

const isActiveMembershipEntry = (entry) => {
  const record = asRecord(entry);
  const status = normalizeBusinessAccessStatus(record.status);
  return !INACTIVE_MEMBERSHIP_STATUSES.has(status) && record.active !== false;
};

const resolveBusinessCurrentAccessStatus = (businessData) => {
  const root = asRecord(businessData);
  const businessNode = asRecord(root.business);
  return normalizeBusinessAccessStatus(
    root.status ||
      root.accessStatus ||
      businessNode.status ||
      businessNode.accessStatus,
  );
};

const buildNextAccessControl = ({
  entries,
  businessId,
  memberActive,
  membershipStatus,
}) => {
  const normalizedEntries = toArray(entries).filter(
    (entry) => entry && typeof entry === 'object' && !Array.isArray(entry),
  );
  let touched = false;

  const nextEntries = normalizedEntries.map((entry) => {
    const entryBusinessId = resolveBusinessIdFromEntry(entry);
    if (entryBusinessId !== businessId) return entry;
    touched = true;
    return {
      ...entry,
      active: memberActive,
      status: membershipStatus,
    };
  });

  return {
    entries: nextEntries,
    touched,
  };
};

const createBatchWriter = () => {
  let batch = db.batch();
  let count = 0;
  let commits = 0;

  const commit = async () => {
    if (!count) return;
    await batch.commit();
    commits += 1;
    batch = db.batch();
    count = 0;
  };

  return {
    set(ref, data, options) {
      batch.set(ref, data, options);
      count += 1;
    },
    delete(ref) {
      batch.delete(ref);
      count += 1;
    },
    async flushIfNeeded() {
      if (count >= BUSINESS_ACCESS_BATCH_LIMIT) {
        await commit();
      }
    },
    async close() {
      await commit();
      return commits;
    },
  };
};

const resolveCanonicalMembershipForBusiness = async ({
  userId,
  businessId,
}) => {
  if (!userId || !businessId) return null;
  const [businessSnap, snap] = await Promise.all([
    db.doc(`businesses/${businessId}`).get(),
    db.doc(`businesses/${businessId}/members/${userId}`).get(),
  ]);
  if (!businessSnap.exists) {
    throw new HttpsError('not-found', 'Negocio no encontrado');
  }
  assertBusinessAllowsMemberRead(businessSnap.data() || {});
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

const resolveAuthUserId = async (request) => {
  return toCleanString(await resolveCallableAuthUid(request));
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
  assertUserAccountActive(userData);
  const entries = normalizeMembershipEntries(userData, {
    includeBusinessName: true,
  });
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
    toCleanString(business.name) || toCleanString(businessNode.name) || null;

  let hasMultipleBusinesses = false;
  let resultingRole = ROLE.OWNER;

  await db.runTransaction(async (tx) => {
    const freshUserSnap = await tx.get(userRef);
    if (!freshUserSnap.exists) {
      throw new HttpsError('not-found', 'Usuario no encontrado');
    }

    const freshUserData = freshUserSnap.data() || {};
    assertUserAccountActive(freshUserData);
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
    subscriptionStatus:
      toCleanString(onboardingSubscription?.status)?.toLowerCase() || null,
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
  assertUserAccountActive(userData);
  const entries = normalizeMembershipEntries(userData, {
    includeBusinessName: true,
  });
  const canonicalMembership = await resolveCanonicalMembershipForBusiness({
    userId,
    businessId,
  });

  const selectedMembership =
    canonicalMembership ||
    assertActiveMembershipForBusiness(
      entries,
      businessId,
      'No tienes acceso activo al negocio seleccionado',
    );

  let nextEntries = entries;
  const cachedEntry =
    entries.find((entry) => entry?.businessId === businessId) || null;
  const cacheNeedsSync =
    !!canonicalMembership &&
    (!cachedEntry ||
      normalizeRole(cachedEntry.role || '') !==
        normalizeRole(selectedMembership.role || '') ||
      String(cachedEntry.status || 'active').toLowerCase() !==
        String(selectedMembership.status || 'active').toLowerCase());

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

export const clientUpdateBusinessAccess = onCall(async (request) => {
  const payload = asRecord(request?.data);
  const businessId = toCleanString(payload.businessId);
  const status = normalizeBusinessAccessStatus(payload.status, 'suspended');
  const reason =
    toCleanString(payload.reason) || 'developer-business-access-update';

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido');
  }
  if (!ALLOWED_BUSINESS_ACCESS_STATUSES.has(status)) {
    throw new HttpsError(
      'invalid-argument',
      `Estado invalido. Usa uno de: ${Array.from(
        ALLOWED_BUSINESS_ACCESS_STATUSES,
      ).join(', ')}`,
    );
  }

  const actorUserId = await resolveAuthUserId(request);
  if (!actorUserId) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const actorSnap = await usersCol.doc(actorUserId).get();
  if (!actorSnap.exists) {
    throw new HttpsError('not-found', 'Usuario actor no encontrado');
  }
  const actorData = actorSnap.data() || {};
  if (!hasDevPrivileges(actorData)) {
    throw new HttpsError(
      'permission-denied',
      'Solo un usuario dev puede cambiar el acceso completo de un negocio',
    );
  }

  const businessRef = db.doc(`businesses/${businessId}`);
  const businessSnap = await businessRef.get();
  if (!businessSnap.exists) {
    throw new HttpsError('not-found', 'Negocio no encontrado');
  }

  const currentStatus = resolveBusinessCurrentAccessStatus(
    businessSnap.data() || {},
  );
  const blocksLogin = isBlockingBusinessAccessStatus(status);
  const readOnly = isReadOnlyBusinessAccessStatus(status);
  const memberActive = !blocksLogin;
  const membershipStatus = blocksLogin ? 'suspended' : 'active';
  const now = FieldValue.serverTimestamp();
  const membersSnap = await businessRef.collection('members').get();
  const stats = {
    membersFound: membersSnap.size,
    membersUpdated: 0,
    usersUpdated: 0,
    usersDeactivated: 0,
    usersReactivated: 0,
    sessionsRevoked: 0,
  };
  const writer = createBatchWriter();

  writer.set(
    businessRef,
    {
      status,
      accessStatus: status,
      accessPolicy: {
        readAllowed: !blocksLogin,
        writeAllowed: status === 'active',
        loginBlocked: blocksLogin,
        readOnly,
        updatedAt: now,
        updatedBy: actorUserId,
        reason,
      },
      updatedAt: now,
      accessStatusUpdatedAt: now,
      accessStatusUpdatedBy: actorUserId,
      accessStatusReason: reason,
      ...(blocksLogin
        ? {
            suspendedAt: now,
            suspendedBy: actorUserId,
            suspendedReason: reason,
          }
        : status === 'active'
          ? {
              reactivatedAt: now,
              reactivatedBy: actorUserId,
              reactivatedReason: reason,
            }
          : {
              readOnlyAt: now,
              readOnlyBy: actorUserId,
              readOnlyReason: reason,
            }),
    },
    { merge: true },
  );
  await writer.flushIfNeeded();

  for (const memberDoc of membersSnap.docs) {
    const targetUserId = memberDoc.id;
    const memberData = memberDoc.data() || {};
    const targetRole =
      toCleanString(memberData.role) ||
      toCleanString(memberData.activeRole) ||
      null;
    const userRef = usersCol.doc(targetUserId);
    const [userSnap, sessionsSnap] = await Promise.all([
      userRef.get(),
      blocksLogin
        ? sessionsCol.where('userId', '==', targetUserId).get()
        : Promise.resolve({ docs: [] }),
    ]);

    stats.membersUpdated += 1;
    writer.set(
      memberDoc.ref,
      {
        active: memberActive,
        status: membershipStatus,
        updatedAt: now,
        ...(blocksLogin
          ? {
              suspendedAt: now,
              suspendedBy: actorUserId,
              suspendedReason: reason,
            }
          : status === 'active'
            ? {
                reactivatedAt: now,
                reactivatedBy: actorUserId,
                reactivatedReason: reason,
              }
            : {
                readOnlyAt: now,
                readOnlyBy: actorUserId,
                readOnlyReason: reason,
              }),
      },
      { merge: true },
    );
    await writer.flushIfNeeded();

    if (userSnap.exists) {
      const userData = userSnap.data() || {};
      const accessControlResult = buildNextAccessControl({
        entries: userData.accessControl,
        businessId,
        memberActive,
        membershipStatus,
      });
      const remainingActiveEntries = accessControlResult.entries.filter(
        (entry) =>
          resolveBusinessIdFromEntry(entry) !== businessId &&
          isActiveMembershipEntry(entry),
      );
      const fallbackBusiness = remainingActiveEntries[0] || null;
      const userPatch = {
        updatedAt: now,
      };

      if (accessControlResult.touched) {
        userPatch.accessControl = accessControlResult.entries;
      }

      if (blocksLogin) {
        if (!hasDevPrivileges(userData) && !remainingActiveEntries.length) {
          userPatch.active = false;
          userPatch.activeBusinessId = null;
          userPatch.lastSelectedBusinessId = null;
          userPatch.activeRole = null;
          userPatch.deactivatedAt = now;
          userPatch.deactivatedBy = actorUserId;
          userPatch.deactivatedSource = BUSINESS_ACCESS_SOURCE;
          userPatch.deactivatedReason = reason;
          stats.usersDeactivated += 1;
        } else if (toCleanString(userData.activeBusinessId) === businessId) {
          const fallbackBusinessId =
            resolveBusinessIdFromEntry(fallbackBusiness);
          userPatch.activeBusinessId = fallbackBusinessId;
          userPatch.lastSelectedBusinessId = fallbackBusinessId;
          userPatch.activeRole =
            toCleanString(asRecord(fallbackBusiness).role) || null;
        }
      } else if (
        userData.active === false &&
        !hasDevPrivileges(userData) &&
        (userData.deactivatedSource === BUSINESS_ACCESS_SOURCE ||
          userData.deactivatedBy === BUSINESS_ACCESS_SOURCE ||
          userData.deactivatedBy === 'suspendBusinessAccess')
      ) {
        userPatch.active = true;
        userPatch.activeBusinessId =
          toCleanString(userData.activeBusinessId) || businessId;
        userPatch.lastSelectedBusinessId = userPatch.activeBusinessId;
        userPatch.activeRole =
          normalizeRole(
            targetRole || userData.activeRole || userData.role || '',
          ) || null;
        userPatch.reactivatedAt = now;
        userPatch.reactivatedBy = actorUserId;
        userPatch.reactivatedSource = BUSINESS_ACCESS_SOURCE;
        userPatch.reactivatedReason = reason;
        stats.usersReactivated += 1;
      }

      if (Object.keys(userPatch).length > 1) {
        stats.usersUpdated += 1;
        writer.set(userRef, userPatch, { merge: true });
        await writer.flushIfNeeded();
      }
    }

    if (blocksLogin) {
      stats.sessionsRevoked += sessionsSnap.docs.length;
      for (const sessionDoc of sessionsSnap.docs) {
        writer.delete(sessionDoc.ref);
        await writer.flushIfNeeded();
      }
    }
  }

  const batchesCommitted = await writer.close();
  await businessAccessAuditCol.add({
    businessId,
    actorUserId,
    status,
    previousStatus: currentStatus,
    reason,
    source: BUSINESS_ACCESS_SOURCE,
    stats: {
      ...stats,
      batchesCommitted,
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    ok: true,
    businessId,
    status,
    previousStatus: currentStatus,
    statusLabel: BUSINESS_ACCESS_STATUS_LABELS[status] || status,
    stats: {
      ...stats,
      batchesCommitted,
    },
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
    const refreshedUserData = refreshedSnap.exists
      ? refreshedSnap.data() || {}
      : userData;
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
