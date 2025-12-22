import { admin, db, FieldValue } from '../../../../core/config/firebase.js';

const SESSION_IDLE_TIMEOUT_MS =
  Number(process.env.CLIENT_AUTH_MAX_IDLE_MS) || 0;

const SESSION_COLLECTION = 'sessionTokens';

class HttpAuthError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const headerCaseInsensitive = (req, key) => {
  if (!req?.headers) return null;
  const direct = req.headers[key];
  if (direct) return direct;
  const lower = key.toLowerCase();
  return req.headers[lower] || null;
};

const toMillis = (value) => {
  if (!value) return null;
  if (typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

async function verifyFirebaseToken(idToken) {
  if (!idToken) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (!decoded?.uid) return null;
    return { uid: decoded.uid, method: 'firebase' };
  } catch {
    return null;
  }
}

async function verifySessionToken(token) {
  if (!token) return null;
  const snap = await db.collection(SESSION_COLLECTION).doc(token).get();
  if (!snap.exists) {
    throw new HttpAuthError(401, 'Sesión inválida o expirada');
  }
  const data = snap.data() || {};
  const userId = data.userId;
  if (!userId) {
    throw new HttpAuthError(401, 'Sesión sin usuario asociado');
  }
  const now = Date.now();
  const expiresAt = toMillis(data.expiresAt);
  if (expiresAt && expiresAt <= now) {
    throw new HttpAuthError(401, 'La sesión ha expirado');
  }
  if (SESSION_IDLE_TIMEOUT_MS > 0) {
    const lastActivity = toMillis(data.lastActivity);
    if (lastActivity && now - lastActivity > SESSION_IDLE_TIMEOUT_MS) {
      throw new HttpAuthError(401, 'Sesión cerrada por inactividad');
    }
  }

  try {
    await snap.ref.set(
      {
        lastActivity: FieldValue.serverTimestamp(),
        status: 'active',
      },
      { merge: true },
    );
  } catch {
    /* noop */
  }

  return { uid: userId, method: 'session', sessionToken: token };
}

export async function resolveHttpAuthUser(req) {
  const authHeader = headerCaseInsensitive(req, 'authorization') || '';
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.slice(7);
    const firebaseResult = await verifyFirebaseToken(idToken);
    if (firebaseResult) {
      return firebaseResult;
    }
  }

  const sessionToken =
    headerCaseInsensitive(req, 'x-session-token') ||
    headerCaseInsensitive(req, 'x-sessiontoken') ||
    req?.body?.sessionToken ||
    req?.query?.sessionToken;

  if (sessionToken) {
    return verifySessionToken(sessionToken);
  }

  throw new HttpAuthError(401, 'Autenticación requerida');
}

export { HttpAuthError };
