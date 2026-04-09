import type { UserRoleLike } from '@/types/users';

export const CORE_PRIVILEGED_ROLES = [
  'admin',
  'owner',
  'dev',
] as const satisfies ReadonlyArray<UserRoleLike>;

export const ADMIN_DEV_ROLES = ['admin', 'dev'] as const satisfies ReadonlyArray<UserRoleLike>;

export const ADMIN_MANAGER_ROLES = [
  'admin',
  'manager',
] as const satisfies ReadonlyArray<UserRoleLike>;

export const CASHIER_ONLY_ROLES = ['cashier'] as const satisfies ReadonlyArray<UserRoleLike>;

export const AUTHORIZATION_APPROVER_ROLES = [
  ...CORE_PRIVILEGED_ROLES,
  'manager',
] as const satisfies ReadonlyArray<UserRoleLike>;

export const CASH_COUNT_AUTHORIZATION_ROLES = [
  ...AUTHORIZATION_APPROVER_ROLES,
  'cashier',
] as const satisfies ReadonlyArray<UserRoleLike>;
