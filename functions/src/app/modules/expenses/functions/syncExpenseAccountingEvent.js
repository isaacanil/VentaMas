import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { db } from '../../../core/config/firebase.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import {
  buildAccountingEvent,
  resolveAccountingPaymentChannel,
} from '../../../versions/v2/accounting/utils/accountingEvent.util.js';

const REGION = 'us-central1';
const MEMORY = '256MiB';
const NODE_VERSION = '20';
const RECORDED_EXPENSE_STATUSES = new Set([
  'active',
  'posted',
  'completed',
  'paid',
]);

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

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundToTwoDecimals = (value) =>
  Math.round((safeNumber(value) || 0) * 100) / 100;

const resolveExpenseStatus = (expenseRecord) =>
  toCleanString(expenseRecord?.status)?.toLowerCase() || null;

const isRecordedExpenseStatus = (status) =>
  Boolean(status) && RECORDED_EXPENSE_STATUSES.has(status);

const resolveCurrencyCode = (value) =>
  toCleanString(asRecord(value).code ?? value)?.toUpperCase() || null;

const resolveExpenseMonetarySnapshot = (expenseRecord) => {
  const monetary = asRecord(expenseRecord.monetary);
  const documentTotals = asRecord(monetary.documentTotals);
  const functionalTotals = asRecord(monetary.functionalTotals);
  const amount = roundToTwoDecimals(
    safeNumber(documentTotals.total ?? monetary.amount ?? expenseRecord.amount) ?? 0,
  );
  const functionalAmount = roundToTwoDecimals(
    safeNumber(functionalTotals.total ?? monetary.functionalAmount ?? amount) ??
      amount,
  );

  return {
    currency: resolveCurrencyCode(monetary.documentCurrency),
    functionalCurrency: resolveCurrencyCode(monetary.functionalCurrency),
    monetary: {
      amount,
      functionalAmount,
    },
  };
};

export const buildExpenseRecordedAccountingEvent = ({
  businessId,
  expenseId,
  beforeExpense,
  afterExpense,
}) => {
  const previousExpense = asRecord(beforeExpense);
  const nextExpense = asRecord(afterExpense);
  if (!Object.keys(nextExpense).length) {
    return null;
  }

  const previousStatus = resolveExpenseStatus(previousExpense);
  const nextStatus = resolveExpenseStatus(nextExpense);
  if (
    !isRecordedExpenseStatus(nextStatus) ||
    isRecordedExpenseStatus(previousStatus)
  ) {
    return null;
  }

  const payment = asRecord(nextExpense.payment);
  const dates = asRecord(nextExpense.dates);
  const attachments = Array.isArray(nextExpense.attachments)
    ? nextExpense.attachments
    : [];
  const invoice = asRecord(nextExpense.invoice);
  const monetarySnapshot = resolveExpenseMonetarySnapshot(nextExpense);

  return buildAccountingEvent({
    businessId,
    eventType: 'expense.recorded',
    sourceType: 'expense',
    sourceId: expenseId,
    sourceDocumentType: 'expense',
    sourceDocumentId: expenseId,
    currency: monetarySnapshot.currency,
    functionalCurrency: monetarySnapshot.functionalCurrency,
    monetary: monetarySnapshot.monetary,
    treasury: {
      cashCountId: toCleanString(payment.cashRegister),
      bankAccountId: toCleanString(payment.bankAccountId),
      paymentChannel: resolveAccountingPaymentChannel([
        {
          method: payment.method,
          bankAccountId: payment.bankAccountId,
        },
      ]),
    },
    payload: {
      numberId:
        toCleanString(nextExpense.numberId) ??
        toCleanString(nextExpense.number) ??
        null,
      categoryId: toCleanString(nextExpense.categoryId),
      category: toCleanString(nextExpense.category),
      description: toCleanString(nextExpense.description),
      paymentMethod: toCleanString(payment.method),
      paymentSourceType: toCleanString(payment.sourceType),
      settlementMode:
        toCleanString(payment.settlementMode) ??
        toCleanString(nextExpense.settlementMode) ??
        null,
      reference:
        toCleanString(payment.reference) ??
        toCleanString(payment.bank) ??
        toCleanString(invoice.ncf) ??
        null,
      invoiceNcf: toCleanString(invoice.ncf),
      attachmentCount: attachments.length,
    },
    occurredAt:
      dates.expenseDate ??
      nextExpense.expenseDate ??
      dates.createdAt ??
      nextExpense.createdAt ??
      nextExpense.updatedAt,
    recordedAt:
      nextExpense.createdAt ??
      dates.createdAt ??
      dates.expenseDate ??
      nextExpense.expenseDate ??
      nextExpense.updatedAt,
    createdAt:
      nextExpense.createdAt ??
      dates.createdAt ??
      dates.expenseDate ??
      nextExpense.expenseDate ??
      nextExpense.updatedAt,
    createdBy:
      toCleanString(nextExpense.updatedBy) ??
      toCleanString(nextExpense.createdBy) ??
      null,
  });
};

export const syncExpenseAccountingEvent = onDocumentWritten(
  {
    document: 'businesses/{businessId}/expenses/{expenseId}',
    region: REGION,
    memory: MEMORY,
    runtimeOpts: { nodeVersion: NODE_VERSION },
  },
  async (event) => {
    const { businessId, expenseId } = event.params;
    const accountingSettings =
      await getPilotAccountingSettingsForBusiness(businessId);
    if (
      !isAccountingRolloutEnabledForBusiness(businessId, accountingSettings) ||
      accountingSettings?.generalAccountingEnabled === false
    ) {
      return null;
    }

    const accountingEvent = buildExpenseRecordedAccountingEvent({
      businessId,
      expenseId,
      beforeExpense: event.data?.before?.data()?.expense ?? null,
      afterExpense: event.data?.after?.data()?.expense ?? null,
    });

    if (!accountingEvent) {
      return null;
    }

    await db
      .doc(`businesses/${businessId}/accountingEvents/${accountingEvent.id}`)
      .set(accountingEvent, { merge: true });

    return null;
  },
);
