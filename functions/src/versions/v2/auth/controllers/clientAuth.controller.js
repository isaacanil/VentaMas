import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, Timestamp, FieldValue } from '../../../../core/config/firebase.js';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const USERS_COLLECTION = 'users';
const SESSION_COLLECTION = 'sessionTokens';

const SESSION_DURATION_MS = Number(process.env.CLIENT_AUTH_SESSION_DURATION_MS) || 60 * 24 * 60 * 60 * 1000; // 60 días
const TOKEN_CLEANUP_MS = Number(process.env.CLIENT_AUTH_TOKEN_CLEANUP_MS) || 60 * 24 * 60 * 60 * 1000; // 60 días
const MAX_LOGIN_ATTEMPTS = Number(process.env.CLIENT_AUTH_MAX_ATTEMPTS) || 5;
const LOCK_DURATION_MS = Number(process.env.CLIENT_AUTH_LOCK_MS) || 2 * 60 * 60 * 1000; // 2 horas

const usersCol = db.collection(USERS_COLLECTION);
const sessionsCol = db.collection(SESSION_COLLECTION);

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

function buildUserPayload(doc) {
  const data = doc.data() || {};
  const user = data.user || {};
  return {
    ...user,
    id: user.id || doc.id,
  };
}

async function cleanupOldTokens(userId, keepTokenId = null) {
  const snapshot = await sessionsCol.where('userId', '==', userId).get();
  if (snapshot.empty) return;

  const threshold = Timestamp.fromMillis(Date.now() - TOKEN_CLEANUP_MS);
  const deletions = snapshot.docs
    .filter((doc) => {
      if (keepTokenId && doc.id === keepTokenId) return false;
      const expiresAt = doc.get('expiresAt');
      if (!expiresAt) return true;
      try {
        const expiresMillis = expiresAt.toMillis ? expiresAt.toMillis() : Number(expiresAt);
        return expiresMillis < threshold.toMillis();
      } catch (error) {
        return true;
      }
    })
    .map((doc) => doc.ref.delete());

  if (deletions.length) {
    await Promise.allSettled(deletions);
  }
}

async function createSessionToken(userName, userDocId) {
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + SESSION_DURATION_MS);
  const tokenId = `${userName}_${now.toMillis()}`;

  await cleanupOldTokens(userDocId, tokenId);

  await sessionsCol.doc(tokenId).set({
    userId: userDocId,
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
    lastActivity: FieldValue.serverTimestamp(),
  });

  return { tokenId, expiresAt };
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
    throw new HttpsError('already-exists', 'Error: Ya existe un usuario con este nombre.');
  }
}

export const clientLogin = onCall(async ({ data }) => {
  const { username, name, password } = data || {};
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
        'This account has been temporarily locked due to too many failed login attempts. Please try again later.'
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

  const { tokenId, expiresAt } = await createSessionToken(user.name || identifier, userDoc.id);

  return {
    ok: true,
    userId: userDoc.id,
    user: {
      ...user,
      id: user.id || userDoc.id,
    },
    sessionToken: tokenId,
    sessionExpiresAt: expiresAt.toMillis(),
  };
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
    throw new HttpsError('invalid-argument', 'Error: Es obligatorio proporcionar un nombre de usuario.');
  }
  if (!password) {
    throw new HttpsError('invalid-argument', 'Error: Es obligatorio proporcionar una contraseña.');
  }
  if (!businessID) {
    throw new HttpsError('invalid-argument', 'Error: Es obligatorio proporcionar un ID de negocio.');
  }
  if (!role) {
    throw new HttpsError('invalid-argument', 'Error: Es obligatorio seleccionar un rol.');
  }

  const normalizedName = normalizeName(name).toLowerCase();
  await ensureUniqueUsername(normalizedName);

  const id = nanoid(10);
  const hashedPassword = await bcrypt.hash(password, 10);

  const payload = {
    ...userData,
    id,
    name: normalizedName,
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
    throw new HttpsError('unauthenticated', 'La contraseña antigua no es correcta');
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
