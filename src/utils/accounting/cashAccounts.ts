import type {
  CashAccount,
  CashAccountStatus,
  CashAccountType,
} from '@/types/accounting';
import { normalizeSupportedDocumentCurrency } from '@/utils/accounting/currencies';
import type { SupportedDocumentCurrency } from '@/utils/accounting/currencies';
import { toTimestamp } from '@/utils/firebase/toTimestamp';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeCashAccountStatus = (value: unknown): CashAccountStatus =>
  value === 'inactive' ? 'inactive' : 'active';

const normalizeCashAccountType = (value: unknown): CashAccountType | null => {
  if (typeof value !== 'string') return null;

  switch (value.trim().toLowerCase()) {
    case 'register':
    case 'petty_cash':
    case 'vault':
    case 'other':
      return value.trim().toLowerCase() as CashAccountType;
    default:
      return null;
  }
};

export interface CashAccountDraft {
  name: string;
  currency: SupportedDocumentCurrency;
  type?: CashAccountType | null;
  location?: string | null;
  openingBalance?: number | null;
  openingBalanceDate?: unknown;
  notes?: string | null;
}

export const normalizeCashAccountDraft = (
  value: Partial<CashAccountDraft> | null | undefined,
): CashAccountDraft => {
  const record = asRecord(value);

  return {
    name: toCleanString(record.name) ?? '',
    currency: normalizeSupportedDocumentCurrency(record.currency, 'DOP'),
    type: normalizeCashAccountType(record.type),
    location: toCleanString(record.location),
    openingBalance: safeNumber(record.openingBalance),
    openingBalanceDate: record.openingBalanceDate
      ? toTimestamp(record.openingBalanceDate)
      : null,
    notes: toCleanString(record.notes),
  };
};

export const normalizeCashAccountRecord = (
  id: string,
  businessId: string,
  value: unknown,
): CashAccount => {
  const record = asRecord(value);

  return {
    id,
    businessId,
    name: toCleanString(record.name) ?? 'Caja',
    currency: String(record.currency ?? 'DOP').trim().toUpperCase() as SupportedDocumentCurrency,
    status: normalizeCashAccountStatus(record.status),
    type: normalizeCashAccountType(record.type),
    location: toCleanString(record.location),
    openingBalance: safeNumber(record.openingBalance),
    openingBalanceDate: record.openingBalanceDate ?? null,
    createdAt: (record.createdAt as CashAccount['createdAt']) ?? null,
    updatedAt: (record.updatedAt as CashAccount['updatedAt']) ?? null,
    createdBy: toCleanString(record.createdBy),
    updatedBy: toCleanString(record.updatedBy),
    lastChangeId: toCleanString(record.lastChangeId),
    lastChangedAt: (record.lastChangedAt as CashAccount['lastChangedAt']) ?? null,
    notes: toCleanString(record.notes),
    metadata: asRecord(record.metadata),
  };
};

export const buildCashAccountLabel = (account: CashAccount): string => {
  const locationPrefix = account.location ? `${account.location} · ` : '';
  return `${locationPrefix}${account.name} (${account.currency})`;
};
