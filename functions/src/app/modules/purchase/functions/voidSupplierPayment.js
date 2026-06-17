import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/auth/services/userAccess.service.js';
import { LIMIT_OPERATION_KEYS } from '../../../versions/v2/billing/config/limitOperations.config.js';
import { assertBusinessSubscriptionAccess } from '../../../versions/v2/billing/utils/subscriptionAccess.util.js';
import {
  getPilotAccountingSettingsForBusiness,
  isAccountingRolloutEnabledForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import {
  assertAccountingPeriodOpenInTransaction,
} from '../../../versions/v2/accounting/utils/periodClosure.util.js';
import {
  THRESHOLD,
  asRecord,
  buildPurchasePaymentState,
  buildSupplierCreditNoteApplicationId,
  normalizePaymentMethodsForAggregation,
  resolvePaymentAmount,
  resolvePurchaseDocumentTotal,
  roundToTwoDecimals,
  sanitizeForResponse,
  toCleanString,
  toMillis,
} from './payablePayments.shared.js';
import {
  buildCanonicalVendorBillIdFromPurchaseId,
  buildVendorBillProjection,
  resolvePurchaseIdFromVendorBillRecord,
} from './vendorBill.shared.js';
import {
  isCashMovementReconciledOrLinked,
} from '../../treasury/utils/cashMovementReconciliation.util.js';

const aggregatePaymentCreditNotes = (paymentRecord) =>
  normalizePaymentMethodsForAggregation(paymentRecord).reduce(
    (accumulator, method) => {
      if (
        method.method !== 'supplierCreditNote' ||
        !toCleanString(method.supplierCreditNoteId)
      ) {
        return accumulator;
      }

      const noteId = toCleanString(method.supplierCreditNoteId);
      accumulator.set(
        noteId,
        roundToTwoDecimals((accumulator.get(noteId) || 0) + method.amount),
      );
      return accumulator;
    },
    new Map(),
  );

const resolveSupplierCreditNoteApplicationId = ({
  creditNoteId,
  paymentId,
  paymentRecord,
}) => {
  const appliedCreditNotes = Array.isArray(
    paymentRecord.metadata?.appliedCreditNotes,
  )
    ? paymentRecord.metadata.appliedCreditNotes
    : [];
  const matchingApplication = appliedCreditNotes.find(
    (entry) => toCleanString(entry?.id) === creditNoteId,
  );

  return (
    toCleanString(matchingApplication?.applicationId) ??
    buildSupplierCreditNoteApplicationId({ creditNoteId, paymentId })
  );
};

const buildVoidResponse = ({
  paymentRecord,
  paymentState,
  restoredCreditNotes,
  alreadyVoided = false,
}) => ({
  ok: true,
  alreadyVoided,
  paymentId: paymentRecord.id,
  purchaseId: paymentRecord.purchaseId ?? null,
  vendorBillId: paymentRecord.vendorBillId ?? null,
  paymentState: sanitizeForResponse(paymentState),
  restoredCreditNotes: sanitizeForResponse(restoredCreditNotes),
  payment: sanitizeForResponse(paymentRecord),
});

export const voidSupplierPayment = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    null;
  const paymentId = toCleanString(payload.paymentId);
  const reason = toCleanString(payload.reason);

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido.');
  }
  if (!paymentId) {
    throw new HttpsError('invalid-argument', 'paymentId es requerido.');
  }

  const accountingSettings =
    await getPilotAccountingSettingsForBusiness(businessId);
  const accountingRolloutEnabled = isAccountingRolloutEnabledForBusiness(
    businessId,
    accountingSettings,
  );
  if (!accountingRolloutEnabled) {
    throw new HttpsError(
      'failed-precondition',
      'La anulación de pagos a suplidor no está habilitada para este negocio.',
    );
  }

  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.AUDIT,
  });
  await assertBusinessSubscriptionAccess({
    businessId,
    action: 'write',
    operation: LIMIT_OPERATION_KEYS.ACCOUNTS_PAYABLE_PAYMENT,
  });
  const paymentRef = db.doc(
    `businesses/${businessId}/accountsPayablePayments/${paymentId}`,
  );
  let result = null;

  await db.runTransaction(async (transaction) => {
    const paymentSnap = await transaction.get(paymentRef);
    if (!paymentSnap.exists) {
      throw new HttpsError('not-found', 'El pago a suplidor no existe.');
    }

    const paymentRecord = {
      id: paymentSnap.id,
      ...asRecord(paymentSnap.data()),
    };
    const paymentStatus = toCleanString(paymentRecord.status)?.toLowerCase();
    const vendorBillId =
      toCleanString(paymentRecord.vendorBillId) ??
      buildCanonicalVendorBillIdFromPurchaseId(paymentRecord.purchaseId);
    const purchaseId =
      toCleanString(paymentRecord.purchaseId) ??
      resolvePurchaseIdFromVendorBillRecord(
        { sourceDocumentType: 'purchase', sourceDocumentId: paymentRecord.purchaseId },
        vendorBillId,
      );
    if (!purchaseId) {
      throw new HttpsError(
        'failed-precondition',
        'El pago no está vinculado a una compra válida.',
      );
    }

    const purchaseRef = db.doc(
      `businesses/${businessId}/purchases/${purchaseId}`,
    );
    const purchaseSnap = await transaction.get(purchaseRef);
    if (!purchaseSnap.exists) {
      throw new HttpsError(
        'failed-precondition',
        'La compra asociada al pago no existe.',
      );
    }

    const purchaseRecord = asRecord(purchaseSnap.data());
    if (paymentStatus === 'void') {
      result = buildVoidResponse({
        paymentRecord,
        paymentState: purchaseRecord.paymentState ?? null,
        restoredCreditNotes:
          paymentRecord.metadata?.restoredCreditNotes ??
          paymentRecord.metadata?.appliedCreditNotes ??
          [],
        alreadyVoided: true,
      });
      return;
    }

    await assertAccountingPeriodOpenInTransaction({
      transaction,
      businessId,
      effectiveDate:
        paymentRecord.occurredAt ?? paymentRecord.createdAt ?? Date.now(),
      settings: accountingSettings,
      rolloutEnabled: true,
      operationLabel: 'anular este pago a suplidor',
      createError: (message) =>
        new HttpsError('failed-precondition', message),
    });

    const cashMovementsQuery = db
      .collection(`businesses/${businessId}/cashMovements`)
      .where('sourceId', '==', paymentId);
    const cashMovementsSnap = await transaction.get(cashMovementsQuery);
    const reconciledMovement = cashMovementsSnap.docs.find((docSnap) =>
      isCashMovementReconciledOrLinked(asRecord(docSnap.data())),
    );
    if (reconciledMovement) {
      throw new HttpsError(
        'failed-precondition',
        'El pago tiene movimientos de caja/banco conciliados. Debe revertirse mediante un flujo de conciliación/refund controlado.',
      );
    }

    const paymentsQuery = db
      .collection(`businesses/${businessId}/accountsPayablePayments`)
      .where('purchaseId', '==', purchaseId);
    const paymentsSnap = await transaction.get(paymentsQuery);
    const activePayments = paymentsSnap.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...asRecord(docSnap.data()),
      }))
      .filter((record) => {
        const status = toCleanString(record.status)?.toLowerCase();
        return (
          record.id !== paymentId && status !== 'void' && status !== 'draft'
        );
      });

    const total = resolvePurchaseDocumentTotal(purchaseRecord);
    const paidAfterVoid = roundToTwoDecimals(
      activePayments.reduce(
        (sum, record) => sum + resolvePaymentAmount(record),
        0,
      ),
    );
    const balanceAfterVoid = roundToTwoDecimals(
      Math.max(total - paidAfterVoid, 0),
    );
    const sortedPayments = activePayments.sort((left, right) => {
      const leftMillis =
        toMillis(left.occurredAt) ?? toMillis(left.createdAt) ?? 0;
      const rightMillis =
        toMillis(right.occurredAt) ?? toMillis(right.createdAt) ?? 0;
      return rightMillis - leftMillis;
    });
    const latestPayment = sortedPayments[0] ?? null;
    const paymentState = buildPurchasePaymentState({
      purchaseRecord,
      total,
      paid: paidAfterVoid,
      paymentCount: activePayments.length,
      lastPaymentAt:
        latestPayment?.occurredAt ?? latestPayment?.createdAt ?? null,
      lastPaymentId: latestPayment?.id ?? null,
      nextPaymentAt:
        balanceAfterVoid > THRESHOLD
          ? (latestPayment?.nextPaymentAt ??
            purchaseRecord.paymentTerms?.nextPaymentAt ??
            purchaseRecord.paymentTerms?.expectedPaymentAt ??
            null)
          : null,
    });

    const now = Timestamp.now();
    const restoredCreditNotes = [];
    for (const [creditNoteId, restoreAmount] of aggregatePaymentCreditNotes(
      paymentRecord,
    ).entries()) {
      const creditNoteRef = db.doc(
        `businesses/${businessId}/supplierCreditNotes/${creditNoteId}`,
      );
      const creditNoteSnap = await transaction.get(creditNoteRef);
      if (!creditNoteSnap.exists) {
        continue;
      }

      const creditNoteRecord = asRecord(creditNoteSnap.data());
      const totalAmount = roundToTwoDecimals(
        creditNoteRecord.totalAmount ??
          creditNoteRecord.amount ??
          creditNoteRecord.value,
      );
      const currentAppliedAmount = roundToTwoDecimals(
        creditNoteRecord.appliedAmount ??
          Math.max(
            totalAmount -
              roundToTwoDecimals(
                creditNoteRecord.remainingAmount ??
                  creditNoteRecord.balance ??
                  totalAmount,
              ),
            0,
          ),
      );
      const nextAppliedAmount = roundToTwoDecimals(
        Math.max(currentAppliedAmount - restoreAmount, 0),
      );
      const nextRemainingAmount = roundToTwoDecimals(
        Math.max(totalAmount - nextAppliedAmount, 0),
      );
      const applicationId = resolveSupplierCreditNoteApplicationId({
        creditNoteId,
        paymentId,
        paymentRecord,
      });

      transaction.set(
        creditNoteRef,
        {
          appliedAmount: nextAppliedAmount,
          remainingAmount: nextRemainingAmount,
          status: nextRemainingAmount <= THRESHOLD ? 'applied' : 'open',
          updatedAt: now,
          updatedBy: authUid,
          lastVoidedPaymentId: paymentId,
        },
        { merge: true },
      );
      transaction.set(
        db.doc(
          `businesses/${businessId}/supplierCreditNoteApplications/${applicationId}`,
        ),
        {
          id: applicationId,
          businessId,
          supplierCreditNoteId: creditNoteId,
          paymentId,
          purchaseId,
          vendorBillId,
          supplierId: toCleanString(paymentRecord.supplierId),
          status: 'voided',
          amount: restoreAmount,
          restoredAmount: restoreAmount,
          previousAppliedAmount: currentAppliedAmount,
          nextAppliedAmount,
          previousRemainingAmount: roundToTwoDecimals(
            Math.max(totalAmount - currentAppliedAmount, 0),
          ),
          nextRemainingAmount,
          voidedAt: now,
          voidedBy: authUid,
          voidReason: reason,
          updatedAt: now,
          updatedBy: authUid,
          sourceType: 'accountsPayablePayment',
          sourceId: paymentId,
        },
        { merge: true },
      );

      restoredCreditNotes.push({
        id: creditNoteId,
        applicationId,
        restoredAmount: restoreAmount,
        remainingAmount: nextRemainingAmount,
      });
    }

    transaction.set(
      paymentRef,
      {
        vendorBillId,
        status: 'void',
        updatedAt: now,
        updatedBy: authUid,
        voidedAt: now,
        voidedBy: authUid,
        voidReason: reason,
        metadata: {
          ...asRecord(paymentRecord.metadata),
          restoredCreditNotes,
        },
      },
      { merge: true },
    );
    transaction.set(
      purchaseRef,
      {
        paymentState,
        paymentTerms: {
          ...asRecord(purchaseRecord.paymentTerms),
          nextPaymentAt:
            balanceAfterVoid > THRESHOLD
              ? (latestPayment?.nextPaymentAt ??
                purchaseRecord.paymentTerms?.expectedPaymentAt ??
                null)
              : null,
        },
      },
      { merge: true },
    );
    const vendorBillProjection = buildVendorBillProjection({
      purchaseId,
      purchaseRecord,
      paymentState,
      paymentTerms: {
        ...asRecord(purchaseRecord.paymentTerms),
        nextPaymentAt:
          balanceAfterVoid > THRESHOLD
            ? (latestPayment?.nextPaymentAt ??
              purchaseRecord.paymentTerms?.expectedPaymentAt ??
              null)
            : null,
      },
      vendorBillId,
    });
    if (vendorBillProjection && vendorBillId) {
      transaction.set(
        db.doc(`businesses/${businessId}/vendorBills/${vendorBillId}`),
        vendorBillProjection,
        { merge: true },
      );
    }

    result = buildVoidResponse({
      paymentRecord: {
        ...paymentRecord,
        vendorBillId,
        status: 'void',
        updatedAt: now,
        updatedBy: authUid,
        voidedAt: now,
        voidedBy: authUid,
        voidReason: reason,
        metadata: {
          ...asRecord(paymentRecord.metadata),
          restoredCreditNotes,
        },
      },
      paymentState,
      restoredCreditNotes,
    });
  });

  return result;
});
