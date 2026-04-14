import { normalizePaymentMethodCode } from './accountingContract.util.js';
import {
  ACCOUNTING_EVENT_STATUS_VALUES,
  ACCOUNTING_EVENT_TYPE_VALUES,
  ACCOUNTING_PROJECTION_STATUS_VALUES,
  AccountingEventProjectionSchema,
  AccountingEventSchema,
} from '../../../../../shared/accountingSchemas.js';

const ACCOUNTING_EVENT_TYPES = new Set(ACCOUNTING_EVENT_TYPE_VALUES);

const BANK_PAYMENT_METHODS = new Set(['card', 'transfer']);
const CASH_PAYMENT_METHODS = new Set(['cash']);
const OTHER_PAYMENT_METHODS = new Set(['creditNote']);

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

export const roundAccountingAmount = (value) =>
  Math.round(safeNumber(value) * 100) / 100;

export const normalizeAccountingEventType = (
  value,
  fallback = 'invoice.committed',
) => (ACCOUNTING_EVENT_TYPES.has(value) ? value : fallback);

export const normalizeAccountingEventVersion = (value, fallback = 1) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const normalizeAccountingEventStatus = (value) => {
  return ACCOUNTING_EVENT_STATUS_VALUES.find((status) => status === value) || 'recorded';
};

export const normalizeAccountingProjectionStatus = (value) => {
  return (
    ACCOUNTING_PROJECTION_STATUS_VALUES.find((status) => status === value) ||
    'pending'
  );
};

export const sanitizeAccountingDocIdPart = (value) => {
  const cleaned = toCleanString(value);
  if (!cleaned) return null;

  const normalized = cleaned
    .replace(/[\\/]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || null;
};

export const resolveAccountingSourceDocumentType = ({
  sourceDocumentType = null,
  sourceType = null,
} = {}) => toCleanString(sourceDocumentType) || toCleanString(sourceType);

export const resolveAccountingSourceDocumentId = ({
  sourceDocumentId = null,
  sourceId = null,
} = {}) => toCleanString(sourceDocumentId) || toCleanString(sourceId);

export const buildAccountingEventId = ({ eventType, sourceId, qualifier } = {}) =>
  [
    sanitizeAccountingDocIdPart(
      normalizeAccountingEventType(eventType, 'invoice.committed'),
    ),
    sanitizeAccountingDocIdPart(sourceId) || 'event',
    sanitizeAccountingDocIdPart(qualifier),
  ]
    .filter(Boolean)
    .join('__');

export const resolveAccountingEventDedupeKey = ({
  businessId = null,
  eventType = null,
  sourceId = null,
  qualifier = null,
  eventVersion = 1,
  dedupeKey = null,
} = {}) =>
  toCleanString(dedupeKey) ||
  [
    toCleanString(businessId),
    normalizeAccountingEventType(eventType, 'invoice.committed'),
    toCleanString(sourceId),
    sanitizeAccountingDocIdPart(qualifier),
    normalizeAccountingEventVersion(eventVersion),
  ]
    .filter(Boolean)
    .join(':');

export const resolveAccountingEventIdempotencyKey = ({
  idempotencyKey = null,
  dedupeKey = null,
} = {}) => toCleanString(idempotencyKey) || toCleanString(dedupeKey);

const normalizeMonetarySnapshot = (value) => {
  const record = asRecord(value);
  return {
    amount: roundAccountingAmount(record.amount),
    taxAmount: roundAccountingAmount(record.taxAmount),
    functionalAmount: roundAccountingAmount(record.functionalAmount),
    functionalTaxAmount: roundAccountingAmount(record.functionalTaxAmount),
  };
};

const normalizeTreasurySnapshot = (value) => {
  const record = asRecord(value);
  const paymentChannel = toCleanString(record.paymentChannel);

  return {
    cashAccountId: toCleanString(record.cashAccountId),
    cashCountId: toCleanString(record.cashCountId),
    bankAccountId: toCleanString(record.bankAccountId),
    paymentChannel:
      paymentChannel &&
      ['cash', 'bank', 'mixed', 'other'].includes(paymentChannel)
        ? paymentChannel
        : null,
  };
};

const normalizeAccountingEventError = (value) => {
  const record = asRecord(value);
  const code = toCleanString(record.code);
  const message = toCleanString(record.message);

  if (!code && !message) {
    return null;
  }

  return {
    code: code || 'projection-error',
    message: message || 'Error proyectando evento contable.',
    at: record.at ?? null,
    details: asRecord(record.details),
  };
};

export const buildAccountingEventProjection = ({
  status = 'pending',
  projectorVersion = 1,
  journalEntryId = null,
  lastAttemptAt = null,
  projectedAt = null,
  lastError = null,
} = {}) =>
  AccountingEventProjectionSchema.parse({
  status: normalizeAccountingProjectionStatus(status),
  projectorVersion:
    Number.isFinite(Number(projectorVersion)) && Number(projectorVersion) > 0
      ? Number(projectorVersion)
      : 1,
  journalEntryId: toCleanString(journalEntryId),
  lastAttemptAt: lastAttemptAt ?? null,
  projectedAt: projectedAt ?? null,
  lastError: normalizeAccountingEventError(lastError),
  });

export const resolveAccountingPaymentChannel = (paymentMethods = []) => {
  let hasCash = false;
  let hasBank = false;
  let hasOther = false;

  (Array.isArray(paymentMethods) ? paymentMethods : []).forEach((method) => {
    const hasExplicitAmount =
      method &&
      typeof method === 'object' &&
      ('amount' in method || 'value' in method);
    const amount = safeNumber(method?.amount ?? method?.value);
    if (hasExplicitAmount && amount <= 0) {
      return;
    }

    const methodCode = normalizePaymentMethodCode(
      method?.method ?? method?.code ?? method,
    );
    if (!methodCode) return;

    if (CASH_PAYMENT_METHODS.has(methodCode)) {
      hasCash = true;
      return;
    }
    if (BANK_PAYMENT_METHODS.has(methodCode)) {
      hasBank = true;
      return;
    }
    if (OTHER_PAYMENT_METHODS.has(methodCode)) {
      hasOther = true;
    }
  });

  if ((hasCash && hasBank) || (hasCash && hasOther) || (hasBank && hasOther)) {
    return 'mixed';
  }
  if (hasBank) return 'bank';
  if (hasCash) return 'cash';
  if (hasOther) return 'other';
  return null;
};

export const resolvePrimaryBankAccountId = (paymentMethods = []) => {
  const uniqueIds = Array.from(
    new Set(
      (Array.isArray(paymentMethods) ? paymentMethods : [])
        .map((method) => toCleanString(method?.bankAccountId))
        .filter(Boolean),
    ),
  );

  return uniqueIds.length === 1 ? uniqueIds[0] : null;
};

export const buildAccountingEvent = ({
  businessId,
  eventType,
  eventVersion = 1,
  status = 'recorded',
  occurredAt = null,
  recordedAt = null,
  sourceType = null,
  sourceId = null,
  sourceDocumentType = null,
  sourceDocumentId = null,
  counterpartyType = null,
  counterpartyId = null,
  currency = null,
  functionalCurrency = null,
  monetary = null,
  treasury = null,
  payload = null,
  dedupeKey = null,
  idempotencyKey = null,
  projection = null,
  projectionStatus = 'pending',
  projectorVersion = 1,
  reversalOfEventId = null,
  qualifier = null,
  createdAt = null,
  createdBy = null,
  metadata = null,
} = {}) => {
  const resolvedBusinessId = toCleanString(businessId);
  const resolvedEventType = normalizeAccountingEventType(eventType);
  const resolvedSourceId = toCleanString(sourceId) || 'event';
  const resolvedSourceType = toCleanString(sourceType);
  const resolvedEventVersion = normalizeAccountingEventVersion(eventVersion);
  const eventId = buildAccountingEventId({
    eventType: resolvedEventType,
    sourceId: resolvedSourceId,
    qualifier,
  });
  const resolvedDedupeKey = resolveAccountingEventDedupeKey({
    businessId: resolvedBusinessId,
    eventType: resolvedEventType,
    sourceId: resolvedSourceId,
    qualifier,
    eventVersion: resolvedEventVersion,
    dedupeKey,
  });

  return AccountingEventSchema.parse({
    id: eventId,
    businessId: resolvedBusinessId,
    eventType: resolvedEventType,
    eventVersion: resolvedEventVersion,
    status: normalizeAccountingEventStatus(status),
    occurredAt: occurredAt ?? null,
    recordedAt: recordedAt ?? occurredAt ?? createdAt ?? null,
    sourceType: resolvedSourceType,
    sourceId: resolvedSourceId,
    sourceDocumentType: resolveAccountingSourceDocumentType({
      sourceDocumentType,
      sourceType: resolvedSourceType,
    }),
    sourceDocumentId: resolveAccountingSourceDocumentId({
      sourceDocumentId,
      sourceId: resolvedSourceId,
    }),
    counterpartyType: toCleanString(counterpartyType),
    counterpartyId: toCleanString(counterpartyId),
    currency: toCleanString(currency),
    functionalCurrency: toCleanString(functionalCurrency),
    monetary: normalizeMonetarySnapshot(monetary),
    treasury: normalizeTreasurySnapshot(treasury),
    payload: asRecord(payload),
    dedupeKey: resolvedDedupeKey,
    idempotencyKey: resolveAccountingEventIdempotencyKey({
      idempotencyKey,
      dedupeKey: resolvedDedupeKey,
    }),
    projection:
      projection && typeof projection === 'object'
        ? buildAccountingEventProjection(projection)
        : buildAccountingEventProjection({
            status: projectionStatus,
            projectorVersion,
          }),
    reversalOfEventId: toCleanString(reversalOfEventId),
    createdAt: createdAt ?? recordedAt ?? occurredAt ?? null,
    createdBy: toCleanString(createdBy),
    metadata: asRecord(metadata),
  });
};
