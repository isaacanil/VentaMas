import type {
  BankReconciliationRecord,
  InternalTransfer,
  LiquidityAccountType,
  LiquidityEntryDirection,
  LiquidityEntrySourceType,
  LiquidityLedgerEntry,
} from '@/types/accounting';
import { normalizeSupportedDocumentCurrency } from '@/utils/accounting/currencies';
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

const safeNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeLiquidityAccountType = (
  value: unknown,
): LiquidityAccountType => (value === 'cash' ? 'cash' : 'bank');

const normalizeLiquidityDirection = (
  value: unknown,
): LiquidityEntryDirection => (value === 'out' ? 'out' : 'in');

const normalizeLiquidityEntrySourceType = (
  value: unknown,
): LiquidityEntrySourceType => {
  switch (value) {
    case 'internal_transfer':
    case 'manual_adjustment':
    case 'bank_reconciliation':
    case 'opening_balance':
      return value;
    default:
      return 'manual_adjustment';
  }
};

export const normalizeLiquidityLedgerEntryRecord = (
  id: string,
  businessId: string,
  value: unknown,
): LiquidityLedgerEntry => {
  const record = asRecord(value);

  return {
    id,
    businessId,
    accountId: String(record.accountId ?? ''),
    accountType: normalizeLiquidityAccountType(record.accountType),
    currency: normalizeSupportedDocumentCurrency(record.currency, 'DOP'),
    direction: normalizeLiquidityDirection(record.direction),
    amount: safeNumber(record.amount),
    occurredAt: record.occurredAt ?? record.createdAt ?? null,
    createdAt: record.createdAt ?? null,
    createdBy: toCleanString(record.createdBy),
    status: record.status === 'void' ? 'void' : 'posted',
    sourceType: normalizeLiquidityEntrySourceType(record.sourceType),
    sourceId: toCleanString(record.sourceId),
    reference: toCleanString(record.reference),
    description: toCleanString(record.description),
    counterpartyAccountId: toCleanString(record.counterpartyAccountId),
    counterpartyAccountType:
      record.counterpartyAccountType === 'cash'
        ? 'cash'
        : record.counterpartyAccountType === 'bank'
          ? 'bank'
          : null,
    metadata: asRecord(record.metadata),
  };
};

export interface InternalTransferDraft {
  amount: number;
  currency: string;
  fromAccountId: string;
  fromAccountType: LiquidityAccountType;
  occurredAt?: unknown;
  notes?: string | null;
  reference?: string | null;
  toAccountId: string;
  toAccountType: LiquidityAccountType;
}

export const normalizeInternalTransferRecord = (
  id: string,
  businessId: string,
  value: unknown,
): InternalTransfer => {
  const record = asRecord(value);

  return {
    id,
    businessId,
    fromAccountId: String(record.fromAccountId ?? ''),
    fromAccountType: normalizeLiquidityAccountType(record.fromAccountType),
    toAccountId: String(record.toAccountId ?? ''),
    toAccountType: normalizeLiquidityAccountType(record.toAccountType),
    currency: normalizeSupportedDocumentCurrency(record.currency, 'DOP'),
    amount: safeNumber(record.amount),
    occurredAt: record.occurredAt ?? record.createdAt ?? null,
    status: record.status === 'void' ? 'void' : 'posted',
    reference: toCleanString(record.reference),
    notes: toCleanString(record.notes),
    createdAt: record.createdAt ?? null,
    createdBy: toCleanString(record.createdBy),
    ledgerEntryIds: Array.isArray(record.ledgerEntryIds)
      ? record.ledgerEntryIds
          .map((entryId) => toCleanString(entryId))
          .filter((entryId): entryId is string => Boolean(entryId))
      : null,
    metadata: asRecord(record.metadata),
  };
};

export interface BankReconciliationDraft {
  bankAccountId: string;
  statementBalance: number;
  statementDate?: unknown;
  notes?: string | null;
  reference?: string | null;
}

export const normalizeBankReconciliationRecord = (
  id: string,
  businessId: string,
  value: unknown,
): BankReconciliationRecord => {
  const record = asRecord(value);
  const statementBalance = safeNumber(record.statementBalance);
  const ledgerBalance = safeNumber(record.ledgerBalance);
  const variance =
    typeof record.variance === 'number'
      ? record.variance
      : Number((statementBalance - ledgerBalance).toFixed(2));

  return {
    id,
    businessId,
    bankAccountId: String(record.bankAccountId ?? ''),
    statementDate: record.statementDate ?? record.createdAt ?? null,
    statementBalance,
    ledgerBalance,
    variance,
    status: record.status === 'balanced' ? 'balanced' : variance === 0 ? 'balanced' : 'variance',
    notes: toCleanString(record.notes),
    reference: toCleanString(record.reference),
    createdAt: record.createdAt ?? null,
    createdBy: toCleanString(record.createdBy),
    metadata: asRecord(record.metadata),
  };
};

export const toNormalizedOccurredAt = (value: unknown) =>
  value ? toTimestamp(value) : null;
