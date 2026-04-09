import { HttpsError } from 'firebase-functions/v2/https';

import { db } from '../../../../core/config/firebase.js';
import {
  ROLE,
  normalizeRole,
} from '../../../../core/constants/roles.constants.js';

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const hasPlatformDev = (userData) => {
  const root = userData && typeof userData === 'object' ? userData : {};
  const rootPlatform =
    root.platformRoles &&
    typeof root.platformRoles === 'object' &&
    !Array.isArray(root.platformRoles)
      ? root.platformRoles
      : {};

  return rootPlatform.dev === true;
};

export const assertBusinessOwner = async (userId, businessId) => {
  if (!userId || !businessId) {
    throw new HttpsError('invalid-argument', 'userId y businessId requeridos');
  }

  const businessSnap = await db.doc(`businesses/${businessId}`).get();
  if (!businessSnap.exists) {
    throw new HttpsError('not-found', 'Negocio no encontrado');
  }

  const ownerUid = toCleanString(businessSnap.get('ownerUid'));
  if (ownerUid) {
    if (ownerUid !== userId) {
      throw new HttpsError(
        'permission-denied',
        'Acceso restringido a propietarios del negocio',
      );
    }
    return true;
  }

  const owners = businessSnap.get('owners');
  if (Array.isArray(owners) && owners.length > 0) {
    if (!owners.includes(userId)) {
      throw new HttpsError(
        'permission-denied',
        'Acceso restringido a propietarios del negocio',
      );
    }
    return true;
  }

  const userSnap = await db.doc(`users/${userId}`).get();
  if (!userSnap.exists) {
    throw new HttpsError('permission-denied', 'Usuario no encontrado');
  }

  const userData = userSnap.data() || {};
  if (hasPlatformDev(userData)) {
    return true;
  }

  const ownerMemberSnap = await db
    .doc(`businesses/${businessId}/members/${userId}`)
    .get();
  if (
    ownerMemberSnap.exists &&
    normalizeRole(ownerMemberSnap.get('role') || '') === ROLE.OWNER
  ) {
    return true;
  }

  const rawRole =
    userData.activeRole ||
    userData.role ||
    '';
  const resolvedRole = normalizeRole(rawRole);
  if (resolvedRole === ROLE.ADMIN) {
    console.warn(
      '[ownership] Acceso Admin Legacy permitido para negocio sin dueño',
      { businessId, userId },
    );
    return true;
  }

  throw new HttpsError(
    'permission-denied',
    'Acceso restringido a propietarios del negocio',
  );
};
