import { db, FieldValue, Timestamp } from '../../../../core/config/firebase.js';

import { auditTx } from './audit.service.js';
import { scheduleCompensationsInTx } from './compensation.service.js';
import {
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
    const amount = safeNumber(method?.value ?? method?.amount);
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
    safeNumber(canonical?.totalPurchase?.value) ??
    safeNumber(canonical?.totalAmount);
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
          value: safeNumber(method?.value ?? method?.amount),
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

    const failedSnap = await tx.get(outboxCol.where('status', '==', 'failed'));
    if (!failedSnap.empty) {
      const failedTasks = summarizeOutboxTasks(failedSnap.docs);
      if (areOnlyNonBlockingFailures(failedTasks)) {
        const summary = buildNonBlockingFailureSummary(failedTasks);
        auditTx(tx, {
          businessId,
          invoiceId,
          event: 'finalize_non_blocking_failures',
          level: 'warn',
          data: summary,
        });
        tx.set(
          invoiceRef,
          {
            nonBlockingFailures: {
              ...summary,
              detectedAt: FieldValue.serverTimestamp(),
            },
            statusTimeline: FieldValue.arrayUnion({
              status: 'non_blocking_failure',
              at: Timestamp.now(),
              taskTypes: summary.taskTypes,
            }),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        if (inv.idempotencyKey) {
          const idemRef = db.doc(
            `businesses/${businessId}/idempotency/${inv.idempotencyKey}`,
          );
          tx.set(
            idemRef,
            {
              status: inv.frontendReadyAt ? 'frontend_ready' : inv.status || 'pending',
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        }
        return;
      }

      // Programar compensaciones para tareas completadas
      await scheduleCompensationsInTx(tx, { businessId, invoiceId });
      auditTx(tx, {
        businessId,
        invoiceId,
        event: 'finalize_failed',
        level: 'warn',
        data: {
          failed: true,
          failedTaskTypes: failedTasks.map((task) => task.type),
        },
      });
      tx.update(invoiceRef, {
        status: 'failed',
        statusTimeline: FieldValue.arrayUnion({
          status: 'failed',
          at: Timestamp.now(),
        }),
        updatedAt: FieldValue.serverTimestamp(),
      });
      // Opcional: marcar idempotency como failed
      if (inv.idempotencyKey) {
        const idemRef = db.doc(
          `businesses/${businessId}/idempotency/${inv.idempotencyKey}`,
        );
        tx.set(
          idemRef,
          { status: 'failed', updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
      }
      return;
    }

    // Todas las tareas finalizadas -> consumir NCF (si reservado) y marcar committed
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

    tx.update(invoiceRef, {
      status: 'committed',
      committedAt: FieldValue.serverTimestamp(),
      statusTimeline: FieldValue.arrayUnion({
        status: 'committed',
        at: Timestamp.now(),
      }),
      updatedAt: FieldValue.serverTimestamp(),
    });
    auditTx(tx, {
      businessId,
      invoiceId,
      event: 'finalize_committed',
      data: {
        committed: true,
        accountingEventCreated: accountingEnabled,
      },
    });

    if (inv.idempotencyKey) {
      const idemRef = db.doc(
        `businesses/${businessId}/idempotency/${inv.idempotencyKey}`,
      );
      tx.set(
        idemRef,
        { status: 'committed', updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
    }
  });
}
