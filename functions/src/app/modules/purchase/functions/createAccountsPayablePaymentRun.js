import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

import { db, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import { LIMIT_OPERATION_KEYS } from '../../../versions/v2/billing/config/limitOperations.config.js';
import { assertBusinessSubscriptionAccess } from '../../../versions/v2/billing/utils/subscriptionAccess.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/auth/services/userAccess.service.js';
import {
  THRESHOLD,
  asRecord,
  roundToTwoDecimals,
  safeNumber,
  sanitizeForResponse,
  toCleanString,
  toMillis,
} from './payablePayments.shared.js';
import {
  resolvePurchaseIdFromVendorBillRecord,
  resolveVendorBillDuplicateIdentity,
  resolveVendorBillDuplicateMatch,
  resolveVendorBillPaymentBlock,
} from './vendorBill.shared.js';

const MAX_PAYMENT_RUN_LINES = 200;
const TERMINAL_PAYMENT_RUN_STATUSES = new Set(['canceled', 'cancelled', 'executed']);
const TERMINAL_PAYMENT_RUN_EXECUTION_STATUSES = new Set([
  'canceled',
  'cancelled',
  'executed',
]);

const normalizeVendorBillIds = (value) => {
  if (!Array.isArray(value)) {
    throw new HttpsError(
      'invalid-argument',
      'Debe indicar las cuentas por pagar de la corrida.',
    );
  }

  const ids = [...new Set(value.map(toCleanString).filter(Boolean))];
  if (!ids.length) {
    throw new HttpsError(
      'invalid-argument',
      'Debe indicar al menos una cuenta por pagar válida.',
    );
  }
  if (ids.length > MAX_PAYMENT_RUN_LINES) {
    throw new HttpsError(
      'invalid-argument',
      `Una corrida CxP no puede incluir más de ${MAX_PAYMENT_RUN_LINES} cuentas.`,
    );
  }

  return ids;
};

const pickNumber = (...values) => {
  for (const value of values) {
    const parsed = safeNumber(value);
    if (parsed != null) return parsed;
  }

  return null;
};

const toMoney = (value) => roundToTwoDecimals(Math.max(safeNumber(value) ?? 0, 0));

const sumMoney = (items, selector) =>
  roundToTwoDecimals(items.reduce((sum, item) => sum + toMoney(selector(item)), 0));

const resolveVendorBillTotals = (vendorBillRecord) => {
  const totals = asRecord(vendorBillRecord.totals);
  const paymentState = asRecord(vendorBillRecord.paymentState);
  const total = toMoney(
    pickNumber(
      totals.total,
      paymentState.total,
      vendorBillRecord.totalAmount,
      vendorBillRecord.amount,
    ),
  );
  const paid = toMoney(pickNumber(totals.paid, paymentState.paid, 0));
  const balance = toMoney(
    pickNumber(totals.balance, paymentState.balance, Math.max(total - paid, 0)),
  );

  return { balance, paid, total };
};

const resolveVendorBillFiscalSnapshot = (vendorBillRecord) => {
  const monetary = asRecord(vendorBillRecord.monetary);
  const documentTotals = asRecord(monetary.documentTotals);
  const purchase = asRecord(vendorBillRecord.purchase);
  const purchaseMonetary = asRecord(purchase.monetary);
  const purchaseDocumentTotals = asRecord(purchaseMonetary.documentTotals);
  const legacyTotals = asRecord(purchase.totals ?? purchase.totalPurchase);
  const withholdingITBISAmount = toMoney(
    pickNumber(
      documentTotals.withholdingITBISAmount,
      documentTotals.itbisWithheld,
      purchaseDocumentTotals.withholdingITBISAmount,
      purchaseDocumentTotals.itbisWithheld,
      legacyTotals.withholdingITBISAmount,
      legacyTotals.itbisWithheld,
      purchase.withholdingITBISAmount,
      purchase.itbisWithheld,
    ),
  );
  const withholdingISRAmount = toMoney(
    pickNumber(
      documentTotals.withholdingISRAmount,
      documentTotals.isrWithheld,
      purchaseDocumentTotals.withholdingISRAmount,
      purchaseDocumentTotals.isrWithheld,
      legacyTotals.withholdingISRAmount,
      legacyTotals.isrWithheld,
      purchase.withholdingISRAmount,
      purchase.isrWithheld,
    ),
  );
  const netPayableAmount = pickNumber(
    documentTotals.netPayableAmount,
    documentTotals.net,
    purchaseDocumentTotals.netPayableAmount,
    purchaseDocumentTotals.net,
    legacyTotals.netPayableAmount,
    legacyTotals.net,
    purchase.netPayableAmount,
    purchase.net,
  );

  return {
    netPayableAmount:
      netPayableAmount == null ? null : toMoney(netPayableAmount),
    withholdingITBISAmount,
    withholdingISRAmount,
  };
};

const resolveCashSnapshot = ({ fiscalSnapshot, paid, total, balance }) => {
  const withholdingAmount = roundToTwoDecimals(
    fiscalSnapshot.withholdingITBISAmount + fiscalSnapshot.withholdingISRAmount,
  );
  const estimatedNetPayableAmount =
    fiscalSnapshot.netPayableAmount ??
    (withholdingAmount > THRESHOLD && total > THRESHOLD
      ? Math.max(total - withholdingAmount, 0)
      : null);

  if (estimatedNetPayableAmount == null || withholdingAmount <= THRESHOLD) {
    return {
      cashRequirementAmount: balance,
      grossBalanceAmount: balance,
      withholdingAmount: 0,
    };
  }

  const openNetPayableAmount = Math.max(estimatedNetPayableAmount - paid, 0);
  const cashRequirementAmount = roundToTwoDecimals(
    Math.min(balance, openNetPayableAmount),
  );

  return {
    cashRequirementAmount,
    grossBalanceAmount: balance,
    withholdingAmount: roundToTwoDecimals(
      Math.min(withholdingAmount, Math.max(balance - cashRequirementAmount, 0)),
    ),
  };
};

export const buildRunLine = ({ vendorBillId, vendorBillRecord }) => {
  const totals = resolveVendorBillTotals(vendorBillRecord);
  const fiscalSnapshot = resolveVendorBillFiscalSnapshot(vendorBillRecord);
  const cashSnapshot = resolveCashSnapshot({
    ...totals,
    fiscalSnapshot,
  });
  const purchaseId = resolvePurchaseIdFromVendorBillRecord(
    vendorBillRecord,
    vendorBillId,
  );
  const dueAt = vendorBillRecord.dueAt ?? null;
  const dueAtMillis = toMillis(dueAt);
  const paymentBlock = resolveVendorBillPaymentBlock(vendorBillRecord);
  const paymentControl = asRecord(vendorBillRecord.paymentControl);
  const baseLine = {
    vendorBillId,
    purchaseId,
    supplierId: toCleanString(vendorBillRecord.supplierId),
    supplierName: toCleanString(vendorBillRecord.supplierName),
    reference: String(vendorBillRecord.reference ?? vendorBillId),
    status: toCleanString(vendorBillRecord.status)?.toLowerCase() ?? null,
    approvalStatus:
      toCleanString(vendorBillRecord.approvalStatus)?.toLowerCase() ?? null,
    paymentControlStatus:
      toCleanString(paymentControl.status)?.toLowerCase() ?? null,
    dueAt,
    dueAtMillis,
    totalAmount: totals.total,
    paidAmount: totals.paid,
    balanceAmount: totals.balance,
    cashRequirementAmount: cashSnapshot.cashRequirementAmount,
    withholdingAmount: cashSnapshot.withholdingAmount,
    fiscalSnapshot,
  };

  if (totals.balance <= THRESHOLD) {
    return {
      ...baseLine,
      eligible: false,
      exclusionCode: 'zero_balance',
      exclusionReason: 'La cuenta por pagar no tiene balance pendiente.',
    };
  }

  if (paymentBlock.blocked) {
    return {
      ...baseLine,
      eligible: false,
      exclusionCode: paymentBlock.code ?? 'payment_blocked',
      exclusionReason:
        paymentBlock.message ??
        'La cuenta por pagar no está habilitada para pago.',
    };
  }

  if (dueAtMillis == null) {
    return {
      ...baseLine,
      eligible: false,
      exclusionCode: 'missing_due_date',
      exclusionReason:
        'La cuenta por pagar no tiene vencimiento confirmado para la corrida.',
    };
  }

  return {
    ...baseLine,
    eligible: true,
    exclusionCode: null,
    exclusionReason: null,
  };
};

const buildTotals = ({ eligibleLines, excludedLines, requestedCount }) => ({
  requestedCount,
  eligibleCount: eligibleLines.length,
  excludedCount: excludedLines.length,
  eligibleAmount: sumMoney(eligibleLines, (line) => line.balanceAmount),
  eligibleCashRequirementAmount: sumMoney(
    eligibleLines,
    (line) => line.cashRequirementAmount,
  ),
  eligibleWithholdingAmount: sumMoney(
    eligibleLines,
    (line) => line.withholdingAmount,
  ),
  excludedAmount: sumMoney(excludedLines, (line) => line.balanceAmount),
  excludedCashRequirementAmount: sumMoney(
    excludedLines,
    (line) => line.cashRequirementAmount,
  ),
  excludedWithholdingAmount: sumMoney(
    excludedLines,
    (line) => line.withholdingAmount,
  ),
});

const buildPaymentRunDuplicateRecord = ({ vendorBillId, vendorBillRecord }) => ({
  id: vendorBillId,
  ...asRecord(vendorBillRecord),
});

const buildDuplicateVendorBillRecordFromSnapshot = (snapshot) => ({
  id: snapshot.id,
  ...asRecord(snapshot.data()),
});

const isPaymentRunTerminalForVendorBill = (paymentRunRecord) => {
  const status = toCleanString(paymentRunRecord.status)?.toLowerCase() ?? null;
  const executionStatus =
    toCleanString(paymentRunRecord.executionStatus)?.toLowerCase() ?? null;

  return (
    TERMINAL_PAYMENT_RUN_STATUSES.has(status) ||
    TERMINAL_PAYMENT_RUN_EXECUTION_STATUSES.has(executionStatus)
  );
};

const buildPaymentRunRecordFromSnapshot = (snapshot) => ({
  id: snapshot.id,
  ...asRecord(snapshot.data()),
});

const assertEligibleVendorBillsNotInActivePaymentRun = async ({
  businessId,
  transaction,
  vendorBillIds,
}) => {
  for (const vendorBillId of vendorBillIds) {
    const paymentRunsQuery = db
      .collection(`businesses/${businessId}/accountsPayablePaymentRuns`)
      .where('eligibleVendorBillIds', 'array-contains', vendorBillId);
    const paymentRunsSnap = await transaction.get(paymentRunsQuery);
    const paymentRunDocs = Array.isArray(paymentRunsSnap.docs)
      ? paymentRunsSnap.docs
      : [];
    const activePaymentRun = paymentRunDocs
      .map(buildPaymentRunRecordFromSnapshot)
      .find((paymentRunRecord) =>
        !isPaymentRunTerminalForVendorBill(paymentRunRecord),
      );

    if (!activePaymentRun) continue;

    throw new HttpsError(
      'failed-precondition',
      `La cuenta por pagar ${vendorBillId} ya está incluida en la corrida CxP ${activePaymentRun.id}. Cancele, ejecute o regenere esa corrida antes de crear otra propuesta de pago.`,
    );
  }
};

const assertNoDuplicateVendorBillsInsideRun = (vendorBills) => {
  const seen = [];

  for (const current of vendorBills) {
    for (const previous of seen) {
      const match = resolveVendorBillDuplicateMatch(previous, current);
      if (!match) continue;

      throw new HttpsError(
        'failed-precondition',
        `La corrida CxP incluye cuentas duplicadas del mismo suplidor (${match.label}). Revise ${previous.id} y ${current.id} antes de guardar la corrida.`,
      );
    }

    seen.push(current);
  }
};

const assertEligibleVendorBillsHaveNoExternalDuplicates = async ({
  businessId,
  transaction,
  vendorBills,
}) => {
  const selectedVendorBillIds = new Set(
    vendorBills.map((vendorBill) => toCleanString(vendorBill.id)).filter(Boolean),
  );
  const vendorBillsBySupplier = new Map();

  vendorBills.forEach((vendorBill) => {
    const identity = resolveVendorBillDuplicateIdentity(vendorBill);
    if (!identity.supplierId || !identity.hasDocumentKey) return;

    const supplierVendorBills =
      vendorBillsBySupplier.get(identity.supplierId) ?? [];
    supplierVendorBills.push(vendorBill);
    vendorBillsBySupplier.set(identity.supplierId, supplierVendorBills);
  });

  for (const [supplierId, supplierVendorBills] of vendorBillsBySupplier) {
    const duplicatesQuery = db
      .collection(`businesses/${businessId}/vendorBills`)
      .where('supplierId', '==', supplierId);
    const duplicatesSnap = await transaction.get(duplicatesQuery);
    const duplicateDocs = Array.isArray(duplicatesSnap.docs)
      ? duplicatesSnap.docs
      : [];
    const duplicateCandidates = duplicateDocs
      .map(buildDuplicateVendorBillRecordFromSnapshot)
      .filter((candidate) => {
        const candidateId = toCleanString(candidate.id);
        return candidateId && !selectedVendorBillIds.has(candidateId);
      });

    for (const vendorBill of supplierVendorBills) {
      const duplicate = duplicateCandidates.find((candidate) =>
        Boolean(resolveVendorBillDuplicateMatch(vendorBill, candidate)),
      );
      if (!duplicate) continue;

      const match = resolveVendorBillDuplicateMatch(vendorBill, duplicate);

      throw new HttpsError(
        'failed-precondition',
        `No se puede guardar la corrida CxP porque ${vendorBill.id} coincide con la CxP ${duplicate.id} del mismo suplidor (${match.label}). Revise duplicados antes de pagar.`,
      );
    }
  }
};

export const createAccountsPayablePaymentRun = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    null;
  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido.');
  }

  const vendorBillIds = normalizeVendorBillIds(payload.vendorBillIds);
  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.TREASURY_OPERATOR,
  });
  await assertBusinessSubscriptionAccess({
    businessId,
    action: 'write',
    operation: LIMIT_OPERATION_KEYS.ACCOUNTS_PAYABLE_PAYMENT,
  });

  let result = null;
  await db.runTransaction(async (transaction) => {
    const refs = vendorBillIds.map((vendorBillId) =>
      db.doc(`businesses/${businessId}/vendorBills/${vendorBillId}`),
    );
    const snapshots = await Promise.all(
      refs.map((ref) => transaction.get(ref)),
    );
    const missingIds = snapshots
      .map((snapshot, index) => (snapshot.exists ? null : vendorBillIds[index]))
      .filter(Boolean);
    if (missingIds.length) {
      throw new HttpsError(
        'not-found',
        `No se encontraron ${missingIds.length} cuentas por pagar de la corrida.`,
      );
    }

    const vendorBillRecords = snapshots.map((snapshot) =>
      asRecord(snapshot.data()),
    );
    const lines = vendorBillRecords.map((vendorBillRecord, index) =>
      buildRunLine({
        vendorBillId: vendorBillIds[index],
        vendorBillRecord,
      }),
    );
    const eligibleLines = lines.filter((line) => line.eligible);
    const excludedLines = lines.filter((line) => !line.eligible);
    if (!eligibleLines.length) {
      throw new HttpsError(
        'failed-precondition',
        'La corrida no tiene cuentas por pagar elegibles para pago.',
      );
    }
    const eligibleVendorBills = lines
      .map((line, index) =>
        line.eligible
          ? buildPaymentRunDuplicateRecord({
              vendorBillId: vendorBillIds[index],
              vendorBillRecord: vendorBillRecords[index],
            })
          : null,
      )
      .filter(Boolean);
    assertNoDuplicateVendorBillsInsideRun(eligibleVendorBills);
    await assertEligibleVendorBillsHaveNoExternalDuplicates({
      businessId,
      transaction,
      vendorBills: eligibleVendorBills,
    });
    await assertEligibleVendorBillsNotInActivePaymentRun({
      businessId,
      transaction,
      vendorBillIds: eligibleLines.map((line) => line.vendorBillId),
    });

    const now = Timestamp.now();
    const runId = nanoid();
    const runRecord = {
      id: runId,
      businessId,
      status: 'draft',
      approvalStatus: 'pending_review',
      executionStatus: 'not_started',
      sourceType: 'accountsPayableWorkbench',
      source: {
        label: toCleanString(payload.scope?.label) ?? null,
        description: toCleanString(payload.scope?.description) ?? null,
        queryLimit: safeNumber(payload.scope?.queryLimit),
        rawDocCount: safeNumber(payload.scope?.rawDocCount),
        isClientFilteredQuery: payload.scope?.isClientFilteredQuery === true,
        isQueryLimitReached: payload.scope?.isQueryLimitReached === true,
      },
      vendorBillIds,
      eligibleVendorBillIds: eligibleLines.map((line) => line.vendorBillId),
      excludedVendorBillIds: excludedLines.map((line) => line.vendorBillId),
      totals: buildTotals({
        eligibleLines,
        excludedLines,
        requestedCount: vendorBillIds.length,
      }),
      lines: eligibleLines,
      excludedLines,
      createdAt: now,
      createdBy: authUid,
      updatedAt: now,
      updatedBy: authUid,
      submittedAt: null,
      submittedBy: null,
      approvedAt: null,
      approvedBy: null,
      executedAt: null,
      executedBy: null,
    };

    transaction.set(
      db.doc(`businesses/${businessId}/accountsPayablePaymentRuns/${runId}`),
      runRecord,
    );

    result = {
      ok: true,
      paymentRun: runRecord,
      paymentRunId: runId,
    };
  });

  return sanitizeForResponse(result);
});
