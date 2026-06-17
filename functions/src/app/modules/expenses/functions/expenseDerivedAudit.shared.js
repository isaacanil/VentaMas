export const EXPENSE_DERIVED_RECORD_ACTOR = 'system:expense-derived-sync';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const addIfPresent = (target, key, value) => {
  const cleaned = toCleanString(value);
  if (cleaned) {
    target[key] = cleaned;
  }
};

export const buildExpenseSourceAuditMetadata = (expenseRecord) => {
  const record = asRecord(expenseRecord);
  const metadata = {};

  addIfPresent(metadata, 'sourceExpenseCreatedBy', record.createdBy);
  addIfPresent(metadata, 'sourceExpenseUpdatedBy', record.updatedBy);

  return metadata;
};

export const mergeExpenseSourceAuditMetadata = (metadata, expenseRecord) => ({
  ...asRecord(metadata),
  ...buildExpenseSourceAuditMetadata(expenseRecord),
});
