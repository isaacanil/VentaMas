import { HttpsError } from 'firebase-functions/v2/https';

import { sanitizePrefix } from '../utils/ncfLedger.util.js';

const LEDGER_ALLOWED_ROLES = new Set(['dev', 'admin', 'owner', 'manager']);
const GLOBAL_ROLES = new Set(['dev']);
const LEDGER_ALLOWED_PERMISSIONS = new Set([
  'settings.manage',
  'settings.ncf',
  'ncf.manage',
  'ncf.rebuild',
  'ncf.read',
  'admin.all',
]);

const toArray = (value) => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value === undefined || value === null || value === '') return [];
  return [String(value)];
};

const resolveUserData = (userSnap) => {
  const raw = userSnap?.data() ?? {};
  const nested = raw.user ?? {};
  return { raw, nested };
};

const resolveUserRoles = (userData) => {
  const { raw, nested } = userData;
  const roles = new Set();
  toArray(raw.role).forEach((r) => roles.add(r.toLowerCase()));
  toArray(raw.roles).forEach((r) => roles.add(r.toLowerCase()));
  toArray(nested.role).forEach((r) => roles.add(r.toLowerCase()));
  toArray(nested.roles).forEach((r) => roles.add(r.toLowerCase()));
  if (raw.isAdmin || nested.isAdmin) roles.add('admin');
  if (raw.isOwner || nested.isOwner) roles.add('owner');
  if (raw.isManager || nested.isManager) roles.add('manager');
  if (raw.isDev || nested.isDev) roles.add('dev');
  if (raw.isSuperAdmin || nested.isSuperAdmin) roles.add('super-admin');
  return roles;
};

const resolveUserPermissions = (userData) => {
  const { raw, nested } = userData;
  const perms = new Set();
  toArray(raw.permissions).forEach((p) => perms.add(p));
  toArray(raw.perms).forEach((p) => perms.add(p));
  toArray(nested.permissions).forEach((p) => perms.add(p));
  toArray(nested.perms).forEach((p) => perms.add(p));
  return perms;
};

export const resolveUserBusinessId = (userSnap) => {
  if (!userSnap?.exists) return null;
  return (
    userSnap.get('businessID') ||
    userSnap.get('user.businessID') ||
    userSnap.get('user.businessId') ||
    userSnap.get('user.business.id') ||
    null
  );
};

export const evaluateLedgerAccess = (userSnap, { errorMessage } = {}) => {
  if (!userSnap?.exists) {
    throw new HttpsError('permission-denied', 'Usuario no encontrado');
  }

  const userData = resolveUserData(userSnap);
  const roles = resolveUserRoles(userData);
  const permissions = resolveUserPermissions(userData);

  const hasAllowedRole = Array.from(roles).some((role) =>
    LEDGER_ALLOWED_ROLES.has(role),
  );
  const hasAllowedPermission = Array.from(permissions).some((perm) =>
    LEDGER_ALLOWED_PERMISSIONS.has(perm),
  );

  const hasLedgerAccess = hasAllowedRole || hasAllowedPermission;
  const hasGlobalAccess =
    Array.from(roles).some((role) => GLOBAL_ROLES.has(role)) ||
    permissions.has('admin.all');

  if (!hasLedgerAccess) {
    throw new HttpsError(
      'permission-denied',
      errorMessage || 'No tienes permisos para operar el ledger de NCF.',
    );
  }

  return { roles, permissions, hasGlobalAccess };
};

export const normalizePrefixes = (prefixes) => {
  if (!Array.isArray(prefixes)) return null;
  const normalized = prefixes
    .filter((item) => typeof item === 'string')
    .map((item) => sanitizePrefix(item))
    .filter((item) => !!item);
  return normalized.length ? Array.from(new Set(normalized)) : null;
};
