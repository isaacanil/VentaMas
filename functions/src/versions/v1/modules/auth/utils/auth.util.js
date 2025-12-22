import argon2 from 'argon2';
import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import { db } from '../../../../../core/config/firebase.js';

import { argon2Options } from './hash.util.js';

/**
 * Valida que todos los campos requeridos estén presentes
 */
export function validateRequiredFields(data, requiredFields) {
  const missing = requiredFields.filter((field) => !data[field]);
  if (missing.length > 0) {
    throw new HttpsError(
      'invalid-argument',
      `Campos obligatorios faltan: ${missing.join(', ')}`,
    );
  }
}

/**
 * Valida la contraseña según las reglas de negocio
 */
export function validatePassword(password) {
  if (!password) {
    throw new HttpsError('invalid-argument', 'La contraseña es requerida');
  }
}

/**
 * Normaliza el nombre de usuario
 */
export function normalizeUserName(name) {
  if (!name || typeof name !== 'string') {
    throw new HttpsError('invalid-argument', 'Nombre de usuario inválido');
  }
  return name.toLowerCase().trim();
}

/**
 * Verifica que un nombre de usuario sea único en la transacción
 */
export async function ensureUniqueUsername(tx, name, excludeId = null) {
  const normName = normalizeUserName(name);
  const usersCol = db.collection('users');

  let query = usersCol.where('user.name', '==', normName).limit(1);
  const dup = await tx.get(query);

  // Si hay duplicado y no es el mismo usuario que estamos actualizando
  if (!dup.empty && (!excludeId || dup.docs[0].id !== excludeId)) {
    throw new HttpsError('already-exists', 'Nombre de usuario ya existe');
  }

  return normName;
}

/**
 * Crea los campos de auditoría para un nuevo registro
 */
export function createAuditFields(actor) {
  const now = Timestamp.now();
  return {
    createdAt: now,
    createdBy: actor?.uid || 'system',
    updatedAt: now,
  };
}

/**
 * Crea los campos de auditoría para actualización
 */
export function createUpdateAuditFields(actor) {
  return {
    updatedAt: Timestamp.now(),
    updatedBy: actor?.uid || 'system',
  };
}

/**
 * Hash de contraseña con configuración estándar
 */
export async function hashPassword(password) {
  validatePassword(password);
  return await argon2.hash(password, argon2Options);
}

/**
 * Crea los campos relacionados con autenticación para un nuevo usuario
 */
export function createAuthFields() {
  return {
    active: true,
    loginAttempts: 0,
    lockUntil: null,
    lastSuccessfulAuth: null,
    lastFailedAttempt: null,
  };
}

/**
 * Crea los campos para resetear el lockout de login
 */
export function createPasswordResetFields() {
  return {
    'user.loginAttempts': 0,
    'user.lockUntil': null,
  };
}

/**
 * Valida que el usuario tenga los permisos requeridos
 */
export function validatePermissions(actor, requiredRoles = []) {
  if (!actor?.roles || !Array.isArray(actor.roles)) {
    throw new HttpsError('permission-denied', 'Sin permisos');
  }

  const hasPermission = requiredRoles.some((role) =>
    actor.roles.includes(role),
  );
  if (!hasPermission) {
    throw new HttpsError('permission-denied', 'Sin permisos suficientes');
  }
}

/**
 * Valida que un usuario puede modificar a otro usuario
 */
export function validateUserModificationPermissions(actor, targetUserId) {
  const isAdmin = actor?.roles?.includes('admin');
  const isSelf = actor?.uid === targetUserId;

  if (!isAdmin && !isSelf) {
    throw new HttpsError(
      'permission-denied',
      'Sin permisos para modificar este usuario',
    );
  }

  // Los admins no pueden desactivarse a sí mismos
  return { isAdmin, isSelf };
}

/**
 * Obtiene un usuario por ID con validación de existencia
 */
export async function getUserById(tx, userId) {
  const ref = db.collection('users').doc(userId);
  const snap = await tx.get(ref);

  if (!snap.exists) {
    throw new HttpsError('not-found', 'Usuario no encontrado');
  }

  return { ref, data: snap.data() };
}

/**
 * Prepara los datos del usuario para creación
 */
export async function prepareUserCreationData(userData, actor) {
  const { name, password, businessID, role } = userData;

  // Validar campos requeridos
  validateRequiredFields(userData, ['name', 'password', 'businessID', 'role']);

  // Procesar datos
  const hashedPassword = await hashPassword(password);
  const authFields = createAuthFields();

  return {
    ...createAuditFields(actor),
    user: {
      name: name.trim(),
      displayName: name.trim(),
      password: hashedPassword,
      businessID,
      role,
      ...authFields,
    },
  };
}

/**
 * Prepara los datos del usuario para actualización
 */
export async function prepareUserUpdateData(updates, actor) {
  const patch = {};

  // Procesar campos específicos
  if ('displayName' in updates) {
    patch['user.displayName'] = updates.displayName?.trim();
  }

  if ('businessID' in updates) {
    patch['user.businessID'] = updates.businessID;
  }

  if ('role' in updates) {
    patch['user.role'] = updates.role;
  }

  if ('active' in updates) {
    patch['user.active'] = !!updates.active;
  }

  // Hash de contraseña si se proporciona
  if ('password' in updates) {
    patch['user.password'] = await hashPassword(updates.password);
    // Resetear lockout cuando se cambia contraseña
    patch['user.loginAttempts'] = 0;
    patch['user.lockUntil'] = null;
  }

  // Agregar campos de auditoría
  Object.assign(patch, createUpdateAuditFields(actor));

  return patch;
}
