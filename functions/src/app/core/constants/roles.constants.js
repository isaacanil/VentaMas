export const ROLE = Object.freeze({
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  BUYER: 'buyer',
  DEV: 'dev',
});

const ROLE_ALIASES = new Map([
  ['specialcashier1', ROLE.CASHIER],
  ['specialcashier2', ROLE.CASHIER],
  ['superadmin', ROLE.ADMIN],
  ['super-admin', ROLE.ADMIN],
  ['super_admin', ROLE.ADMIN],
]);

export const normalizeRole = (roleString) => {
  if (typeof roleString !== 'string') return '';
  const trimmed = roleString.trim();
  if (!trimmed) return '';
  const normalized = trimmed.toLowerCase();
  const compact = normalized.replace(/[\s_-]+/g, '');
  if (ROLE_ALIASES.has(compact)) {
    return ROLE_ALIASES.get(compact);
  }
  if (ROLE_ALIASES.has(normalized)) {
    return ROLE_ALIASES.get(normalized);
  }
  return normalized;
};
