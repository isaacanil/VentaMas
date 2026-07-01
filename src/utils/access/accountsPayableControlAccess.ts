import type { VendorBillControlAction } from '@/domain/accountsPayable/vendorBills/types';
import { hasRole } from '@/utils/roles/normalizeRole';

import { hasDeveloperAccess } from './developerAccess';

const ACCOUNTS_PAYABLE_CONTROL_WRITE_ROLES = [
  'owner',
  'admin',
  'accountant',
  'controller',
] as const;

const ACCOUNTS_PAYABLE_CONTROL_ADMIN_ROLES = [
  'owner',
  'admin',
  'controller',
] as const;

const ACCOUNTS_PAYABLE_CONTROL_ADMIN_ACTIONS =
  new Set<VendorBillControlAction>([
    'approve',
    'reject',
    'release_hold',
    'resolve_dispute',
    'void',
  ]);

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const resolveUserRole = (user: unknown): unknown => {
  const record = asRecord(user);
  if (!record) return null;

  return record.activeBusinessRole ?? record.activeRole ?? record.role;
};

export const hasAccountsPayableControlWriteAccess = (
  user: unknown,
): boolean => {
  if (hasDeveloperAccess(user)) return true;

  return hasRole(resolveUserRole(user), ACCOUNTS_PAYABLE_CONTROL_WRITE_ROLES);
};

export const hasAccountsPayableControlAdminAccess = (
  user: unknown,
): boolean => {
  if (hasDeveloperAccess(user)) return true;

  return hasRole(resolveUserRole(user), ACCOUNTS_PAYABLE_CONTROL_ADMIN_ROLES);
};

export const isAccountsPayableControlAdminAction = (
  action: VendorBillControlAction,
): boolean => ACCOUNTS_PAYABLE_CONTROL_ADMIN_ACTIONS.has(action);

export const canManageAccountsPayableControlAction = (
  user: unknown,
  action: VendorBillControlAction,
): boolean =>
  isAccountsPayableControlAdminAction(action)
    ? hasAccountsPayableControlAdminAccess(user)
    : hasAccountsPayableControlWriteAccess(user);

export const getAccountsPayableControlAccessDeniedMessage = (
  user: unknown,
  action?: VendorBillControlAction | null,
): string | null => {
  if (!action) {
    return hasAccountsPayableControlWriteAccess(user)
      ? null
      : 'Tu rol no puede gestionar controles de CxP.';
  }

  if (canManageAccountsPayableControlAction(user, action)) return null;

  return isAccountsPayableControlAdminAction(action)
    ? 'Esta acción requiere rol contable administrador.'
    : 'Tu rol no puede gestionar controles de CxP.';
};
