import type {
  JournalEntry,
  JournalEntryLine,
  JournalEntryStatus,
} from '@/types/accounting';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toFiniteNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeJournalEntryStatus = (
  value: unknown,
): JournalEntryStatus => (value === 'reversed' ? 'reversed' : 'posted');

export const normalizeJournalEntryLineRecord = (
  value: unknown,
  lineNumberFallback: number,
): JournalEntryLine => {
  const record = asRecord(value);

  return {
    lineNumber: Number(record.lineNumber) || lineNumberFallback,
    accountId: toCleanString(record.accountId) ?? '',
    accountCode: toCleanString(record.accountCode),
    accountName: toCleanString(record.accountName),
    accountSystemKey: toCleanString(record.accountSystemKey),
    description: toCleanString(record.description),
    debit: toFiniteNumber(record.debit),
    credit: toFiniteNumber(record.credit),
    amountSource: (toCleanString(record.amountSource) ??
      null) as JournalEntryLine['amountSource'],
    reference: toCleanString(record.reference),
    costCenterId: toCleanString(record.costCenterId),
    departmentId: toCleanString(record.departmentId),
    metadata: asRecord(record.metadata),
  };
};

export const buildJournalEntryTotals = (
  lines: JournalEntryLine[],
): JournalEntry['totals'] =>
  lines.reduce(
    (totals, line) => ({
      debit: totals.debit + (Number.isFinite(line.debit) ? line.debit : 0),
      credit: totals.credit + (Number.isFinite(line.credit) ? line.credit : 0),
    }),
    { debit: 0, credit: 0 },
  );

export const normalizeJournalEntryRecord = (
  id: string,
  businessId: string,
  value: unknown,
): JournalEntry => {
  const record = asRecord(value);
  const lines = Array.isArray(record.lines)
    ? record.lines.map((line, index) =>
        normalizeJournalEntryLineRecord(line, index + 1),
      )
    : [];
  const totals = buildJournalEntryTotals(lines);

  return {
    id,
    businessId,
    eventId: toCleanString(record.eventId) ?? `manual:${id}`,
    eventType:
      (toCleanString(record.eventType) as JournalEntry['eventType']) ??
      'manual.entry.recorded',
    eventVersion: Number(record.eventVersion) || 1,
    status: normalizeJournalEntryStatus(record.status),
    entryDate: (record.entryDate as JournalEntry['entryDate']) ?? null,
    periodKey: toCleanString(record.periodKey),
    description: toCleanString(record.description),
    currency: (toCleanString(record.currency) ??
      null) as JournalEntry['currency'],
    functionalCurrency: (toCleanString(record.functionalCurrency) ??
      null) as JournalEntry['functionalCurrency'],
    sourceType: toCleanString(record.sourceType),
    sourceId: toCleanString(record.sourceId),
    reversalOfEntryId: toCleanString(record.reversalOfEntryId),
    reversalOfEventId: toCleanString(record.reversalOfEventId),
    totals: {
      debit: toFiniteNumber(asRecord(record.totals).debit) || totals.debit,
      credit: toFiniteNumber(asRecord(record.totals).credit) || totals.credit,
    },
    lines,
    projectorVersion: Number(record.projectorVersion) || null,
    createdAt: (record.createdAt as JournalEntry['createdAt']) ?? null,
    createdBy: toCleanString(record.createdBy),
    metadata: asRecord(record.metadata),
  };
};

export const toDateOrNull = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    const nextDate = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(nextDate.getTime()) ? null : nextDate;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    typeof (value as { seconds?: number }).seconds === 'number'
  ) {
    const nextDate = new Date(
      ((value as { seconds: number }).seconds ?? 0) * 1000,
    );
    return Number.isNaN(nextDate.getTime()) ? null : nextDate;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const nextDate = new Date(value);
    return Number.isNaN(nextDate.getTime()) ? null : nextDate;
  }

  return null;
};

export const buildAccountingPeriodKey = (value: Date | string): string => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');

  return `${year}-${month}`;
};
