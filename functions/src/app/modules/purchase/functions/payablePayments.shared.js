import {
  applyOverduePaymentState,
  buildPaymentState,
} from '../../../versions/v2/accounting/utils/paymentState.util.js';
export { buildIdempotencyRequestHash } from '../../../core/utils/idempotencyRequestHash.util.js';
export { sanitizeForResponse } from '../../../core/utils/responseSerialization.util.js';

export const THRESHOLD = 0.01;

const BANK_METHODS_REQUIRING_BANK_ACCOUNT = new Set(['card', 'transfer']);
const CASH_METHODS_REQUIRING_CASH_COUNT = new Set(['cash']);
const INACTIVE_SUPPLIER_PAYMENT_STATUSES = new Set([
  'canceled',
  'cancelled',
  'draft',
  'void',
  'voided',
]);
const TERMINAL_INACTIVE_SUPPLIER_PAYMENT_STATUSES = new Set([
  'canceled',
  'cancelled',
  'void',
  'voided',
]);
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

export const normalizeSupplierPaymentMethodCode = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.length) return null;
  const normalized = trimmed.toLowerCase();
  return SUPPLIER_PAYMENT_METHOD_ALIASES[normalized] ?? trimmed;
};

export const normalizeSupplierPaymentStatus = (value) =>
  toCleanString(value)?.toLowerCase() ?? null;

export const isInactiveSupplierPaymentStatus = (value) => {
  const status = normalizeSupplierPaymentStatus(value);
  return Boolean(status) && INACTIVE_SUPPLIER_PAYMENT_STATUSES.has(status);
};

export const isTerminalInactiveSupplierPaymentStatus = (value) => {
  const status = normalizeSupplierPaymentStatus(value);
  return (
    Boolean(status) && TERMINAL_INACTIVE_SUPPLIER_PAYMENT_STATUSES.has(status)
  );
};

export const isExplicitActiveSupplierPaymentStatus = (value) => {
  const status = normalizeSupplierPaymentStatus(value);
  return Boolean(status) && !INACTIVE_SUPPLIER_PAYMENT_STATUSES.has(status);
};

export const isActiveSupplierPaymentRecord = (paymentRecord) => {
  const status = normalizeSupplierPaymentStatus(asRecord(paymentRecord).status);
  return !status || !INACTIVE_SUPPLIER_PAYMENT_STATUSES.has(status);
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
  const legacyTotals = asRecord(
    purchaseRecord.totals ?? purchaseRecord.totalPurchase,
  );
  const totalFromPaymentState = safeNumber(purchaseRecord.paymentState?.total);
  const totalFromMonetary = safeNumber(
    documentTotals.total ??
      documentTotals.gross ??
      legacyTotals.total ??
      legacyTotals.gross ??
      legacyTotals.totalPurchase,
  );
  const totalFallback =
    safeNumber(purchaseRecord.totalAmount) ??
    safeNumber(purchaseRecord.total) ??
    safeNumber(purchaseRecord.amount);

  return roundToTwoDecimals(
    totalFromPaymentState ?? totalFromMonetary ?? totalFallback ?? 0,
  );
};

export const buildSupplierCreditNoteApplicationId = ({
  creditNoteId,
  paymentId,
}) => `supplier_credit_note_application__${paymentId}__${creditNoteId}`;

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
        cashAccountId: toCleanString(methodRecord.cashAccountId),
        cashCountId: toCleanString(methodRecord.cashCountId),
      };
    })
    .filter(Boolean);
};

export const normalizeWithholdingApplicationsForAggregation = (
  paymentRecord,
) => {
  const applications = Array.isArray(paymentRecord.withholdingApplications)
    ? paymentRecord.withholdingApplications
    : Array.isArray(paymentRecord.metadata?.withholdingApplications)
      ? paymentRecord.metadata.withholdingApplications
      : [];

  return applications
    .map((entry) => {
      const applicationRecord = asRecord(entry);
      const amount = roundToTwoDecimals(
        applicationRecord.amount ?? applicationRecord.value,
      );
      if (amount <= THRESHOLD || applicationRecord.status === false) {
        return null;
      }
      return {
        type: toCleanString(
          applicationRecord.type ??
            applicationRecord.taxType ??
            applicationRecord.code,
        ),
        amount,
        reference: toCleanString(applicationRecord.reference),
        taxPeriod: toCleanString(applicationRecord.taxPeriod),
      };
    })
    .filter(Boolean);
};

export const resolvePaymentWithholdingAmount = (paymentRecord) => {
  const applicationAmount = roundToTwoDecimals(
    normalizeWithholdingApplicationsForAggregation(paymentRecord).reduce(
      (sum, application) => sum + application.amount,
      0,
    ),
  );
  if (applicationAmount > THRESHOLD) {
    return applicationAmount;
  }
  return roundToTwoDecimals(
    paymentRecord.withholdingAmount ??
      paymentRecord.metadata?.withholdingAmount ??
      0,
  );
};

export const resolvePaymentAmount = (paymentRecord) => {
  const paymentMethods = normalizePaymentMethodsForAggregation(paymentRecord);
  const withholdingAmount = resolvePaymentWithholdingAmount(paymentRecord);
  if (paymentMethods.length > 0) {
    return roundToTwoDecimals(
      paymentMethods.reduce((sum, method) => sum + method.amount, 0) +
        withholdingAmount,
    );
  }
  if (withholdingAmount > THRESHOLD) {
    const recordedSettlementAmount = safeNumber(
      paymentRecord.settlementAmount ?? paymentRecord.appliedAmount,
    );
    if (recordedSettlementAmount != null) {
      return roundToTwoDecimals(recordedSettlementAmount);
    }
    return roundToTwoDecimals(
      (safeNumber(paymentRecord.totalAmount) ?? 0) + withholdingAmount,
    );
  }

  return roundToTwoDecimals(
    paymentRecord.settlementAmount ??
      paymentRecord.appliedAmount ??
      paymentRecord.totalAmount ??
      paymentRecord.amount ??
      paymentRecord.value,
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

export const resolvePaymentRecordCashAccountId = (paymentMethods) => {
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
        .map((paymentMethod) => toCleanString(paymentMethod.cashAccountId))
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
