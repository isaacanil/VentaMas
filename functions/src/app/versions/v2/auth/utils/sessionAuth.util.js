import { db, FieldValue } from '../../../../core/config/firebase.js';

const SESSION_COLLECTION = 'sessionTokens';
const SESSION_IDLE_TIMEOUT_MS =
  Number(process.env.CLIENT_AUTH_MAX_IDLE_MS) || 0;
const DISABLE_SESSION_EXPIRY =
  String(process.env.CLIENT_AUTH_DISABLE_SESSION_EXPIRY || '').toLowerCase() ===
  'true';

const sessionsCol = db.collection(SESSION_COLLECTION);

const identity = (value) => value;
const DEFAULT_MESSAGES = {
  invalidSession: 'Sesion invalida o expirada',
  missingUser: 'Sesion sin usuario asociado',
  expired: 'La sesion ha expirado',
  inactive: 'Sesion cerrada por inactividad',
};

export const toMillis = (value) => {
  if (!value) return null;
  if (typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export async function resolveUserIdFromSessionToken({
  sessionToken,
  normalizeUserId = identity,
  createAuthError,
  swallowTouchErrors = false,
  messages = DEFAULT_MESSAGES,
}) {
  if (!sessionToken) return null;
  if (typeof createAuthError !== 'function') {
    throw new TypeError('createAuthError must be a function');
  }

  const sessionRef = sessionsCol.doc(sessionToken);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) {
    throw createAuthError(messages.invalidSession);
  }

  const data = sessionSnap.data() || {};
  const userId = normalizeUserId(data.userId);
  if (!userId) {
    throw createAuthError(messages.missingUser);
  }

  if (!DISABLE_SESSION_EXPIRY) {
    const now = Date.now();
    const expiresAt = toMillis(data.expiresAt);
    if (expiresAt && expiresAt <= now) {
      throw createAuthError(messages.expired);
    }
    if (SESSION_IDLE_TIMEOUT_MS > 0) {
      const lastActivity = toMillis(data.lastActivity);
      if (lastActivity && now - lastActivity > SESSION_IDLE_TIMEOUT_MS) {
        throw createAuthError(messages.inactive);
      }
    }
  }

  const touchSession = sessionRef.set(
    {
      lastActivity: FieldValue.serverTimestamp(),
      status: 'active',
    },
    { merge: true },
  );

  if (swallowTouchErrors) {
    try {
      await touchSession;
    } catch {
      /* noop */
    }
  } else {
    await touchSession;
  }

  return userId;
}
