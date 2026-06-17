import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { db, Timestamp } from '../../../core/config/firebase.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import { buildAccountingEvent } from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import {
  THRESHOLD,
  asRecord,
  resolvePurchaseDocumentTotal,
  resolvePurchaseSupplierId,
  roundToTwoDecimals,
  safeNumber,
  toCleanString,
} from './payablePayments.shared.js';
import {
  buildPurchaseSourceAuditMetadata,
  SUPPLIER_CREDIT_NOTE_SYNC_ACTOR,
} from './purchaseDerivedAudit.shared.js';

const REGION = 'us-central1';
const MEMORY = '256MiB';
const NODE_VERSION = '20';

const resolveOverpaidAmount = (purchaseRecord) => {
  const total = resolvePurchaseDocumentTotal(purchaseRecord);
  const paid = safeNumber(purchaseRecord.paymentState?.paid) ?? 0;
  return roundToTwoDecimals(Math.max(paid - total, 0));
};

const resolveCurrencyCode = (value) =>
  toCleanString(asRecord(value).code ?? value)?.toUpperCase() ?? null;

const resolveSupplierCreditNoteMonetarySnapshot = ({
  amount,
  purchaseRecord,
}) => {
  const monetary = asRecord(purchaseRecord.monetary);
  const documentTotals = asRecord(monetary.documentTotals);
  const functionalTotals = asRecord(monetary.functionalTotals);
  const purchaseDocumentTotal = roundToTwoDecimals(
    documentTotals.total ?? documentTotals.gross,
  );
  const purchaseFunctionalTotal = roundToTwoDecimals(
    functionalTotals.total ?? functionalTotals.gross,
  );
  const functionalAmount =
    purchaseDocumentTotal > THRESHOLD && purchaseFunctionalTotal > THRESHOLD
      ? roundToTwoDecimals((purchaseFunctionalTotal * amount) / purchaseDocumentTotal)
      : roundToTwoDecimals(amount);

  return {
    currency: resolveCurrencyCode(monetary.documentCurrency),
    functionalCurrency: resolveCurrencyCode(monetary.functionalCurrency),
    monetary: {
      amount: roundToTwoDecimals(amount),
      functionalAmount,
    },
  };
};

export const syncPurchaseSupplierCreditNote = onDocumentWritten(
  {
    document: 'businesses/{businessId}/purchases/{purchaseId}',
    region: REGION,
    memory: MEMORY,
    runtimeOpts: { nodeVersion: NODE_VERSION },
  },
  async (event) => {
    const { businessId, purchaseId } = event.params;
    const accountingSettings =
      await getPilotAccountingSettingsForBusiness(businessId);
    if (
      !isAccountingRolloutEnabledForBusiness(businessId, accountingSettings)
    ) {
      return null;
    }
    const shouldProjectAccountingEvents =
      accountingSettings?.generalAccountingEnabled !== false;

    const purchaseRecord = asRecord(event.data?.after?.data());
    if (!Object.keys(purchaseRecord).length) {
      return null;
    }

    const supplierId = resolvePurchaseSupplierId(purchaseRecord);
    if (!supplierId) {
      return null;
    }

    const overpaidAmount = resolveOverpaidAmount(purchaseRecord);
    const noteId = `purchase_overpaid_${purchaseId}`;
    const noteRef = db.doc(
      `businesses/${businessId}/supplierCreditNotes/${noteId}`,
    );
    const noteSnap = await noteRef.get();
    if (overpaidAmount <= THRESHOLD && !noteSnap.exists) {
      return null;
    }

    const existingRecord = noteSnap.exists ? asRecord(noteSnap.data()) : {};
    const existingTotalAmount = roundToTwoDecimals(
      existingRecord.totalAmount ??
        existingRecord.amount ??
        existingRecord.value,
    );
    const appliedAmount = roundToTwoDecimals(
      existingRecord.appliedAmount ??
        Math.max(
          existingTotalAmount -
            roundToTwoDecimals(
              existingRecord.remainingAmount ??
                existingRecord.balance ??
                existingTotalAmount,
            ),
          0,
        ),
    );
    const nextTotalAmount =
      overpaidAmount > THRESHOLD
        ? roundToTwoDecimals(Math.max(overpaidAmount, appliedAmount))
        : roundToTwoDecimals(appliedAmount);
    const nextRemainingAmount = roundToTwoDecimals(
      Math.max(nextTotalAmount - appliedAmount, 0),
    );
    const nextStatus =
      nextTotalAmount <= THRESHOLD
        ? 'void'
        : nextRemainingAmount <= THRESHOLD
          ? 'applied'
          : 'open';

    const payload = {
      id: noteId,
      businessId,
      supplierId,
      counterpartyId: supplierId,
      sourceDocumentType: 'purchase',
      sourceDocumentId: purchaseId,
      originType: 'purchase_overpayment',
      totalAmount: nextTotalAmount,
      appliedAmount,
      remainingAmount: nextRemainingAmount,
      status: nextStatus,
      createdAt: noteSnap.exists
        ? (existingRecord.createdAt ?? Timestamp.now())
        : Timestamp.now(),
      createdBy: SUPPLIER_CREDIT_NOTE_SYNC_ACTOR,
      updatedAt: Timestamp.now(),
      updatedBy: SUPPLIER_CREDIT_NOTE_SYNC_ACTOR,
      metadata: {
        purchaseId,
        purchaseNumber: purchaseRecord.numberId ?? null,
        purchaseStatus:
          toCleanString(
            purchaseRecord.workflowStatus ?? purchaseRecord.status,
          ) ?? null,
        autoGenerated: true,
        overpaidAmount,
        ...buildPurchaseSourceAuditMetadata(purchaseRecord),
      },
    };

    const writes = [noteRef.set(payload, { merge: true })];

    if (shouldProjectAccountingEvents && nextTotalAmount > THRESHOLD) {
      const creditNoteMonetary = resolveSupplierCreditNoteMonetarySnapshot({
        amount: nextTotalAmount,
        purchaseRecord,
      });
      const accountingEvent = buildAccountingEvent({
        businessId,
        eventType: 'supplier_credit_note.issued',
        sourceType: 'supplierCreditNote',
        sourceId: noteId,
        sourceDocumentType: 'supplierCreditNote',
        sourceDocumentId: noteId,
        counterpartyType: 'supplier',
        counterpartyId: supplierId,
        currency: creditNoteMonetary.currency,
        functionalCurrency: creditNoteMonetary.functionalCurrency,
        monetary: creditNoteMonetary.monetary,
        payload: {
          supplierCreditNoteId: noteId,
          purchaseId,
          purchaseNumber: payload.metadata.purchaseNumber,
          originType: payload.originType,
          totalAmount: nextTotalAmount,
          appliedAmount,
          remainingAmount: nextRemainingAmount,
          status: nextStatus,
        },
        occurredAt:
          purchaseRecord.completedAt ??
          purchaseRecord.updatedAt ??
          payload.createdAt,
        recordedAt: payload.createdAt,
        createdAt: payload.createdAt,
        createdBy: SUPPLIER_CREDIT_NOTE_SYNC_ACTOR,
        metadata: buildPurchaseSourceAuditMetadata(purchaseRecord),
      });

      writes.push(
        db
          .doc(`businesses/${businessId}/accountingEvents/${accountingEvent.id}`)
          .set(accountingEvent, { merge: true }),
      );
    }

    await Promise.all(writes);
    return null;
  },
);
