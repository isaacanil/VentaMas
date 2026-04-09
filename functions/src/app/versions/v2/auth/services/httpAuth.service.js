import { admin } from '../../../../core/config/firebase.js';
import {
  resolveUserIdFromSessionToken,
} from '../utils/sessionAuth.util.js';

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
  const userId = await resolveUserIdFromSessionToken({
    sessionToken: token,
    createAuthError: (message) => new HttpAuthError(401, message),
    swallowTouchErrors: true,
    messages: {
      invalidSession: 'Sesión inválida o expirada',
      missingUser: 'Sesión sin usuario asociado',
      expired: 'La sesión ha expirado',
      inactive: 'Sesión cerrada por inactividad',
    },
  });

  return userId
    ? { uid: userId, method: 'session', sessionToken: token }
    : null;
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
