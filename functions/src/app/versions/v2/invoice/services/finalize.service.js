import { db, FieldValue, Timestamp } from '../../../../core/config/firebase.js';

import { auditTx } from './audit.service.js';
import { scheduleCompensationsInTx } from './compensation.service.js';
import { markInvoiceTimingStage } from './invoiceTiming.service.js';
import { upsertInvoiceTimelineEventInTransaction } from './invoiceTimeline.service.js';
import {
  NON_BLOCKING_FAILURE_REVIEW_STATUS,
  areOnlyNonBlockingFailures,
  buildNonBlockingFailureSummary,
  summarizeOutboxTasks,
} from './failurePolicy.service.js';
import {
  buildAccountingEvent,
  resolveAccountingPaymentChannel,
  resolvePrimaryBankAccountId,
} from '../../accounting/utils/accountingEvent.util.js';
import { isAccountingRolloutEnabledForBusiness } from '../../accounting/utils/accountingRollout.util.js';

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

const ELECTRONIC_TAX_RECEIPT_TASK_TYPE = 'issueElectronicTaxReceipt';
const REQUIRED_FISCAL_FAILURE_STATUSES = new Set([
  'rejected',
  'error',
  'failed',
  'local_failed',
]);

const normalizeToken = (value) => toCleanString(value)?.toLowerCase() || null;

const hasRecordData = (value) => Object.keys(asRecord(value)).length > 0;

const toMillis = (value) => {
  if (!value) return null;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    const seconds =
      typeof value.seconds === 'number'
        ? value.seconds
        : typeof value._seconds === 'number'
          ? value._seconds
          : null;
    if (seconds != null) return seconds * 1000;
  }
  return null;
};

const resolveTaskCreatedMillis = (docSnap) => {
  const data = typeof docSnap?.data === 'function' ? docSnap.data() : docSnap;
  return toMillis(data?.createdAt);
};

const resolveTaskType = (docSnap) => {
  const data = typeof docSnap?.data === 'function' ? docSnap.data() : docSnap;
  return toCleanString(data?.type);
};

const filterSupersededFailedTasks = (failedDocs = [], doneDocs = []) => {
  if (!failedDocs.length || !doneDocs.length) return failedDocs;

  const latestDoneCreatedByType = new Map();
  for (const doneDoc of doneDocs) {
    const type = resolveTaskType(doneDoc);
    const createdAt = resolveTaskCreatedMillis(doneDoc);
    if (!type || createdAt == null) continue;
    const current = latestDoneCreatedByType.get(type);
    if (current == null || createdAt > current) {
      latestDoneCreatedByType.set(type, createdAt);
    }
  }

  if (!latestDoneCreatedByType.size) return failedDocs;

  return failedDocs.filter((failedDoc) => {
    const type = resolveTaskType(failedDoc);
    const failedCreatedAt = resolveTaskCreatedMillis(failedDoc);
    const latestDoneCreatedAt = type
      ? latestDoneCreatedByType.get(type)
      : null;
    return !(
      failedCreatedAt != null &&
      latestDoneCreatedAt != null &&
      latestDoneCreatedAt > failedCreatedAt
    );
  });
};

const resolveElectronicTaxReceiptSnapshot = (invoice) => {
  const invoiceRecord = asRecord(invoice);
  const snapshot = asRecord(invoiceRecord.snapshot);
  const fiscal = asRecord(invoiceRecord.fiscal ?? snapshot.fiscal);
  return (
    [
      asRecord(snapshot.electronicTaxReceipt),
      asRecord(invoiceRecord.electronicTaxReceipt),
      asRecord(fiscal.electronic),
    ].find(hasRecordData) || {}
  );
};

const resolveRequiredFiscalFailure = (invoice) => {
  const electronicSnapshot = resolveElectronicTaxReceiptSnapshot(invoice);
  const mode = normalizeToken(electronicSnapshot.mode);
  const status = normalizeToken(electronicSnapshot.status);
  if (mode !== 'required' || !REQUIRED_FISCAL_FAILURE_STATUSES.has(status)) {
    return null;
  }

  return {
    type: ELECTRONIC_TAX_RECEIPT_TASK_TYPE,
    status,
    lastError: toCleanString(electronicSnapshot.lastError),
  };
};

const resolveInvoicePaymentMethods = (invoiceRecord, invoiceSnapshot) => {
  const canonicalInvoice = asRecord(invoiceRecord);
  const snapshot = asRecord(invoiceSnapshot);
  const snapshotCart = asRecord(snapshot.cart);
  const payment = asRecord(canonicalInvoice.payment);

  const candidates = [
    canonicalInvoice.paymentMethod,
    payment.paymentMethod,
    snapshot.initialPaymentMethods,
    snapshotCart.paymentMethod,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) {
      return candidate;
    }
  }

  return [];
};

const normalizeInvoiceAccountingPaymentMethods = (paymentMethods) =>
  (Array.isArray(paymentMethods) ? paymentMethods : []).filter((method) => {
    const amount = safeNumber(method?.value);
    return amount != null && amount > 0;
  });

const buildInvoiceCommittedAccountingEvent = ({
  businessId,
  invoiceId,
  invoice,
  canonicalInvoice,
  accountingSettings,
  now,
}) => {
  const snapshot = asRecord(invoice?.snapshot);
  const canonical = asRecord(canonicalInvoice);
  const client = asRecord(canonical.client ?? snapshot.client);
  const monetary = canonical.monetary ?? snapshot.monetary ?? null;
  const paymentMethods = normalizeInvoiceAccountingPaymentMethods(
    resolveInvoicePaymentMethods(canonical, snapshot),
  );
  const occurredAt =
    canonical.date ??
    snapshot.createdAt ??
    invoice?.frontendReadyAt ??
    invoice?.createdAt ??
    now;
  const invoiceNumber =
    canonical.numberID ?? canonical.number ?? canonical.invoiceNumber ?? null;
  const ncfCode = canonical.NCF ?? snapshot?.ncf?.code ?? null;
  const paymentTerm = canonical.isAddedToReceivables === true ? 'credit' : 'cash';
  const totalAmount =
    monetary?.totals?.total ??
    safeNumber(canonical?.totalPurchase?.value);
  const paidAmount =
    monetary?.totals?.paid ?? safeNumber(canonical?.payment?.value) ?? 0;
  const receivableBalance =
    canonical.isAddedToReceivables === true
      ? Math.max((totalAmount ?? 0) - paidAmount, 0)
      : 0;

  return buildAccountingEvent({
    businessId,
    eventType: 'invoice.committed',
    sourceType: 'invoice',
    sourceId: invoiceId,
    sourceDocumentType: 'invoice',
    sourceDocumentId: invoiceId,
    counterpartyType: toCleanString(client?.id) ? 'client' : null,
    counterpartyId: toCleanString(client?.id),
    currency: toCleanString(
      monetary?.documentCurrency?.code ?? canonical.currency ?? snapshot.currency,
    ),
    functionalCurrency: toCleanString(
      monetary?.functionalCurrency?.code ?? accountingSettings?.functionalCurrency,
    ),
    monetary: {
      amount: totalAmount,
      taxAmount:
        monetary?.totals?.taxes ??
        safeNumber(canonical?.totalTaxes?.value),
      functionalAmount:
        monetary?.functionalTotals?.total ?? monetary?.totals?.total ?? null,
      functionalTaxAmount:
        monetary?.functionalTotals?.taxes ?? monetary?.totals?.taxes ?? null,
    },
    treasury: {
      cashCountId: toCleanString(canonical.cashCountId),
      bankAccountId: resolvePrimaryBankAccountId(paymentMethods),
      paymentChannel: resolveAccountingPaymentChannel(paymentMethods),
    },
    payload: {
      invoiceNumber,
      ncfCode,
      status: toCleanString(canonical.status),
      paymentTerm,
      paymentMethodCount: Array.isArray(paymentMethods) ? paymentMethods.length : 0,
      paymentMethods: (Array.isArray(paymentMethods) ? paymentMethods : []).map(
        (method) => ({
          method: toCleanString(method?.method) || null,
          value: safeNumber(method?.value),
          bankAccountId: toCleanString(method?.bankAccountId),
        }),
      ),
      paidAmount,
      settledAmount: paidAmount,
      receivableBalance,
      isAddedToReceivables: canonical.isAddedToReceivables === true,
      hasMonetarySnapshot: monetary != null,
    },
    occurredAt,
    recordedAt: now,
    idempotencyKey: toCleanString(invoice?.idempotencyKey),
    createdAt: now,
    createdBy: toCleanString(invoice?.userId),
  });
};

async function consumeNcfIfReserved(tx, { businessId, invoice, invoiceId }) {
  const ncf = invoice?.snapshot?.ncf;
  const usageId = ncf?.usageId;
  if (!usageId) return;
  const usageRef = db.doc(`businesses/${businessId}/ncfUsage/${usageId}`);
  const usageSnap = await tx.get(usageRef);
  if (!usageSnap.exists) return;
  const data = usageSnap.data();
  if (data.status === 'used') return; // idempotente
  if (data.status === 'voided') return; // no consumir si fue anulado
  tx.update(usageRef, {
    status: 'used',
    usedAt: FieldValue.serverTimestamp(),
    invoiceId: invoiceId || invoice.id || null,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

async function failFinalizeInTx(
  tx,
  { businessId, invoiceId, invoiceRef, invoice, failedTaskTypes, metadata = {} },
) {
  await scheduleCompensationsInTx(tx, { businessId, invoiceId });
  auditTx(tx, {
    businessId,
    invoiceId,
    event: 'finalize_failed',
    level: 'warn',
    data: {
      failed: true,
      failedTaskTypes,
      ...metadata,
    },
  });
  const failedAt = Timestamp.now();
  tx.update(invoiceRef, {
    status: 'failed',
    statusTimeline: FieldValue.arrayUnion({
      status: 'failed',
      at: failedAt,
    }),
    updatedAt: FieldValue.serverTimestamp(),
  });
  upsertInvoiceTimelineEventInTransaction({
    transaction: tx,
    timelineEventRef: db.doc(
      `businesses/${businessId}/invoicesV2/${invoiceId}/timeline/finalize__failed`,
    ),
    businessId,
    invoiceId,
    eventId: 'finalize__failed',
    status: 'failed',
    at: failedAt,
    source: 'attemptFinalizeInvoice',
    metadata: {
      failedTaskTypes,
      ...metadata,
    },
  });
  if (invoice.idempotencyKey) {
    const idemRef = db.doc(
      `businesses/${businessId}/idempotency/${invoice.idempotencyKey}`,
    );
    tx.set(
      idemRef,
      { status: 'failed', updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  }
}

export async function attemptFinalizeInvoice({ businessId, invoiceId }) {
  const invoiceRef = db.doc(`businesses/${businessId}/invoicesV2/${invoiceId}`);
  const outboxCol = invoiceRef.collection('outbox');
  const canonicalInvoiceRef = db.doc(`businesses/${businessId}/invoices/${invoiceId}`);
  const accountingSettingsRef = db.doc(
    `businesses/${businessId}/settings/accounting`,
  );

  await db.runTransaction(async (tx) => {
    const invSnap = await tx.get(invoiceRef);
    if (!invSnap.exists) return;
    const inv = invSnap.data();
    if (inv.status === 'committed' || inv.status === 'failed') return; // idempotente

    const pendingSnap = await tx.get(
      outboxCol.where('status', '==', 'pending').limit(1),
    );
    if (!pendingSnap.empty) return; // aun pendientes

    let nonBlockingFailureSummary = null;
    let supersededFailureSummary = null;
    const failedSnap = await tx.get(outboxCol.where('status', '==', 'failed'));
    if (!failedSnap.empty) {
      const doneSnap = await tx.get(outboxCol.where('status', '==', 'done'));
      const activeFailedDocs = filterSupersededFailedTasks(
        failedSnap.docs,
        doneSnap.docs || [],
      );
      const failedTasks = summarizeOutboxTasks(activeFailedDocs);
      if (!failedTasks.length) {
        supersededFailureSummary = {
          ignored: failedSnap.docs.length,
        };
      } else if (areOnlyNonBlockingFailures(failedTasks)) {
        const summary = buildNonBlockingFailureSummary(failedTasks);
        nonBlockingFailureSummary = summary;
      } else {
        await failFinalizeInTx(tx, {
          businessId,
          invoiceId,
          invoiceRef,
          invoice: inv,
          failedTaskTypes: failedTasks.map((task) => task.type),
        });
        return;
      }
    }

    const requiredFiscalFailure = resolveRequiredFiscalFailure(inv);
    if (requiredFiscalFailure) {
      await failFinalizeInTx(tx, {
        businessId,
        invoiceId,
        invoiceRef,
        invoice: inv,
        failedTaskTypes: [requiredFiscalFailure.type],
        metadata: {
          fiscalStatus: requiredFiscalFailure.status,
          fiscalLastError: requiredFiscalFailure.lastError || undefined,
        },
      });
      return;
    }

    // Todas las tareas criticas finalizaron; las no bloqueantes quedan para revision.
    const accountingSettingsSnap = await tx.get(accountingSettingsRef);
    const accountingSettings = accountingSettingsSnap.exists
      ? accountingSettingsSnap.data() || {}
      : null;
    const accountingEnabled =
      accountingSettings?.generalAccountingEnabled === true &&
      isAccountingRolloutEnabledForBusiness(businessId, accountingSettings);
    const canonicalInvoiceSnap = accountingEnabled
      ? await tx.get(canonicalInvoiceRef)
      : null;
    const canonicalInvoice =
      canonicalInvoiceSnap?.exists ? canonicalInvoiceSnap.data()?.data || {} : {};
    const now = Timestamp.now();

    await consumeNcfIfReserved(tx, { businessId, invoice: inv, invoiceId });

    if (accountingEnabled) {
      const accountingEvent = buildInvoiceCommittedAccountingEvent({
        businessId,
        invoiceId,
        invoice: inv,
        canonicalInvoice,
        accountingSettings,
        now,
      });
      const accountingEventRef = db.doc(
        `businesses/${businessId}/accountingEvents/${accountingEvent.id}`,
      );
      tx.set(accountingEventRef, accountingEvent);
    }

    const finalStatus = nonBlockingFailureSummary
      ? NON_BLOCKING_FAILURE_REVIEW_STATUS
      : 'committed';
    const timelineEntries = [];
    if (nonBlockingFailureSummary) {
      timelineEntries.push({
        status: 'non_blocking_failure',
        at: now,
        taskTypes: nonBlockingFailureSummary.taskTypes,
      });
    }
    timelineEntries.push({
      status: finalStatus,
      at: now,
      ...(nonBlockingFailureSummary
        ? {
            reviewRequired: true,
            taskTypes: nonBlockingFailureSummary.taskTypes,
          }
        : {}),
    });

    const invoiceUpdate = {
      status: finalStatus,
      committedAt: FieldValue.serverTimestamp(),
      statusTimeline: FieldValue.arrayUnion(...timelineEntries),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (nonBlockingFailureSummary) {
      invoiceUpdate.nonBlockingFailures = {
        ...nonBlockingFailureSummary,
        finalStatus,
        detectedAt: FieldValue.serverTimestamp(),
      };
      invoiceUpdate.requiresCashCountReview =
        nonBlockingFailureSummary.requiresCashCountReview === true;
    }
    tx.update(invoiceRef, invoiceUpdate);
    if (supersededFailureSummary) {
      auditTx(tx, {
        businessId,
        invoiceId,
        event: 'finalize_ignored_superseded_failures',
        level: 'info',
        data: supersededFailureSummary,
      });
    }
    if (nonBlockingFailureSummary) {
      auditTx(tx, {
        businessId,
        invoiceId,
        event: 'finalize_non_blocking_failures',
        level: 'warn',
        data: nonBlockingFailureSummary,
      });
    }
    for (const entry of timelineEntries) {
      const eventId = `finalize__${entry.status}`;
      upsertInvoiceTimelineEventInTransaction({
        transaction: tx,
        timelineEventRef: db.doc(
          `businesses/${businessId}/invoicesV2/${invoiceId}/timeline/${eventId}`,
        ),
        businessId,
        invoiceId,
        eventId,
        status: entry.status,
        at: entry.at,
        source: 'attemptFinalizeInvoice',
        metadata: {
          reviewRequired: entry.reviewRequired || undefined,
          taskTypes: entry.taskTypes || undefined,
          accountingEventCreated: accountingEnabled,
        },
      });
    }
    await markInvoiceTimingStage({
      invoiceRef,
      transaction: tx,
      invoice: inv,
      stage: 'committed',
      at: now,
      metadata: {
        source: 'attemptFinalizeInvoice',
        status: finalStatus,
        accountingEventCreated: accountingEnabled,
        reviewRequired: Boolean(nonBlockingFailureSummary) || undefined,
      },
    });
    const auditData = {
      committed: true,
      accountingEventCreated: accountingEnabled,
    };
    if (nonBlockingFailureSummary) {
      auditData.nonBlockingFailures = nonBlockingFailureSummary.taskTypes;
      auditData.requiresCashCountReview =
        nonBlockingFailureSummary.requiresCashCountReview === true;
    }
    auditTx(tx, {
      businessId,
      invoiceId,
      event: 'finalize_committed',
      data: auditData,
    });

    if (inv.idempotencyKey) {
      const idemRef = db.doc(
        `businesses/${businessId}/idempotency/${inv.idempotencyKey}`,
      );
      tx.set(
        idemRef,
        { status: finalStatus, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
    }
  });
}
