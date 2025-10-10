import { Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { db, admin } from '../../../../../core/config/firebase.js';
import { verifyAndUpgrade } from '../utils/hash.util.js';
import {
  ERROR_MESSAGES,
  normalizeUsername,
  findUserByName,
  createLoginResetFields,
  createFailedLoginFields,
  isAccountLocked,
  validateCredentials,
  createLoginResponse,
  createAuthCheckResponse
} from '../utils/user.util.js';

/* ────────── config runtime ────────── */
const MAX_ATTEMPTS = Number(process.env.AUTH_MAX_ATTEMPTS) || 5;
const LOCK_HOURS   = Number(process.env.AUTH_LOCK_HOURS)   || 2;
const LOCK_MS      = LOCK_HOURS * 60 * 60 * 1_000;

/* ────────── errores genéricos ────────── */
const ERR_GENERIC = new HttpsError(
  'unauthenticated',
  ERROR_MESSAGES.INVALID_CREDENTIALS
);
const ERR_LOCKED = new HttpsError(
  'failed-precondition',
  ERROR_MESSAGES.ACCOUNT_LOCKED
);

/* ────────── helper: autenticación común ────────── */
async function tryAuth(usernameRaw, password, upgrade = false) {
  const uname = normalizeUsername(usernameRaw);

  return db.runTransaction(async tx => {
    const doc = await findUserByName(tx, uname);
    const userData = doc.data();
    const user = userData.user; // Acceder a la sub-propiedad user

    /* estado de la cuenta */
    if (user.active === false) throw ERR_GENERIC;
    if (isAccountLocked(user)) throw ERR_LOCKED;

    /* verificación + posible upgrade */
    const { ok, newHash } = await verifyAndUpgrade(password, user.password);
    if (!ok) {
      const attempts = (user.loginAttempts ?? 0) + 1;
      const shouldLock = attempts >= MAX_ATTEMPTS;
      const failedFields = createFailedLoginFields(
        shouldLock ? MAX_ATTEMPTS : null,
        shouldLock ? LOCK_MS : null
      );
      tx.update(doc.ref, failedFields);
      throw ERR_GENERIC;
    }    /* login OK → reset contador + hash upgrade opcional */
    const update = {
      ...createLoginResetFields(),
      ...(upgrade && newHash && { 'user.password': newHash })
    };
    tx.update(doc.ref, update);

    return { uid: doc.id, user, hashUpgraded: Boolean(upgrade && newHash) };
  });
}

/* ────────── 1. LOGIN ────────── */
export const authLogin = onCall(async ({ data }) => {
  const { username, password } = data ?? {};
  validateCredentials(username, password);

  const { uid, user } = await tryAuth(username, password, true);
  const token = await admin.auth().createCustomToken(uid);

  return createLoginResponse(token, user, uid);
});

/* ────────── 2. CHECK (sin login) ────────── */
export const authCheck = onCall(async ({ data }) => {
  const { username, password } = data ?? {};
  validateCredentials(username, password);

  try {
    await tryAuth(username, password);
    return createAuthCheckResponse(true);
  } catch (err) {
    if (['failed-precondition', 'unauthenticated'].includes(err.code)) {
      return createAuthCheckResponse(false);
    }
    throw err;
  }
});

/* ────────── 3. LOGOUT global ────────── */
export const authLogout = onCall(async req => {
  const uid = req.auth?.uid || req.data?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'No autenticado');

  await admin.auth().revokeRefreshTokens(uid);
  return { ok: true };
});

/* ────────── 4. CRON: revocar cuentas expiradas ────────── */
export const expireSessions = onSchedule('every 60 minutes', async () => {
  const now = Timestamp.now();
  let last  = null;

  while (true) {
    let q = db.collection('users')
      .where('user.expirationDate', '<=', now)
      .where('user.active', '==', true)
      .orderBy('user.expirationDate')
      .limit(500);

    if (last) q = q.startAfter(last);

    const snap = await q.get();
    if (snap.empty) break;

    /* desactivar cuentas en lote */
    const batch = db.batch();
    snap.docs.forEach(d => batch.update(d.ref, {
      active            : false,
      deactivatedAt     : now,
      deactivatedReason : 'expired'
    }));
    await batch.commit();

    /* revocar tokens en paralelo (no afectan transacción) */
    await Promise.allSettled(
      snap.docs.map(d => admin.auth().revokeRefreshTokens(d.id))
    );

    last = snap.docs[snap.docs.length - 1];
    if (snap.size < 500) break;
  }
});
