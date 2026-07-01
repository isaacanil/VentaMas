import { hasRole } from '@/utils/roles/normalizeRole';

import { hasDeveloperAccess } from './developerAccess';

const TREASURY_OPERATOR_ROLES = [
  'owner',
  'admin',
  'manager',
  'accountant',
  'controller',
] as const;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

/**
 * Access check for registering treasury/AP payments.
 * Mirrors the backend TREASURY_OPERATOR role group and excludes cashier,
 * buyer and audit-only users from supplier payment posting.
 */
export const hasTreasuryOperatorAccess = (user: unknown): boolean => {
  if (hasDeveloperAccess(user)) return true;

  const record = asRecord(user);
  if (!record) return false;

  return hasRole(
    record.activeBusinessRole ?? record.activeRole ?? record.role,
    TREASURY_OPERATOR_ROLES,
  );
};
