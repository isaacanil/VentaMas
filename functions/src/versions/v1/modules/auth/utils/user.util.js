import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import { db } from '../../../../../core/config/firebase.js';

/* ────────── config runtime ────────── */
const MAX_ATTEMPTS = Number(process.env.AUTH_MAX_ATTEMPTS) || 5;
const LOCK_HOURS   = Number(process.env.AUTH_LOCK_HOURS)   || 2;
const LOCK_MS      = LOCK_HOURS * 60 * 60 * 1_000;

export const AUTH_LIMITS = {
  maxAttempts: MAX_ATTEMPTS,
  lockHours: LOCK_HOURS,
  lockMs: LOCK_MS
};

/* ────────── mensajes de error ────────── */
export const ERROR_MESSAGES = {
  MISSING_CREDENTIALS: 'Credenciales requeridas',
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  ACCOUNT_LOCKED: `Cuenta bloqueada por ${LOCK_HOURS} horas tras ${MAX_ATTEMPTS} intentos fallidos`
};

/**
 * Normaliza el nombre de usuario para búsqueda
 */
export function normalizeUsername(username) {
  return username?.toLowerCase()?.trim() || '';
}

/**
 * Busca un usuario por nombre en una transacción
 */
export async function findUserByName(tx, normalizedName) {
  const usersCol = db.collection('users');
  const query = usersCol.where('user.name', '==', normalizedName).limit(1);
  const snap = await tx.get(query);
  
  if (snap.empty) {
    throw new HttpsError('unauthenticated', ERROR_MESSAGES.INVALID_CREDENTIALS);
  }
  
  return snap.docs[0];
}

/**
 * Verifica si una cuenta está bloqueada
 */
export function isAccountLocked(user) {
  if (!user.lockUntil) return false;
  
  const now = Timestamp.now();
  const lockUntil = user.lockUntil;
  
  // Si es un Timestamp de Firestore
  if (lockUntil.toMillis) {
    return lockUntil.toMillis() > now.toMillis();
  }
  
  // Si es un número (timestamp en ms)
  if (typeof lockUntil === 'number') {
    return lockUntil > now.toMillis();
  }
  
  return false;
}

/**
 * Crea los campos para resetear el estado de login
 */
export function createLoginResetFields() {
  return {
    'user.loginAttempts': 0,
    'user.lockUntil': null,
    'user.lastSuccessfulAuth': Timestamp.now()
  };
}

/**
 * Crea los campos para un intento de login fallido
 */
export function createFailedLoginFields(maxAttempts = null, lockMs = null) {
  const fields = {
    'user.loginAttempts': FieldValue.increment(1),
    'user.lastFailedAttempt': Timestamp.now()
  };
  
  // Si se alcanzó el máximo de intentos, bloquear cuenta
  if (maxAttempts !== null && lockMs !== null) {
    fields['user.loginAttempts'] = maxAttempts;
    fields['user.lockUntil'] = Timestamp.fromMillis(Date.now() + lockMs);
  }
  
  return fields;
}

/**
 * Valida las credenciales básicas
 */
export function validateCredentials(username, password) {
  if (!username || !password) {
    throw new HttpsError('invalid-argument', ERROR_MESSAGES.MISSING_CREDENTIALS);
  }
}

/**
 * Crea respuesta estándar de login exitoso
 */
export function createLoginResponse(token, user, userId) {
  return {
    token,
    displayName: user.displayName || user.name,
    userId
  };
}

/**
 * Crea respuesta estándar de verificación
 */
export function createAuthCheckResponse(isValid) {
  return { valid: isValid };
}
