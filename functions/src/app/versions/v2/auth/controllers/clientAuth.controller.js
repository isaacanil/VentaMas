import bcrypt from 'bcryptjs';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import {
  admin,
  db,
  Timestamp,
  FieldValue,
} from '../../../../core/config/firebase.js';
import {
  ROLE,
  normalizeRole,
} from '../../../../core/constants/roles.constants.js';
import { MAIL_SECRETS } from '../../../../core/config/secrets.js';
import {
  assertMembershipWritePolicy,
  resolveMembershipWritePolicy,
} from '../utils/membershipWritePolicy.util.js';
import {
  assertBusinessCreationLimit,
  provisionBusinessCoreInTransaction,
  runBusinessPostProvisioning,
} from '../../../../modules/business/functions/createBusiness.js';
import { LIMIT_OPERATION_KEYS } from '../../billing/config/limitOperations.config.js';
import { incrementBusinessUsageMetric } from '../../billing/services/usage.service.js';
import { assertBusinessSubscriptionAccess } from '../../billing/utils/subscriptionAccess.util.js';

const USERS_COLLECTION = 'users';
const SESSION_COLLECTION = 'sessionTokens';
const SESSION_LOG_COLLECTION = 'sessionLogs';

const SESSION_DURATION_MS =
  Number(process.env.CLIENT_AUTH_SESSION_DURATION_MS) ||
  60 * 24 * 60 * 60 * 1000; // 60 días
const TOKEN_CLEANUP_MS =
  Number(process.env.CLIENT_AUTH_TOKEN_CLEANUP_MS) || 60 * 24 * 60 * 60 * 1000; // 60 días
const SESSION_IDLE_TIMEOUT_MS =
  Number(process.env.CLIENT_AUTH_MAX_IDLE_MS) || SESSION_DURATION_MS;
const MAX_LOGIN_ATTEMPTS = Number(process.env.CLIENT_AUTH_MAX_ATTEMPTS) || 5;
const LOCK_DURATION_MS =
  Number(process.env.CLIENT_AUTH_LOCK_MS) || 2 * 60 * 60 * 1000; // 2 horas
const MAX_ACTIVE_SESSIONS =
  Number(process.env.CLIENT_AUTH_MAX_ACTIVE_SESSIONS) || 10;
const MAX_PARALLEL_ACTIVE_SESSIONS = Math.max(
  5,
  Number(process.env.CLIENT_AUTH_MAX_PARALLEL_SESSIONS) || 5,
);
const SESSION_EXTENSION_MS =
  Number(process.env.CLIENT_AUTH_SESSION_EXTENSION_MS) || SESSION_DURATION_MS;
const DISABLE_SESSION_EXPIRY =
  String(process.env.CLIENT_AUTH_DISABLE_SESSION_EXPIRY || '').toLowerCase() ===
  'true';
const ALLOW_PUBLIC_SIGNUP =
  String(process.env.ALLOW_PUBLIC_SIGNUP || '').toLowerCase() === 'true';
const ALLOW_PUBLIC_SIGNUP_LOCALHOST =
  String(process.env.ALLOW_PUBLIC_SIGNUP_LOCALHOST || 'true').toLowerCase() ===
  'true';

const CLIENT_AUTH_CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'https://ventamaxpos-staging.web.app',
  'https://ventamaxpos.web.app',
  'https://ventamax.web.app',
  'https://ventamax.vercel.app',
];
const LOCALHOST_SIGNUP_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
]);
const usersCol = db.collection(USERS_COLLECTION);
const sessionsCol = db.collection(SESSION_COLLECTION);
const sessionLogsCol = db.collection(SESSION_LOG_COLLECTION);

const PRIVILEGED_SESSION_LOG_ROLES = ['admin', 'dev', 'owner'];
const MAX_SESSION_LOG_LIMIT =
  Number(process.env.CLIENT_AUTH_SESSION_LOG_LIMIT) || 200;
const SESSION_LOG_WHITELIST = new Set(['login', 'logout']);
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const ROLE_SWITCH_ALLOWED_ROLES = new Set(Object.values(ROLE));
const ROLE_SWITCH_SOURCE = 'client-switch-user-role';

const normalizeName = (name) => (typeof name === 'string' ? name.trim() : '');
const toCleanString = (value) =>
  typeof value === 'string' && value.trim().length ? value.trim() : null;
const resolveRequestOrigin = (request) =>
  toCleanString(request?.rawRequest?.headers?.origin)?.toLowerCase() || null;
const canUsePublicSignup = (request) => {
  if (ALLOW_PUBLIC_SIGNUP) return true;
  if (!ALLOW_PUBLIC_SIGNUP_LOCALHOST) return false;
  const origin = resolveRequestOrigin(request);
  if (!origin) return false;
  return LOCALHOST_SIGNUP_ORIGINS.has(origin);
};
const normalizeProviderId = (providerId) =>
  typeof providerId === 'string' ? providerId.trim().toLowerCase() : '';
const resolveProviderKey = (providerId) => {
  const normalized = normalizeProviderId(providerId);
  if (!normalized) return '';
  return normalized.endsWith('.com') ? normalized.slice(0, -4) : normalized;
};
const normalizeArray = (value) => (Array.isArray(value) ? value : []);
const isPlainObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value);
const resolveProviders = (providers) => normalizeArray(providers);
const hasPlatformDevRoleFromUserData = (userData = {}) => {
  const root = isPlainObject(userData) ? userData : {};
  const rootPlatform = isPlainObject(root.platformRoles)
    ? root.platformRoles
    : {};

  return rootPlatform.dev === true;
};

const resolvePrivilegedRoleFromUserData = (userData = {}) => {
  if (hasPlatformDevRoleFromUserData(userData)) {
    return ROLE.DEV;
  }

  const root = isPlainObject(userData) ? userData : {};
  return normalizeRole(root.activeRole || root.role || '');
};
const buildLegacyUserPayload = (payload, userId) => {
  const root = payload || {};
  const activeBusinessId =
    root.activeBusinessId ??
    root.lastSelectedBusinessId ??
    null;
  const resolvedRole =
    root.activeRole ??
    root.role ??
    null;
  return {
    id: root.id || userId,
    name: root.name ?? null,
    displayName: root.displayName ?? null,
    realName: root.realName ?? null,
    businessID:
      root.businessID ??
      root.businessId ??
      activeBusinessId,
    businessId:
      root.businessId ??
      root.businessID ??
      activeBusinessId,
    activeBusinessId,
    role: resolvedRole,
    activeRole: resolvedRole,
    number: root.number ?? null,
    active: root.active ?? true,
    password: root.password ?? null,
    loginAttempts: root.loginAttempts ?? 0,
    lockUntil: root.lockUntil ?? null,
    passwordChangedAt:
      root.passwordChangedAt ?? null,
    email: root.email ?? null,
    emailVerified: root.emailVerified ?? false,
    phoneNumber: root.phoneNumber ?? null,
    phoneNumberE164: root.phoneNumberE164 ?? null,
    phoneVerified: root.phoneVerified ?? false,
    providers: resolveProviders(root.providers),
    photoURL: root.photoURL ?? null,
  };
};

const normalizeBusinessEntries = (value) =>
  normalizeArray(value).filter((entry) => isPlainObject(entry));

const collectBusinessIdsFromEntries = (entries) => {
  const ids = [];
  for (const entry of normalizeBusinessEntries(entries)) {
    const businessNode = isPlainObject(entry.business) ? entry.business : {};
    ids.push(
      toCleanString(entry.businessId),
      toCleanString(entry.businessID),
      toCleanString(businessNode.id),
      toCleanString(businessNode.businessId),
      toCleanString(businessNode.businessID),
    );
  }
  return ids.filter(Boolean);
};

const extractUserBusinessIds = (userData = {}) => {
  const root = isPlainObject(userData) ? userData : {};

  const ids = [
    toCleanString(root.activeBusinessId),
    toCleanString(root.lastSelectedBusinessId),
    toCleanString(root.defaultBusinessId),
    ...collectBusinessIdsFromEntries(root.accessControl),
    ...collectBusinessIdsFromEntries(root.availableBusinesses),
  ];

  return [...new Set(ids.filter(Boolean))];
};

const hasBusinessAccess = (userData, businessId) => {
  const resolvedBusinessId = toCleanString(businessId);
  if (!resolvedBusinessId) return false;
  return extractUserBusinessIds(userData).includes(resolvedBusinessId);
};

const resolveCurrentRoleFromUserData = (userData = {}) => {
  if (hasPlatformDevRoleFromUserData(userData)) {
    return ROLE.DEV;
  }

  const root = isPlainObject(userData) ? userData : {};
  return (
    normalizeRole(root.activeRole || root.role || '') || ROLE.CASHIER
  );
};

const resolveActiveBusinessIdFromUserData = (userData = {}) => {
  const root = isPlainObject(userData) ? userData : {};

  return (
    toCleanString(root.activeBusinessId) ||
    toCleanString(root.lastSelectedBusinessId) ||
    null
  );
};

const resolveBusinessIdFromEntry = (entry) => {
  if (!isPlainObject(entry)) return null;
  const businessNode = isPlainObject(entry.business) ? entry.business : {};
  return (
    toCleanString(entry.businessId) ||
    toCleanString(entry.businessID) ||
    toCleanString(businessNode.id) ||
    toCleanString(businessNode.businessId) ||
    toCleanString(businessNode.businessID) ||
    null
  );
};

const updateBusinessRoleEntries = (
  entries,
  businessId,
  userId,
  targetRole,
  {
    ensureEntry = false,
    membership = false,
  } = {},
) => {
  const resolvedBusinessId = toCleanString(businessId);
  if (!resolvedBusinessId) {
    return normalizeArray(entries).filter((entry) => isPlainObject(entry));
  }

  const normalizedEntries = normalizeArray(entries).filter((entry) =>
    isPlainObject(entry),
  );

  let found = false;
  const updated = normalizedEntries.map((entry) => {
    const entryBusinessId = resolveBusinessIdFromEntry(entry);
    if (entryBusinessId !== resolvedBusinessId) return entry;

    found = true;
    return {
      ...entry,
      role: targetRole,
      ...(entry.activeRole != null || membership ? { activeRole: targetRole } : {}),
      ...(entry.businessId != null ? { businessId: resolvedBusinessId } : {}),
      ...(entry.businessID != null ? { businessID: resolvedBusinessId } : {}),
    };
  });

  if (!found && ensureEntry) {
    if (membership) {
      updated.push({
        uid: userId,
        userId,
        businessId: resolvedBusinessId,
        role: targetRole,
        activeRole: targetRole,
        status: 'active',
        source: ROLE_SWITCH_SOURCE,
      });
    } else {
      updated.push({
        businessId: resolvedBusinessId,
        role: targetRole,
        status: 'active',
      });
    }
  }

  return updated;
};

const resolveRoleSwitchActor = async (request, action = 'role-switch') => {
  const { data = {}, auth } = request || {};
  const sessionToken = data?.sessionToken || null;

  let userId = null;
  if (sessionToken) {
    const sessionSnap = await ensureActiveSession(sessionToken, {
      eventContext: { action },
    });
    userId = sessionSnap.get('userId');
  } else if (auth?.uid) {
    userId = auth.uid;
  }

  const resolvedUserId = toCleanString(userId);
  if (!resolvedUserId) {
    throw new HttpsError('permission-denied', 'Usuario no autenticado.');
  }

  const actorSnap = await ensureUserExists(resolvedUserId);
  return {
    userId: resolvedUserId,
    actorSnap,
  };
};

const INACTIVE_MEMBER_STATUSES = new Set([
  'inactive',
  'suspended',
  'revoked',
  'disabled',
]);

const isUserBusinessOwner = async (businessId, userId) => {
  const resolvedBusinessId = toCleanString(businessId);
  const resolvedUserId = toCleanString(userId);
  if (!resolvedBusinessId || !resolvedUserId) return false;

  const businessRef = db.doc(`businesses/${resolvedBusinessId}`);
  const businessSnap = await businessRef.get();
  if (!businessSnap.exists) return false;

  const ownerUid = toCleanString(businessSnap.get('ownerUid'));
  if (ownerUid) return ownerUid === resolvedUserId;

  const owners = normalizeArray(businessSnap.get('owners'))
    .map((entry) => toCleanString(entry))
    .filter(Boolean);
  if (owners.includes(resolvedUserId)) return true;

  const ownerMemberSnap = await businessRef
    .collection('members')
    .doc(resolvedUserId)
    .get();
  if (!ownerMemberSnap.exists) return false;

  const ownerRole = normalizeRole(ownerMemberSnap.get('role') || '');
  if (ownerRole !== ROLE.OWNER) return false;

  const status = String(ownerMemberSnap.get('status') || 'active').toLowerCase();
  return !INACTIVE_MEMBER_STATUSES.has(status);
};

const getNextUserNumber = async (businessID) => {
  if (!businessID) {
    throw new HttpsError(
      'invalid-argument',
      'Error: Es obligatorio proporcionar un ID de negocio.',
    );
  }

  const counterRef = db.doc(`businesses/${businessID}/counters/users`);

  return db.runTransaction(async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    const currentValue =
      counterSnap.exists && typeof counterSnap.get('value') === 'number'
        ? counterSnap.get('value')
        : 0;
    const updatedValue = currentValue + 1;

    transaction.set(
      counterRef,
      {
        value: updatedValue,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return updatedValue;
  });
};

async function findUserByName(name) {
  const query = await usersCol.where('name', '==', name).limit(1).get();
  if (query.empty) {
    throw new HttpsError('not-found', 'Error: No se encontró el usuario');
  }
  return query.docs[0];
}

async function findUserByEmail(email) {
  if (!email) return null;
  const query = await usersCol
    .where('email', '==', email)
    .limit(1)
    .get();
  if (!query.empty) {
    return query.docs[0];
  }
  return null;
}

async function ensureUserExists(userId) {
  if (!userId) {
    throw new HttpsError('invalid-argument', 'ID de usuario requerido');
  }
  const ref = usersCol.doc(userId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Usuario no encontrado');
  }
  return snap;
}

async function assertAdminAccess(request, action = 'admin-access') {
  const { data = {}, auth } = request || {};
  const sessionToken = data?.sessionToken || null;

  const PRIVILEGED_ROLES = [ROLE.ADMIN, ROLE.OWNER, ROLE.DEV];

  let userId = null;
  if (sessionToken) {
    try {
      const snap = await ensureActiveSession(sessionToken, {
        eventContext: { action },
      });
      userId = snap.get('userId');
    } catch {
      throw new HttpsError(
        'permission-denied',
        'Acceso denegado: Se requieren permisos de administrador',
      );
    }
  } else if (auth?.uid) {
    userId = auth.uid;
  }

  if (!userId) {
    throw new HttpsError(
      'permission-denied',
      'Acceso denegado: Se requieren permisos de administrador',
    );
  }

  let adminSnap;
  try {
    adminSnap = await ensureUserExists(userId);
  } catch {
    throw new HttpsError(
      'permission-denied',
      'Acceso denegado: Se requieren permisos de administrador',
    );
  }

  const resolvedRole = resolvePrivilegedRoleFromUserData(
    adminSnap.data() || {},
  );
  if (!PRIVILEGED_ROLES.includes(resolvedRole)) {
    throw new HttpsError(
      'permission-denied',
      'Acceso denegado: Se requieren permisos de administrador',
    );
  }

  return { userId, adminSnap, role: resolvedRole };
}

async function cleanupOldTokens(userId, keepTokenId = null) {
  if (DISABLE_SESSION_EXPIRY) return;
  const snapshot = await sessionsCol.where('userId', '==', userId).get();
  if (snapshot.empty) return;

  const threshold = Timestamp.fromMillis(Date.now() - TOKEN_CLEANUP_MS);
  const now = Date.now();
  const deletions = snapshot.docs
    .filter((doc) => {
      if (keepTokenId && doc.id === keepTokenId) return false;
      const expiresAt = doc.get('expiresAt');
      if (!expiresAt) return true;
      try {
        const expiresMillis = expiresAt.toMillis
          ? expiresAt.toMillis()
          : Number(expiresAt);
        if (!Number.isFinite(expiresMillis)) {
          return true;
        }
        return expiresMillis < threshold.toMillis() || expiresMillis <= now;
      } catch {
        return true;
      }
    })
    .map((doc) => doc.ref.delete());

  if (deletions.length) {
    await Promise.allSettled(deletions);
  }
}

const toMillis = (value) => {
  if (!value) return null;
  if (typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const buildSessionPayload = (doc) => {
  if (!doc?.exists) return null;
  const data = doc.data() || {};
  return {
    id: doc.id,
    userId: data.userId,
    deviceId: data.deviceId || null,
    deviceLabel: data.deviceLabel || null,
    userAgent: data.userAgent || null,
    ipAddress: data.ipAddress || null,
    status: data.status || 'active',
    createdAt: toMillis(data.createdAt),
    lastActivity: toMillis(data.lastActivity),
    expiresAt: toMillis(data.expiresAt),
    metadata: data.metadata || null,
  };
};

const buildSessionLogPayload = (doc) => {
  if (!doc?.exists) return null;
  const data = doc.data() || {};
  return {
    id: doc.id,
    userId: data.userId || null,
    sessionId: data.sessionId || null,
    event: data.event || null,
    context:
      typeof data.context === 'object' && data.context !== null
        ? data.context
        : {},
    createdAt: toMillis(data.createdAt),
  };
};

const resolveBusinessHasOwners = async (businessId) => {
  if (!businessId) return false;
  const snap = await db.doc(`businesses/${businessId}`).get();
  if (!snap.exists) return false;
  const ownerUid = toCleanString(snap.get('ownerUid'));
  if (ownerUid) return true;

  const owners = snap.get('owners');
  if (Array.isArray(owners) && owners.length > 0) return true;

  const ownerMembersSnap = await db
    .collection(`businesses/${businessId}/members`)
    .where('role', '==', ROLE.OWNER)
    .limit(20)
    .get();

  return ownerMembersSnap.docs.some((doc) => {
    const status = String(doc.get('status') || 'active').toLowerCase();
    return !['inactive', 'suspended', 'revoked', 'disabled'].includes(status);
  });
};

async function assertCanViewSessionLogs(actorUserId, targetUserId) {
  if (!actorUserId || !targetUserId) {
    throw new HttpsError('invalid-argument', 'ID de usuario requerido');
  }
  if (actorUserId === targetUserId) {
    return;
  }

  const actorSnap = await ensureUserExists(actorUserId);
  const actorData = actorSnap.data() || {};
  const actorRole = (resolvePrivilegedRoleFromUserData(actorData) || '')
    .toLowerCase();

  if (!PRIVILEGED_SESSION_LOG_ROLES.includes(actorRole)) {
    throw new HttpsError(
      'permission-denied',
      'No tienes permiso para consultar los registros de sesiones de otros usuarios.',
    );
  }

  await ensureUserExists(targetUserId);
}

async function logSessionEvent({ userId, sessionId, event, context = {} }) {
  if (!userId || !sessionId || !event) return;
  if (!SESSION_LOG_WHITELIST.has(event)) return;
  try {
    await sessionLogsCol.add({
      userId,
      sessionId,
      event,
      context,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('session log error:', error);
  }
}

async function updateUserPresence(userId, status) {
  if (!userId) return;
  try {
    await usersCol.doc(userId).set(
      {
        presence: {
          status,
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
    );
  } catch (error) {
    console.error('presence update error:', error);
  }
}

async function terminateSession(docSnap, event = 'revoked', context = {}) {
  if (!docSnap?.exists) return;
  const userId = docSnap.get('userId');
  const sessionId = docSnap.id;
  const data = docSnap.data() || {};
  const baseActor = {
    id: userId,
    displayName: data.userDisplayName || data.userRealName || null,
    username: data.username || null,
  };
  const mergedContext =
    context && typeof context === 'object' && !Array.isArray(context)
      ? { ...context }
      : {};

  const metadataFromDoc =
    data.metadata &&
    typeof data.metadata === 'object' &&
    !Array.isArray(data.metadata)
      ? data.metadata
      : {};
  const metadataFromContext =
    mergedContext.metadata &&
    typeof mergedContext.metadata === 'object' &&
    !Array.isArray(mergedContext.metadata)
      ? mergedContext.metadata
      : {};

  const combinedMetadata = { ...metadataFromDoc, ...metadataFromContext };
  if (Object.keys(combinedMetadata).length) {
    mergedContext.metadata = combinedMetadata;
  }

  const ensureContextField = (field, value) => {
    if (value === undefined || value === null || value === '') return;
    if (
      mergedContext[field] === undefined ||
      mergedContext[field] === null ||
      mergedContext[field] === ''
    ) {
      mergedContext[field] = value;
    }
  };

  ensureContextField('deviceId', data.deviceId || combinedMetadata.deviceId);
  ensureContextField(
    'deviceLabel',
    data.deviceLabel || combinedMetadata.deviceLabel || combinedMetadata.label,
  );
  ensureContextField(
    'label',
    data.deviceLabel || combinedMetadata.label || combinedMetadata.deviceLabel,
  );
  ensureContextField('platform', data.platform || combinedMetadata.platform);
  ensureContextField('userAgent', data.userAgent || combinedMetadata.userAgent);
  ensureContextField('ipAddress', data.ipAddress || combinedMetadata.ipAddress);
  if (!mergedContext.actor || typeof mergedContext.actor !== 'object') {
    mergedContext.actor = baseActor;
  } else {
    mergedContext.actor = {
      id: mergedContext.actor.id || baseActor.id,
      displayName: mergedContext.actor.displayName || baseActor.displayName,
      username: mergedContext.actor.username || baseActor.username,
    };
  }
  try {
    await docSnap.ref.delete();
    await logSessionEvent({ userId, sessionId, event, context: mergedContext });
  } catch (error) {
    console.error(`terminate session error (${sessionId}):`, error);
  }
}

async function enforceSessionLimit(
  userDocId,
  {
    allowSessions = MAX_ACTIVE_SESSIONS,
    skipTokenId = null,
    reason = 'max-sessions-exceeded',
  } = {},
) {
  if (!allowSessions || allowSessions < 1) return;
  const snapshot = await sessionsCol.where('userId', '==', userDocId).get();
  if (snapshot.empty) return;

  const now = Date.now();
  const revocations = [];
  const active = [];

  snapshot.docs.forEach((doc) => {
    if (skipTokenId && doc.id === skipTokenId) {
      return;
    }
    const data = doc.data() || {};
    const expiresAtMs = toMillis(data.expiresAt);
    const lastActivityMs = toMillis(data.lastActivity);
    const expired = !expiresAtMs || expiresAtMs <= now;
    const idleTooLong =
      SESSION_IDLE_TIMEOUT_MS > 0 &&
      lastActivityMs &&
      now - lastActivityMs > SESSION_IDLE_TIMEOUT_MS;

    if (expired || idleTooLong) {
      revocations.push(
        terminateSession(doc, expired ? 'expired' : 'idle-timeout', {
          reason: 'stale-session',
        }),
      );
    } else {
      active.push(doc);
    }
  });

  if (revocations.length) {
    await Promise.allSettled(revocations);
  }

  active.sort((a, b) => {
    const createdA = toMillis((a.data() || {}).createdAt) || 0;
    const createdB = toMillis((b.data() || {}).createdAt) || 0;
    return createdA - createdB;
  });

  const maxAllowedBeforeNew = allowSessions - 1;
  const overflowCount =
    maxAllowedBeforeNew >= 0
      ? active.length - maxAllowedBeforeNew
      : active.length;
  if (overflowCount <= 0) return;

  const toRevoke = active.slice(0, overflowCount);
  await Promise.allSettled(
    toRevoke.map((doc) =>
      terminateSession(doc, 'auto-revoked', {
        reason,
      }),
    ),
  );
}

async function getActiveSessions(userId) {
  if (!userId) return [];
  const snapshot = await sessionsCol.where('userId', '==', userId).get();
  if (snapshot.empty) return [];

  const now = Date.now();
  return snapshot.docs
    .map((doc) => buildSessionPayload(doc))
    .filter(
      (session) => session && session.expiresAt && session.expiresAt > now,
    );
}

async function revokeAllUserSessions(userId, reason = 'password-changed') {
  if (!userId) return { revoked: 0 };
  const snapshot = await sessionsCol.where('userId', '==', userId).get();
  if (snapshot.empty) return { revoked: 0 };

  const revocations = snapshot.docs.map((doc) =>
    terminateSession(doc, 'revoked', { reason }),
  );
  await Promise.allSettled(revocations);

  await updateUserPresence(userId, 'offline');

  return { revoked: snapshot.docs.length };
}

async function syncUserPresence(userId) {
  const sessions = await getActiveSessions(userId);
  await updateUserPresence(userId, sessions.length ? 'online' : 'offline');
  return sessions;
}

const extractRequestInfo = ({ data = {}, rawRequest } = {}) => {
  const sessionInfo = data.sessionInfo || {};
  const headers = rawRequest?.headers || {};
  const ip =
    sessionInfo.ipAddress ||
    rawRequest?.ip ||
    headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    null;

  return {
    deviceId: sessionInfo.deviceId || null,
    deviceLabel: sessionInfo.deviceLabel || sessionInfo.label || null,
    userAgent: sessionInfo.userAgent || headers['user-agent'] || null,
    platform: sessionInfo.platform || null,
    ipAddress: ip,
    metadata: sessionInfo.metadata || null,
  };
};

async function ensureActiveSession(tokenId, { eventContext = {} } = {}) {
  if (!tokenId) {
    throw new HttpsError('invalid-argument', 'Token de sesión requerido');
  }

  const snap = await sessionsCol.doc(tokenId).get();
  if (!snap.exists) {
    throw new HttpsError('unauthenticated', 'Sesión no encontrada');
  }

  const now = Date.now();
  const data = snap.data() || {};
  const expiresAtMs = toMillis(data.expiresAt);
  if (!DISABLE_SESSION_EXPIRY) {
    if (!expiresAtMs || expiresAtMs <= now) {
      await terminateSession(snap, 'expired', eventContext);
      await updateUserPresence(data.userId, 'offline');
      throw new HttpsError('unauthenticated', 'La sesión ha expirado');
    }

    if (SESSION_IDLE_TIMEOUT_MS > 0) {
      const lastActivityMs = toMillis(data.lastActivity);
      if (lastActivityMs && now - lastActivityMs > SESSION_IDLE_TIMEOUT_MS) {
        await terminateSession(snap, 'idle-timeout', eventContext);
        await updateUserPresence(data.userId, 'offline');
        throw new HttpsError(
          'unauthenticated',
          'Sesión cerrada por inactividad',
        );
      }
    }
  }

  return snap;
}

async function createSessionToken(
  userDocId,
  sessionInfo = {},
  userProfile = {},
) {
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + SESSION_DURATION_MS);
  const tokenId = nanoid(32);

  await cleanupOldTokens(userDocId, tokenId);

  const payload = {
    userId: userDocId,
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
    lastActivity: FieldValue.serverTimestamp(),
    status: 'active',
  };

  if (sessionInfo.deviceId) payload.deviceId = sessionInfo.deviceId;
  if (sessionInfo.deviceLabel) payload.deviceLabel = sessionInfo.deviceLabel;
  if (sessionInfo.userAgent) payload.userAgent = sessionInfo.userAgent;
  if (sessionInfo.ipAddress) payload.ipAddress = sessionInfo.ipAddress;
  if (sessionInfo.platform) payload.platform = sessionInfo.platform;
  if (sessionInfo.metadata) payload.metadata = sessionInfo.metadata;
  const { displayName, username, realName } = userProfile || {};
  if (displayName) payload.userDisplayName = displayName;
  if (username) payload.username = username;
  if (realName) payload.userRealName = realName;

  await sessionsCol.doc(tokenId).set(payload);

  return { tokenId, expiresAt, payload };
}

function assertPassword(password, { requireComplexity = true } = {}) {
  if (!password) {
    throw new HttpsError('invalid-argument', 'Contraseña requerida');
  }
  if (requireComplexity && !PASSWORD_REGEX.test(password)) {
    throw new HttpsError(
      'invalid-argument',
      'La contraseña debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas y números.',
    );
  }
}

async function ensureUniqueUsername(name, excludeId = null) {
  const query = await usersCol.where('name', '==', name).get();
  if (query.empty) return;

  const hasOther = query.docs.some((doc) => doc.id !== excludeId);
  if (hasOther) {
    throw new HttpsError(
      'already-exists',
      'Error: Ya existe un usuario con este nombre.',
    );
  }
}

export const clientPublicSignUp = onCall(
  { cors: CLIENT_AUTH_CORS_ORIGINS },
  async (request) => {
  if (!canUsePublicSignup(request)) {
    throw new HttpsError(
      'permission-denied',
      'El registro público no está habilitado. Contacte a soporte.',
    );
  }

  const { data = {} } = request || {};
  const sessionInfo = extractRequestInfo(request);
  const rawEmail = toCleanString(data.email);
  const rawName = normalizeName(data.name || rawEmail || '');
  const rawRealName = normalizeName(data.realName || data.displayName || '');
  const password = data.password;

  if (!rawEmail) {
    throw new HttpsError('invalid-argument', 'Email requerido');
  }
  if (!String(rawEmail).includes('@')) {
    throw new HttpsError('invalid-argument', 'Email inválido');
  }

  assertPassword(password);

  const name = rawName.toLowerCase();
  const email = rawEmail.toLowerCase();

  const existingUserByEmail = await findUserByEmail(email);
  if (existingUserByEmail) {
    throw new HttpsError(
      'already-exists',
      'Ya existe una cuenta registrada con este email.',
    );
  }
  await ensureUniqueUsername(name);

  const id = nanoid(10);
  const hashedPassword = await bcrypt.hash(password, 10);
  const now = Timestamp.now();
  const resolvedDisplayName = rawRealName || name;

  const newUserPayload = {
    id,
    name,
    displayName: resolvedDisplayName,
    realName: rawRealName || null,
    activeBusinessId: null,
    lastSelectedBusinessId: null,
    activeRole: null,
    number: null,
    active: true,
    password: hashedPassword,
    loginAttempts: 0,
    lockUntil: null,
    passwordChangedAt: null,
    email,
    emailVerified: false,
    phoneNumber: null,
    phoneNumberE164: null,
    phoneVerified: false,
    providers: ['password'],
    identities: {
      password: {
        uid: id,
        email,
        linkedAt: now,
      },
    },
    photoURL: null,
    meta: {
      primaryProvider: 'password',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    },
    accessControl: [],
    availableBusinesses: [],
  };

  await usersCol.doc(id).set(newUserPayload);

  await enforceSessionLimit(id, {
    allowSessions: MAX_PARALLEL_ACTIVE_SESSIONS,
    reason: 'new-signup',
  });

  const { tokenId, expiresAt } = await createSessionToken(id, sessionInfo, {
    displayName: resolvedDisplayName,
    username: name,
    realName: rawRealName || null,
  });
  const sessionSnap = await sessionsCol.doc(tokenId).get();
  const session = buildSessionPayload(sessionSnap);

  await logSessionEvent({
    userId: id,
    sessionId: tokenId,
    event: 'login',
    context: {
      ...sessionInfo,
      actor: {
        id,
        displayName: resolvedDisplayName,
        username: name,
      },
      source: 'public-signup',
    },
  });

  const activeSessions = await syncUserPresence(id);
  const firebaseCustomToken = await createFirebaseCustomToken(id);

  return {
    ok: true,
    userId: id,
    user: sanitizeUserResponse(newUserPayload),
    sessionToken: tokenId,
    sessionExpiresAt: expiresAt.toMillis(),
    session,
    activeSessions,
    businessHasOwners: false,
    firebaseCustomToken,
  };
});

export const clientLogin = onCall(
  {
    cors: CLIENT_AUTH_CORS_ORIGINS,
  },
  async (request) => {
  const { data = {} } = request || {};
  const { username, name, password } = data;
  const sessionInfo = extractRequestInfo(request);
  const identifier = normalizeName(username || name);
  assertPassword(password, { requireComplexity: false });
  if (!identifier) {
    throw new HttpsError('invalid-argument', 'Nombre de usuario requerido');
  }

  const nowMs = Date.now();

  const { userDoc, user } = await db.runTransaction(async (tx) => {
    const snap = await findUserByName(identifier);
    const payload = snap.data() || {};
    const userData = payload;

    if (userData.lockUntil && nowMs < userData.lockUntil) {
      throw new HttpsError(
        'failed-precondition',
        'This account has been temporarily locked due to too many failed login attempts. Please try again later.',
      );
    }

    const ok = await bcrypt.compare(password, userData.password);

    if (!ok) {
      const updates = {
        loginAttempts: FieldValue.increment(1),
      };
      const attempts = (userData.loginAttempts || 0) + 1;
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        updates.lockUntil = nowMs + LOCK_DURATION_MS;
      }
      tx.update(snap.ref, updates);
      throw new HttpsError('unauthenticated', 'Error: Contraseña incorrecta');
    }

    tx.update(snap.ref, {
      loginAttempts: 0,
      lockUntil: null,
    });

    return {
      userDoc: snap,
      user: userData,
    };
  });

  await enforceSessionLimit(userDoc.id, {
    allowSessions: MAX_PARALLEL_ACTIVE_SESSIONS,
    reason: 'new-login',
  });
  const displayName =
    user.realName || user.displayName || user.name || identifier;
  const usernameValue = user.name || identifier;

  const { tokenId, expiresAt } = await createSessionToken(
    userDoc.id,
    sessionInfo,
    {
      displayName,
      username: usernameValue,
      realName: user.realName || null,
    },
  );
  const sessionSnap = await sessionsCol.doc(tokenId).get();
  const session = buildSessionPayload(sessionSnap);

  const logContext = {
    ...sessionInfo,
    actor: {
      id: userDoc.id,
      displayName,
      username: usernameValue,
    },
  };

  await logSessionEvent({
    userId: userDoc.id,
    sessionId: tokenId,
    event: 'login',
    context: logContext,
  });
  const activeSessions = await syncUserPresence(userDoc.id);
  const businessId =
    userDoc.get('activeBusinessId') ||
    user.activeBusinessId ||
    user.businessId ||
    user.businessID ||
    null;
  const businessHasOwners = await resolveBusinessHasOwners(businessId);
  const firebaseCustomToken = await createFirebaseCustomToken(userDoc.id);

  return {
    ok: true,
    userId: userDoc.id,
    user: {
      ...sanitizeUserResponse({
        ...user,
        id: user.id || userDoc.id,
      }),
    },
    sessionToken: tokenId,
    sessionExpiresAt: expiresAt.toMillis(),
    session,
    activeSessions,
    businessHasOwners,
    firebaseCustomToken,
  };
});

export const clientLoginWithProvider = onCall(
  {
    cors: CLIENT_AUTH_CORS_ORIGINS,
  },
  async (request) => {
    const { data = {} } = request || {};
    const { idToken, providerId } = data;
    const sessionInfo = extractRequestInfo(request);

    if (!idToken || typeof idToken !== 'string') {
      throw new HttpsError('invalid-argument', 'idToken requerido');
    }

    const normalizedProviderId = normalizeProviderId(providerId);
    if (!normalizedProviderId) {
      throw new HttpsError('invalid-argument', 'providerId requerido');
    }
    const providerKey = resolveProviderKey(normalizedProviderId);
    if (!providerKey) {
      throw new HttpsError('invalid-argument', 'Proveedor inválido');
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('verifyIdToken error:', error);
      throw new HttpsError('unauthenticated', 'Token inválido');
    }

    const tokenProvider = normalizeProviderId(
      decodedToken?.firebase?.sign_in_provider || '',
    );
    if (tokenProvider && tokenProvider !== normalizedProviderId) {
      throw new HttpsError(
        'unauthenticated',
        'El proveedor no coincide con el token',
      );
    }

    const email =
      typeof decodedToken?.email === 'string' ? decodedToken.email.trim() : '';
    if (!email) {
      throw new HttpsError(
        'failed-precondition',
        'El token no incluye un email válido',
      );
    }
    const emailNormalized = email.toLowerCase();
    const displayName = normalizeName(
      decodedToken?.name || decodedToken?.displayName || '',
    );
    const photoURL =
      typeof decodedToken?.picture === 'string'
        ? decodedToken.picture
        : typeof decodedToken?.photoURL === 'string'
          ? decodedToken.photoURL
          : null;
    const emailVerified = decodedToken?.email_verified === true;
    const identityUid = decodedToken?.uid || decodedToken?.sub || null;
    const now = Timestamp.now();

    let userDoc = await findUserByEmail(emailNormalized);

    if (userDoc) {
      const payload = userDoc.data() || {};
      const rootProviders = normalizeArray(payload.providers);
      const currentProviders = rootProviders.length
        ? [...rootProviders]
        : [];
      const updates = {};

      if (!payload.email) updates.email = emailNormalized;
      if (emailVerified && payload.emailVerified !== true) {
        updates.emailVerified = true;
      }
      if (displayName && !payload.displayName) {
        updates.displayName = displayName;
      }
      if (displayName && !payload.realName) {
        updates.realName = displayName;
      }
      if (photoURL && !payload.photoURL) {
        updates.photoURL = photoURL;
      }

      if (!currentProviders.includes(providerKey)) {
        currentProviders.push(providerKey);
      }
      if (JSON.stringify(rootProviders) !== JSON.stringify(currentProviders)) {
        updates.providers = currentProviders;
      }

      const identities = isPlainObject(payload.identities)
        ? payload.identities
        : {};
      const existingIdentity = isPlainObject(identities[providerKey])
        ? identities[providerKey]
        : {};
      updates[`identities.${providerKey}`] = {
        ...existingIdentity,
        uid: identityUid || existingIdentity.uid || null,
        email,
        linkedAt: existingIdentity.linkedAt || now,
      };

      updates['meta.updatedAt'] = now;
      updates['meta.lastLoginAt'] = now;
      if (!payload.meta?.primaryProvider) {
        updates['meta.primaryProvider'] = providerKey;
      }

      if (Object.keys(updates).length) {
        await userDoc.ref.set(updates, { merge: true });
        userDoc = await userDoc.ref.get();
      }
    } else {
      if (!canUsePublicSignup(request)) {
        throw new HttpsError(
          'permission-denied',
          'El registro público no está habilitado. Contacte a soporte.',
        );
      }
      const id = nanoid(10);
      const fallbackName = emailNormalized;
      const resolvedDisplayName = displayName || fallbackName;

      const newUserPayload = {
        id,
        name: fallbackName,
        displayName: resolvedDisplayName,
        realName: displayName || null,
        activeBusinessId: null,
        lastSelectedBusinessId: null,
        activeRole: null,
        number: null,
        active: true,
        password: null,
        loginAttempts: 0,
        lockUntil: null,
        passwordChangedAt: null,
        email: emailNormalized,
        emailVerified,
        phoneNumber: null,
        phoneNumberE164: null,
        phoneVerified: false,
        providers: [providerKey],
        identities: {
          [providerKey]: {
            uid: identityUid,
            email,
            linkedAt: now,
          },
        },
        photoURL: photoURL || null,
        meta: {
          primaryProvider: providerKey,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
        },
      };

      await usersCol.doc(id).set(newUserPayload);
      userDoc = await usersCol.doc(id).get();
    }

    await enforceSessionLimit(userDoc.id, {
      allowSessions: MAX_PARALLEL_ACTIVE_SESSIONS,
      reason: 'new-login',
    });

    const resolvedUser = buildLegacyUserPayload(
      userDoc.data() || {},
      userDoc.id,
    );
    const displayNameValue =
      resolvedUser.realName ||
      resolvedUser.displayName ||
      resolvedUser.name ||
      email;
    const usernameValue = resolvedUser.name || email;

    const { tokenId, expiresAt } = await createSessionToken(
      userDoc.id,
      sessionInfo,
      {
        displayName: displayNameValue,
        username: usernameValue,
        realName: resolvedUser.realName || null,
      },
    );
    const sessionSnap = await sessionsCol.doc(tokenId).get();
    const session = buildSessionPayload(sessionSnap);

    const logContext = {
      ...sessionInfo,
      provider: providerKey,
      actor: {
        id: userDoc.id,
        displayName: displayNameValue,
        username: usernameValue,
      },
    };

    await logSessionEvent({
      userId: userDoc.id,
      sessionId: tokenId,
      event: 'login',
      context: logContext,
    });
    const activeSessions = await syncUserPresence(userDoc.id);
    const businessId =
      userDoc.get('activeBusinessId') ||
      resolvedUser.activeBusinessId ||
      resolvedUser.businessId ||
      resolvedUser.businessID ||
      null;
    const businessHasOwners = await resolveBusinessHasOwners(businessId);
    const firebaseCustomToken = await createFirebaseCustomToken(userDoc.id);

    return {
      ok: true,
      userId: userDoc.id,
      user: {
        ...sanitizeUserResponse({
          ...resolvedUser,
          id: resolvedUser.id || userDoc.id,
        }),
      },
      sessionToken: tokenId,
      sessionExpiresAt: expiresAt.toMillis(),
      session,
      activeSessions,
      businessHasOwners,
      firebaseCustomToken,
    };
  },
);

export const clientClaimOwnership = onCall(
  { cors: CLIENT_AUTH_CORS_ORIGINS },
  async (request) => {
  const { data = {} } = request || {};
  const { sessionToken } = data;

  if (!sessionToken) {
    throw new HttpsError('invalid-argument', 'sessionToken requerido');
  }

  const sessionSnap = await ensureActiveSession(sessionToken, {
    eventContext: { action: 'claim-ownership' },
  });
  const userId = sessionSnap.get('userId');
  const userSnap = await ensureUserExists(userId);

  const userData = userSnap.data() || {};
  const resolvedRole = resolvePrivilegedRoleFromUserData(userData);
  if (![ROLE.ADMIN, ROLE.DEV].includes(resolvedRole)) {
    throw new HttpsError(
      'permission-denied',
      'Solo administradores o dev pueden reclamar propiedad',
    );
  }

  const businessId =
    userSnap.get('activeBusinessId') ||
    userSnap.get('lastSelectedBusinessId') ||
    null;
  if (!businessId) {
    throw new HttpsError(
      'failed-precondition',
      'El usuario no tiene negocio asignado',
    );
  }

  const businessRef = db.doc(`businesses/${businessId}`);

  await db.runTransaction(async (tx) => {
    const businessSnap = await tx.get(businessRef);
    if (!businessSnap.exists) {
      throw new HttpsError('not-found', 'Negocio no encontrado');
    }

    const ownerUid = toCleanString(businessSnap.get('ownerUid'));
    if (ownerUid) {
      throw new HttpsError(
        'failed-precondition',
        'El negocio ya tiene propietario registrado.',
      );
    }

    const owners = businessSnap.get('owners');
    if (Array.isArray(owners) && owners.length > 0) {
      throw new HttpsError(
        'failed-precondition',
        'El negocio ya tiene propietario registrado.',
      );
    }

    tx.set(
      businessRef,
      {
        ownerUid: userId,
        owners: [userId],
        billingContact: userId,
      },
      { merge: true },
    );

    const memberRef = db.doc(`businesses/${businessId}/members/${userId}`);
    tx.set(
      memberRef,
      {
        uid: userId,
        userId,
        businessId,
        role: ROLE.ADMIN,
        status: 'active',
        source: 'claim_ownership_legacy_callable',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    tx.set(
      userSnap.ref,
      {
        ...(resolvedRole !== ROLE.DEV
          ? {
            activeRole: ROLE.ADMIN,
          }
          : {}),
        businessHasOwners: true,
      },
      { merge: true },
    );
  });

  return { ok: true, message: 'Ahora eres el propietario registrado.' };
});

export const clientValidateSession = onCall(
  { cors: CLIENT_AUTH_CORS_ORIGINS },
  async (request) => {
  const { data = {} } = request || {};
  const { sessionToken } = data;
  const snap = await ensureActiveSession(sessionToken, {
    eventContext: { action: 'validate-session' },
  });
  const session = buildSessionPayload(snap);
  return {
    ok: true,
    session,
  };
});

export const clientRefreshSession = onCall(
  {
    cors: CLIENT_AUTH_CORS_ORIGINS,
  },
  async (request) => {
    const { data = {} } = request || {};
    const { sessionToken, extend = true } = data;
    const sessionInfo = extractRequestInfo(request);

    const snap = await ensureActiveSession(sessionToken, {
      eventContext: { action: 'refresh-session' },
    });

    const updates = {
      lastActivity: FieldValue.serverTimestamp(),
      status: 'active',
    };

    if (extend) {
      updates.expiresAt = Timestamp.fromMillis(
        Date.now() + SESSION_EXTENSION_MS,
      );
    }
    if (sessionInfo.deviceLabel) updates.deviceLabel = sessionInfo.deviceLabel;
    if (sessionInfo.deviceId) updates.deviceId = sessionInfo.deviceId;
    if (sessionInfo.userAgent) updates.userAgent = sessionInfo.userAgent;
    if (sessionInfo.ipAddress) updates.ipAddress = sessionInfo.ipAddress;
    if (sessionInfo.platform) updates.platform = sessionInfo.platform;
    if (sessionInfo.metadata) {
      updates.metadata = {
        ...(snap.get('metadata') || {}),
        ...sessionInfo.metadata,
      };
    }

    await snap.ref.set(updates, { merge: true });
    const refreshedSnap = await snap.ref.get();
    const session = buildSessionPayload(refreshedSnap);
    const activeSessions = await syncUserPresence(session.userId);
    const userSnap = await ensureUserExists(session.userId);
    const userPayload = sanitizeUserDocResponse(
      userSnap.data() || {},
      session.userId,
    );
    const businessId =
      userSnap.get('activeBusinessId') ||
      null;
    const businessHasOwners = await resolveBusinessHasOwners(businessId);
    const firebaseCustomToken = await createFirebaseCustomToken(session.userId);

    return {
      ok: true,
      session,
      activeSessions,
      businessHasOwners,
      user: userPayload,
      firebaseCustomToken,
    };
  },
);

export const clientListSessionLogs = onCall(
  {
    cors: true,
    invoker: 'public',
  },
  async (request) => {
    const { data = {} } = request || {};
    const { sessionToken, targetUserId = null, limit = 50 } = data;
    const sessionInfo = extractRequestInfo(request);

    if (!sessionToken) {
      throw new HttpsError('invalid-argument', 'Token de sesión requerido');
    }

    const eventContext = {
      action: 'list-session-logs',
      targetUserId: targetUserId || null,
    };

    const actorSnap = await ensureActiveSession(sessionToken, { eventContext });
    const actorUserId = actorSnap.get('userId');
    const resolvedTargetUserId = targetUserId || actorUserId;

    await assertCanViewSessionLogs(actorUserId, resolvedTargetUserId);

    const effectiveLimit = Math.max(
      1,
      Math.min(Number(limit) || 50, MAX_SESSION_LOG_LIMIT),
    );

    const query = sessionLogsCol
      .where('userId', '==', resolvedTargetUserId)
      .orderBy('createdAt', 'desc')
      .limit(effectiveLimit);

    const snapshot = await query.get();
    const logs = snapshot.docs.map(buildSessionLogPayload).filter(Boolean);

    if (actorUserId !== resolvedTargetUserId) {
      await logSessionEvent({
        userId: actorUserId,
        sessionId: actorSnap.id,
        event: 'view-session-logs',
        context: {
          ...sessionInfo,
          targetUserId: resolvedTargetUserId,
          fetched: logs.length,
        },
      });
    }

    return {
      ok: true,
      userId: resolvedTargetUserId,
      requestedBy: actorUserId,
      logs,
    };
  },
);

export const clientListSessions = onCall(
  { cors: CLIENT_AUTH_CORS_ORIGINS },
  async (request) => {
  const { data = {} } = request || {};
  const { sessionToken } = data;
  const snap = await ensureActiveSession(sessionToken, {
    eventContext: { action: 'list-sessions' },
  });
  const sessions = await syncUserPresence(snap.get('userId'));

  return {
    ok: true,
    currentSessionId: snap.id,
    sessions,
  };
});

export const clientRevokeSession = onCall(
  { cors: CLIENT_AUTH_CORS_ORIGINS },
  async (request) => {
  const { data = {} } = request || {};
  const { sessionToken, targetToken, targetUserId } = data;

  if (!targetToken) {
    throw new HttpsError(
      'invalid-argument',
      'Token de sesión objetivo requerido',
    );
  }

  const actorSnap = await ensureActiveSession(sessionToken, {
    eventContext: { action: 'revoke-session', targetToken },
  });
  const actorUserId = actorSnap.get('userId');

  const targetSnap = await sessionsCol.doc(targetToken).get();
  if (!targetSnap.exists) {
    throw new HttpsError('not-found', 'Sesión no encontrada');
  }

  const sessionOwnerId = targetSnap.get('userId');

  // Si el usuario intenta cerrar una sesión que no es suya
  if (sessionOwnerId !== actorUserId) {
    // Verificar si tiene permisos de administrador
    // Reutilizamos la lógica de permisos de logs que permite a admins/devs/owners actuar sobre otros
    await assertCanViewSessionLogs(actorUserId, sessionOwnerId);

    // Opcional: Verificar que el targetUserId coincida si se envió
    if (targetUserId && targetUserId !== sessionOwnerId) {
      throw new HttpsError(
        'invalid-argument',
        'El usuario objetivo no coincide con la sesión',
      );
    }
  }

  const eventType = targetToken === sessionToken ? 'logout' : 'revoked';

  // Registrar quién realizó la acción en el contexto
  await terminateSession(targetSnap, eventType, {
    requestedBy: actorUserId, // Guardamos el ID del usuario que solicitó el cierre
    adminAction: sessionOwnerId !== actorUserId, // Flag para identificar cierres administrativos
  });

  const sessions = await syncUserPresence(sessionOwnerId);

  return {
    ok: true,
    terminatedSession: targetToken,
    sessions,
  };
});

export const clientLogout = onCall(
  { cors: CLIENT_AUTH_CORS_ORIGINS },
  async (request) => {
  const { data = {} } = request || {};
  const { sessionToken } = data;
  if (!sessionToken) {
    return { ok: true };
  }

  try {
    const snap = await ensureActiveSession(sessionToken, {
      eventContext: { action: 'logout' },
    });
    await terminateSession(snap, 'logout', { requestedBy: sessionToken });
    await syncUserPresence(snap.get('userId'));
  } catch (error) {
    if (error instanceof HttpsError) {
      if (error.code === 'unauthenticated') {
        return { ok: true, status: 'already-expired' };
      }
      throw error;
    }
    console.error('logout error:', error);
    throw new HttpsError('internal', 'No se pudo cerrar la sesión');
  }

  return { ok: true };
});

export const clientValidateUser = onCall(
  { cors: CLIENT_AUTH_CORS_ORIGINS },
  async ({ data }) => {
  const { username, name, password, uid } = data || {};
  const identifier = normalizeName(username || name);
  assertPassword(password, { requireComplexity: false });

  let snap;
  if (uid) {
    snap = await ensureUserExists(uid);
  } else {
    if (!identifier) {
      throw new HttpsError('invalid-argument', 'Nombre de usuario requerido');
    }
    snap = await findUserByName(identifier);
  }

  const rawDoc = snap.data() || {};
  const rootUser = isPlainObject(rawDoc) ? rawDoc : {};
  const passwordHash =
    typeof rootUser.password === 'string' ? rootUser.password : '';
  if (!passwordHash) {
    throw new HttpsError(
      'failed-precondition',
      'El usuario no tiene contraseña configurada en el esquema actual.',
    );
  }
  const ok = await bcrypt.compare(password, passwordHash);
  if (!ok) {
    throw new HttpsError('unauthenticated', 'Contraseña incorrecta');
  }

  const responseUser = sanitizeUserResponse({
    ...rootUser,
    id: rootUser.id || snap.id,
  });

  return {
    ok: true,
    userId: snap.id,
    user: {
      ...responseUser,
    },
  };
});

export const clientSeedBusinessWithUsers = onCall(
  { cors: CLIENT_AUTH_CORS_ORIGINS },
  async (request) => {
  const { userId: actorUserId, role: actorRole } = await assertAdminAccess(
    request,
    'client-seed-business-with-users',
  );
  const { data = {} } = request || {};
  const businessInput = isPlainObject(data.business) ? data.business : null;
  const usersInput = normalizeArray(data.users).filter((entry) =>
    isPlainObject(entry),
  );

  if (!businessInput) {
    throw new HttpsError('invalid-argument', 'business requerido');
  }
  if (!usersInput.length) {
    throw new HttpsError(
      'invalid-argument',
      'Debe incluir al menos un usuario para crear el negocio.',
    );
  }

  let writePolicy;
  try {
    writePolicy = assertMembershipWritePolicy(resolveMembershipWritePolicy());
  } catch (policyError) {
    throw new HttpsError(
      'failed-precondition',
      policyError?.message || 'Configuración de escritura inválida',
    );
  }

  const businessId =
    typeof businessInput.id === 'string' && businessInput.id.trim()
      ? businessInput.id.trim()
      : nanoid();

  const seenNames = new Set();
  const seenEmails = new Set();
  const preparedUsers = [];

  for (const rawEntry of usersInput) {
    const name = normalizeName(rawEntry.name).toLowerCase();
    if (!name) {
      throw new HttpsError(
        'invalid-argument',
        'Todos los usuarios requieren name.',
      );
    }
    if (seenNames.has(name)) {
      throw new HttpsError(
        'already-exists',
        `Usuario duplicado en la solicitud: ${name}`,
      );
    }
    seenNames.add(name);

    const password = typeof rawEntry.password === 'string' ? rawEntry.password : '';
    assertPassword(password);

    const resolvedRole = normalizeRole(rawEntry.role || '');
    if (!resolvedRole || !ROLE_SWITCH_ALLOWED_ROLES.has(resolvedRole)) {
      throw new HttpsError(
        'invalid-argument',
        `Rol inválido para ${name}.`,
      );
    }
    if (resolvedRole === ROLE.DEV && actorRole !== ROLE.DEV) {
      throw new HttpsError(
        'permission-denied',
        'Solo un usuario dev puede asignar rol dev.',
      );
    }

    const normalizedEmail =
      typeof rawEntry.email === 'string' && rawEntry.email.trim()
        ? rawEntry.email.trim().toLowerCase()
        : null;
    if (normalizedEmail) {
      if (seenEmails.has(normalizedEmail)) {
        throw new HttpsError(
          'already-exists',
          `Correo duplicado en la solicitud: ${normalizedEmail}`,
        );
      }
      seenEmails.add(normalizedEmail);
    }

    preparedUsers.push({
      id: nanoid(10),
      name,
      password,
      role: resolvedRole,
      realName: toCleanString(rawEntry.realName) || null,
      email: normalizedEmail,
      active: rawEntry.active !== false,
    });
  }

  const ownerUsers = preparedUsers.filter((user) => user.role === ROLE.OWNER);
  if (ownerUsers.length !== 1) {
    throw new HttpsError(
      'invalid-argument',
      'Debe existir exactamente 1 usuario con rol owner.',
    );
  }

  await assertBusinessCreationLimit({ ownerUid: actorUserId });

  for (const user of preparedUsers) {
    await ensureUniqueUsername(user.name);
    if (user.email) {
      const emailSnap = await findUserByEmail(user.email);
      if (emailSnap?.exists) {
        throw new HttpsError(
          'already-exists',
          `Ya existe un usuario con el correo ${user.email}.`,
        );
      }
    }
  }

  const hashedPasswords = await Promise.all(
    preparedUsers.map((user) => bcrypt.hash(user.password, 10)),
  );
  const now = Timestamp.now();
  const ownerUser = ownerUsers[0];
  const businessName = toCleanString(businessInput.name);

  await db.runTransaction(async (tx) => {
    const counterRef = db.doc(`businesses/${businessId}/counters/users`);
    const counterSnap = await tx.get(counterRef);
    const currentCounter =
      counterSnap.exists && typeof counterSnap.get('value') === 'number'
        ? counterSnap.get('value')
        : 0;

    await provisionBusinessCoreInTransaction({
      tx,
      businessId,
      business: businessInput,
      createdBy: actorUserId,
      requireNewBusiness: true,
    });

    let nextNumber = currentCounter;
    for (let index = 0; index < preparedUsers.length; index += 1) {
      const user = preparedUsers[index];
      const hashedPassword = hashedPasswords[index];
      nextNumber += 1;
      user.number = nextNumber;

      const membershipEntry = {
        businessId,
        role: user.role,
        status: 'active',
        ...(businessName ? { businessName } : {}),
      };

      const payload = {
        id: user.id,
        name: user.name,
        realName: user.realName,
        number: nextNumber,
        password: hashedPassword,
        active: user.active,
        email: user.email,
        activeBusinessId: businessId,
        lastSelectedBusinessId: businessId,
        activeRole: user.role,
        createdAt: now,
        updatedAt: now,
        loginAttempts: 0,
        lockUntil: null,
        accessControl: [membershipEntry],
      };

      const userRef = usersCol.doc(user.id);
      const memberRef = db.doc(`businesses/${businessId}/members/${user.id}`);
      tx.set(userRef, payload);

      if (writePolicy.writeCanonical) {
        tx.set(
          memberRef,
          {
            uid: user.id,
            userId: user.id,
            businessId,
            role: user.role,
            status: 'active',
            source: 'client-seed-business-with-users',
            createdBy: actorUserId,
            updatedAt: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
    }

    tx.set(
      counterRef,
      {
        value: nextNumber,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await incrementBusinessUsageMetric({
      businessId,
      metricKey: 'usersTotal',
      incrementBy: preparedUsers.length,
      tx,
    });

    const businessRef = db.doc(`businesses/${businessId}`);
    tx.set(
      businessRef,
      {
        ownerUid: ownerUser.id,
        owners: [ownerUser.id],
        billingContact: ownerUser.id,
        billingContactUid: ownerUser.id,
        updatedAt: FieldValue.serverTimestamp(),
        business: {
          ownerUid: ownerUser.id,
          owners: [ownerUser.id],
          billingContact: ownerUser.id,
          billingContactUid: ownerUser.id,
          updatedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
    );
  });

  await runBusinessPostProvisioning({
    businessId,
    actorUserId: actorUserId,
  });

  return {
    ok: true,
    id: businessId,
    users: preparedUsers.map((user) =>
      sanitizeUserResponse({
        id: user.id,
        name: user.name,
        realName: user.realName,
        email: user.email,
        active: user.active,
        activeRole: user.role,
        role: user.role,
        activeBusinessId: businessId,
        lastSelectedBusinessId: businessId,
        number: typeof user.number === 'number' ? user.number : null,
      }),
    ),
  };
});

export const clientSignUp = onCall(
  { cors: CLIENT_AUTH_CORS_ORIGINS },
  async (request) => {
  const { userId: actorUserId, role: actorRole } = await assertAdminAccess(
    request,
    'client-signup',
  );
  const { data } = request || {};
  const userData = data?.userData || {};
  const { name, password, businessID, role } = userData;
  const assignAsBusinessOwner = userData?.assignAsBusinessOwner === true;

  if (!name) {
    throw new HttpsError(
      'invalid-argument',
      'Error: Es obligatorio proporcionar un nombre de usuario.',
    );
  }
  assertPassword(password);
  if (!businessID) {
    throw new HttpsError(
      'invalid-argument',
      'Error: Es obligatorio proporcionar un ID de negocio.',
    );
  }
  if (!role) {
    throw new HttpsError(
      'invalid-argument',
      'Error: Es obligatorio seleccionar un rol.',
    );
  }

  const resolvedRole = normalizeRole(role);
  if (!resolvedRole || !ROLE_SWITCH_ALLOWED_ROLES.has(resolvedRole)) {
    throw new HttpsError(
      'invalid-argument',
      'role inválido. Roles permitidos: owner, admin, manager, cashier, buyer, dev.',
    );
  }
  if (resolvedRole === ROLE.DEV && actorRole !== ROLE.DEV) {
    throw new HttpsError(
      'permission-denied',
      'Solo un usuario dev puede asignar rol dev.',
    );
  }
  if (assignAsBusinessOwner && resolvedRole !== ROLE.OWNER) {
    throw new HttpsError(
      'invalid-argument',
      'assignAsBusinessOwner requiere role owner.',
    );
  }

  const normalizedName = normalizeName(name).toLowerCase();
  await ensureUniqueUsername(normalizedName);

  await assertBusinessSubscriptionAccess({
    businessId: businessID,
    action: 'write',
    operation: LIMIT_OPERATION_KEYS.USER_CREATE,
  });

  const id = nanoid(10);
  const hashedPassword = await bcrypt.hash(password, 10);

  const nextSequentialNumber = await getNextUserNumber(businessID);

  const normalizedEmail =
    typeof userData.email === 'string' && userData.email.trim()
      ? userData.email.trim().toLowerCase()
      : null;

  let writePolicy;
  try {
    writePolicy = assertMembershipWritePolicy(resolveMembershipWritePolicy());
  } catch (policyError) {
    throw new HttpsError(
      'failed-precondition',
      policyError?.message || 'Configuración de escritura inválida',
    );
  }

  const payload = {
    ...userData,
    id,
    name: normalizedName,
    number: nextSequentialNumber,
    password: hashedPassword,
    active: true,
    email: normalizedEmail,
    activeBusinessId: businessID,
    lastSelectedBusinessId: businessID,
    activeRole: resolvedRole,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    loginAttempts: 0,
    lockUntil: null,
  };

  delete payload.user;

  const userRef = usersCol.doc(id);
  const businessRef = db.doc(`businesses/${businessID}`);
  const memberRef = db.doc(`businesses/${businessID}/members/${id}`);

  await db.runTransaction(async (tx) => {
    const businessSnap = await tx.get(businessRef);
    if (!businessSnap.exists) {
      throw new HttpsError('not-found', 'Negocio no encontrado');
    }

    const businessNode = isPlainObject(businessSnap.get('business'))
      ? businessSnap.get('business')
      : {};
    const businessName =
      toCleanString(businessSnap.get('name')) ||
      toCleanString(businessNode.name) ||
      null;

    const membershipEntry = {
      businessId: businessID,
      role: resolvedRole,
      status: 'active',
      ...(businessName ? { businessName } : {}),
    };

    // Keep membership cache on the user doc in all modes (frontend reads from users/{uid}).
    const accessControlPayload = [membershipEntry];
    const userDocPayload = {
      ...payload,
      accessControl: accessControlPayload,
    };

    tx.set(userRef, userDocPayload);

    if (writePolicy.writeCanonical) {
      tx.set(
        memberRef,
        {
          uid: id,
          userId: id,
          businessId: businessID,
          role: resolvedRole,
          status: 'active',
          source: 'client-signup',
          createdBy: actorUserId,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    if (resolvedRole === ROLE.OWNER) {
      const ownerUid = toCleanString(businessSnap.get('ownerUid'));
      const owners = normalizeArray(businessSnap.get('owners'))
        .map((entry) => toCleanString(entry))
        .filter(Boolean);
      const hasOwners = Boolean(ownerUid) || owners.length > 0;

      const actorOwnsBusiness =
        (ownerUid && ownerUid === actorUserId) || owners.includes(actorUserId);
      const shouldTransferOwnership =
        assignAsBusinessOwner && (!hasOwners || actorOwnsBusiness || actorRole === ROLE.DEV);

      if (assignAsBusinessOwner && !shouldTransferOwnership) {
        throw new HttpsError(
          'permission-denied',
          'No se puede reasignar el owner del negocio desde este contexto.',
        );
      }

      if (!hasOwners || shouldTransferOwnership) {
        tx.set(
          businessRef,
          {
            ownerUid: id,
            owners: [id],
            billingContact: id,
            billingContactUid: id,
            updatedAt: FieldValue.serverTimestamp(),
            business: {
              ...businessNode,
              ownerUid: id,
              owners: [id],
              billingContact: id,
              billingContactUid: id,
              updatedAt: FieldValue.serverTimestamp(),
            },
          },
          { merge: true },
        );
      }
    }

    await incrementBusinessUsageMetric({
      businessId: businessID,
      metricKey: 'usersTotal',
      incrementBy: 1,
      tx,
    });
  });

  return {
    ok: true,
    id,
    user: sanitizeUserResponse(payload),
  };
});

export const clientUpdateUser = onCall(
  { cors: CLIENT_AUTH_CORS_ORIGINS },
  async (request) => {
  const {
    userId: actorUserId,
    adminSnap,
    role: actorRole,
  } = await assertAdminAccess(request, 'client-update-user');
  const { data } = request || {};
  const payload = data?.userData || {};
  const userId = payload?.id;
  if (!userId) {
    throw new HttpsError('invalid-argument', 'ID de usuario requerido');
  }

  const snap = await ensureUserExists(userId);
  const snapData = snap.data() || {};
  const currentUser = {
    ...(isPlainObject(snapData) ? snapData : {}),
  };
  const targetGlobalRole = resolvePrivilegedRoleFromUserData(snapData);

  const name = normalizeName(payload.name || currentUser.name);
  if (!name) {
    throw new HttpsError(
      'invalid-argument',
      'Error: Es obligatorio proporcionar un nombre de usuario.',
    );
  }
  await ensureUniqueUsername(name, userId);
  if (Object.prototype.hasOwnProperty.call(payload, 'password')) {
    assertPassword(payload.password);
  }

  const requestedRole = normalizeRole(payload.activeRole || payload.role || '');
  if (actorRole !== ROLE.DEV && requestedRole === ROLE.DEV) {
    throw new HttpsError(
      'permission-denied',
      'Solo un usuario dev puede asignar rol dev.',
    );
  }

  if (
    actorRole !== ROLE.DEV &&
    Object.prototype.hasOwnProperty.call(payload, 'platformRoles')
  ) {
    throw new HttpsError(
      'permission-denied',
      'Solo un usuario dev puede modificar platformRoles.',
    );
  }

  const businessID =
    payload.businessID ||
    payload.businessId ||
    currentUser.businessID ||
    currentUser.businessId ||
    null;

  if (actorRole !== ROLE.DEV && businessID) {
    const actorData = adminSnap.data() || {};
    if (!hasBusinessAccess(actorData, businessID)) {
      throw new HttpsError(
        'permission-denied',
        'No tienes permisos para gestionar usuarios de este negocio.',
      );
    }
  }

  const hasActiveFlag = Object.prototype.hasOwnProperty.call(payload, 'active');
  if (hasActiveFlag && payload.active === false) {
    if (toCleanString(actorUserId) === toCleanString(userId)) {
      throw new HttpsError(
        'failed-precondition',
        'No puedes desactivar tu propio usuario.',
      );
    }

    if (targetGlobalRole === ROLE.DEV && actorRole !== ROLE.DEV) {
      throw new HttpsError(
        'permission-denied',
        'Solo un usuario dev puede desactivar a otro usuario dev.',
      );
    }

    const targetIsBusinessOwner = await isUserBusinessOwner(businessID, userId);
    if (targetIsBusinessOwner && actorRole !== ROLE.DEV) {
      throw new HttpsError(
        'permission-denied',
        'Solo un usuario dev puede desactivar al propietario del negocio.',
      );
    }
  }

  const hasNumber = typeof currentUser.number === 'number';
  if (!hasNumber && !businessID) {
    throw new HttpsError(
      'failed-precondition',
      'No se puede asignar número de usuario sin businessID.',
    );
  }

  const resolvedNumber = hasNumber
    ? currentUser.number
    : typeof payload.number === 'number'
      ? payload.number
      : await getNextUserNumber(businessID);

  // Normalizar email a minúsculas
  const normalizedEmail =
    typeof payload.email === 'string' && payload.email.trim()
      ? payload.email.trim().toLowerCase()
      : currentUser.email ?? null;

  const aliasResolvedBusinessId =
    toCleanString(payload.activeBusinessId) ||
    toCleanString(payload.lastSelectedBusinessId) ||
    toCleanString(payload.businessID) ||
    toCleanString(payload.businessId) ||
    null;
  const aliasResolvedRole =
    normalizeRole(payload.activeRole || payload.role || '') || null;

  const normalizedPayload = { ...payload };
  delete normalizedPayload.user;
  delete normalizedPayload.businessID;
  delete normalizedPayload.businessId;
  delete normalizedPayload.role;

  const updated = {
    ...currentUser,
    ...normalizedPayload,
    ...(aliasResolvedBusinessId
      ? {
        activeBusinessId: aliasResolvedBusinessId,
        lastSelectedBusinessId:
          normalizedPayload.lastSelectedBusinessId || aliasResolvedBusinessId,
      }
      : {}),
    ...(aliasResolvedRole ? { activeRole: aliasResolvedRole } : {}),
    name,
    number: resolvedNumber,
    email: normalizedEmail,
    updatedAt: Timestamp.now(),
  };

  // Never write the legacy nested mirror (`user`) again; root fields are canonical.
  const nextUser = { ...updated };
  delete nextUser.user;
  delete nextUser.businessID;
  delete nextUser.businessId;
  delete nextUser.role;

  await usersCol.doc(userId).set(nextUser, { merge: true });

  return {
    ok: true,
    id: userId,
    user: nextUser,
  };
});

export const clientChangePassword = onCall(
  { cors: CLIENT_AUTH_CORS_ORIGINS },
  async ({ data }) => {
  const { userId, oldPassword, newPassword } = data || {};
  if (!userId) {
    throw new HttpsError('invalid-argument', 'ID de usuario requerido');
  }
  assertPassword(newPassword);
  assertPassword(oldPassword, { requireComplexity: false });

  const snap = await ensureUserExists(userId);
  const user = snap.data() || {};

  const ok = await bcrypt.compare(oldPassword, user.password);
  if (!ok) {
    throw new HttpsError(
      'unauthenticated',
      'La contraseña antigua no es correcta',
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await snap.ref.update({
    password: hashedPassword,
    passwordChangedAt: Timestamp.now(),
  });

  // Revocar todas las sesiones activas del usuario por seguridad
  const { revoked } = await revokeAllUserSessions(userId, 'password-changed');

  return { ok: true, sessionsRevoked: revoked };
});

export const clientSetUserPassword = onCall(
  { cors: CLIENT_AUTH_CORS_ORIGINS },
  async (request) => {
  await assertAdminAccess(request, 'client-set-user-password');
  const { data } = request || {};
  const { userId, newPassword } = data || {};
  if (!userId) {
    throw new HttpsError('invalid-argument', 'ID de usuario requerido');
  }
  assertPassword(newPassword);

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await usersCol.doc(userId).update({
    password: hashedPassword,
    passwordChangedAt: Timestamp.now(),
  });

  // Revocar todas las sesiones activas del usuario por seguridad
  const { revoked } = await revokeAllUserSessions(userId, 'password-changed');

  return { ok: true, sessionsRevoked: revoked };
});

export const clientSwitchUserRole = onCall(
  { cors: CLIENT_AUTH_CORS_ORIGINS },
  async (request) => {
  const { data = {} } = request || {};
  const targetRole = normalizeRole(data?.targetRole || data?.role || '');

  if (!targetRole || !ROLE_SWITCH_ALLOWED_ROLES.has(targetRole)) {
    throw new HttpsError(
      'invalid-argument',
      'targetRole inválido. Roles permitidos: owner, admin, manager, cashier, buyer, dev.',
    );
  }

  const { userId: actorUserId, actorSnap } = await resolveRoleSwitchActor(
    request,
    'client-switch-user-role',
  );

  const currentData = actorSnap.data() || {};
  const currentRole = resolveCurrentRoleFromUserData(currentData);
  const isActorDev = currentRole === ROLE.DEV;

  const existingSimulation = isPlainObject(currentData.roleSimulation)
    ? currentData.roleSimulation
    : {};
  const simulationOriginalRole = normalizeRole(
    existingSimulation.originalRole || '',
  );
  const canRestoreOwnRole =
    simulationOriginalRole &&
    simulationOriginalRole === targetRole &&
    toCleanString(existingSimulation.actorUserId || actorUserId) === actorUserId;

  if (!isActorDev && !canRestoreOwnRole) {
    throw new HttpsError(
      'permission-denied',
      'Solo un usuario dev puede cambiar de rol.',
    );
  }

  if (targetRole === currentRole) {
    return {
      ok: true,
      userId: actorUserId,
      role: currentRole,
      restored: false,
      message: 'El usuario ya tiene ese rol activo.',
    };
  }

  const activeBusinessId = resolveActiveBusinessIdFromUserData(currentData);

  const root = isPlainObject(currentData) ? currentData : {};

  const nextAccessControl = updateBusinessRoleEntries(
    root.accessControl,
    activeBusinessId,
    actorUserId,
    targetRole,
    { ensureEntry: true },
  );
  const roleSimulationOriginalRole =
    simulationOriginalRole || resolveCurrentRoleFromUserData(currentData);
  const isRestoringOriginalRole =
    simulationOriginalRole &&
    targetRole === roleSimulationOriginalRole &&
    canRestoreOwnRole;

  const roleSimulationPayload = isRestoringOriginalRole
    ? FieldValue.delete()
    : {
      active: true,
      actorUserId,
      originalRole: roleSimulationOriginalRole,
      originalPlatformDev:
          typeof existingSimulation.originalPlatformDev === 'boolean'
            ? existingSimulation.originalPlatformDev
            : hasPlatformDevRoleFromUserData(currentData),
      startedAt: existingSimulation.startedAt || FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

  const shouldEnablePlatformDev =
    targetRole === ROLE.DEV ||
    (isRestoringOriginalRole &&
      existingSimulation.originalPlatformDev === true);

  await actorSnap.ref.set(
    {
      activeRole: targetRole,
      updatedAt: FieldValue.serverTimestamp(),
      accessControl: nextAccessControl,
      ...(activeBusinessId
        ? {
          activeBusinessId,
        }
        : {}),
      roleSimulation: roleSimulationPayload,
      ...(shouldEnablePlatformDev
        ? {
          'platformRoles.dev': true,
        }
        : {
          'platformRoles.dev': FieldValue.delete(),
        }),
    },
    { merge: true },
  );

  if (activeBusinessId) {
    await db.doc(`businesses/${activeBusinessId}/members/${actorUserId}`).set(
      {
        uid: actorUserId,
        userId: actorUserId,
        businessId: activeBusinessId,
        role: targetRole,
        activeRole: targetRole,
        status: 'active',
        source: ROLE_SWITCH_SOURCE,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  return {
    ok: true,
    userId: actorUserId,
    businessId: activeBusinessId || null,
    role: targetRole,
    restored: Boolean(isRestoringOriginalRole),
    originalRole: isRestoringOriginalRole ? null : roleSimulationOriginalRole,
  };
});

function sanitizeUserResponse(user) {
  if (!user || typeof user !== 'object') return user;
  const sanitized = { ...user };
  delete sanitized.password;
  delete sanitized.loginAttempts;
  delete sanitized.lockUntil;
  delete sanitized.history;
  return sanitized;
}

function sanitizeUserDocResponse(payload, userId) {
  if (!payload || typeof payload !== 'object') {
    return { id: userId };
  }

  const sanitized = sanitizeUserResponse(payload);

  return {
    ...sanitized,
    id: sanitized.id || userId,
  };
}

async function createFirebaseCustomToken(userId) {
  const uid = typeof userId === 'string' ? userId.trim() : String(userId || '');
  if (!uid) {
    throw new HttpsError('internal', 'No se pudo crear token de autenticación.');
  }

  try {
    return await admin.auth().createCustomToken(uid);
  } catch (error) {
    console.error('createCustomToken error:', error);
    throw new HttpsError('internal', 'No se pudo crear token de autenticación.');
  }
}

// ─── Email Verification ────────────────────────────────────────────────

const EMAIL_CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutos
const EMAIL_CODE_LENGTH = 6;

function generateVerificationCode() {
  const chars = '0123456789';
  let code = '';
  for (let i = 0; i < EMAIL_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Envía un código de verificación al email proporcionado.
 * Requiere acceso admin (sessionToken). Guarda el código hasheado en el doc del usuario.
 */
export const clientSendEmailVerification = onCall(
  { cors: CLIENT_AUTH_CORS_ORIGINS, secrets: MAIL_SECRETS },
  async (request) => {
    await assertAdminAccess(request, 'send-email-verification');
    const { data } = request || {};
    const userId = data?.userId;
    const email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';

    if (!userId) {
      throw new HttpsError('invalid-argument', 'ID de usuario requerido.');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpsError('invalid-argument', 'Correo electrónico inválido.');
    }

    await ensureUserExists(userId);

    const code = generateVerificationCode();
    const hashedCode = await bcrypt.hash(code, 6);
    const expiresAtMillis = Date.now() + EMAIL_CODE_EXPIRY_MS;

    await usersCol.doc(userId).set(
      {
        emailVerification: {
          code: hashedCode,
          email,
          expiresAt: Timestamp.fromMillis(expiresAtMillis),
          attempts: 0,
          createdAt: Timestamp.now(),
        },
      },
      { merge: true },
    );

    // Enviar email con el código
    let mailer;
    try {
      mailer = await import('../../../../core/config/mailer.js');
    } catch {
      throw new HttpsError(
        'internal',
        'No se pudo cargar el módulo de correo.',
      );
    }

    if (typeof mailer.getTransport === 'function') {
      const transport = await mailer.getTransport();
      if (!transport) {
        throw new HttpsError(
          'failed-precondition',
          'Servicio de correo no configurado. Configura STOCK_ALERT_MAIL_USER/STOCK_ALERT_MAIL_PASS y STOCK_ALERT_MAIL_HOST o STOCK_ALERT_MAIL_SERVICE.',
        );
      }
    }

    const sendMail = mailer.sendMail;

    try {
      await sendMail({
        to: email,
        subject: 'Código de verificación - VentaMax',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1890ff; margin-bottom: 8px;">Verificación de correo</h2>
          <p>Tu código de verificación es:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; background: #f5f5f5; border-radius: 8px; margin: 16px 0;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px;">Este código expira en 10 minutos.</p>
          <p style="color: #999; font-size: 12px;">Si no solicitaste esta verificación, ignora este mensaje.</p>
        </div>
      `,
        text: `Tu código de verificación de VentaMax es: ${code}. Expira en 10 minutos.`,
      });
    } catch {
    // Limpiar el código si el envío falla
      await usersCol.doc(userId).set(
        { emailVerification: FieldValue.delete() },
        { merge: true },
      );
      throw new HttpsError(
        'internal',
        'No se pudo enviar el correo de verificación. Verifica la configuración de correo.',
      );
    }

    return {
      ok: true,
      message: 'Código de verificación enviado.',
      expiresAtMillis,
      email,
    };
  });

/**
 * Verifica el código enviado por email. Si es correcto, marca el email como verificado
 * y lo guarda en el documento del usuario.
 */
export const clientVerifyEmailCode = onCall(
  { cors: CLIENT_AUTH_CORS_ORIGINS },
  async (request) => {
  await assertAdminAccess(request, 'verify-email-code');
  const { data } = request || {};
  const userId = data?.userId;
  const code = typeof data?.code === 'string' ? data.code.trim() : '';

  if (!userId) {
    throw new HttpsError('invalid-argument', 'ID de usuario requerido.');
  }
  if (!code || code.length !== EMAIL_CODE_LENGTH) {
    throw new HttpsError('invalid-argument', 'Código de verificación inválido.');
  }

  const snap = await ensureUserExists(userId);
  const docData = snap.data() || {};
  const verification = docData.emailVerification;

  if (!verification || !verification.code || !verification.email) {
    throw new HttpsError(
      'failed-precondition',
      'No hay una verificación pendiente para este usuario.',
    );
  }

  // Verificar expiración
  const expiresAt = verification.expiresAt?.toMillis?.() || 0;
  if (Date.now() > expiresAt) {
    await usersCol.doc(userId).set(
      { emailVerification: FieldValue.delete() },
      { merge: true },
    );
    throw new HttpsError(
      'deadline-exceeded',
      'El código ha expirado. Solicita uno nuevo.',
    );
  }

  // Verificar intentos (máx 5)
  const attempts = verification.attempts || 0;
  if (attempts >= 5) {
    await usersCol.doc(userId).set(
      { emailVerification: FieldValue.delete() },
      { merge: true },
    );
    throw new HttpsError(
      'resource-exhausted',
      'Demasiados intentos fallidos. Solicita un nuevo código.',
    );
  }

  // Comparar código
  const codeMatch = await bcrypt.compare(code, verification.code);
  if (!codeMatch) {
    await usersCol.doc(userId).set(
      { 'emailVerification.attempts': attempts + 1 },
      { merge: true },
    );
    throw new HttpsError(
      'unauthenticated',
      `Código incorrecto. ${4 - attempts} intentos restantes.`,
    );
  }

  // Código correcto: guardar email verificado y limpiar
  const verifiedEmail = verification.email;
  await usersCol.doc(userId).set(
    {
      email: verifiedEmail,
      emailVerified: true,
      emailVerification: FieldValue.delete(),
    },
    { merge: true },
  );

  return { ok: true, email: verifiedEmail, message: 'Correo verificado exitosamente.' };
});
