import bcrypt from 'bcryptjs';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db, Timestamp, FieldValue } from '../../../../core/config/firebase.js';

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
const SESSION_EXTENSION_MS =
  Number(process.env.CLIENT_AUTH_SESSION_EXTENSION_MS) || SESSION_DURATION_MS;

const usersCol = db.collection(USERS_COLLECTION);
const sessionsCol = db.collection(SESSION_COLLECTION);
const sessionLogsCol = db.collection(SESSION_LOG_COLLECTION);

const PRIVILEGED_SESSION_LOG_ROLES = ['admin', 'dev', 'owner'];
const MAX_SESSION_LOG_LIMIT =
  Number(process.env.CLIENT_AUTH_SESSION_LOG_LIMIT) || 200;
const SESSION_LOG_WHITELIST = new Set(['login', 'logout']);

const normalizeName = (name) => (typeof name === 'string' ? name.trim() : '');

async function findUserByName(name) {
  const query = await usersCol.where('user.name', '==', name).limit(1).get();
  if (query.empty) {
    throw new HttpsError('not-found', 'Error: No se encontró el usuario');
  }
  return query.docs[0];
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

async function cleanupOldTokens(userId, keepTokenId = null) {
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

async function assertCanViewSessionLogs(actorUserId, targetUserId) {
  if (!actorUserId || !targetUserId) {
    throw new HttpsError('invalid-argument', 'ID de usuario requerido');
  }
  if (actorUserId === targetUserId) {
    return;
  }

  const actorSnap = await ensureUserExists(actorUserId);
  const actorData = actorSnap.data() || {};
  const actorRole = (actorData.user?.role || '').toLowerCase();

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
  { allowSessions = MAX_ACTIVE_SESSIONS, skipTokenId = null } = {},
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
        reason: 'max-sessions-exceeded',
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
      throw new HttpsError('unauthenticated', 'Sesión cerrada por inactividad');
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
  const tokenId = `${userDocId}_${now.toMillis()}`;

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

function assertPassword(password) {
  if (!password) {
    throw new HttpsError('invalid-argument', 'Contraseña requerida');
  }
}

async function ensureUniqueUsername(name, excludeId = null) {
  const query = await usersCol.where('user.name', '==', name).get();
  if (query.empty) return;

  const hasOther = query.docs.some((doc) => doc.id !== excludeId);
  if (hasOther) {
    throw new HttpsError(
      'already-exists',
      'Error: Ya existe un usuario con este nombre.',
    );
  }
}

export const clientLogin = onCall(async (request) => {
  const { data = {} } = request || {};
  const { username, name, password } = data;
  const sessionInfo = extractRequestInfo(request);
  const identifier = normalizeName(username || name);
  assertPassword(password);
  if (!identifier) {
    throw new HttpsError('invalid-argument', 'Nombre de usuario requerido');
  }

  const nowMs = Date.now();

  const { userDoc, user } = await db.runTransaction(async (tx) => {
    const snap = await findUserByName(identifier);
    const payload = snap.data() || {};
    const userData = payload.user || {};

    if (userData.lockUntil && nowMs < userData.lockUntil) {
      throw new HttpsError(
        'failed-precondition',
        'This account has been temporarily locked due to too many failed login attempts. Please try again later.',
      );
    }

    const ok = await bcrypt.compare(password, userData.password);

    if (!ok) {
      const updates = {
        'user.loginAttempts': FieldValue.increment(1),
      };
      const attempts = (userData.loginAttempts || 0) + 1;
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        updates['user.lockUntil'] = nowMs + LOCK_DURATION_MS;
      }
      tx.update(snap.ref, updates);
      throw new HttpsError('unauthenticated', 'Error: Contraseña incorrecta');
    }

    tx.update(snap.ref, {
      'user.loginAttempts': 0,
      'user.lockUntil': null,
    });

    return {
      userDoc: snap,
      user: userData,
    };
  });

  await enforceSessionLimit(userDoc.id);
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

  return {
    ok: true,
    userId: userDoc.id,
    user: {
      ...user,
      id: user.id || userDoc.id,
    },
    sessionToken: tokenId,
    sessionExpiresAt: expiresAt.toMillis(),
    session,
    activeSessions,
  };
});

export const clientValidateSession = onCall(async (request) => {
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

export const clientRefreshSession = onCall(async (request) => {
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
    updates.expiresAt = Timestamp.fromMillis(Date.now() + SESSION_EXTENSION_MS);
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

  return {
    ok: true,
    session,
    activeSessions,
  };
});

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

export const clientListSessions = onCall(async (request) => {
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

export const clientRevokeSession = onCall(async (request) => {
  const { data = {} } = request || {};
  const { sessionToken, targetToken } = data;

  if (!targetToken) {
    throw new HttpsError(
      'invalid-argument',
      'Token de sesión objetivo requerido',
    );
  }

  const actorSnap = await ensureActiveSession(sessionToken, {
    eventContext: { action: 'revoke-session', targetToken },
  });
  const userId = actorSnap.get('userId');
  const targetSnap = await sessionsCol.doc(targetToken).get();

  if (!targetSnap.exists || targetSnap.get('userId') !== userId) {
    throw new HttpsError('not-found', 'Sesión no encontrada');
  }

  const eventType = targetToken === sessionToken ? 'logout' : 'revoked';
  await terminateSession(targetSnap, eventType, { requestedBy: sessionToken });
  const sessions = await syncUserPresence(userId);

  return {
    ok: true,
    terminatedSession: targetToken,
    sessions,
  };
});

export const clientLogout = onCall(async (request) => {
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

export const clientValidateUser = onCall(async ({ data }) => {
  const { username, name, password, uid } = data || {};
  const identifier = normalizeName(username || name);
  assertPassword(password);

  let snap;
  if (uid) {
    snap = await ensureUserExists(uid);
  } else {
    if (!identifier) {
      throw new HttpsError('invalid-argument', 'Nombre de usuario requerido');
    }
    snap = await findUserByName(identifier);
  }

  const user = (snap.data() || {}).user || {};
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw new HttpsError('unauthenticated', 'Contraseña incorrecta');
  }

  return {
    ok: true,
    userId: snap.id,
    user: {
      ...user,
      id: user.id || snap.id,
    },
  };
});

export const clientSignUp = onCall(async ({ data }) => {
  const userData = data?.userData || {};
  const { name, password, businessID, role } = userData;

  if (!name) {
    throw new HttpsError(
      'invalid-argument',
      'Error: Es obligatorio proporcionar un nombre de usuario.',
    );
  }
  if (!password) {
    throw new HttpsError(
      'invalid-argument',
      'Error: Es obligatorio proporcionar una contraseña.',
    );
  }
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

  const normalizedName = normalizeName(name).toLowerCase();
  await ensureUniqueUsername(normalizedName);

  const id = nanoid(10);
  const hashedPassword = await bcrypt.hash(password, 10);

  const counterRef = db.doc(`businesses/${businessID}/counters/users`);
  const nextSequentialNumber = await db.runTransaction(async (transaction) => {
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

  const payload = {
    ...userData,
    id,
    name: normalizedName,
    number: nextSequentialNumber,
    password: hashedPassword,
    active: true,
    createAt: Timestamp.now(),
    loginAttempts: 0,
    lockUntil: null,
  };

  await usersCol.doc(id).set({
    user: payload,
  });

  return {
    ok: true,
    id,
    user: payload,
  };
});

export const clientUpdateUser = onCall(async ({ data }) => {
  const payload = data?.userData || {};
  const userId = payload?.id;
  if (!userId) {
    throw new HttpsError('invalid-argument', 'ID de usuario requerido');
  }

  const name = normalizeName(payload.name);
  await ensureUniqueUsername(name, userId);

  const updated = {
    ...payload,
    name,
    updatedAt: Timestamp.now(),
  };

  await usersCol.doc(userId).update({
    user: updated,
  });

  return {
    ok: true,
    id: userId,
    user: updated,
  };
});

export const clientChangePassword = onCall(async ({ data }) => {
  const { userId, oldPassword, newPassword } = data || {};
  if (!userId) {
    throw new HttpsError('invalid-argument', 'ID de usuario requerido');
  }
  assertPassword(newPassword);
  assertPassword(oldPassword);

  const snap = await ensureUserExists(userId);
  const user = (snap.data() || {}).user || {};

  const ok = await bcrypt.compare(oldPassword, user.password);
  if (!ok) {
    throw new HttpsError(
      'unauthenticated',
      'La contraseña antigua no es correcta',
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await snap.ref.update({
    'user.password': hashedPassword,
  });

  return { ok: true };
});

export const clientSetUserPassword = onCall(async ({ data }) => {
  const { userId, newPassword } = data || {};
  if (!userId) {
    throw new HttpsError('invalid-argument', 'ID de usuario requerido');
  }
  assertPassword(newPassword);

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await usersCol.doc(userId).update({
    'user.password': hashedPassword,
  });

  return { ok: true };
});
