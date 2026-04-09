import { createHash } from 'node:crypto';

import { Timestamp } from '../../../core/config/firebase.js';
import {
  applyOverduePaymentState,
  buildPaymentState,
} from '../../../versions/v2/accounting/utils/paymentState.util.js';

export const THRESHOLD = 0.01;

const BANK_METHODS_REQUIRING_BANK_ACCOUNT = new Set(['card', 'transfer']);
const CASH_METHODS_REQUIRING_CASH_COUNT = new Set(['cash']);
const SUPPLIER_PAYMENT_METHOD_ALIASES = Object.freeze({
  cash: 'cash',
  open_cash: 'cash',
  card: 'card',
  credit_card: 'card',
  debit_card: 'card',
  transfer: 'transfer',
  bank_transfer: 'transfer',
  check: 'transfer',
  suppliercreditnote: 'supplierCreditNote',
  supplier_credit_note: 'supplierCreditNote',
  supplier_creditnote: 'supplierCreditNote',
  supplier_credit: 'supplierCreditNote',
  suppliercredit: 'supplierCreditNote',
  supplierCreditNote: 'supplierCreditNote',
});

export const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const roundToTwoDecimals = (value) =>
  Math.round((safeNumber(value) || 0) * 100) / 100;

export const toMillis = (value) => {
  if (value == null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (typeof value?.toMillis === 'function') {
    const parsed = value.toMillis();
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value?.toDate === 'function') {
    const dateValue = value.toDate();
    return dateValue instanceof Date ? dateValue.getTime() : null;
  }
  const record = asRecord(value);
  const seconds =
    typeof record.seconds === 'number'
      ? record.seconds
      : typeof record._seconds === 'number'
        ? record._seconds
        : null;
  const nanoseconds =
    typeof record.nanoseconds === 'number'
      ? record.nanoseconds
      : typeof record._nanoseconds === 'number'
        ? record._nanoseconds
        : 0;
  if (seconds == null) return null;
  return seconds * 1000 + Math.floor(nanoseconds / 1e6);
};

export const sanitizeForResponse = (value) => {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForResponse(item));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const next = {};
  Object.entries(value).forEach(([key, nestedValue]) => {
    if (nestedValue === undefined) return;
    next[key] = sanitizeForResponse(nestedValue);
  });
  return next;
};

const stableSerialize = (value) => {
  if (value == null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  const record = asRecord(value);
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
    .join(',')}}`;
};

export const buildIdempotencyRequestHash = (value) =>
  createHash('sha256').update(stableSerialize(value)).digest('hex');

export const normalizeSupplierPaymentMethodCode = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.length) return null;
  const normalized = trimmed.toLowerCase();
  return SUPPLIER_PAYMENT_METHOD_ALIASES[normalized] ?? trimmed;
};

export const paymentMethodRequiresBankAccount = (methodCode) =>
  typeof methodCode === 'string' &&
  BANK_METHODS_REQUIRING_BANK_ACCOUNT.has(methodCode);

export const paymentMethodRequiresCashCount = (methodCode) =>
  typeof methodCode === 'string' &&
  CASH_METHODS_REQUIRING_CASH_COUNT.has(methodCode);

export const resolvePurchaseSupplierId = (purchaseRecord) => {
  const providerId = toCleanString(purchaseRecord.providerId);
  if (providerId) return providerId;

  const provider = purchaseRecord.provider;
  if (typeof provider === 'string') {
    return toCleanString(provider);
  }

  const providerRecord = asRecord(provider);
  return toCleanString(providerRecord.id ?? providerRecord.providerId);
};

export const resolvePurchaseDocumentTotal = (purchaseRecord) => {
  const monetary = asRecord(purchaseRecord.monetary);
  const documentTotals = asRecord(monetary.documentTotals);
  const totalFromPaymentState = safeNumber(purchaseRecord.paymentState?.total);
  const totalFromMonetary = safeNumber(
    documentTotals.total ?? documentTotals.gross,
  );
  const totalFallback =
    safeNumber(purchaseRecord.totalAmount) ??
    safeNumber(purchaseRecord.total) ??
    safeNumber(purchaseRecord.amount);

  return roundToTwoDecimals(
    totalFromPaymentState ?? totalFromMonetary ?? totalFallback ?? 0,
  );
};

export const normalizePaymentMethodsForAggregation = (paymentRecord) => {
  const paymentMethods = Array.isArray(paymentRecord.paymentMethods)
    ? paymentRecord.paymentMethods
    : [];

  return paymentMethods
    .map((entry) => {
      const methodRecord = asRecord(entry);
      const method = normalizeSupplierPaymentMethodCode(methodRecord.method);
      const amount = roundToTwoDecimals(
        methodRecord.value ?? methodRecord.amount,
      );
      if (!method || amount <= THRESHOLD || methodRecord.status === false) {
        return null;
      }
      return {
        method,
        amount,
        supplierCreditNoteId: toCleanString(methodRecord.supplierCreditNoteId),
        reference: toCleanString(methodRecord.reference),
        bankAccountId: toCleanString(methodRecord.bankAccountId),
        cashCountId: toCleanString(methodRecord.cashCountId),
      };
    })
    .filter(Boolean);
};

export const resolvePaymentAmount = (paymentRecord) => {
  const paymentMethods = normalizePaymentMethodsForAggregation(paymentRecord);
  if (paymentMethods.length > 0) {
    return roundToTwoDecimals(
      paymentMethods.reduce((sum, method) => sum + method.amount, 0),
    );
  }

  return roundToTwoDecimals(
    paymentRecord.totalAmount ?? paymentRecord.amount ?? paymentRecord.value,
  );
};

export const buildPurchasePaymentState = ({
  purchaseRecord,
  total,
  paid,
  paymentCount,
  lastPaymentAt,
  lastPaymentId,
  nextPaymentAt,
}) => {
  const currentPaymentState = asRecord(purchaseRecord.paymentState);
  const balance = roundToTwoDecimals(Math.max(total - paid, 0));
  const hasLegacyReviewState =
    paymentCount === 0 &&
    (currentPaymentState.status === 'unknown_legacy' ||
      currentPaymentState.migratedFromLegacy === true);

  const baseState = buildPaymentState({
    total,
    paid,
    balance,
    paymentCount,
    lastPaymentAt,
    lastPaymentId,
    nextPaymentAt,
    requiresReview:
      hasLegacyReviewState ||
      (paymentCount === 0 && currentPaymentState.requiresReview === true),
    migratedFromLegacy:
      hasLegacyReviewState || currentPaymentState.migratedFromLegacy === true,
    status: hasLegacyReviewState ? 'unknown_legacy' : undefined,
  });

  return applyOverduePaymentState(baseState);
};

export const resolvePaymentRecordReference = (paymentMethods) =>
  paymentMethods.length === 1
    ? toCleanString(paymentMethods[0]?.reference)
    : null;

export const resolvePaymentRecordCashCountId = (paymentMethods) => {
  if (
    !paymentMethods.length ||
    paymentMethods.some(
      (paymentMethod) => !paymentMethodRequiresCashCount(paymentMethod.method),
    )
  ) {
    return null;
  }

  const uniqueIds = Array.from(
    new Set(
      paymentMethods
        .map((paymentMethod) => toCleanString(paymentMethod.cashCountId))
        .filter(Boolean),
    ),
  );
  return uniqueIds.length === 1 ? uniqueIds[0] : null;
};

export const resolvePaymentRecordBankAccountId = (paymentMethods) => {
  if (
    !paymentMethods.length ||
    paymentMethods.some(
      (paymentMethod) =>
        !paymentMethodRequiresBankAccount(paymentMethod.method),
    )
  ) {
    return null;
  }

  const uniqueIds = Array.from(
    new Set(
      paymentMethods
        .map((paymentMethod) => toCleanString(paymentMethod.bankAccountId))
        .filter(Boolean),
    ),
  );
  return uniqueIds.length === 1 ? uniqueIds[0] : null;
};
