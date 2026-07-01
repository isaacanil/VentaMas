import { hasRole } from '@/utils/roles/normalizeRole';

import { hasDeveloperAccess } from './developerAccess';

const FINANCIAL_DOCUMENT_VOID_ROLES = [
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
 * Access check for financial document voiding.
 * Mirrors the backend FINANCIAL_DOCUMENT_VOID role group and intentionally
 * excludes audit-only users from destructive AP payment actions.
 */
export const hasFinancialDocumentVoidAccess = (user: unknown): boolean => {
  if (hasDeveloperAccess(user)) return true;

  const record = asRecord(user);
  if (!record) return false;

  return hasRole(
    record.activeBusinessRole ?? record.activeRole ?? record.role,
    FINANCIAL_DOCUMENT_VOID_ROLES,
  );
};
