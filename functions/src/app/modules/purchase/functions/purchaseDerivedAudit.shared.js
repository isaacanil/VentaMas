export const PURCHASE_ACCOUNTING_EVENT_SYNC_ACTOR =
  'system:purchase-accounting-event-sync';
export const SUPPLIER_CREDIT_NOTE_SYNC_ACTOR =
  'system:purchase-supplier-credit-note-sync';

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

export const buildPurchaseSourceAuditMetadata = (purchaseRecord) => {
  const record = asRecord(purchaseRecord);
  const metadata = {};

  addIfPresent(metadata, 'sourcePurchaseCreatedBy', record.createdBy);
  addIfPresent(metadata, 'sourcePurchaseUpdatedBy', record.updatedBy);

  return metadata;
};
