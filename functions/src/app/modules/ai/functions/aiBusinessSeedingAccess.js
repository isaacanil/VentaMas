import { HttpsError } from 'firebase-functions/v2/https';

import { db } from '../../../core/config/firebase.js';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const readString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : '';

const normalizeRole = (value) => readString(value).toLowerCase();

const hasAiBusinessSeedingDeveloperAccess = (userData) => {
  const root = asRecord(userData);
  const platformRoles = asRecord(root.platformRoles);
  const platformNode = asRecord(root.platform);

  return (
    normalizeRole(root.activeRole || root.role) === 'dev' ||
    root.isDev === true ||
    platformRoles.dev === true ||
    platformNode.dev === true
  );
};

export const assertAiBusinessSeedingDeveloperAccess = async (request) => {
  const uid = readString(request?.auth?.uid);
  if (!uid) {
    throw new HttpsError(
      'unauthenticated',
      'Debes iniciar sesión con un usuario desarrollador para usar este asistente.',
    );
  }

  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists) {
    throw new HttpsError('permission-denied', 'Usuario no encontrado.');
  }

  const userData = userSnap.data() || {};
  if (!hasAiBusinessSeedingDeveloperAccess(userData)) {
    throw new HttpsError(
      'permission-denied',
      'Este asistente solo está disponible para usuarios desarrolladores.',
    );
  }

  return {
    uid,
    userData,
  };
};
