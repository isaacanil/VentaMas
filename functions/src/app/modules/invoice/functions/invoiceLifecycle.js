import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, FieldValue, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';
import { auditTx } from '../../../versions/v2/invoice/services/audit.service.js';
import {
  buildAccountingEvent,
  roundAccountingAmount,
} from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import {
  buildJournalEntry,
  normalizeJournalEntryLine,
} from '../../../versions/v2/accounting/utils/journalEntry.util.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import { assertAccountingPeriodOpenInTransaction } from '../../../versions/v2/accounting/utils/periodClosure.util.js';
import { DGII_608_REASON_CATALOG_VERSION } from '../../compliance/services/dgii608ReasonCatalog.service.js';
import { voidServiceCommissionsTx } from '../../commissions/services/serviceCommissions.service.js';

const LOCKED_INVOICE_STATUSES = new Set([
  'issued',
  'posted',
  'committed',
  'completed',
  'partial',
  'paid',
  'voided',
  'canceled',
  'cancelled',
  'reversed',
]);

const VOIDED_INVOICE_STATUSES = new Set(['voided', 'canceled', 'cancelled']);

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveBusinessId = (payload) =>
  toCleanString(payload.businessId) || toCleanString(payload.businessID);

const resolveInvoicePayload = (invoiceDoc) => {
  const root = asRecord(invoiceDoc);
  const data = asRecord(root.data);
  return Object.keys(data).length ? data : root;
};

const resolveInvoiceStatus = (invoiceDoc) =>
  toCleanString(resolveInvoicePayload(invoiceDoc).status);

const isDraftInvoice = (invoiceDoc) =>
  resolveInvoiceStatus(invoiceDoc) === 'draft';

const isLockedInvoice = (invoiceDoc) => {
  const payload = resolveInvoicePayload(invoiceDoc);
  const status = resolveInvoiceStatus(invoiceDoc);
  if (LOCKED_INVOICE_STATUSES.has(status)) return true;

  return Boolean(
    toCleanString(payload.NCF) ||
    toCleanString(payload.ncf) ||
    toCleanString(payload.comprobante) ||
    toCleanString(payload.numberID) ||
    toCleanString(payload.cashCountId) ||
    toCleanString(payload.voidedAt) ||
    Object.keys(asRecord(payload.receivableState)).length ||
    (Array.isArray(payload.paymentHistory) &&
      payload.paymentHistory.length > 0) ||
    safeNumber(payload.accumulatedPaid) > 0 ||
    safeNumber(payload.balanceDue) > 0,
  );
};

const getProductQuantity = (product) => {
  const amountToBuy = product?.amountToBuy;
  if (typeof amountToBuy === 'number') return amountToBuy;
  if (typeof amountToBuy === 'string') return safeNumber(amountToBuy);
  const amount = asRecord(amountToBuy);
  return safeNumber(amount.total ?? amount.unit ?? product?.quantity);
};

const buildUpdatedInvoiceData = ({ invoice, updates, now, authUid }) => ({
  ...invoice,
  ...updates,
  id: invoice.id,
  updatedAt: now,
  updatedBy: authUid,
});

export const updateInvoiceFinancialDocument = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    const invoiceId =
      toCleanString(payload.invoiceId) || toCleanString(payload.id);
    const updates = asRecord(payload.invoice);

    if (!businessId || !invoiceId) {
      throw new HttpsError(
        'invalid-argument',
        'businessId e invoiceId son requeridos.',
      );
    }

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR,
    });

    const invoiceRef = db.doc(`businesses/${businessId}/invoices/${invoiceId}`);
    let result = null;

    await db.runTransaction(async (transaction) => {
      const invoiceSnap = await transaction.get(invoiceRef);
      if (!invoiceSnap.exists) {
        throw new HttpsError('not-found', 'La factura ya no existe.');
      }

      const invoiceDoc = asRecord(invoiceSnap.data());
      const currentInvoice = resolveInvoicePayload(invoiceDoc);
      if (!isDraftInvoice(invoiceDoc) || isLockedInvoice(invoiceDoc)) {
        throw new HttpsError(
          'failed-precondition',
          'La factura ya fue emitida o tiene huella fiscal/contable. Debe corregirse por anulación, reverso o nota de crédito.',
        );
      }

      const now = Timestamp.now();
      const nextInvoice = buildUpdatedInvoiceData({
        invoice: currentInvoice,
        updates,
        now,
        authUid,
      });

      if (
        !isDraftInvoice({ data: nextInvoice }) ||
        isLockedInvoice({ data: nextInvoice })
      ) {
        throw new HttpsError(
          'failed-precondition',
          'La edición directa solo está permitida para facturas draft sin huella fiscal/contable.',
        );
      }

      transaction.set(
        invoiceRef,
        {
          ...invoiceDoc,
          data: nextInvoice,
          updatedAt: now,
          updatedBy: authUid,
        },
        { merge: true },
      );

      result = { ok: true, invoiceId, status: nextInvoice.status || 'draft' };
    });

    return result;
  },
);

export const deleteDraftInvoice = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    const invoiceId =
      toCleanString(payload.invoiceId) || toCleanString(payload.id);

    if (!businessId || !invoiceId) {
      throw new HttpsError(
        'invalid-argument',
        'businessId e invoiceId son requeridos.',
      );
    }

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR,
    });

    const invoiceRef = db.doc(`businesses/${businessId}/invoices/${invoiceId}`);

    await db.runTransaction(async (transaction) => {
      const invoiceSnap = await transaction.get(invoiceRef);
      if (!invoiceSnap.exists) return;

      const invoiceDoc = asRecord(invoiceSnap.data());
      if (!isDraftInvoice(invoiceDoc) || isLockedInvoice(invoiceDoc)) {
        throw new HttpsError(
          'failed-precondition',
          'No se permite borrar físicamente una factura emitida, fiscal o posteada. Use anulación formal.',
        );
      }

      transaction.delete(invoiceRef);
    });

    return { ok: true, invoiceId };
  },
);

export const voidInvoiceFinancialDocument = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    const invoiceId =
      toCleanString(payload.invoiceId) || toCleanString(payload.id);
    const cancellation = asRecord(payload.cancellation);
    const reasonCode = toCleanString(cancellation.reasonCode);
    const reasonLabel = toCleanString(cancellation.reasonLabel);
    const note = toCleanString(cancellation.note);

    if (!businessId || !invoiceId) {
      throw new HttpsError(
        'invalid-argument',
        'businessId e invoiceId son requeridos.',
      );
    }

    if (!reasonCode || !reasonLabel) {
      throw new HttpsError(
        'invalid-argument',
        'Debe indicar un motivo DGII válido para anular la factura.',
      );
    }

    await assertUserAccess({
      authUid,
      businessId,
      allowedRoles: MEMBERSHIP_ROLE_GROUPS.FINANCIAL_DOCUMENT_VOID,
    });

    const invoiceRef = db.doc(`businesses/${businessId}/invoices/${invoiceId}`);
    const invoiceV2Ref = db.doc(
      `businesses/${businessId}/invoicesV2/${invoiceId}`,
    );
    const settingsRef = db.doc(`businesses/${businessId}/settings/accounting`);
    const committedEventRef = db.doc(
      `businesses/${businessId}/accountingEvents/invoice.committed__${invoiceId}`,
    );
    const committedEntryRef = db.doc(
      `businesses/${businessId}/journalEntries/invoice.committed__${invoiceId}`,
    );
    const voidEventRef = db.doc(
      `businesses/${businessId}/accountingEvents/invoice.voided__${invoiceId}`,
    );
    const voidEntryRef = db.doc(
      `businesses/${businessId}/journalEntries/invoice.voided__${invoiceId}`,
    );
    const arQuery = db
      .collection(`businesses/${businessId}/accountsReceivable`)
      .where('invoiceId', '==', invoiceId)
      .limit(10);
    const cashMovementQuery = db
      .collection(`businesses/${businessId}/cashMovements`)
      .where('sourceId', '==', invoiceId)
      .limit(1);
    const commissionsQuery = db
      .collection(`businesses/${businessId}/serviceCommissions`)
      .where('invoiceId', '==', invoiceId)
      .limit(100);

    const accountingSettings =
      await getPilotAccountingSettingsForBusiness(businessId);
    const rolloutEnabled = isAccountingRolloutEnabledForBusiness(
      businessId,
      accountingSettings,
    );

    let result = null;

    await db.runTransaction(async (transaction) => {
      const [
        invoiceSnap,
        invoiceV2Snap,
        settingsSnap,
        committedEventSnap,
        committedEntrySnap,
        voidEntrySnap,
        arSnap,
        cashMovementSnap,
        commissionsSnap,
      ] = await Promise.all([
        transaction.get(invoiceRef),
        transaction.get(invoiceV2Ref),
        transaction.get(settingsRef),
        transaction.get(committedEventRef),
        transaction.get(committedEntryRef),
        transaction.get(voidEntryRef),
        transaction.get(arQuery),
        transaction.get(cashMovementQuery),
        transaction.get(commissionsQuery),
      ]);

      if (!invoiceSnap.exists) {
        throw new HttpsError('not-found', 'La factura ya no existe.');
      }

      const invoiceDoc = asRecord(invoiceSnap.data());
      const invoice = resolveInvoicePayload(invoiceDoc);
      const currentStatus = resolveInvoiceStatus(invoiceDoc);
      if (VOIDED_INVOICE_STATUSES.has(currentStatus)) {
        result = {
          ok: true,
          invoiceId,
          status: currentStatus,
          reused: true,
          reversalEntryId: voidEntrySnap.exists ? voidEntryRef.id : null,
        };
        return;
      }

      if (safeNumber(invoice.accumulatedPaid) > 0) {
        throw new HttpsError(
          'failed-precondition',
          'La factura tiene pagos aplicados. Anule primero los cobros desde el flujo de CxC.',
        );
      }

      if (
        Array.isArray(invoice.paymentHistory) &&
        invoice.paymentHistory.length > 0
      ) {
        throw new HttpsError(
          'failed-precondition',
          'La factura tiene historial de pagos. Anule primero los cobros desde el flujo de CxC.',
        );
      }

      if (!cashMovementSnap.empty) {
        throw new HttpsError(
          'failed-precondition',
          'La factura tiene movimientos de caja/banco asociados. La anulación automática segura de tesorería aún no está soportada.',
        );
      }

      const arDocs = arSnap.docs || [];
      const arRecords = arDocs.map((docSnapshot) => ({
        ref: docSnapshot.ref,
        id: docSnapshot.id,
        data: asRecord(docSnapshot.data()),
      }));
      const paidAr = arRecords.find((entry) => {
        const paymentState = asRecord(entry.data.paymentState);
        return (
          safeNumber(paymentState.paid) > 0 ||
          safeNumber(entry.data.accumulatedPaid) > 0 ||
          safeNumber(entry.data.totalPaid) > 0
        );
      });
      if (paidAr) {
        throw new HttpsError(
          'failed-precondition',
          'La factura tiene CxC con pagos aplicados. Anule primero los cobros.',
        );
      }

      if (committedEventSnap.exists && !committedEntrySnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'La factura tiene evento contable pendiente o fallido sin asiento posteado. Resuelva la proyección antes de anular.',
        );
      }

      const now = Timestamp.now();
      if (committedEntrySnap.exists) {
        await assertAccountingPeriodOpenInTransaction({
          transaction,
          businessId,
          effectiveDate: now,
          settings: settingsSnap.exists ? settingsSnap.data() || {} : {},
          rolloutEnabled,
          operationLabel: 'anular esta factura',
          createError: (message) =>
            new HttpsError('failed-precondition', message),
        });
      }

      const paddedReasonCode = reasonCode.padStart(2, '0');
      const cancelPayload = {
        reason: reasonLabel,
        reasonCode: paddedReasonCode,
        reasonLabel,
        note: note ?? null,
        user: authUid,
        cancelledAt: now,
      };
      const nextInvoice = {
        ...invoice,
        status: 'cancelled',
        cancel: cancelPayload,
        voidedAt: now,
        voidedBy: authUid,
        voidReason: reasonLabel,
        voidReasonCode: paddedReasonCode,
        voidReasonLabel: reasonLabel,
        voidReasonCatalogVersion: DGII_608_REASON_CATALOG_VERSION,
        updatedAt: now,
        updatedBy: authUid,
      };

      transaction.set(
        invoiceRef,
        {
          ...invoiceDoc,
          data: nextInvoice,
          updatedAt: now,
          updatedBy: authUid,
        },
        { merge: true },
      );

      if (invoiceV2Snap.exists) {
        transaction.set(
          invoiceV2Ref,
          {
            status: 'voided',
            voidedAt: now,
            voidedBy: authUid,
            voidReason: reasonLabel,
            statusTimeline: FieldValue.arrayUnion({
              status: 'voided',
              at: now,
              reason: reasonLabel,
            }),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      const products = Array.isArray(invoice.products) ? invoice.products : [];
      products.forEach((product) => {
        const productId = toCleanString(product?.id || product?.productId);
        const quantity = getProductQuantity(product);
        if (!productId || !quantity) return;
        transaction.update(
          db.doc(`businesses/${businessId}/products/${productId}`),
          { 'product.stock': FieldValue.increment(quantity) },
        );
      });

      arRecords.forEach((entry) => {
        const paymentState = asRecord(entry.data.paymentState);
        const balance = safeNumber(
          paymentState.balance ?? entry.data.arBalance,
        );
        transaction.set(
          entry.ref,
          {
            status: 'voided',
            isClosed: true,
            arBalance: 0,
            updatedAt: now,
            updatedBy: authUid,
            voidedAt: now,
            voidedBy: authUid,
            voidReason: reasonLabel,
            paymentState: {
              ...paymentState,
              balance: 0,
              status: 'voided',
            },
          },
          { merge: true },
        );

        const clientId = toCleanString(entry.data.clientId);
        if (clientId && balance > 0) {
          transaction.set(
            db.doc(`businesses/${businessId}/clients/${clientId}`),
            {
              pendingBalance: FieldValue.increment(-balance),
              updatedAt: now,
            },
            { merge: true },
          );
        }
      });

      const usageId =
        toCleanString(invoiceV2Snap.get('snapshot.ncf.usageId')) ||
        toCleanString(invoice.ncfUsageId);
      if (usageId) {
        transaction.set(
          db.doc(`businesses/${businessId}/ncfUsage/${usageId}`),
          {
            status: 'voided',
            voidedAt: FieldValue.serverTimestamp(),
            voidedBy: authUid,
            voidReason: reasonLabel,
            invoiceId,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      const voidedCommissionsCount = voidServiceCommissionsTx(transaction, {
        authUid,
        businessId,
        commissionSnap: commissionsSnap,
        reasonLabel,
        voidedAt: now,
      });

      let reversalEntryId = null;
      if (committedEntrySnap.exists && !voidEntrySnap.exists) {
        const originalEntry = asRecord(committedEntrySnap.data());
        const originalLines = Array.isArray(originalEntry.lines)
          ? originalEntry.lines.map((line, index) =>
              normalizeJournalEntryLine(line, index),
            )
          : [];

        if (!originalLines.length) {
          throw new HttpsError(
            'failed-precondition',
            'El asiento original de la factura no tiene líneas válidas para revertir.',
          );
        }

        const originalEventId =
          toCleanString(originalEntry.eventId) || committedEventRef.id;
        const voidEvent = buildAccountingEvent({
          businessId,
          eventType: 'invoice.voided',
          status: 'projected',
          sourceType: 'invoice',
          sourceId: invoiceId,
          sourceDocumentType: 'invoice',
          sourceDocumentId: invoiceId,
          counterpartyType: toCleanString(invoice.client?.id) ? 'client' : null,
          counterpartyId: toCleanString(invoice.client?.id),
          currency: toCleanString(originalEntry.currency),
          functionalCurrency: toCleanString(originalEntry.functionalCurrency),
          monetary: {
            amount: roundAccountingAmount(
              invoice.totalPurchase?.value ?? originalEntry.totals?.debit,
            ),
            taxAmount: roundAccountingAmount(invoice.totalTaxes?.value),
          },
          payload: {
            invoiceNumber: toCleanString(invoice.numberID),
            ncfCode: toCleanString(invoice.NCF),
            reasonCode: paddedReasonCode,
            reasonLabel,
          },
          projection: {
            status: 'projected',
            journalEntryId: voidEventRef.id,
            projectedAt: now,
            lastAttemptAt: now,
          },
          occurredAt: now,
          recordedAt: now,
          reversalOfEventId: originalEventId,
          createdAt: now,
          createdBy: authUid,
          metadata: {
            source: 'voidInvoiceFinancialDocument',
            originalJournalEntryId: committedEntryRef.id,
          },
        });

        const reversalLines = originalLines.map((line, index) => ({
          ...line,
          lineNumber: index + 1,
          debit: safeNumber(line.credit),
          credit: safeNumber(line.debit),
          description:
            toCleanString(line.description) || `Reverso de linea ${index + 1}`,
          reference: reasonLabel,
        }));

        const reversalEntry = buildJournalEntry({
          businessId,
          entryId: voidEvent.id,
          event: voidEvent,
          entryDate: now,
          description: `Anulacion de factura ${toCleanString(invoice.numberID) || invoiceId}`,
          currency: toCleanString(originalEntry.currency),
          functionalCurrency: toCleanString(originalEntry.functionalCurrency),
          sourceType: 'invoice',
          sourceId: invoiceId,
          reversalOfEntryId: committedEntryRef.id,
          reversalOfEventId: originalEventId,
          lines: reversalLines,
          createdAt: now,
          createdBy: authUid,
          metadata: {
            entryOrigin: 'invoice_void',
            reversedEntryId: committedEntryRef.id,
            reversedEventId: originalEventId,
            reversalReason: reasonLabel,
          },
        });

        transaction.set(voidEventRef, voidEvent);
        transaction.set(voidEntryRef, reversalEntry);
        transaction.set(
          committedEntryRef,
          {
            status: 'reversed',
            metadata: {
              ...asRecord(originalEntry.metadata),
              reversedAt: now,
              reversedBy: authUid,
              reversedByEntryId: voidEntryRef.id,
              reversalReason: reasonLabel,
            },
          },
          { merge: true },
        );
        reversalEntryId = voidEntryRef.id;
      } else if (voidEntrySnap.exists) {
        reversalEntryId = voidEntryRef.id;
      }

      auditTx(transaction, {
        businessId,
        invoiceId,
        event: 'invoice_voided',
        data: {
          reasonCode: paddedReasonCode,
          reasonLabel,
          serviceCommissionsVoided: voidedCommissionsCount,
          accountingReversalCreated: Boolean(reversalEntryId),
        },
      });

      result = {
        ok: true,
        invoiceId,
        status: 'cancelled',
        reused: false,
        reversalEntryId,
      };
    });

    return result;
  },
);
