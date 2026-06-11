import {
  buildAccountingEvent,
  resolveAccountingPaymentChannel,
} from '../../../versions/v2/accounting/utils/accountingEvent.util.js';

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

const normalizeExpensePaymentMethods = (expenseRecord) => {
  const payment = asRecord(expenseRecord.payment);
  const rawPaymentMethods = Array.isArray(expenseRecord.paymentMethods)
    ? expenseRecord.paymentMethods
    : Array.isArray(expenseRecord.paymentMethod)
      ? expenseRecord.paymentMethod
      : [];
  const sourcePaymentMethods = rawPaymentMethods.length
    ? rawPaymentMethods
    : [
        {
          amount: payment.amount,
          bankAccountId: payment.bankAccountId,
          cashAccountId: payment.cashAccountId,
          cashCountId: payment.cashCountId ?? payment.cashRegister,
          method: payment.method,
          reference: payment.reference ?? payment.bank,
          sourceType: payment.sourceType,
          value: payment.value,
        },
      ];

  return sourcePaymentMethods
    .map((entry) => {
      const record = asRecord(entry);
      const method = toCleanString(record.method ?? record.code ?? entry);
      if (!method) {
        return null;
      }

      const explicitAmount = safeNumber(record.amount ?? record.value);
      if (explicitAmount != null && explicitAmount <= 0) {
        return null;
      }

      const normalized = {
        bankAccountId: toCleanString(record.bankAccountId),
        cashAccountId: toCleanString(record.cashAccountId),
        cashCountId: toCleanString(record.cashCountId ?? record.cashRegister),
        method,
        reference: toCleanString(record.reference),
        sourceType: toCleanString(record.sourceType),
      };

      if (explicitAmount != null) {
        normalized.amount = roundToTwoDecimals(explicitAmount);
        normalized.value = normalized.amount;
      }

      return normalized;
    })
    .filter(Boolean);
};

const resolvePrimaryValue = (records, key) => {
  const values = new Set(
    records.map((record) => toCleanString(record[key])).filter(Boolean),
  );
  return values.size === 1 ? Array.from(values)[0] : null;
};

const resolveExpenseFiscalAmount = (expenseRecord, documentTotals, ...keys) => {
  const legacyTotals = asRecord(
    expenseRecord.totals ?? expenseRecord.totalPurchase,
  );
  for (const key of keys) {
    const direct = safeNumber(expenseRecord[key]);
    if (direct != null) return direct;
    const nested = safeNumber(documentTotals[key]);
    if (nested != null) return nested;
    const legacy = safeNumber(legacyTotals[key]);
    if (legacy != null) return legacy;
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

const resolveTotalFromFiscalParts = ({ subtotal, tax, total }) => {
  const normalizedTotal = roundToTwoDecimals(total);
  if (normalizedTotal > 0) {
    return normalizedTotal;
  }

  const reconstructedTotal = roundToTwoDecimals(subtotal + tax);
  return reconstructedTotal > 0 ? reconstructedTotal : normalizedTotal;
};

const resolveExpenseMonetarySnapshot = (expenseRecord, { expenseId }) => {
  const monetary = asRecord(expenseRecord.monetary);
  const documentTotals = asRecord(monetary.documentTotals);
  const legacyTotals = asRecord(
    expenseRecord.totals ?? expenseRecord.totalPurchase,
  );
  const functionalTotals = asRecord(monetary.functionalTotals);
  const amountCandidate = roundToTwoDecimals(
    safeNumber(
      documentTotals.total ??
        legacyTotals.total ??
        legacyTotals.gross ??
        monetary.amount ??
        expenseRecord.amount,
    ) ?? 0,
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
    ) ?? Math.max(amountCandidate - taxAmount, 0),
  );
  const amount = resolveTotalFromFiscalParts({
    subtotal: subtotalAmount,
    tax: taxAmount,
    total: amountCandidate,
  });
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
  const functionalRate =
    amount > 0 && functionalAmount > 0 ? functionalAmount / amount : 1;
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
  const resolvedFunctionalAmount = resolveTotalFromFiscalParts({
    subtotal: functionalSubtotalAmount,
    tax: functionalTaxAmount,
    total: functionalAmount,
  });
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
        total: resolvedFunctionalAmount,
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
      functionalAmount: resolvedFunctionalAmount,
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
  const paymentMethods = normalizeExpensePaymentMethods(expenseRecord);
  if (
    paymentMethods.some(
      (method) => toCleanString(method.method)?.toLowerCase() === 'credit',
    )
  ) {
    return 'deferred';
  }

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

  if (
    !paymentMethods.length &&
    !toCleanString(payment.method) &&
    !toCleanString(payment.sourceType) &&
    !toCleanString(expenseRecord.paymentMethod)
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
  const paymentMethods = normalizeExpensePaymentMethods(nextExpense);
  const paymentChannel = resolveAccountingPaymentChannel(paymentMethods);
  const primaryPaymentMethod = paymentMethods[0] ?? null;
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
      cashAccountId:
        resolvePrimaryValue(paymentMethods, 'cashAccountId') ??
        toCleanString(payment.cashAccountId),
      cashCountId:
        resolvePrimaryValue(paymentMethods, 'cashCountId') ??
        toCleanString(payment.cashRegister),
      bankAccountId:
        resolvePrimaryValue(paymentMethods, 'bankAccountId') ??
        toCleanString(payment.bankAccountId),
      paymentChannel,
    },
    payload: {
      numberId:
        toCleanString(nextExpense.numberId) ??
        toCleanString(nextExpense.number) ??
        null,
      categoryId: toCleanString(nextExpense.categoryId),
      category: toCleanString(nextExpense.category),
      description: toCleanString(nextExpense.description),
      paymentMethod:
        toCleanString(primaryPaymentMethod?.method) ??
        toCleanString(payment.method),
      paymentMethods,
      paymentMethodCount: paymentMethods.length,
      paymentSourceType:
        toCleanString(primaryPaymentMethod?.sourceType) ??
        toCleanString(payment.sourceType),
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
