import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { db } from '../../../core/config/firebase.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import {
  buildAccountingEvent,
  buildAccountingEventId,
  resolveAccountingPaymentChannel,
  resolvePrimaryBankAccountId,
} from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import {
  buildAccountsPayablePaymentCashMovements,
} from '../../../versions/v2/accounting/utils/cashMovement.util.js';
import {
  applyOverduePaymentState,
  buildPaymentState,
} from '../../../versions/v2/accounting/utils/paymentState.util.js';
import {
  normalizePaymentMethodsForAggregation,
  resolvePaymentAmount,
  resolvePaymentRecordCashAccountId,
  resolvePaymentRecordCashCountId,
  resolvePurchaseSupplierId,
} from './payablePayments.shared.js';
import {
  buildCanonicalVendorBillIdFromPurchaseId,
  buildVendorBillProjection,
} from './vendorBill.shared.js';

export { buildVendorBillProjection } from './vendorBill.shared.js';

const REGION = 'us-central1';
const MEMORY = '256MiB';
const NODE_VERSION = '20';
const THRESHOLD = 0.01;
const INACTIVE_PAYMENT_STATUSES = new Set(['void', 'draft']);

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

const toMillis = (value) => {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
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

const resolvePurchaseDocumentTotal = (purchaseRecord) => {
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

const syncVendorBillPaymentState = async ({
  businessId,
  purchaseId,
  purchaseRecord,
  paymentState,
  paymentTerms,
}) => {
  const vendorBillId = buildCanonicalVendorBillIdFromPurchaseId(purchaseId);
  if (!vendorBillId) {
    return;
  }
  const vendorBillRef = db.doc(
    `businesses/${businessId}/vendorBills/${vendorBillId}`,
  );

  const vendorBillProjection = buildVendorBillProjection({
    purchaseId,
    purchaseRecord,
    paymentState,
    paymentTerms,
    vendorBillId,
  });
  if (!vendorBillProjection) {
    return;
  }

  await vendorBillRef.set(vendorBillProjection, { merge: true });
};

const buildLegacyAwarePaymentState = ({
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

const resolvePaymentStatus = (paymentRecord) =>
  toCleanString(paymentRecord?.status)?.toLowerCase() || null;

const isActivePaymentStatus = (status) =>
  Boolean(status) && !INACTIVE_PAYMENT_STATUSES.has(status);

const resolveCurrencyCode = (value) =>
  toCleanString(asRecord(value).code ?? value)?.toUpperCase() || null;

const resolvePaymentMonetarySnapshot = (paymentRecord) => {
  const monetary = asRecord(paymentRecord.monetary);
  const documentTotals = asRecord(monetary.documentTotals);
  const functionalTotals = asRecord(monetary.functionalTotals);
  const amount = roundToTwoDecimals(
    safeNumber(
      documentTotals.total ??
        documentTotals.paid ??
        monetary.amount ??
        paymentRecord.totalAmount,
    ) ?? resolvePaymentAmount(paymentRecord),
  );
  const functionalAmount = roundToTwoDecimals(
    safeNumber(
      functionalTotals.total ??
        functionalTotals.paid ??
        monetary.functionalAmount,
    ) ?? amount,
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

const serializePaymentMethods = (paymentMethods) =>
  paymentMethods.map((method) => ({
    method: toCleanString(method.method) || null,
    amount: roundToTwoDecimals(method.amount),
    supplierCreditNoteId: toCleanString(method.supplierCreditNoteId),
    reference: toCleanString(method.reference),
    bankAccountId: toCleanString(method.bankAccountId),
    cashAccountId: toCleanString(method.cashAccountId),
    cashCountId: toCleanString(method.cashCountId),
  }));

export const buildAccountsPayablePaymentAccountingEvents = ({
  businessId,
  paymentId,
  beforePayment,
  afterPayment,
}) => {
  const previousPayment = asRecord(beforePayment);
  const nextPayment = asRecord(afterPayment);
  if (!Object.keys(nextPayment).length) {
    return [];
  }

  const previousStatus = resolvePaymentStatus(previousPayment);
  const nextStatus = resolvePaymentStatus(nextPayment);
  const normalizedPaymentMethods =
    normalizePaymentMethodsForAggregation(nextPayment);
  const supplierId =
    toCleanString(nextPayment.supplierId) ??
    toCleanString(nextPayment.counterpartyId) ??
    resolvePurchaseSupplierId(nextPayment);
  const paymentMonetarySnapshot = resolvePaymentMonetarySnapshot(nextPayment);
  const commonPayload = {
    purchaseId: toCleanString(nextPayment.purchaseId) ?? null,
    vendorBillId:
      toCleanString(nextPayment.vendorBillId) ??
      buildCanonicalVendorBillIdFromPurchaseId(nextPayment.purchaseId),
    purchaseNumber:
      toCleanString(nextPayment.metadata?.purchaseNumber) ??
      toCleanString(nextPayment.purchaseNumber) ??
      null,
    receiptNumber:
      toCleanString(nextPayment.receiptNumber) ??
      toCleanString(nextPayment.referenceNumber) ??
      null,
    reference:
      toCleanString(nextPayment.reference) ??
      toCleanString(nextPayment.metadata?.reference) ??
      null,
    paymentMethods: serializePaymentMethods(normalizedPaymentMethods),
    appliedCreditNotes: Array.isArray(nextPayment.metadata?.appliedCreditNotes)
      ? nextPayment.metadata.appliedCreditNotes
      : [],
  };
  const commonEventInput = {
    businessId,
    sourceType: 'accountsPayablePayment',
    sourceId: paymentId,
    sourceDocumentType: 'accountsPayablePayment',
    sourceDocumentId: paymentId,
    counterpartyType: supplierId ? 'supplier' : null,
    counterpartyId: supplierId,
    currency: paymentMonetarySnapshot.currency,
    functionalCurrency: paymentMonetarySnapshot.functionalCurrency,
    monetary: paymentMonetarySnapshot.monetary,
    treasury: {
      cashAccountId:
        toCleanString(nextPayment.cashAccountId) ??
        resolvePaymentRecordCashAccountId(normalizedPaymentMethods),
      cashCountId:
        toCleanString(nextPayment.cashCountId) ??
        resolvePaymentRecordCashCountId(normalizedPaymentMethods),
      bankAccountId:
        resolvePrimaryBankAccountId(normalizedPaymentMethods) ??
        toCleanString(nextPayment.bankAccountId),
      paymentChannel: resolveAccountingPaymentChannel(normalizedPaymentMethods),
    },
    payload: commonPayload,
  };
  const events = [];

  if (!isActivePaymentStatus(previousStatus) && isActivePaymentStatus(nextStatus)) {
    events.push(
      buildAccountingEvent({
        ...commonEventInput,
        eventType: 'accounts_payable.payment.recorded',
        idempotencyKey: toCleanString(nextPayment.metadata?.idempotencyKey),
        occurredAt:
          nextPayment.occurredAt ?? nextPayment.createdAt ?? nextPayment.updatedAt,
        recordedAt:
          nextPayment.createdAt ?? nextPayment.occurredAt ?? nextPayment.updatedAt,
        createdAt:
          nextPayment.createdAt ?? nextPayment.occurredAt ?? nextPayment.updatedAt,
        createdBy:
          toCleanString(nextPayment.createdBy) ??
          toCleanString(nextPayment.updatedBy) ??
          null,
      }),
    );
  }

  if (previousStatus !== 'void' && nextStatus === 'void') {
    events.push(
      buildAccountingEvent({
        ...commonEventInput,
        eventType: 'accounts_payable.payment.voided',
        payload: {
          ...commonPayload,
          reason:
            toCleanString(nextPayment.voidReason) ??
            toCleanString(nextPayment.metadata?.voidReason) ??
            null,
          restoredCreditNotes: Array.isArray(
            nextPayment.metadata?.restoredCreditNotes,
          )
            ? nextPayment.metadata.restoredCreditNotes
            : [],
        },
        reversalOfEventId: buildAccountingEventId({
          eventType: 'accounts_payable.payment.recorded',
          sourceId: paymentId,
        }),
        occurredAt:
          nextPayment.voidedAt ??
          nextPayment.updatedAt ??
          nextPayment.occurredAt ??
          nextPayment.createdAt,
        recordedAt:
          nextPayment.voidedAt ??
          nextPayment.updatedAt ??
          nextPayment.createdAt ??
          nextPayment.occurredAt,
        createdAt:
          nextPayment.voidedAt ??
          nextPayment.updatedAt ??
          nextPayment.createdAt ??
          nextPayment.occurredAt,
        createdBy:
          toCleanString(nextPayment.voidedBy) ??
          toCleanString(nextPayment.updatedBy) ??
          toCleanString(nextPayment.createdBy) ??
          null,
      }),
    );
  }

  return events;
};

const syncCashMovementsForPayment = async ({
  businessId,
  paymentId,
  beforePayment,
  afterPayment,
}) => {
  const beforeMovements = buildAccountsPayablePaymentCashMovements({
    businessId,
    payment: beforePayment ? { ...beforePayment, id: paymentId } : null,
    createdAt:
      beforePayment?.createdAt ?? beforePayment?.occurredAt ?? Date.now(),
  });
  const afterMovements = buildAccountsPayablePaymentCashMovements({
    businessId,
    payment: afterPayment ? { ...afterPayment, id: paymentId } : null,
    createdAt: afterPayment?.createdAt ?? afterPayment?.occurredAt ?? Date.now(),
  });

  const afterIds = new Set(afterMovements.map((movement) => movement.id));
  const batch = db.batch();

  beforeMovements.forEach((movement) => {
    if (afterIds.has(movement.id)) {
      return;
    }

    batch.delete(db.doc(`businesses/${businessId}/cashMovements/${movement.id}`));
  });

  afterMovements.forEach((movement) => {
    batch.set(
      db.doc(`businesses/${businessId}/cashMovements/${movement.id}`),
      movement,
      { merge: true },
    );
  });

  if (beforeMovements.length || afterMovements.length) {
    await batch.commit();
  }
};

const syncPurchasePaymentState = async ({ businessId, purchaseId }) => {
  if (!purchaseId) return;

  const purchaseRef = db.doc(`businesses/${businessId}/purchases/${purchaseId}`);
  const purchaseSnap = await purchaseRef.get();
  if (!purchaseSnap.exists) {
    logger.warn('Purchase not found while syncing accounts payable payment', {
      businessId,
      purchaseId,
    });
    return;
  }

  const purchaseRecord = asRecord(purchaseSnap.data());
  const total = resolvePurchaseDocumentTotal(purchaseRecord);
  if (total <= THRESHOLD) {
    return;
  }

  const paymentsSnap = await db
    .collection(`businesses/${businessId}/accountsPayablePayments`)
    .where('purchaseId', '==', purchaseId)
    .get();

  const activePayments = paymentsSnap.docs
    .map((paymentDoc) => ({
      id: paymentDoc.id,
      ...asRecord(paymentDoc.data()),
    }))
    .filter((paymentRecord) => {
      const status = toCleanString(paymentRecord.status)?.toLowerCase();
      return status !== 'void' && status !== 'draft';
    });

  const paid = roundToTwoDecimals(
    activePayments.reduce(
      (sum, paymentRecord) => sum + resolvePaymentAmount(paymentRecord),
      0,
    ),
  );

  const sortedPayments = activePayments.sort((left, right) => {
    const leftMillis =
      toMillis(left.occurredAt) ?? toMillis(left.createdAt) ?? 0;
    const rightMillis =
      toMillis(right.occurredAt) ?? toMillis(right.createdAt) ?? 0;
    return rightMillis - leftMillis;
  });

  const latestPayment = sortedPayments[0] ?? null;
  const balance = roundToTwoDecimals(Math.max(total - paid, 0));
  const nextPaymentAt =
    balance > THRESHOLD
      ? latestPayment?.nextPaymentAt ??
        purchaseRecord.paymentTerms?.nextPaymentAt ??
        purchaseRecord.paymentTerms?.expectedPaymentAt ??
        null
      : null;

  const paymentState = buildLegacyAwarePaymentState({
    purchaseRecord,
    total,
    paid,
    paymentCount: activePayments.length,
    lastPaymentAt:
      latestPayment?.occurredAt ?? latestPayment?.createdAt ?? null,
    lastPaymentId: latestPayment?.id ?? null,
    nextPaymentAt,
  });
  const paymentTerms = {
    ...asRecord(purchaseRecord.paymentTerms),
    nextPaymentAt,
  };

  await purchaseRef.set(
    {
      paymentState,
      paymentTerms,
    },
    { merge: true },
  );

  await syncVendorBillPaymentState({
    businessId,
    purchaseId,
    purchaseRecord,
    paymentState,
    paymentTerms,
  });
};

export const syncAccountsPayablePayment = onDocumentWritten(
  {
    document: 'businesses/{businessId}/accountsPayablePayments/{paymentId}',
    region: REGION,
    memory: MEMORY,
    runtimeOpts: { nodeVersion: NODE_VERSION },
  },
  async (event) => {
    const { businessId, paymentId } = event.params;

    const accountingSettings =
      await getPilotAccountingSettingsForBusiness(businessId);
    if (
      !isAccountingRolloutEnabledForBusiness(businessId, accountingSettings)
    ) {
      return null;
    }
    const shouldProjectAccountingEvents =
      accountingSettings?.generalAccountingEnabled !== false;

    const beforePayment = event.data?.before?.data() ?? null;
    const afterPayment = event.data?.after?.data() ?? null;

    await syncCashMovementsForPayment({
      businessId,
      paymentId,
      beforePayment,
      afterPayment,
    });

    const purchaseId = toCleanString(
      afterPayment?.purchaseId ??
        beforePayment?.purchaseId,
    );

    await syncPurchasePaymentState({
      businessId,
      purchaseId,
    });

    if (!shouldProjectAccountingEvents) {
      return null;
    }

    const accountingEvents = buildAccountsPayablePaymentAccountingEvents({
      businessId,
      paymentId,
      beforePayment,
      afterPayment,
    });

    await Promise.all(
      accountingEvents.map((accountingEvent) =>
        db
          .doc(`businesses/${businessId}/accountingEvents/${accountingEvent.id}`)
          .set(accountingEvent, { merge: true }),
      ),
    );

    return null;
  },
);
