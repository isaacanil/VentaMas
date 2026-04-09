import type {
  BankAccount,
  BankAccountStatus,
  BankAccountType,
} from '@/types/accounting';
import { normalizeSupportedDocumentCurrency } from '@/utils/accounting/currencies';
import { toTimestamp } from '@/utils/firebase/toTimestamp';
import type { SupportedDocumentCurrency } from '@/utils/accounting/currencies';

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

const normalizeBankAccountStatus = (value: unknown): BankAccountStatus =>
  value === 'inactive' ? 'inactive' : 'active';

const normalizeBankAccountType = (value: unknown): BankAccountType | null => {
  if (typeof value !== 'string') return null;
  switch (value.trim().toLowerCase()) {
    case 'checking':
    case 'savings':
    case 'credit_card':
    case 'other':
      return value.trim().toLowerCase() as BankAccountType;
    default:
      return null;
  }
};

export interface BankAccountDraft {
  name: string;
  currency: SupportedDocumentCurrency;
  type?: BankAccountType | null;
  institutionName?: string | null;
  accountNumberLast4?: string | null;
  openingBalance?: number | null;
  openingBalanceDate?: unknown;
  notes?: string | null;
}

export const normalizeBankAccountDraft = (
  value: Partial<BankAccountDraft> | null | undefined,
): BankAccountDraft => {
  const record = asRecord(value);
  const accountNumberLast4Raw =
    toCleanString(record.accountNumberLast4) ?? toCleanString(record.last4);
  const accountNumberDigits = accountNumberLast4Raw?.replace(/\D/g, '') ?? '';

  return {
    name: toCleanString(record.name) ?? '',
    currency: normalizeSupportedDocumentCurrency(record.currency, 'DOP'),
    type: normalizeBankAccountType(record.type),
    institutionName: toCleanString(record.institutionName ?? record.bankName),
    accountNumberLast4: accountNumberDigits
      ? accountNumberDigits.slice(-4)
      : null,
    openingBalance: safeNumber(record.openingBalance),
    openingBalanceDate: record.openingBalanceDate
      ? toTimestamp(record.openingBalanceDate)
      : null,
    notes: toCleanString(record.notes),
  };
};

export const normalizeBankAccountRecord = (
  id: string,
  businessId: string,
  value: unknown,
): BankAccount => {
  const record = asRecord(value);

  return {
    id,
    businessId,
    name: toCleanString(record.name) ?? 'Cuenta bancaria',
    currency: String(record.currency ?? 'DOP').trim().toUpperCase() as SupportedDocumentCurrency,
    status: normalizeBankAccountStatus(record.status),
    type: normalizeBankAccountType(record.type),
    institutionName: toCleanString(record.institutionName ?? record.bankName),
    accountNumberLast4: toCleanString(record.accountNumberLast4 ?? record.last4),
    openingBalance: safeNumber(record.openingBalance),
    openingBalanceDate: record.openingBalanceDate ?? null,
    createdAt: (record.createdAt as BankAccount['createdAt']) ?? null,
    updatedAt: (record.updatedAt as BankAccount['updatedAt']) ?? null,
    createdBy: toCleanString(record.createdBy),
    updatedBy: toCleanString(record.updatedBy),
    lastChangeId: toCleanString(record.lastChangeId),
    lastChangedAt: (record.lastChangedAt as BankAccount['lastChangedAt']) ?? null,
    notes: toCleanString(record.notes),
    metadata: asRecord(record.metadata),
  };
};

export const buildBankAccountLabel = (account: BankAccount): string => {
  const bankPrefix = account.institutionName ? `${account.institutionName} · ` : '';
  const last4 = account.accountNumberLast4 ? ` · ****${account.accountNumberLast4}` : '';
  return `${bankPrefix}${account.name} (${account.currency})${last4}`;
};
