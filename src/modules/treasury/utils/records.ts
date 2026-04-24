import type {
  BankReconciliationRecord,
  BankStatementLine,
  InternalTransfer,
  LiquidityAccountType,
  LiquidityEntryDirection,
  LiquidityEntrySourceType,
  LiquidityLedgerEntry,
} from '@/types/accounting';
import type { CashMovement } from '@/types/payments';
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
    case 'invoice_pos':
    case 'receivable_payment':
    case 'receivable_payment_void':
    case 'supplier_payment':
    case 'expense':
    case 'credit_note_application':
    case 'cash_adjustment':
    case 'bank_statement_adjustment':
    case 'internal_transfer':
    case 'manual_adjustment':
    case 'bank_reconciliation':
    case 'opening_balance':
      return value;
    default:
      return 'manual_adjustment';
  }
};

const resolveLedgerAccountId = (value: unknown): string => {
  const record = asRecord(value);
  return String(
    record.bankAccountId ?? record.cashAccountId ?? record.cashCountId ?? '',
  );
};

const resolveLedgerAccountType = (value: unknown): LiquidityAccountType => {
  const record = asRecord(value);
  return normalizeLiquidityAccountType(record.type);
};

const toBoolean = (value: unknown): boolean => value === true;

const resolveCashMovementAccountId = (movement: Record<string, unknown>): string => {
  const bankAccountId = toCleanString(movement.bankAccountId);
  if (bankAccountId) return bankAccountId;

  const cashAccountId = toCleanString(movement.cashAccountId);
  if (cashAccountId) return cashAccountId;

  return toCleanString(movement.cashCountId) ?? '';
};

const resolveCashMovementAccountType = (
  movement: Record<string, unknown>,
): LiquidityAccountType => {
  if (toCleanString(movement.bankAccountId)) {
    return 'bank';
  }

  return 'cash';
};

const buildCashMovementDescription = (
  sourceType: LiquidityEntrySourceType,
  record: Record<string, unknown>,
) => {
  const metadata = asRecord(record.metadata);
  const recordDescription = toCleanString(record.description);
  const paymentComment = toCleanString(metadata.paymentComment);
  const note = toCleanString(metadata.note);
  const explicitDescription = toCleanString(metadata.description);
  if (recordDescription) return recordDescription;
  if (explicitDescription) return explicitDescription;
  if (paymentComment) return paymentComment;
  if (note) return note;

  switch (sourceType) {
    case 'invoice_pos':
      return 'Cobro de venta';
    case 'receivable_payment':
      return 'Cobro CxC';
    case 'receivable_payment_void':
      return 'Reverso de cobro CxC';
    case 'supplier_payment':
      return 'Pago a suplidor';
    case 'expense':
      return 'Gasto pagado';
    case 'credit_note_application':
      return 'Aplicacion de nota de credito';
    case 'internal_transfer':
      return 'Transferencia interna';
    case 'cash_adjustment':
      return 'Ajuste de caja';
    case 'bank_statement_adjustment':
      return 'Ajuste por diferencia bancaria';
    default:
      return null;
  }
};

export const normalizeCashMovementAsLiquidityLedgerEntry = (
  id: string,
  businessId: string,
  value: unknown,
): LiquidityLedgerEntry | null => {
  const record = asRecord(value) as Record<string, unknown> & Partial<CashMovement>;
  const sourceType = normalizeLiquidityEntrySourceType(record.sourceType);
  const accountId = resolveCashMovementAccountId(record);
  if (!accountId) {
    return null;
  }

  const bankAccountId = toCleanString(record.bankAccountId);
  const cashAccountId = toCleanString(record.cashAccountId);
  const cashCountId = toCleanString(record.cashCountId);
  const metadata = asRecord(record.metadata);
  const method = toCleanString(record.method);

  return {
    id,
    businessId,
    accountId,
    accountType: resolveCashMovementAccountType(record),
    currency: normalizeSupportedDocumentCurrency(record.currency, 'DOP'),
    direction: normalizeLiquidityDirection(record.direction),
    amount: safeNumber(record.amount),
    occurredAt: record.occurredAt ?? record.createdAt ?? null,
    createdAt: record.createdAt ?? null,
    createdBy: toCleanString(record.createdBy),
    status: record.status === 'void' ? 'void' : 'posted',
    sourceType,
    sourceId: toCleanString(record.sourceId),
    reference: toCleanString(record.reference),
    description: buildCashMovementDescription(sourceType, record),
    reconciliationStatus: bankAccountId
      ? toCleanString(record.reconciliationStatus) === 'reconciled'
        ? 'reconciled'
        : 'unreconciled'
      : null,
    reconciliationId: toCleanString(record.reconciliationId),
    reconciledAt: record.reconciledAt ?? null,
    counterpartyAccountId: null,
    counterpartyAccountType: null,
    metadata: {
      ...metadata,
      method,
      sourceDocumentId: toCleanString(record.sourceDocumentId),
      sourceDocumentType: toCleanString(record.sourceDocumentType),
      counterpartyType: toCleanString(record.counterpartyType),
      counterpartyId: toCleanString(record.counterpartyId),
      bankAccountId,
      cashAccountId,
      cashCountId,
      impactsCashDrawer: toBoolean(record.impactsCashDrawer),
      impactsBankLedger: toBoolean(record.impactsBankLedger),
      bankStatementLineId: toCleanString(record.bankStatementLineId),
    },
  };
};

export interface InternalTransferDraft {
  allowOverdraft?: boolean;
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
  const fromLedger = asRecord(record.from);
  const toLedger = asRecord(record.to);

  return {
    id,
    businessId,
    fromAccountId:
      String(record.fromAccountId ?? '') || resolveLedgerAccountId(fromLedger),
    fromAccountType:
      record.fromAccountType != null
        ? normalizeLiquidityAccountType(record.fromAccountType)
        : resolveLedgerAccountType(fromLedger),
    toAccountId:
      String(record.toAccountId ?? '') || resolveLedgerAccountId(toLedger),
    toAccountType:
      record.toAccountType != null
        ? normalizeLiquidityAccountType(record.toAccountType)
        : resolveLedgerAccountType(toLedger),
    currency: normalizeSupportedDocumentCurrency(record.currency, 'DOP'),
    amount: safeNumber(record.amount),
    occurredAt: record.occurredAt ?? record.createdAt ?? null,
    status: record.status === 'void' ? 'void' : 'posted',
    reference: toCleanString(record.reference),
    notes: toCleanString(record.notes ?? record.note),
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

export interface BankStatementLineDraft {
  amount: number;
  bankAccountId: string;
  description?: string | null;
  direction: 'in' | 'out';
  movementIds?: string[];
  reference?: string | null;
  statementDate?: unknown;
}

export interface ResolveBankStatementLineDraft {
  movementIds: string[];
  resolutionMode?: 'match' | 'write_off';
  statementLineId: string;
  writeOffNotes?: string | null;
  writeOffReason?: string | null;
}

export const normalizeBankReconciliationRecord = (
  id: string,
  businessId: string,
  value: unknown,
): BankReconciliationRecord => {
  const record = asRecord(value);
  const metadata = asRecord(record.metadata);
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
    reconciledMovementCount: safeNumber(
      record.reconciledMovementCount ?? metadata.reconciledMovementCount,
    ),
    unreconciledMovementCount: safeNumber(
      record.unreconciledMovementCount ?? metadata.unreconciledMovementCount,
    ),
    statementLineCount: safeNumber(
      record.statementLineCount ?? metadata.statementLineCount,
    ),
    notes: toCleanString(record.notes ?? record.note),
    reference: toCleanString(record.reference),
    createdAt: record.createdAt ?? null,
    createdBy: toCleanString(record.createdBy),
    metadata,
  };
};

export const normalizeBankStatementLineRecord = (
  id: string,
  businessId: string,
  value: unknown,
): BankStatementLine => {
  const record = asRecord(value);

  return {
    id,
    businessId,
    bankAccountId: String(record.bankAccountId ?? ''),
    reconciliationId: toCleanString(record.reconciliationId),
    lineType: record.lineType === 'transaction' ? 'transaction' : 'closing_balance',
    status:
      record.status === 'pending'
        ? 'pending'
        : record.status === 'written_off'
          ? 'written_off'
          : 'reconciled',
    statementDate: record.statementDate ?? record.createdAt ?? null,
    amount:
      record.amount == null ? null : safeNumber(record.amount),
    runningBalance:
      record.runningBalance == null ? null : safeNumber(record.runningBalance),
    direction:
      record.direction === 'out' ? 'out' : record.direction === 'in' ? 'in' : null,
    description: toCleanString(record.description),
    reference: toCleanString(record.reference),
    createdAt: record.createdAt ?? null,
    createdBy: toCleanString(record.createdBy),
    metadata: asRecord(record.metadata),
  };
};

export const toNormalizedOccurredAt = (value: unknown) =>
  value ? toTimestamp(value) : null;
