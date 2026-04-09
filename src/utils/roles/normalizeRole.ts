import type { UserRoleLike } from '@/types/users';

const ROLE_ALIASES: Record<string, UserRoleLike> = {
  specialcashier1: 'cashier',
  specialcashier2: 'cashier',
  superadmin: 'admin',
  'super-admin': 'admin',
  super_admin: 'admin',
};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Admin',
  manager: 'Gerente',
  cashier: 'Cajero',
  buyer: 'Comprador',
  dev: 'Dev',
};

export const normalizeRoleId = (value: unknown): UserRoleLike | null => {
  const role = toCleanString(value);
  if (!role) return null;

  const normalized = role.toLowerCase();
  const compact = normalized.replace(/[\s_-]+/g, '');

  return ROLE_ALIASES[compact] || ROLE_ALIASES[normalized] || normalized;
};

export const isRole = (value: unknown, expectedRole: UserRoleLike): boolean =>
  normalizeRoleId(value) === normalizeRoleId(expectedRole);

export const hasRole = (
  value: unknown,
  allowedRoles: ReadonlyArray<UserRoleLike | string>,
): boolean => {
  const role = normalizeRoleId(value);
  if (!role) return false;

  return allowedRoles.some((allowedRole) => normalizeRoleId(allowedRole) === role);
};

export const getRoleLabel = (
  value: unknown,
  fallbackLabel = 'Rol no definido',
): string => {
  const normalized = normalizeRoleId(value);
  if (!normalized) return fallbackLabel;
  return ROLE_LABELS[normalized] || fallbackLabel;
};
