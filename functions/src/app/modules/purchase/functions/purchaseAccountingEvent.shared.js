import { Timestamp } from 'firebase-admin/firestore';

import {
  buildAccountingEvent,
  resolveAccountingPaymentChannel,
} from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import { resolveAccountingTimestamp as resolveTimestamp } from '../../../versions/v2/accounting/utils/accountingTimestamp.util.js';
import {
  asRecord,
  resolvePurchaseDocumentTotal,
  resolvePurchaseSupplierId,
  roundToTwoDecimals,
  safeNumber,
  toCleanString,
} from './payablePayments.shared.js';
import {
  isPurchaseReceiptInventoryPending,
  resolvePurchaseDocumentNature,
  resolvePurchaseSettlementTiming,
} from './vendorBill.shared.js';
import {
  buildPurchaseSourceAuditMetadata,
  PURCHASE_ACCOUNTING_EVENT_SYNC_ACTOR,
} from './purchaseDerivedAudit.shared.js';

const COMMITTED_WORKFLOW_STATUSES = new Set(['completed']);
const COMMITTED_LEGACY_STATUSES = new Set(['completed', 'delivered', 'posted']);
const VOIDED_ACCOUNTS_PAYABLE_STATUSES = new Set([
  'cancelled',
  'canceled',
  'void',
  'voided',
]);

const resolveCommittedPurchaseState = (purchaseRecord) => {
  if (isPurchaseReceiptInventoryPending(purchaseRecord)) {
    return false;
  }

  const workflowStatus = toCleanString(
    purchaseRecord.workflowStatus,
  )?.toLowerCase();
  if (workflowStatus && COMMITTED_WORKFLOW_STATUSES.has(workflowStatus)) {
    return true;
  }

  const legacyStatus = toCleanString(purchaseRecord.status)?.toLowerCase();
  return legacyStatus ? COMMITTED_LEGACY_STATUSES.has(legacyStatus) : false;
};

const resolvePurchaseAccountsPayableControl = (purchaseRecord) =>
  asRecord(
    purchaseRecord.accountsPayable ??
      purchaseRecord.payables ??
      purchaseRecord.vendorBill,
  );

const resolveVoidedAccountsPayableControl = (purchaseRecord) => {
  const accountsPayable = resolvePurchaseAccountsPayableControl(purchaseRecord);
  const status = toCleanString(
    accountsPayable.status ??
      accountsPayable.state ??
      accountsPayable.approvalStatus,
  )?.toLowerCase();
  const isVoided =
    VOIDED_ACCOUNTS_PAYABLE_STATUSES.has(status) ||
    Boolean(accountsPayable.voidedAt) ||
    Boolean(toCleanString(accountsPayable.voidedBy));

  if (!isVoided) {
    return null;
  }

  return {
    status: 'voided',
    voidedAt: accountsPayable.voidedAt ?? null,
    voidedBy: toCleanString(accountsPayable.voidedBy),
    voidReason: toCleanString(accountsPayable.voidReason),
    voidEvidenceNote: toCleanString(accountsPayable.voidEvidenceNote),
    voidEvidenceUrls: Array.isArray(accountsPayable.voidEvidenceUrls)
      ? accountsPayable.voidEvidenceUrls.map(toCleanString).filter(Boolean)
      : [],
    controlEventId: toCleanString(accountsPayable.lastControlEventId),
  };
};

const resolveCurrencyCode = (value) =>
  toCleanString(asRecord(value).code ?? value)?.toUpperCase() || null;

const resolvePurchaseDocumentTotals = (purchaseRecord) => {
  const monetary = asRecord(purchaseRecord.monetary);
  const documentTotals = asRecord(monetary.documentTotals);
  return asRecord(
    purchaseRecord.totals ?? purchaseRecord.totalPurchase ?? documentTotals,
  );
};

const normalizePurchasePaymentMethods = (purchaseRecord) => {
  const paymentMethods = Array.isArray(purchaseRecord.paymentMethods)
    ? purchaseRecord.paymentMethods
    : Array.isArray(purchaseRecord.paymentMethod)
      ? purchaseRecord.paymentMethod
      : [];

  return paymentMethods
    .map((entry) => {
      const record = asRecord(entry);
      const method = toCleanString(record.method ?? record.code ?? entry);
      const amount = roundToTwoDecimals(record.amount ?? record.value);
      if (!method || amount <= 0 || record.status === false) {
        return null;
      }

      return {
        amount,
        bankAccountId: toCleanString(record.bankAccountId),
        cashAccountId: toCleanString(record.cashAccountId),
        cashCountId: toCleanString(record.cashCountId ?? record.cashRegister),
        method,
        reference: toCleanString(record.reference),
        value: amount,
      };
    })
    .filter(Boolean);
};

const resolvePrimaryValue = (records, key) => {
  const values = new Set(
    records.map((record) => toCleanString(record[key])).filter(Boolean),
  );
  return values.size === 1 ? Array.from(values)[0] : null;
};

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

const resolvePurchaseMonetarySnapshot = (purchaseRecord, { purchaseId }) => {
  const monetary = asRecord(purchaseRecord.monetary);
  const documentTotals = asRecord(monetary.documentTotals);
  const legacyTotals = resolvePurchaseDocumentTotals(purchaseRecord);
  const functionalTotals = asRecord(monetary.functionalTotals);
  const documentTotalCandidate = roundToTwoDecimals(
    safeNumber(
      documentTotals.total ??
        legacyTotals.total ??
        legacyTotals.totalPurchase ??
        legacyTotals.gross,
    ) ?? resolvePurchaseDocumentTotal(purchaseRecord),
  );
  const documentTaxes = roundToTwoDecimals(
    safeNumber(
      documentTotals.taxes ??
        documentTotals.tax ??
        legacyTotals.taxes ??
        legacyTotals.tax ??
        legacyTotals.totalItbis,
    ) ?? 0,
  );
  const documentSubtotal = roundToTwoDecimals(
    safeNumber(
      documentTotals.subtotal ??
        documentTotals.subTotal ??
        documentTotals.subtotalAmount ??
        legacyTotals.subtotal ??
        legacyTotals.subTotal ??
        legacyTotals.subtotalAmount ??
        legacyTotals.totalBaseCost ??
        legacyTotals.totalProducts,
    ) ?? Math.max(documentTotalCandidate - documentTaxes, 0),
  );
  const documentTotal = resolveTotalFromFiscalParts({
    subtotal: documentSubtotal,
    tax: documentTaxes,
    total: documentTotalCandidate,
  });
  const documentWithholdingITBIS = roundToTwoDecimals(
    safeNumber(
      documentTotals.withholdingITBISAmount ??
        documentTotals.itbisWithheld ??
        legacyTotals.withholdingITBISAmount ??
        legacyTotals.itbisWithheld ??
        purchaseRecord.withholdingITBISAmount ??
        purchaseRecord.itbisWithheld,
    ) ?? 0,
  );
  const documentWithholdingISR = roundToTwoDecimals(
    safeNumber(
      documentTotals.withholdingISRAmount ??
        documentTotals.isrWithheld ??
        legacyTotals.withholdingISRAmount ??
        legacyTotals.isrWithheld ??
        purchaseRecord.withholdingISRAmount ??
        purchaseRecord.isrWithheld,
    ) ?? 0,
  );
  const contextLabel = `purchase ${purchaseId}`;
  const documentNetPayable = resolveValidNetPayableAmount({
    contextLabel,
    total: documentTotal,
    withholdingITBIS: documentWithholdingITBIS,
    withholdingISR: documentWithholdingISR,
  });
  const functionalTotal = roundToTwoDecimals(
    safeNumber(functionalTotals.total) ?? documentTotal,
  );
  const functionalTaxes = roundToTwoDecimals(
    safeNumber(functionalTotals.taxes ?? functionalTotals.tax) ?? documentTaxes,
  );
  const functionalSubtotal = roundToTwoDecimals(
    safeNumber(
      functionalTotals.subtotal ??
        functionalTotals.subTotal ??
        functionalTotals.subtotalAmount,
    ) ?? Math.max(functionalTotal - functionalTaxes, 0),
  );
  const resolvedFunctionalTotal = resolveTotalFromFiscalParts({
    subtotal: functionalSubtotal,
    tax: functionalTaxes,
    total: functionalTotal,
  });
  const functionalWithholdingITBIS = roundToTwoDecimals(
    safeNumber(
      functionalTotals.withholdingITBISAmount ?? functionalTotals.itbisWithheld,
    ) ?? documentWithholdingITBIS,
  );
  const functionalWithholdingISR = roundToTwoDecimals(
    safeNumber(
      functionalTotals.withholdingISRAmount ?? functionalTotals.isrWithheld,
    ) ?? documentWithholdingISR,
  );
  const functionalNetPayable = resolveValidNetPayableAmount({
    contextLabel: `${contextLabel} functional totals`,
    total: resolvedFunctionalTotal,
    withholdingITBIS: functionalWithholdingITBIS,
    withholdingISR: functionalWithholdingISR,
  });

  return {
    currency: resolveCurrencyCode(monetary.documentCurrency),
    functionalCurrency: resolveCurrencyCode(monetary.functionalCurrency),
    monetary: {
      amount: documentTotal,
      subtotalAmount: documentSubtotal,
      taxAmount: documentTaxes,
      withholdingITBISAmount: documentWithholdingITBIS,
      withholdingISRAmount: documentWithholdingISR,
      netPayableAmount: documentNetPayable,
      functionalAmount: resolvedFunctionalTotal,
      functionalSubtotalAmount: functionalSubtotal,
      functionalTaxAmount: functionalTaxes,
      functionalWithholdingITBISAmount: functionalWithholdingITBIS,
      functionalWithholdingISRAmount: functionalWithholdingISR,
      functionalNetPayableAmount: functionalNetPayable,
    },
  };
};

const resolvePurchaseTreasurySnapshot = (purchaseRecord) => {
  const paymentMethods = normalizePurchasePaymentMethods(purchaseRecord);
  const paymentChannel = resolveAccountingPaymentChannel(paymentMethods);

  return {
    paymentMethods,
    treasury: {
      bankAccountId: resolvePrimaryValue(paymentMethods, 'bankAccountId'),
      cashAccountId: resolvePrimaryValue(paymentMethods, 'cashAccountId'),
      cashCountId: resolvePrimaryValue(paymentMethods, 'cashCountId'),
      paymentChannel,
    },
  };
};

export const buildPurchaseCommittedAccountingEvent = ({
  afterPurchase,
  beforePurchase = null,
  businessId,
  purchaseId,
  recordedAt = Timestamp.now(),
}) => {
  const previousPurchase = asRecord(beforePurchase);
  const nextPurchase = asRecord(afterPurchase);

  if (!Object.keys(nextPurchase).length) {
    return null;
  }

  const beforeCommitted = resolveCommittedPurchaseState(previousPurchase);
  const afterCommitted = resolveCommittedPurchaseState(nextPurchase);
  const previousAccountsPayableVoid =
    resolveVoidedAccountsPayableControl(previousPurchase);
  const nextAccountsPayableVoid =
    resolveVoidedAccountsPayableControl(nextPurchase);
  const shouldVoidCommittedEvent =
    afterCommitted && nextAccountsPayableVoid && !previousAccountsPayableVoid;

  if (!afterCommitted || (beforeCommitted && !shouldVoidCommittedEvent)) {
    return null;
  }

  const supplierId = resolvePurchaseSupplierId(nextPurchase);
  const occurredAt = shouldVoidCommittedEvent
    ? resolveTimestamp(
        nextAccountsPayableVoid.voidedAt,
        nextPurchase.updatedAt,
        nextPurchase.completedAt,
        nextPurchase.createdAt,
      )
    : resolveTimestamp(
        nextPurchase.completedAt,
        nextPurchase.updatedAt,
        nextPurchase.createdAt,
      );
  const monetarySnapshot = resolvePurchaseMonetarySnapshot(nextPurchase, {
    purchaseId,
  });
  const treasurySnapshot = resolvePurchaseTreasurySnapshot(nextPurchase);
  const accountingEvent = buildAccountingEvent({
    businessId,
    eventType: 'purchase.committed',
    status: shouldVoidCommittedEvent ? 'voided' : 'recorded',
    sourceType: 'purchase',
    sourceId: purchaseId,
    sourceDocumentType: 'purchase',
    sourceDocumentId: purchaseId,
    counterpartyType: supplierId ? 'supplier' : null,
    counterpartyId: supplierId,
    currency: monetarySnapshot.currency,
    functionalCurrency: monetarySnapshot.functionalCurrency,
    monetary: monetarySnapshot.monetary,
    treasury: treasurySnapshot.treasury,
    payload: {
      purchaseNumber:
        toCleanString(nextPurchase.numberId) ??
        toCleanString(nextPurchase.number) ??
        null,
      vendorReference:
        toCleanString(nextPurchase.vendorReference) ??
        toCleanString(nextPurchase.invoiceNumber) ??
        toCleanString(nextPurchase.reference) ??
        null,
      invoiceNumber: toCleanString(nextPurchase.invoiceNumber) ?? null,
      workflowStatus:
        toCleanString(nextPurchase.workflowStatus)?.toLowerCase() ?? null,
      purchaseStatus: toCleanString(nextPurchase.status)?.toLowerCase() ?? null,
      paymentCondition:
        toCleanString(nextPurchase.paymentTerms?.condition) ??
        toCleanString(nextPurchase.condition) ??
        null,
      paymentMethodCount: treasurySnapshot.paymentMethods.length,
      paymentMethods: treasurySnapshot.paymentMethods,
      documentNature: resolvePurchaseDocumentNature(nextPurchase),
      settlementTiming: resolvePurchaseSettlementTiming(nextPurchase),
      accountsPayableControlStatus: nextAccountsPayableVoid?.status ?? null,
      accountsPayableControlEventId:
        nextAccountsPayableVoid?.controlEventId ?? null,
      accountsPayableVoidReason: nextAccountsPayableVoid?.voidReason ?? null,
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
    occurredAt,
    recordedAt,
    createdAt: recordedAt,
    createdBy: PURCHASE_ACCOUNTING_EVENT_SYNC_ACTOR,
    metadata: {
      ...buildPurchaseSourceAuditMetadata(nextPurchase),
      accountsPayableVoidedAt: nextAccountsPayableVoid?.voidedAt ?? null,
      accountsPayableVoidedBy: nextAccountsPayableVoid?.voidedBy ?? null,
      accountsPayableControlEventId:
        nextAccountsPayableVoid?.controlEventId ?? null,
      accountsPayableVoidReason: nextAccountsPayableVoid?.voidReason ?? null,
      accountsPayableVoidEvidenceNote:
        nextAccountsPayableVoid?.voidEvidenceNote ?? null,
      accountsPayableVoidEvidenceUrls:
        nextAccountsPayableVoid?.voidEvidenceUrls ?? [],
    },
  });

  if (!shouldVoidCommittedEvent) {
    return accountingEvent;
  }

  return {
    ...accountingEvent,
    voidedAt: nextAccountsPayableVoid.voidedAt ?? recordedAt,
    voidedBy:
      nextAccountsPayableVoid.voidedBy ?? PURCHASE_ACCOUNTING_EVENT_SYNC_ACTOR,
    voidReason:
      nextAccountsPayableVoid.voidReason ?? 'Cuenta por pagar anulada.',
  };
};
