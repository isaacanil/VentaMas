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

const resolveExpenseFiscalAmount = (expenseRecord, documentTotals, ...keys) => {
  for (const key of keys) {
    const direct = safeNumber(expenseRecord[key]);
    if (direct != null) return direct;
    const nested = safeNumber(documentTotals[key]);
    if (nested != null) return nested;
  }
  return null;
};

const resolveExpenseStatus = (expenseRecord) =>
  toCleanString(expenseRecord?.status)?.toLowerCase() || null;

const isRecordedExpenseStatus = (status) =>
  Boolean(status) && RECORDED_EXPENSE_STATUSES.has(status);

const resolveCurrencyCode = (value) =>
  toCleanString(asRecord(value).code ?? value)?.toUpperCase() || null;

const resolveValidNetPayableAmount = ({
  contextLabel,
  total,
  withholdingITBIS,
  withholdingISR,
}) => {
  const withholdingTotal = roundToTwoDecimals(
    withholdingITBIS + withholdingISR,
  );
  const netPayableAmount = roundToTwoDecimals(
    total - withholdingITBIS - withholdingISR,
  );

  if (withholdingTotal > total || netPayableAmount < 0) {
    throw new Error(
      `${contextLabel}: invalid fiscal totals. withholdingITBIS + withholdingISR (${withholdingTotal}) must be less than or equal to total (${total}); netPayableAmount must be >= 0 (calculated ${netPayableAmount}).`,
    );
  }

  return netPayableAmount;
};

const resolveExpenseMonetarySnapshot = (expenseRecord, { expenseId }) => {
  const monetary = asRecord(expenseRecord.monetary);
  const documentTotals = asRecord(monetary.documentTotals);
  const functionalTotals = asRecord(monetary.functionalTotals);
  const amount = roundToTwoDecimals(
    safeNumber(documentTotals.total ?? monetary.amount ?? expenseRecord.amount) ?? 0,
  );
  const taxAmount = roundToTwoDecimals(
    resolveExpenseFiscalAmount(
      expenseRecord,
      documentTotals,
      'taxAmount',
      'itbisAmount',
      'taxes',
      'tax',
    ) ?? 0,
  );
  const subtotalAmount = roundToTwoDecimals(
    resolveExpenseFiscalAmount(
      expenseRecord,
      documentTotals,
      'subtotal',
      'subTotal',
      'subtotalAmount',
    ) ?? Math.max(amount - taxAmount, 0),
  );
  const withholdingITBISAmount = roundToTwoDecimals(
    resolveExpenseFiscalAmount(
      expenseRecord,
      documentTotals,
      'withholdingITBISAmount',
      'itbisWithheld',
    ) ?? 0,
  );
  const withholdingISRAmount = roundToTwoDecimals(
    resolveExpenseFiscalAmount(
      expenseRecord,
      documentTotals,
      'withholdingISRAmount',
      'isrWithheld',
    ) ?? 0,
  );
  const contextLabel = `expense ${expenseId}`;
  const netPayableAmount = resolveValidNetPayableAmount({
    contextLabel,
    total: amount,
    withholdingITBIS: withholdingITBISAmount,
    withholdingISR: withholdingISRAmount,
  });
  const functionalAmount = roundToTwoDecimals(
    safeNumber(functionalTotals.total ?? monetary.functionalAmount ?? amount) ??
      amount,
  );
  const functionalRate = amount > 0 && functionalAmount > 0 ? functionalAmount / amount : 1;
  const functionalTaxAmount = roundToTwoDecimals(
    safeNumber(functionalTotals.taxes ?? functionalTotals.tax) ??
      taxAmount * functionalRate,
  );
  const functionalSubtotalAmount = roundToTwoDecimals(
    safeNumber(
      functionalTotals.subtotal ??
        functionalTotals.subTotal ??
        functionalTotals.subtotalAmount,
    ) ?? subtotalAmount * functionalRate,
  );
  const functionalWithholdingITBISAmount = roundToTwoDecimals(
    safeNumber(functionalTotals.withholdingITBISAmount) ??
      withholdingITBISAmount * functionalRate,
  );
  const functionalWithholdingISRAmount = roundToTwoDecimals(
    safeNumber(functionalTotals.withholdingISRAmount) ??
      withholdingISRAmount * functionalRate,
  );
  const functionalNetPayableAmount = roundToTwoDecimals(
    safeNumber(functionalTotals.netPayableAmount) ??
      resolveValidNetPayableAmount({
        contextLabel: `${contextLabel} functional totals`,
        total: functionalAmount,
        withholdingITBIS: functionalWithholdingITBISAmount,
        withholdingISR: functionalWithholdingISRAmount,
      }),
  );

  return {
    currency: resolveCurrencyCode(monetary.documentCurrency),
    functionalCurrency: resolveCurrencyCode(monetary.functionalCurrency),
    monetary: {
      amount,
      subtotalAmount,
      taxAmount,
      withholdingITBISAmount,
      withholdingISRAmount,
      netPayableAmount,
      functionalAmount,
      functionalSubtotalAmount,
      functionalTaxAmount,
      functionalWithholdingITBISAmount,
      functionalWithholdingISRAmount,
      functionalNetPayableAmount,
    },
  };
};

const resolveExpenseSettlementTiming = (expenseRecord) => {
  const payment = asRecord(expenseRecord.payment);
  const settlementMode = toCleanString(
    payment.settlementMode ??
      payment.mode ??
      expenseRecord.settlementMode ??
      expenseRecord.paymentMode,
  )?.toLowerCase();

  if (settlementMode === 'payable' || settlementMode === 'deferred') {
    return 'deferred';
  }

  if (
    payment.deferToAccountsPayable === true ||
    toCleanString(payment.accountsPayableId) ||
    toCleanString(expenseRecord.accountsPayableId)
  ) {
    return 'deferred';
  }

  return 'immediate';
};

const resolveExpenseDocumentNature = (expenseRecord) => {
  const normalized = toCleanString(
    expenseRecord.financialType ??
      expenseRecord.expenseNature ??
      expenseRecord.accountingCategory ??
      expenseRecord.categoryType,
  )?.toLowerCase();

  switch (normalized) {
    case 'asset':
    case 'fixed_asset':
    case 'fixed-asset':
    case 'capex':
      return 'asset';
    case 'service':
      return 'service';
    case 'inventory':
    case 'stock':
      return 'inventory';
    default:
      return 'expense';
  }
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
  const monetarySnapshot = resolveExpenseMonetarySnapshot(nextExpense, {
    expenseId,
  });

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
      cashAccountId: toCleanString(payment.cashAccountId),
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
      documentNature: resolveExpenseDocumentNature(nextExpense),
      settlementTiming: resolveExpenseSettlementTiming(nextExpense),
      reference:
        toCleanString(payment.reference) ??
        toCleanString(payment.bank) ??
        toCleanString(invoice.ncf) ??
        null,
      invoiceNcf: toCleanString(invoice.ncf),
      attachmentCount: attachments.length,
      fiscalTotals: {
        subtotal: monetarySnapshot.monetary.subtotalAmount,
        taxAmount: monetarySnapshot.monetary.taxAmount,
        withholdingITBISAmount:
          monetarySnapshot.monetary.withholdingITBISAmount,
        withholdingISRAmount: monetarySnapshot.monetary.withholdingISRAmount,
        total: monetarySnapshot.monetary.amount,
        netPayableAmount: monetarySnapshot.monetary.netPayableAmount,
      },
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
