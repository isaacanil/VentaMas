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
import { assertAccountingPeriodOpenInTransaction } from '../../../versions/v2/accounting/utils/periodClosure.util.js';
import {
  THRESHOLD,
  asRecord,
  buildPurchasePaymentState,
  buildSupplierCreditNoteApplicationId,
  isActiveSupplierPaymentRecord,
  isTerminalInactiveSupplierPaymentStatus,
  normalizeSupplierPaymentStatus,
  normalizePaymentMethodsForAggregation,
  resolvePaymentAmount,
  resolvePaymentWithholdingAmount,
  resolvePurchaseDocumentTotal,
  roundToTwoDecimals,
  sanitizeForResponse,
  toCleanString,
  toMillis,
} from './payablePayments.shared.js';
import {
  buildCanonicalVendorBillIdFromPurchaseId,
  buildVendorBillProjection,
  preserveVendorBillControlDetails,
  resolvePurchaseIdFromVendorBillRecord,
} from './vendorBill.shared.js';
import { isCashMovementReconciledOrLinked } from '../../treasury/utils/cashMovementReconciliation.util.js';

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

const validateVoidReason = (reason) => {
  const normalizedReason = toCleanString(reason);
  if (!normalizedReason || normalizedReason.length < 5) {
    throw new HttpsError(
      'invalid-argument',
      'Debe indicar un motivo de anulación con al menos 5 caracteres.',
    );
  }

  return normalizedReason;
};

const normalizeEvidenceUrls = (value) =>
  (Array.isArray(value) ? value : [])
    .map((entry) => toCleanString(entry))
    .filter(Boolean)
    .slice(0, 10);

const normalizeEvidenceNote = (value) => toCleanString(value);

const validateVoidEvidence = ({ evidenceNote, evidenceUrls }) => {
  if (evidenceNote || evidenceUrls.length > 0) {
    return;
  }

  throw new HttpsError(
    'invalid-argument',
    'Debe indicar una evidencia o referencia para anular el pago al proveedor.',
  );
};

const resolveActorId = (value) => {
  const directId = toCleanString(value);
  if (directId) return directId;

  const record = asRecord(value);
  return (
    toCleanString(record.uid) ??
    toCleanString(record.id) ??
    toCleanString(record.userId) ??
    null
  );
};

const assertPaymentVoidSegregationOfDuties = ({ authUid, paymentRecord }) => {
  const createdBy = resolveActorId(
    paymentRecord.createdBy ?? paymentRecord.createdByUser,
  );
  if (!createdBy || createdBy !== authUid) return;

  throw new HttpsError(
    'failed-precondition',
    'La anulación del pago debe realizarla un usuario distinto al que lo registró.',
  );
};

const resolvePaymentRunIdFromPayment = (paymentRecord) =>
  toCleanString(paymentRecord.paymentRunId) ??
  toCleanString(paymentRecord.metadata?.paymentRunId) ??
  toCleanString(paymentRecord.paymentRunStatusSnapshot?.id) ??
  toCleanString(paymentRecord.metadata?.paymentRunStatusSnapshot?.id) ??
  null;

const resolvePaymentCashAmount = (paymentRecord) =>
  roundToTwoDecimals(
    normalizePaymentMethodsForAggregation(paymentRecord).reduce(
      (sum, method) => sum + method.amount,
      0,
    ),
  );

const resolvePaymentRunLineBaseAmounts = (lineRecord) => {
  const cashRequirementAmount = roundToTwoDecimals(
    lineRecord.cashRequirementAmount ?? lineRecord.executedCashRequirementAmount,
  );
  const withholdingAmount = roundToTwoDecimals(lineRecord.withholdingAmount);
  const balanceAmount = roundToTwoDecimals(
    lineRecord.balanceAmount ??
      lineRecord.grossBalanceAmount ??
      cashRequirementAmount + withholdingAmount,
  );

  return {
    balanceAmount,
    cashRequirementAmount,
    withholdingAmount,
  };
};

const isPaymentRunLineComplete = (lineSnapshot) =>
  lineSnapshot.cashRequirementAmount - lineSnapshot.paidCashAmount <=
    THRESHOLD &&
  lineSnapshot.withholdingAmount - lineSnapshot.paidWithholdingAmount <=
    THRESHOLD &&
  lineSnapshot.balanceAmount - lineSnapshot.paidSettlementAmount <= THRESHOLD;

const isPaymentRunLinePartial = (lineSnapshot) =>
  !isPaymentRunLineComplete(lineSnapshot) &&
  (lineSnapshot.paidCashAmount > THRESHOLD ||
    lineSnapshot.paidSettlementAmount > THRESHOLD ||
    lineSnapshot.paidWithholdingAmount > THRESHOLD);

const resolveLatestPaymentForLine = (payments) =>
  payments
    .slice()
    .sort((left, right) => {
      const leftMillis =
        toMillis(left.occurredAt) ?? toMillis(left.createdAt) ?? 0;
      const rightMillis =
        toMillis(right.occurredAt) ?? toMillis(right.createdAt) ?? 0;
      return rightMillis - leftMillis;
    })[0] ?? null;

const buildPaymentRunStatusSnapshot = (paymentRun) => ({
  approvalStatus: toCleanString(paymentRun.approvalStatus) ?? null,
  executionStatus: toCleanString(paymentRun.executionStatus) ?? null,
  status: toCleanString(paymentRun.status) ?? null,
});

const buildPaymentRunVoidExecutionPatch = ({
  activePayments,
  authUid,
  now,
  paymentId,
  paymentRecord,
  paymentRun,
  reason,
}) => {
  const paymentRunId = resolvePaymentRunIdFromPayment(paymentRecord);
  const lines = Array.isArray(paymentRun.lines) ? paymentRun.lines : [];
  if (!paymentRunId || !lines.length) return null;

  const runPayments = activePayments.filter(
    (record) => resolvePaymentRunIdFromPayment(record) === paymentRunId,
  );
  const updatedLines = lines.map((line) => {
    const lineRecord = asRecord(line);
    const vendorBillId = toCleanString(lineRecord.vendorBillId);
    const matchingPayments = runPayments.filter(
      (record) => toCleanString(record.vendorBillId) === vendorBillId,
    );
    const latestPayment = resolveLatestPaymentForLine(matchingPayments);
    const paidCashAmount = roundToTwoDecimals(
      matchingPayments.reduce(
        (sum, record) => sum + resolvePaymentCashAmount(record),
        0,
      ),
    );
    const paidSettlementAmount = roundToTwoDecimals(
      matchingPayments.reduce(
        (sum, record) => sum + resolvePaymentAmount(record),
        0,
      ),
    );
    const paidWithholdingAmount = roundToTwoDecimals(
      matchingPayments.reduce(
        (sum, record) => sum + resolvePaymentWithholdingAmount(record),
        0,
      ),
    );
    const paymentIds = matchingPayments.map((record) => record.id).filter(Boolean);
    const baseAmounts = resolvePaymentRunLineBaseAmounts(lineRecord);
    const lineSnapshot = {
      ...baseAmounts,
      paidCashAmount,
      paidSettlementAmount,
      paidWithholdingAmount,
    };
    const executionStatus = isPaymentRunLineComplete(lineSnapshot)
      ? 'executed'
      : isPaymentRunLinePartial(lineSnapshot)
        ? 'partial'
        : 'not_started';

    return {
      ...lineRecord,
      executionStatus,
      lastPaymentAt: latestPayment?.occurredAt ?? latestPayment?.createdAt ?? null,
      lastPaymentId: latestPayment?.id ?? null,
      paidCashAmount,
      paidSettlementAmount,
      paidWithholdingAmount,
      paymentIds,
    };
  });

  const lineSnapshots = updatedLines.map((line) => ({
    ...resolvePaymentRunLineBaseAmounts(asRecord(line)),
    paidCashAmount: roundToTwoDecimals(line.paidCashAmount),
    paidSettlementAmount: roundToTwoDecimals(line.paidSettlementAmount),
    paidWithholdingAmount: roundToTwoDecimals(line.paidWithholdingAmount),
  }));
  const executedLineCount = lineSnapshots.filter(isPaymentRunLineComplete).length;
  const partialLineCount = lineSnapshots.filter(isPaymentRunLinePartial).length;
  const totalLineCount = lineSnapshots.length;
  const paidCashAmount = roundToTwoDecimals(
    lineSnapshots.reduce((sum, line) => sum + line.paidCashAmount, 0),
  );
  const paidSettlementAmount = roundToTwoDecimals(
    lineSnapshots.reduce((sum, line) => sum + line.paidSettlementAmount, 0),
  );
  const paidWithholdingAmount = roundToTwoDecimals(
    lineSnapshots.reduce((sum, line) => sum + line.paidWithholdingAmount, 0),
  );
  const allLinesExecuted =
    totalLineCount > 0 && executedLineCount === totalLineCount;
  const hasExecutedAmount =
    paidCashAmount > THRESHOLD ||
    paidSettlementAmount > THRESHOLD ||
    paidWithholdingAmount > THRESHOLD;
  const latestRunPayment = resolveLatestPaymentForLine(runPayments);
  const currentStatus = toCleanString(paymentRun.status);
  const nextStatus = allLinesExecuted
    ? 'executed'
    : currentStatus === 'executed'
      ? 'approved'
      : (currentStatus ?? 'approved');

  return {
    executedAt: allLinesExecuted ? (paymentRun.executedAt ?? now) : null,
    executedBy: allLinesExecuted ? (paymentRun.executedBy ?? authUid) : null,
    executionStatus: allLinesExecuted
      ? 'executed'
      : hasExecutedAmount
        ? 'in_progress'
        : 'not_started',
    executionSummary: {
      executedLineCount,
      lastPaymentAt:
        latestRunPayment?.occurredAt ?? latestRunPayment?.createdAt ?? null,
      lastPaymentId: latestRunPayment?.id ?? null,
      paidCashAmount,
      paidSettlementAmount,
      paidWithholdingAmount,
      partialLineCount,
      pendingLineCount: Math.max(
        totalLineCount - executedLineCount - partialLineCount,
        0,
      ),
      totalLineCount,
    },
    lastVoidedPaymentId: paymentId,
    lastVoidedPaymentReason: reason,
    lastVoidedPaymentAt: now,
    lines: updatedLines,
    status: nextStatus,
    updatedAt: now,
    updatedBy: authUid,
  };
};

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
  const reason = validateVoidReason(payload.reason);
  const evidenceNote = normalizeEvidenceNote(payload.evidenceNote);
  const evidenceUrls = normalizeEvidenceUrls(payload.evidenceUrls);

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido.');
  }
  if (!paymentId) {
    throw new HttpsError('invalid-argument', 'paymentId es requerido.');
  }
  validateVoidEvidence({ evidenceNote, evidenceUrls });

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
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.FINANCIAL_DOCUMENT_VOID,
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
    const paymentStatus = normalizeSupplierPaymentStatus(paymentRecord.status);
    const paymentRunId = resolvePaymentRunIdFromPayment(paymentRecord);
    const vendorBillId =
      toCleanString(paymentRecord.vendorBillId) ??
      buildCanonicalVendorBillIdFromPurchaseId(paymentRecord.purchaseId);
    const purchaseId =
      toCleanString(paymentRecord.purchaseId) ??
      resolvePurchaseIdFromVendorBillRecord(
        {
          sourceDocumentType: 'purchase',
          sourceDocumentId: paymentRecord.purchaseId,
        },
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
    if (isTerminalInactiveSupplierPaymentStatus(paymentStatus)) {
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

    const vendorBillRef = vendorBillId
      ? db.doc(`businesses/${businessId}/vendorBills/${vendorBillId}`)
      : null;
    const vendorBillSnap = vendorBillRef
      ? await transaction.get(vendorBillRef)
      : null;
    const vendorBillRecord = vendorBillSnap?.exists
      ? asRecord(vendorBillSnap.data())
      : {};

    assertPaymentVoidSegregationOfDuties({ authUid, paymentRecord });

    const now = Timestamp.now();

    await assertAccountingPeriodOpenInTransaction({
      transaction,
      businessId,
      effectiveDate: now,
      settings: accountingSettings,
      rolloutEnabled: true,
      operationLabel: 'anular este pago a suplidor',
      createError: (message) => new HttpsError('failed-precondition', message),
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
      .filter(
        (record) =>
          record.id !== paymentId && isActiveSupplierPaymentRecord(record),
      );
    const paymentRunRef = paymentRunId
      ? db.doc(
          `businesses/${businessId}/accountsPayablePaymentRuns/${paymentRunId}`,
        )
      : null;
    const paymentRunSnap = paymentRunRef
      ? await transaction.get(paymentRunRef)
      : null;
    const paymentRunRecord = paymentRunSnap?.exists
      ? asRecord(paymentRunSnap.data())
      : null;

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
          voidEvidenceNote: evidenceNote ?? null,
          voidEvidenceUrls: evidenceUrls,
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

    if (paymentRunRef && paymentRunRecord) {
      const paymentRunPatch = buildPaymentRunVoidExecutionPatch({
        activePayments,
        authUid,
        now,
        paymentId,
        paymentRecord,
        paymentRun: paymentRunRecord,
        reason,
      });

      if (paymentRunPatch) {
        const nextPaymentRun = {
          ...paymentRunRecord,
          ...paymentRunPatch,
        };
        const eventId = `payment_run_void__${paymentId}`;

        transaction.set(paymentRunRef, paymentRunPatch, { merge: true });
        transaction.set(
          db.doc(
            `businesses/${businessId}/accountsPayablePaymentRunEvents/${eventId}`,
          ),
          {
            id: eventId,
            businessId,
            paymentRunId,
            action: 'void_payment',
            reason,
            evidenceNote: evidenceNote ?? null,
            evidenceUrls,
            previousStatus: buildPaymentRunStatusSnapshot(paymentRunRecord),
            nextStatus: buildPaymentRunStatusSnapshot(nextPaymentRun),
            createdAt: now,
            createdBy: authUid,
            sourceType: 'accountsPayablePayment',
            sourceId: paymentId,
          },
        );
      }
    }

    transaction.set(
      paymentRef,
      {
        vendorBillId,
        paymentRunId: paymentRunId ?? null,
        status: 'void',
        updatedAt: now,
        updatedBy: authUid,
        voidedAt: now,
        voidedBy: authUid,
        voidEvidenceNote: evidenceNote ?? null,
        voidEvidenceUrls: evidenceUrls,
        voidReason: reason,
        metadata: {
          ...asRecord(paymentRecord.metadata),
          restoredCreditNotes,
          voidEvidence: {
            note: evidenceNote ?? null,
            urls: evidenceUrls,
          },
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
        vendorBillRef,
        preserveVendorBillControlDetails({
          existingVendorBill: vendorBillRecord,
          vendorBillProjection,
        }),
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
        voidEvidenceNote: evidenceNote ?? null,
        voidEvidenceUrls: evidenceUrls,
        voidReason: reason,
        metadata: {
          ...asRecord(paymentRecord.metadata),
          restoredCreditNotes,
          voidEvidence: {
            note: evidenceNote ?? null,
            urls: evidenceUrls,
          },
        },
      },
      paymentState,
      restoredCreditNotes,
    });
  });

  return result;
});
