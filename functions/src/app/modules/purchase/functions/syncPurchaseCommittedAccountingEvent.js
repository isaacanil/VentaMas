import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { db, Timestamp } from '../../../core/config/firebase.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import { buildAccountingEvent } from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import {
  asRecord,
  resolvePurchaseDocumentTotal,
  resolvePurchaseSupplierId,
  roundToTwoDecimals,
  safeNumber,
  toCleanString,
} from './payablePayments.shared.js';
import {
  resolvePurchaseDocumentNature,
  resolvePurchaseSettlementTiming,
} from './vendorBill.shared.js';

const REGION = 'us-central1';
const MEMORY = '256MiB';
const NODE_VERSION = '20';

const COMMITTED_WORKFLOW_STATUSES = new Set(['completed']);
const COMMITTED_LEGACY_STATUSES = new Set(['completed', 'delivered', 'posted']);

const resolveCommittedPurchaseState = (purchaseRecord) => {
  const workflowStatus = toCleanString(
    purchaseRecord.workflowStatus,
  )?.toLowerCase();
  if (workflowStatus && COMMITTED_WORKFLOW_STATUSES.has(workflowStatus)) {
    return true;
  }

  const legacyStatus = toCleanString(purchaseRecord.status)?.toLowerCase();
  return legacyStatus ? COMMITTED_LEGACY_STATUSES.has(legacyStatus) : false;
};

const resolveTimestamp = (...values) => {
  for (const value of values) {
    if (!value) continue;
    if (value instanceof Timestamp) {
      return value;
    }
    if (typeof value?.toMillis === 'function') {
      return Timestamp.fromMillis(value.toMillis());
    }
    if (typeof value?.toDate === 'function') {
      const dateValue = value.toDate();
      if (dateValue instanceof Date) {
        return Timestamp.fromMillis(dateValue.getTime());
      }
    }
    if (value instanceof Date) {
      return Timestamp.fromMillis(value.getTime());
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Timestamp.fromMillis(value);
    }
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) {
        return Timestamp.fromMillis(parsed);
      }
    }
    if (typeof value === 'object') {
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
      if (seconds != null) {
        return new Timestamp(seconds, nanoseconds);
      }
    }
  }

  return Timestamp.now();
};

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

const resolvePurchaseMonetarySnapshot = (purchaseRecord, { purchaseId }) => {
  const monetary = asRecord(purchaseRecord.monetary);
  const documentTotals = asRecord(monetary.documentTotals);
  const functionalTotals = asRecord(monetary.functionalTotals);
  const documentTotal = roundToTwoDecimals(
    safeNumber(documentTotals.total) ?? resolvePurchaseDocumentTotal(purchaseRecord),
  );
  const documentTaxes = roundToTwoDecimals(
    safeNumber(documentTotals.taxes ?? documentTotals.tax) ?? 0,
  );
  const documentSubtotal = roundToTwoDecimals(
    safeNumber(
      documentTotals.subtotal ??
        documentTotals.subTotal ??
        documentTotals.subtotalAmount,
    ) ?? Math.max(documentTotal - documentTaxes, 0),
  );
  const documentWithholdingITBIS = roundToTwoDecimals(
    safeNumber(
      documentTotals.withholdingITBISAmount ??
        documentTotals.itbisWithheld ??
        purchaseRecord.withholdingITBISAmount ??
        purchaseRecord.itbisWithheld,
    ) ?? 0,
  );
  const documentWithholdingISR = roundToTwoDecimals(
    safeNumber(
      documentTotals.withholdingISRAmount ??
        documentTotals.isrWithheld ??
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
  const functionalWithholdingITBIS = roundToTwoDecimals(
    safeNumber(
      functionalTotals.withholdingITBISAmount ??
        functionalTotals.itbisWithheld,
    ) ?? documentWithholdingITBIS,
  );
  const functionalWithholdingISR = roundToTwoDecimals(
    safeNumber(
      functionalTotals.withholdingISRAmount ?? functionalTotals.isrWithheld,
    ) ?? documentWithholdingISR,
  );
  const functionalNetPayable = resolveValidNetPayableAmount({
    contextLabel: `${contextLabel} functional totals`,
    total: functionalTotal,
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
      functionalAmount: functionalTotal,
      functionalSubtotalAmount: functionalSubtotal,
      functionalTaxAmount: functionalTaxes,
      functionalWithholdingITBISAmount: functionalWithholdingITBIS,
      functionalWithholdingISRAmount: functionalWithholdingISR,
      functionalNetPayableAmount: functionalNetPayable,
    },
  };
};

export const syncPurchaseCommittedAccountingEvent = onDocumentWritten(
  {
    document: 'businesses/{businessId}/purchases/{purchaseId}',
    region: REGION,
    memory: MEMORY,
    runtimeOpts: { nodeVersion: NODE_VERSION },
  },
  async (event) => {
    const { businessId, purchaseId } = event.params;
    const beforePurchase = asRecord(event.data?.before?.data());
    const afterPurchase = asRecord(event.data?.after?.data());

    if (!Object.keys(afterPurchase).length) {
      return null;
    }

    const beforeCommitted = resolveCommittedPurchaseState(beforePurchase);
    const afterCommitted = resolveCommittedPurchaseState(afterPurchase);
    if (!afterCommitted || beforeCommitted) {
      return null;
    }

    const settingsRef = db.doc(`businesses/${businessId}/settings/accounting`);
    const settingsSnap = await settingsRef.get();
    const rawSettings = settingsSnap.exists ? settingsSnap.data() || {} : {};
    const accountingSettings = await getPilotAccountingSettingsForBusiness(
      businessId,
      { settings: rawSettings },
    );
    if (
      !accountingSettings ||
      rawSettings.generalAccountingEnabled !== true ||
      !isAccountingRolloutEnabledForBusiness(businessId, rawSettings)
    ) {
      return null;
    }

    const supplierId = resolvePurchaseSupplierId(afterPurchase);
    const occurredAt = resolveTimestamp(
      afterPurchase.completedAt,
      afterPurchase.updatedAt,
      afterPurchase.createdAt,
    );
    const recordedAt = Timestamp.now();
    const monetarySnapshot = resolvePurchaseMonetarySnapshot(afterPurchase, {
      purchaseId,
    });
    const accountingEvent = buildAccountingEvent({
      businessId,
      eventType: 'purchase.committed',
      sourceType: 'purchase',
      sourceId: purchaseId,
      sourceDocumentType: 'purchase',
      sourceDocumentId: purchaseId,
      counterpartyType: supplierId ? 'supplier' : null,
      counterpartyId: supplierId,
      currency: monetarySnapshot.currency,
      functionalCurrency: monetarySnapshot.functionalCurrency,
      monetary: monetarySnapshot.monetary,
      payload: {
        purchaseNumber:
          toCleanString(afterPurchase.numberId) ??
          toCleanString(afterPurchase.number) ??
          null,
        vendorReference:
          toCleanString(afterPurchase.vendorReference) ??
          toCleanString(afterPurchase.invoiceNumber) ??
          toCleanString(afterPurchase.reference) ??
          null,
        invoiceNumber: toCleanString(afterPurchase.invoiceNumber) ?? null,
        workflowStatus:
          toCleanString(afterPurchase.workflowStatus)?.toLowerCase() ?? null,
        purchaseStatus:
          toCleanString(afterPurchase.status)?.toLowerCase() ?? null,
        paymentCondition:
          toCleanString(afterPurchase.paymentTerms?.condition) ??
          toCleanString(afterPurchase.condition) ??
          null,
        documentNature: resolvePurchaseDocumentNature(afterPurchase),
        settlementTiming: resolvePurchaseSettlementTiming(afterPurchase),
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
      createdBy:
        toCleanString(afterPurchase.updatedBy) ??
        toCleanString(afterPurchase.createdBy) ??
        null,
    });

    await db
      .doc(`businesses/${businessId}/accountingEvents/${accountingEvent.id}`)
      .set(accountingEvent, { merge: true });

    return null;
  },
);
