import {
  onDocumentCreated,
  onDocumentWritten,
} from 'firebase-functions/v2/firestore';

import { db, Timestamp } from '../../../core/config/firebase.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import { buildAccountingEvent } from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import {
  resolveAccountingTimestamp as resolveTimestamp,
} from '../../../versions/v2/accounting/utils/accountingTimestamp.util.js';

const REGION = 'us-central1';
const MEMORY = '256MiB';
const NODE_VERSION = '20';

const VOID_CREDIT_NOTE_STATUSES = new Set(['cancelled', 'canceled', 'void', 'voided']);

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
  Math.round((safeNumber(value) ?? 0) * 100) / 100;

const resolveCurrencyCode = (value) =>
  toCleanString(asRecord(value).code ?? value)?.toUpperCase() || null;

const resolveCreditNoteTotal = (creditNoteRecord) =>
  roundToTwoDecimals(
    safeNumber(
      creditNoteRecord.totalAmount ??
        creditNoteRecord.amount ??
        creditNoteRecord.value ??
        creditNoteRecord.total,
    ) ?? 0,
  );

const resolveLineTaxAmount = (item) => {
  const record = asRecord(item);
  const explicitTax = safeNumber(
    record.taxAmount ??
      record.itbis ??
      record.taxTotal ??
      record.totalTax ??
      record.totalTaxes,
  );
  if (explicitTax != null) {
    return explicitTax;
  }

  const pricing = asRecord(asRecord(record.selectedSaleUnit).pricing ?? record.pricing);
  const taxPercentage = safeNumber(pricing.tax ?? record.taxPercentage) ?? 0;
  if (taxPercentage <= 0) {
    return 0;
  }

  const quantity = safeNumber(record.amountToBuy ?? record.quantity ?? record.qty) ?? 1;
  const unitPrice = safeNumber(pricing.price ?? record.price) ?? 0;
  const baseAmount = Math.max(unitPrice * quantity, 0);

  return (baseAmount * taxPercentage) / 100;
};

const resolveCreditNoteTaxAmount = (creditNoteRecord) => {
  const explicitTax = safeNumber(
    creditNoteRecord.taxAmount ??
      creditNoteRecord.totalTax ??
      creditNoteRecord.totalTaxes ??
      creditNoteRecord.totalItbis ??
      creditNoteRecord.itbis ??
      asRecord(creditNoteRecord.monetary).taxAmount,
  );
  if (explicitTax != null) {
    return roundToTwoDecimals(explicitTax);
  }

  const items = Array.isArray(creditNoteRecord.items) ? creditNoteRecord.items : [];
  return roundToTwoDecimals(
    items.reduce((total, item) => total + resolveLineTaxAmount(item), 0),
  );
};

const resolveCreditNoteMonetarySnapshot = (creditNoteRecord) => {
  const monetary = asRecord(creditNoteRecord.monetary);
  const totalAmount = resolveCreditNoteTotal(creditNoteRecord);
  const taxAmount = resolveCreditNoteTaxAmount(creditNoteRecord);
  const functionalAmount = roundToTwoDecimals(
    safeNumber(
      monetary.functionalAmount ??
        monetary.functionalTotal ??
        monetary.functionalTotals?.total,
    ) ?? totalAmount,
  );
  const functionalTaxAmount = roundToTwoDecimals(
    safeNumber(
      monetary.functionalTaxAmount ??
        monetary.functionalTaxTotal ??
        monetary.functionalTotals?.taxes,
    ) ?? taxAmount,
  );

  return {
    currency: resolveCurrencyCode(
      monetary.documentCurrency ?? creditNoteRecord.currency,
    ),
    functionalCurrency: resolveCurrencyCode(monetary.functionalCurrency),
    monetary: {
      amount: totalAmount,
      taxAmount,
      functionalAmount,
      functionalTaxAmount,
    },
  };
};

const isAccountingEnabled = async (businessId) => {
  const settingsSnap = await db
    .doc(`businesses/${businessId}/settings/accounting`)
    .get();
  const rawSettings = settingsSnap.exists ? settingsSnap.data() || {} : {};
  const accountingSettings = await getPilotAccountingSettingsForBusiness(
    businessId,
    { settings: rawSettings },
  );

  return (
    Boolean(accountingSettings) &&
    rawSettings.generalAccountingEnabled === true &&
    isAccountingRolloutEnabledForBusiness(businessId, rawSettings)
  );
};

export const buildCustomerCreditNoteIssuedAccountingEvent = ({
  businessId,
  creditNoteId,
  creditNoteRecord,
}) => {
  const record = asRecord(creditNoteRecord);
  const status = toCleanString(record.status)?.toLowerCase() ?? null;
  if (status && status !== 'issued') {
    return null;
  }
  if (status && VOID_CREDIT_NOTE_STATUSES.has(status)) {
    return null;
  }

  const monetarySnapshot = resolveCreditNoteMonetarySnapshot(record);
  if (monetarySnapshot.monetary.functionalAmount <= 0) {
    return null;
  }

  const client = asRecord(record.client);
  const occurredAt = resolveTimestamp(
    record.issuedAt,
    record.createdAt,
    record.updatedAt,
  );
  const recordedAt = Timestamp.now();

  return buildAccountingEvent({
    businessId,
    eventType: 'customer_credit_note.issued',
    sourceType: 'creditNote',
    sourceId: creditNoteId,
    sourceDocumentType: 'creditNote',
    sourceDocumentId: creditNoteId,
    counterpartyType: toCleanString(client.id) ? 'client' : null,
    counterpartyId: toCleanString(client.id),
    currency: monetarySnapshot.currency,
    functionalCurrency: monetarySnapshot.functionalCurrency,
    monetary: monetarySnapshot.monetary,
    payload: {
      creditNoteNumber:
        toCleanString(record.number) ?? toCleanString(record.numberID) ?? null,
      creditNoteNcf: toCleanString(record.ncf),
      invoiceId:
        toCleanString(record.invoiceId) ?? toCleanString(record.sourceInvoiceId),
      invoiceNcf: toCleanString(record.invoiceNcf),
      invoiceNumber: toCleanString(record.invoiceNumber),
      availableAmount: roundToTwoDecimals(
        safeNumber(record.availableAmount) ?? monetarySnapshot.monetary.amount,
      ),
      reason: toCleanString(record.reason),
      itemCount: Array.isArray(record.items) ? record.items.length : 0,
    },
    occurredAt,
    recordedAt,
    createdAt: record.createdAt ?? recordedAt,
    createdBy: toCleanString(asRecord(record.createdBy).uid),
  });
};

export const buildCustomerCreditNoteAppliedAccountingEvent = ({
  businessId,
  applicationId,
  applicationRecord,
}) => {
  const record = asRecord(applicationRecord);
  const amount = roundToTwoDecimals(safeNumber(record.amountApplied) ?? 0);
  if (amount <= 0) {
    return null;
  }

  const occurredAt = resolveTimestamp(record.appliedAt, record.createdAt);
  const recordedAt = Timestamp.now();

  return buildAccountingEvent({
    businessId,
    eventType: 'customer_credit_note.applied',
    sourceType: 'creditNoteApplication',
    sourceId: applicationId,
    sourceDocumentType: 'creditNoteApplication',
    sourceDocumentId: applicationId,
    counterpartyType: toCleanString(record.clientId) ? 'client' : null,
    counterpartyId: toCleanString(record.clientId),
    monetary: {
      amount,
      functionalAmount: amount,
    },
    payload: {
      creditNoteId: toCleanString(record.creditNoteId),
      creditNoteNcf: toCleanString(record.creditNoteNcf),
      invoiceId: toCleanString(record.invoiceId),
      invoiceNcf: toCleanString(record.invoiceNcf),
      invoiceNumber: toCleanString(record.invoiceNumber),
      previousBalance: roundToTwoDecimals(record.previousBalance),
      newBalance: roundToTwoDecimals(record.newBalance),
    },
    occurredAt,
    recordedAt,
    createdAt: record.createdAt ?? recordedAt,
    createdBy: toCleanString(asRecord(record.appliedBy).uid),
  });
};

export const syncCustomerCreditNoteIssuedAccountingEvent = onDocumentWritten(
  {
    document: 'businesses/{businessId}/creditNotes/{creditNoteId}',
    region: REGION,
    memory: MEMORY,
    runtimeOpts: { nodeVersion: NODE_VERSION },
  },
  async (event) => {
    const { businessId, creditNoteId } = event.params;
    const beforeData = asRecord(event.data?.before?.data?.());
    const afterData = asRecord(event.data?.after?.data?.() ?? event.data?.data?.());
    const beforeStatus = toCleanString(beforeData.status)?.toLowerCase() ?? null;
    const afterStatus = toCleanString(afterData.status)?.toLowerCase() ?? null;
    if (afterStatus !== 'issued' || beforeStatus === 'issued') {
      return null;
    }

    if (!(await isAccountingEnabled(businessId))) {
      return null;
    }

    const accountingEvent = buildCustomerCreditNoteIssuedAccountingEvent({
      businessId,
      creditNoteId,
      creditNoteRecord: afterData,
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

export const syncCustomerCreditNoteApplicationAccountingEvent = onDocumentCreated(
  {
    document:
      'businesses/{businessId}/creditNoteApplications/{applicationId}',
    region: REGION,
    memory: MEMORY,
    runtimeOpts: { nodeVersion: NODE_VERSION },
  },
  async (event) => {
    const { businessId, applicationId } = event.params;
    if (!(await isAccountingEnabled(businessId))) {
      return null;
    }

    const accountingEvent = buildCustomerCreditNoteAppliedAccountingEvent({
      businessId,
      applicationId,
      applicationRecord: event.data?.data(),
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
