import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { db, Timestamp } from '../../../core/config/firebase.js';
import { getNextIDTransactionalSnap } from '../../../core/utils/getNextID.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import { buildAccountingEvent } from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import {
  resolveAccountingTimestamp as resolveTimestamp,
} from '../../../versions/v2/accounting/utils/accountingTimestamp.util.js';
import { addAccountReceivable } from '../services/addAccountReceivable.js';
import { addInstallmentReceivable } from '../services/addInstallmentsAccountReceivable.js';

const REGION = 'us-central1';
const MEMORY = '256MiB';
const NODE_VERSION = '20';

const VOID_DEBIT_NOTE_STATUSES = new Set(['cancelled', 'canceled', 'void', 'voided']);

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

const resolveDebitNoteTotal = (debitNoteRecord) =>
  roundToTwoDecimals(
    safeNumber(
      debitNoteRecord.totalAmount ??
        debitNoteRecord.amount ??
        debitNoteRecord.value ??
        debitNoteRecord.total,
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

const resolveDebitNoteTaxAmount = (debitNoteRecord) => {
  const explicitTax = safeNumber(
    debitNoteRecord.taxAmount ??
      debitNoteRecord.totalTax ??
      debitNoteRecord.totalTaxes ??
      debitNoteRecord.totalItbis ??
      debitNoteRecord.itbis ??
      asRecord(debitNoteRecord.monetary).taxAmount,
  );
  if (explicitTax != null) {
    return roundToTwoDecimals(explicitTax);
  }

  const items = Array.isArray(debitNoteRecord.items) ? debitNoteRecord.items : [];
  return roundToTwoDecimals(
    items.reduce((total, item) => total + resolveLineTaxAmount(item), 0),
  );
};

const resolveDebitNoteMonetarySnapshot = (debitNoteRecord) => {
  const monetary = asRecord(debitNoteRecord.monetary);
  const totalAmount = resolveDebitNoteTotal(debitNoteRecord);
  const taxAmount = resolveDebitNoteTaxAmount(debitNoteRecord);
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
      monetary.documentCurrency ?? debitNoteRecord.currency,
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

const buildDebitNoteReceivableDraft = ({
  debitNoteId,
  debitNoteRecord,
  now,
}) => {
  const record = asRecord(debitNoteRecord);
  const client = asRecord(record.client);
  const clientId =
    toCleanString(client.id) ||
    toCleanString(record.clientId) ||
    toCleanString(asRecord(record.customer).id);
  const totalAmount = resolveDebitNoteTotal(record);

  return {
    client,
    clientId,
    debitNoteId,
    invoiceId:
      toCleanString(record.invoiceId) ?? toCleanString(record.sourceInvoiceId),
    invoiceNumber: toCleanString(record.invoiceNumber),
    invoiceNcf: toCleanString(record.invoiceNcf),
    sourceType: 'debitNote',
    originType: 'debitNote',
    originId: debitNoteId,
    documentType: 'debitNote',
    documentId: debitNoteId,
    documentNumber:
      toCleanString(record.number) ?? toCleanString(record.numberID),
    documentNcf: toCleanString(record.ncf) ?? toCleanString(record.eNcf),
    comments: toCleanString(record.reason) ?? null,
    totalReceivable: totalAmount,
    totalInstallments: 1,
    type: 'debitNote',
    monetary: record.monetary ?? null,
    createdAt: record.issuedAt ?? record.createdAt ?? now,
    updatedAt: now,
    paymentDate: record.paymentDate ?? record.dueDate ?? record.issuedAt ?? now,
    lastPaymentDate: null,
  };
};

export const ensureCustomerDebitNoteReceivable = async ({
  businessId,
  debitNoteId,
}) => {
  const user = { businessID: businessId, uid: 'system:customer-debit-note' };
  let receivableId = null;

  await db.runTransaction(async (tx) => {
    const noteRef = db.doc(`businesses/${businessId}/debitNotes/${debitNoteId}`);
    const noteSnap = await tx.get(noteRef);
    if (!noteSnap.exists) return;

    const debitNoteRecord = asRecord(noteSnap.data());
    const status = toCleanString(debitNoteRecord.status)?.toLowerCase() ?? null;
    if (status !== 'issued') return;

    receivableId = toCleanString(debitNoteRecord.accountsReceivableId);
    if (receivableId) return;

    const totalAmount = resolveDebitNoteTotal(debitNoteRecord);
    if (totalAmount <= 0) return;

    const accountReceivableNextIDSnap = await getNextIDTransactionalSnap(
      tx,
      user,
      'lastAccountReceivableId',
    );
    const now = Timestamp.now();
    const arRecord = await addAccountReceivable(tx, {
      user,
      ar: buildDebitNoteReceivableDraft({
        debitNoteId,
        debitNoteRecord,
        now,
      }),
      accountReceivableNextIDSnap,
    });
    await addInstallmentReceivable(tx, { user, ar: arRecord });
    receivableId = arRecord.id;

    tx.set(
      noteRef,
      {
        accountsReceivableId: receivableId,
        receivableCreatedAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
  });

  return receivableId;
};

export const buildCustomerDebitNoteIssuedAccountingEvent = ({
  businessId,
  debitNoteId,
  debitNoteRecord,
}) => {
  const record = asRecord(debitNoteRecord);
  const status = toCleanString(record.status)?.toLowerCase() ?? null;
  if (status && status !== 'issued') {
    return null;
  }
  if (status && VOID_DEBIT_NOTE_STATUSES.has(status)) {
    return null;
  }

  const monetarySnapshot = resolveDebitNoteMonetarySnapshot(record);
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
    eventType: 'customer_debit_note.issued',
    sourceType: 'debitNote',
    sourceId: debitNoteId,
    sourceDocumentType: 'debitNote',
    sourceDocumentId: debitNoteId,
    counterpartyType: toCleanString(client.id) ? 'client' : null,
    counterpartyId: toCleanString(client.id),
    currency: monetarySnapshot.currency,
    functionalCurrency: monetarySnapshot.functionalCurrency,
    monetary: monetarySnapshot.monetary,
    payload: {
      debitNoteNumber:
        toCleanString(record.number) ?? toCleanString(record.numberID) ?? null,
      debitNoteNcf: toCleanString(record.ncf) ?? toCleanString(record.eNcf),
      invoiceId:
        toCleanString(record.invoiceId) ?? toCleanString(record.sourceInvoiceId),
      invoiceNcf: toCleanString(record.invoiceNcf),
      invoiceNumber: toCleanString(record.invoiceNumber),
      accountsReceivableId: toCleanString(record.accountsReceivableId),
      reason: toCleanString(record.reason),
      itemCount: Array.isArray(record.items) ? record.items.length : 0,
    },
    occurredAt,
    recordedAt,
    createdAt: record.createdAt ?? recordedAt,
    createdBy: toCleanString(asRecord(record.createdBy).uid),
  });
};

export const syncCustomerDebitNoteIssuedAccountingEvent = onDocumentWritten(
  {
    document: 'businesses/{businessId}/debitNotes/{debitNoteId}',
    region: REGION,
    memory: MEMORY,
    runtimeOpts: { nodeVersion: NODE_VERSION },
  },
  async (event) => {
    const { businessId, debitNoteId } = event.params;
    const afterData = asRecord(event.data?.after?.data?.() ?? event.data?.data?.());
    const afterStatus = toCleanString(afterData.status)?.toLowerCase() ?? null;
    if (afterStatus !== 'issued') {
      return null;
    }

    const accountsReceivableId = await ensureCustomerDebitNoteReceivable({
      businessId,
      debitNoteId,
    });

    if (!(await isAccountingEnabled(businessId))) {
      return null;
    }

    const accountingEvent = buildCustomerDebitNoteIssuedAccountingEvent({
      businessId,
      debitNoteId,
      debitNoteRecord: {
        ...afterData,
        accountsReceivableId:
          accountsReceivableId ?? afterData.accountsReceivableId ?? null,
      },
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
