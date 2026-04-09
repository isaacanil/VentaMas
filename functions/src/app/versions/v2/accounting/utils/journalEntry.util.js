const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const roundJournalAmount = (value) =>
  Math.round(safeNumber(value) * 100) / 100;

export const normalizeJournalEntryStatus = (value) =>
  value === 'reversed' ? 'reversed' : 'posted';

const asDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === 'function') {
    const converted = value.toDate();
    return converted instanceof Date && !Number.isNaN(converted.getTime())
      ? converted
      : null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const resolveJournalPeriodKey = (value) => {
  const date = asDate(value);
  if (!date) return null;

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    '0',
  )}`;
};

export const normalizeJournalEntryLine = (value, index = 0) => {
  const record = asRecord(value);
  const lineNumber = Number(record.lineNumber);

  return {
    lineNumber:
      Number.isFinite(lineNumber) && lineNumber > 0 ? lineNumber : index + 1,
    accountId: toCleanString(record.accountId) || 'unmapped-account',
    accountCode: toCleanString(record.accountCode),
    accountName: toCleanString(record.accountName),
    accountSystemKey: toCleanString(record.accountSystemKey),
    description: toCleanString(record.description),
    debit: roundJournalAmount(record.debit),
    credit: roundJournalAmount(record.credit),
    amountSource: toCleanString(record.amountSource),
    reference: toCleanString(record.reference),
    costCenterId: toCleanString(record.costCenterId),
    departmentId: toCleanString(record.departmentId),
    metadata: asRecord(record.metadata),
  };
};

export const computeJournalEntryTotals = (lines = []) =>
  (Array.isArray(lines) ? lines : []).reduce(
    (accumulator, line) => ({
      debit: roundJournalAmount(accumulator.debit + safeNumber(line?.debit)),
      credit: roundJournalAmount(accumulator.credit + safeNumber(line?.credit)),
    }),
    { debit: 0, credit: 0 },
  );

export const isJournalEntryBalanced = (value, threshold = 0.01) => {
  const lines = Array.isArray(value) ? value : Array.isArray(value?.lines) ? value.lines : [];
  const totals = Array.isArray(value) ? computeJournalEntryTotals(lines) : value?.totals || computeJournalEntryTotals(lines);

  return Math.abs(safeNumber(totals.debit) - safeNumber(totals.credit)) <= threshold;
};

export const buildJournalEntry = ({
  businessId,
  event,
  entryId = null,
  status = 'posted',
  entryDate = null,
  periodKey = null,
  description = null,
  currency = null,
  functionalCurrency = null,
  sourceType = null,
  sourceId = null,
  reversalOfEntryId = null,
  reversalOfEventId = null,
  lines = [],
  projectorVersion = 1,
  createdAt = null,
  createdBy = null,
  metadata = null,
} = {}) => {
  const eventRecord = asRecord(event);
  const normalizedLines = (Array.isArray(lines) ? lines : []).map((line, index) =>
    normalizeJournalEntryLine(line, index),
  );
  const totals = computeJournalEntryTotals(normalizedLines);
  const resolvedEntryDate =
    entryDate ??
    eventRecord.entryDate ??
    eventRecord.occurredAt ??
    eventRecord.recordedAt ??
    createdAt ??
    null;

  return {
    id: toCleanString(entryId) || toCleanString(eventRecord.id) || 'journal-entry',
    businessId: toCleanString(businessId) || toCleanString(eventRecord.businessId),
    eventId: toCleanString(eventRecord.id),
    eventType: toCleanString(eventRecord.eventType),
    eventVersion: Number(eventRecord.eventVersion) || 1,
    status: normalizeJournalEntryStatus(status),
    entryDate: resolvedEntryDate,
    periodKey: toCleanString(periodKey) || resolveJournalPeriodKey(resolvedEntryDate),
    description: toCleanString(description),
    currency: toCleanString(currency) || toCleanString(eventRecord.currency),
    functionalCurrency:
      toCleanString(functionalCurrency) ||
      toCleanString(eventRecord.functionalCurrency),
    sourceType: toCleanString(sourceType) || toCleanString(eventRecord.sourceType),
    sourceId: toCleanString(sourceId) || toCleanString(eventRecord.sourceId),
    reversalOfEntryId: toCleanString(reversalOfEntryId),
    reversalOfEventId:
      toCleanString(reversalOfEventId) ||
      toCleanString(eventRecord.reversalOfEventId),
    totals,
    lines: normalizedLines,
    projectorVersion:
      Number.isFinite(Number(projectorVersion)) && Number(projectorVersion) > 0
        ? Number(projectorVersion)
        : 1,
    createdAt: createdAt ?? resolvedEntryDate,
    createdBy: toCleanString(createdBy),
    metadata: asRecord(metadata),
  };
};
