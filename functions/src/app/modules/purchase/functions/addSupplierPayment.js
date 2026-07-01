import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { nanoid } from 'nanoid';

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
  resolvePilotMonetarySnapshotForBusiness,
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import { assertAccountingPeriodOpenInTransaction } from '../../../versions/v2/accounting/utils/periodClosure.util.js';
import {
  THRESHOLD,
  asRecord,
  buildIdempotencyRequestHash,
  buildPurchasePaymentState,
  buildSupplierCreditNoteApplicationId,
  isActiveSupplierPaymentRecord,
  normalizeSupplierPaymentMethodCode,
  paymentMethodRequiresBankAccount,
  paymentMethodRequiresCashCount,
  resolvePaymentRecordBankAccountId,
  resolvePaymentRecordCashAccountId,
  resolvePaymentRecordCashCountId,
  resolvePaymentRecordReference,
  normalizeWithholdingApplicationsForAggregation,
  resolvePaymentWithholdingAmount,
  resolvePurchaseDocumentTotal,
  resolvePurchaseSupplierId,
  roundToTwoDecimals,
  safeNumber,
  sanitizeForResponse,
  toCleanString,
  toMillis,
} from './payablePayments.shared.js';
import {
  buildCanonicalVendorBillIdFromPurchaseId,
  buildVendorBillProjection,
  preserveVendorBillControlDetails,
  resolveVendorBillPaymentBlock,
  resolvePurchaseIdFromVendorBillRecord,
} from './vendorBill.shared.js';
import { buildRunLine } from './createAccountsPayablePaymentRun.js';

const SUPPORTED_PAYMENT_METHODS = new Set([
  'cash',
  'card',
  'transfer',
  'supplierCreditNote',
]);
const APPLICABLE_SUPPLIER_CREDIT_NOTE_STATUSES = new Set(['open']);
const WITHHOLDING_TYPE_ALIASES = Object.freeze({
  itbis: 'itbis',
  withholding_itbis: 'itbis',
  retention_itbis: 'itbis',
  retencion_itbis: 'itbis',
  isr: 'isr',
  withholding_isr: 'isr',
  retention_isr: 'isr',
  retencion_isr: 'isr',
  income_tax: 'isr',
  other: 'other',
  otro: 'other',
});
const SUPPORTED_WITHHOLDING_TYPES = new Set(['itbis', 'isr']);
const PAYMENT_RUN_EXECUTION_STATUSES_ALLOWING_PAYMENT = new Set([
  'not_started',
  'in_progress',
]);
const PAYMENT_RUN_TERMINAL_STATUSES = new Set([
  'canceled',
  'cancelled',
  'executed',
]);
const PAYMENT_RUN_TERMINAL_EXECUTION_STATUSES = new Set([
  'canceled',
  'cancelled',
  'executed',
]);
const PAYMENT_RUN_LINE_TERMINAL_EXECUTION_STATUSES = new Set([
  'executed',
  'paid',
  'voided',
  'canceled',
  'cancelled',
]);

const normalizeWithholdingType = (value) => {
  const normalized = toCleanString(value)?.toLowerCase();
  if (!normalized) return null;
  return WITHHOLDING_TYPE_ALIASES[normalized] ?? null;
};

const normalizeRequestedPaymentMethods = (paymentMethods) => {
  if (!Array.isArray(paymentMethods)) {
    throw new HttpsError(
      'invalid-argument',
      'Debe indicar al menos un método de pago.',
    );
  }

  const normalized = paymentMethods
    .map((entry) => {
      const methodRecord = asRecord(entry);
      const method = normalizeSupplierPaymentMethodCode(methodRecord.method);
      const amount = roundToTwoDecimals(methodRecord.value);
      if (!method || !SUPPORTED_PAYMENT_METHODS.has(method)) {
        throw new HttpsError(
          'invalid-argument',
          'Método de pago no soportado para proveedor.',
        );
      }
      if (amount <= THRESHOLD) {
        return null;
      }

      const normalizedEntry = {
        method,
        status: methodRecord.status !== false,
        value: amount,
        reference: toCleanString(methodRecord.reference),
        bankAccountId: paymentMethodRequiresBankAccount(method)
          ? toCleanString(methodRecord.bankAccountId)
          : null,
        cashAccountId: paymentMethodRequiresCashCount(method)
          ? toCleanString(methodRecord.cashAccountId)
          : null,
        cashCountId: paymentMethodRequiresCashCount(method)
          ? toCleanString(methodRecord.cashCountId)
          : null,
        supplierCreditNoteId:
          method === 'supplierCreditNote'
            ? toCleanString(methodRecord.supplierCreditNoteId)
            : null,
      };

      if (!normalizedEntry.status) {
        return null;
      }

      return normalizedEntry;
    })
    .filter(Boolean);

  if (!normalized.length) {
    throw new HttpsError(
      'invalid-argument',
      'Debe indicar al menos un método de pago con monto válido.',
    );
  }

  return normalized;
};

const normalizeRequestedWithholdingApplications = (applications) => {
  if (applications == null) return [];
  if (!Array.isArray(applications)) {
    throw new HttpsError(
      'invalid-argument',
      'Las retenciones aplicadas deben enviarse como una lista.',
    );
  }

  return applications
    .map((entry) => {
      const applicationRecord = asRecord(entry);
      const amount = roundToTwoDecimals(
        applicationRecord.amount ?? applicationRecord.value,
      );
      if (amount <= THRESHOLD) {
        return null;
      }

      const type = normalizeWithholdingType(
        applicationRecord.type ??
          applicationRecord.taxType ??
          applicationRecord.code,
      );
      if (!type) {
        throw new HttpsError(
          'invalid-argument',
          'Cada retención aplicada debe indicar un tipo fiscal válido.',
        );
      }
      if (!SUPPORTED_WITHHOLDING_TYPES.has(type)) {
        throw new HttpsError(
          'invalid-argument',
          'Solo se admiten retenciones ITBIS e ISR en pagos de CxP.',
        );
      }

      return {
        type,
        amount,
        reference: toCleanString(applicationRecord.reference),
        taxPeriod: toCleanString(applicationRecord.taxPeriod),
        sourceDocumentId: toCleanString(applicationRecord.sourceDocumentId),
      };
    })
    .filter(Boolean);
};

const validateMethodRequirements = ({ paymentMethods, accountingSettings }) => {
  const bankAccountsEnabled = accountingSettings?.bankAccountsEnabled !== false;

  paymentMethods.forEach((method) => {
    if (
      paymentMethodRequiresCashCount(method.method) &&
      !toCleanString(method.cashCountId)
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Seleccione un cuadre abierto para el pago en efectivo.',
      );
    }

    if (
      paymentMethodRequiresBankAccount(method.method) &&
      !bankAccountsEnabled
    ) {
      throw new HttpsError(
        'failed-precondition',
        'Los pagos con tarjeta o transferencia no estan habilitados para este negocio.',
      );
    }

    if (
      bankAccountsEnabled &&
      paymentMethodRequiresBankAccount(method.method) &&
      !toCleanString(method.bankAccountId)
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Los pagos con tarjeta o transferencia requieren una cuenta bancaria activa.',
      );
    }

    if (
      paymentMethodRequiresBankAccount(method.method) &&
      !toCleanString(method.reference)
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Los pagos con tarjeta o transferencia requieren referencia o comprobante.',
      );
    }

    if (
      method.method === 'supplierCreditNote' &&
      !toCleanString(method.supplierCreditNoteId)
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Debe seleccionar una nota de crédito del suplidor.',
      );
    }
  });
};

const normalizeEvidenceUrls = (value) =>
  (Array.isArray(value) ? value : [])
    .map((entry) => toCleanString(entry))
    .filter(Boolean)
    .slice(0, 10);

const normalizeEvidenceNote = (value) => toCleanString(value);

const hasPaymentMethodOperationalTrace = (method) =>
  Boolean(
    toCleanString(method.reference) ||
      toCleanString(method.bankAccountId) ||
      toCleanString(method.cashCountId) ||
      toCleanString(method.cashAccountId) ||
      toCleanString(method.supplierCreditNoteId),
  );

const hasWithholdingOperationalTrace = (application) =>
  Boolean(
    toCleanString(application.reference) ||
      toCleanString(application.taxPeriod) ||
      toCleanString(application.sourceDocumentId),
  );

const validatePaymentOperationalEvidence = ({
  evidenceNote,
  evidenceUrls,
  paymentMethods,
  withholdingApplications,
}) => {
  if (evidenceNote || evidenceUrls.length > 0) {
    return;
  }

  if (
    paymentMethods.some(hasPaymentMethodOperationalTrace) ||
    withholdingApplications.some(hasWithholdingOperationalTrace)
  ) {
    return;
  }

  throw new HttpsError(
    'invalid-argument',
    'Debe indicar una evidencia o referencia para registrar el pago al proveedor.',
  );
};

const resolvePurchaseAccountsPayable = (purchaseRecord) =>
  asRecord(
    purchaseRecord.accountsPayable ??
      purchaseRecord.payables ??
      purchaseRecord.vendorBill,
  );

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

const resolvePurchaseCreatorId = ({ purchaseRecord, vendorBillRecord }) =>
  resolveActorId(
    purchaseRecord.createdBy ??
      purchaseRecord.createdByUser ??
      purchaseRecord.createdById ??
      vendorBillRecord.createdBy ??
      vendorBillRecord.createdByUser,
  );

const assertDifferentActor = ({ authUid, actorId, message }) => {
  if (!actorId || actorId !== authUid) return;

  throw new HttpsError('failed-precondition', message);
};

const assertAccountsPayableCanBePaid = ({
  authUid,
  purchaseRecord,
  vendorBillRecord,
}) => {
  const accountsPayable = resolvePurchaseAccountsPayable(purchaseRecord);
  const approvalStatus = toCleanString(
    accountsPayable.approvalStatus,
  )?.toLowerCase();
  const approvedBy = resolveActorId(accountsPayable.approvedBy);
  const approvedAtMillis = toMillis(accountsPayable.approvedAt);

  if (
    approvalStatus !== 'approved' ||
    !approvedBy ||
    approvedAtMillis == null
  ) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta por pagar debe tener una aprobación explícita antes de registrar pagos.',
    );
  }

  assertDifferentActor({
    authUid,
    actorId: approvedBy,
    message:
      'El pago de CxP debe registrarlo un usuario distinto al que aprobó la cuenta por pagar.',
  });
  assertDifferentActor({
    authUid,
    actorId: resolvePurchaseCreatorId({ purchaseRecord, vendorBillRecord }),
    message:
      'El pago de CxP debe registrarlo un usuario distinto al que originó la compra.',
  });
};

const resolvePaymentRunEligibleVendorBillIds = (paymentRun) => {
  const directIds = Array.isArray(paymentRun.eligibleVendorBillIds)
    ? paymentRun.eligibleVendorBillIds
    : [];
  const lineIds = Array.isArray(paymentRun.lines)
    ? paymentRun.lines.map((line) => asRecord(line).vendorBillId)
    : [];

  return new Set(
    [...directIds, ...lineIds].map(toCleanString).filter(Boolean),
  );
};

const resolveRequestedPaymentRunId = (payload) => {
  const paymentRunId = toCleanString(payload.paymentRunId);
  const runId = toCleanString(payload.runId);

  if (paymentRunId && runId && paymentRunId !== runId) {
    throw new HttpsError(
      'invalid-argument',
      'paymentRunId y runId no pueden apuntar a corridas CxP distintas.',
    );
  }

  const resolvedPaymentRunId = paymentRunId ?? runId;
  if (resolvedPaymentRunId?.includes('/')) {
    throw new HttpsError(
      'invalid-argument',
      'paymentRunId debe ser un identificador de documento válido.',
    );
  }

  return resolvedPaymentRunId;
};

const resolvePaymentRunLineForVendorBill = (paymentRun, vendorBillId) => {
  const lines = Array.isArray(paymentRun.lines) ? paymentRun.lines : [];
  const lineIndex = lines
    .map((line) => asRecord(line))
    .findIndex((line) => toCleanString(line.vendorBillId) === vendorBillId);

  if (lineIndex < 0) return null;

  return {
    index: lineIndex,
    line: asRecord(lines[lineIndex]),
  };
};

const resolveApprovedRunAmount = (...values) => {
  for (const value of values) {
    const amount = safeNumber(value);
    if (amount != null) return roundToTwoDecimals(amount);
  }

  return null;
};

const buildPaymentRunLineSnapshot = (line) => {
  const cashRequirementAmount =
    resolveApprovedRunAmount(line.cashRequirementAmount) ?? 0;
  const withholdingAmount = resolveApprovedRunAmount(line.withholdingAmount) ?? 0;
  const balanceAmount =
    resolveApprovedRunAmount(line.balanceAmount, line.grossBalanceAmount) ??
    roundToTwoDecimals(cashRequirementAmount + withholdingAmount);

  return {
    vendorBillId: toCleanString(line.vendorBillId),
    purchaseId: toCleanString(line.purchaseId),
    supplierId: toCleanString(line.supplierId),
    balanceAmount,
    cashRequirementAmount,
    executionStatus:
      toCleanString(line.executionStatus)?.toLowerCase() ?? 'not_started',
    paidCashAmount: resolveApprovedRunAmount(
      line.paidCashAmount,
      line.executedCashAmount,
    ) ?? 0,
    paidSettlementAmount: resolveApprovedRunAmount(
      line.paidSettlementAmount,
      line.executedSettlementAmount,
    ) ?? 0,
    paidWithholdingAmount: resolveApprovedRunAmount(
      line.paidWithholdingAmount,
      line.executedWithholdingAmount,
    ) ?? 0,
    paymentIds: Array.isArray(line.paymentIds)
      ? line.paymentIds.map(toCleanString).filter(Boolean)
      : [],
    withholdingAmount,
  };
};

const buildRemainingApprovedRunLineSnapshot = (approvedLine) => ({
  balanceAmount: roundToTwoDecimals(
    Math.max(approvedLine.balanceAmount - approvedLine.paidSettlementAmount, 0),
  ),
  cashRequirementAmount: roundToTwoDecimals(
    Math.max(approvedLine.cashRequirementAmount - approvedLine.paidCashAmount, 0),
  ),
  withholdingAmount: roundToTwoDecimals(
    Math.max(
      approvedLine.withholdingAmount - approvedLine.paidWithholdingAmount,
      0,
    ),
  ),
});

const assertPaymentMatchesApprovedRunLine = ({
  approvedLine,
  settlementAmount,
  totalAmount,
  withholdingAmount,
}) => {
  if (
    PAYMENT_RUN_LINE_TERMINAL_EXECUTION_STATUSES.has(
      approvedLine.executionStatus,
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      'La línea de la corrida CxP ya fue ejecutada y no admite otro pago.',
    );
  }

  const remainingCashAmount = roundToTwoDecimals(
    Math.max(approvedLine.cashRequirementAmount - approvedLine.paidCashAmount, 0),
  );
  const remainingWithholdingAmount = roundToTwoDecimals(
    Math.max(
      approvedLine.withholdingAmount - approvedLine.paidWithholdingAmount,
      0,
    ),
  );
  const remainingSettlementAmount = roundToTwoDecimals(
    Math.max(
      approvedLine.balanceAmount - approvedLine.paidSettlementAmount,
      0,
    ),
  );

  if (totalAmount - remainingCashAmount > THRESHOLD) {
    throw new HttpsError(
      'failed-precondition',
      'El efectivo del pago excede el monto aprobado en la corrida CxP.',
    );
  }

  if (withholdingAmount - remainingWithholdingAmount > THRESHOLD) {
    throw new HttpsError(
      'failed-precondition',
      'Las retenciones del pago exceden el monto aprobado en la corrida CxP.',
    );
  }

  if (settlementAmount - remainingSettlementAmount > THRESHOLD) {
    throw new HttpsError(
      'failed-precondition',
      'El pago excede el total aprobado para la línea de la corrida CxP.',
    );
  }

  if (
    approvedLine.withholdingAmount > THRESHOLD &&
    totalAmount >= remainingCashAmount - THRESHOLD &&
    Math.abs(withholdingAmount - remainingWithholdingAmount) > THRESHOLD
  ) {
    throw new HttpsError(
      'failed-precondition',
      'El pago completo de una corrida con retenciones debe aplicar la retención aprobada.',
    );
  }
};

const assertApprovedRunLineStillMatchesCurrentVendorBill = ({
  approvedLine,
  currentVendorBillRecord,
  vendorBillId,
}) => {
  const currentLine = buildRunLine({
    vendorBillId,
    vendorBillRecord: currentVendorBillRecord,
  });
  if (!currentLine.eligible) {
    throw new HttpsError(
      'failed-precondition',
      currentLine.exclusionReason ??
        `La cuenta por pagar ${vendorBillId} ya no está disponible para la corrida CxP aprobada.`,
    );
  }

  const remainingLine = buildRemainingApprovedRunLineSnapshot(approvedLine);
  const driftFields = [];
  const amountFields = [
    'balanceAmount',
    'cashRequirementAmount',
    'withholdingAmount',
  ];

  amountFields.forEach((field) => {
    const current = safeNumber(currentLine[field]) ?? 0;
    const approvedRemaining = safeNumber(remainingLine[field]) ?? 0;
    if (Math.abs(current - approvedRemaining) > THRESHOLD) {
      driftFields.push(field);
    }
  });

  ['purchaseId', 'supplierId'].forEach((field) => {
    const current = toCleanString(currentLine[field])?.toLowerCase() ?? null;
    const approved = toCleanString(approvedLine[field])?.toLowerCase() ?? null;
    if (approved && current !== approved) {
      driftFields.push(field);
    }
  });

  if (!driftFields.length) return;

  throw new HttpsError(
    'failed-precondition',
    `La cuenta por pagar ${vendorBillId} cambió desde que se aprobó la corrida. Revise o regenere la corrida antes de ejecutar el pago.`,
  );
};

const isPaymentRunLineComplete = (lineSnapshot) =>
  lineSnapshot.cashRequirementAmount - lineSnapshot.paidCashAmount <=
    THRESHOLD &&
  lineSnapshot.withholdingAmount - lineSnapshot.paidWithholdingAmount <=
    THRESHOLD &&
  lineSnapshot.balanceAmount - lineSnapshot.paidSettlementAmount <= THRESHOLD;

const buildPaymentRunStatusSnapshot = (paymentRun) => ({
  approvalStatus: toCleanString(paymentRun.approvalStatus) ?? null,
  executionStatus: toCleanString(paymentRun.executionStatus) ?? null,
  status: toCleanString(paymentRun.status) ?? null,
});

const buildPaymentRunRecordFromSnapshot = (snapshot) => ({
  id: snapshot.id,
  ...asRecord(snapshot.data()),
});

const isActivePaymentRunReservation = (paymentRun) => {
  const status = toCleanString(paymentRun.status)?.toLowerCase() ?? 'draft';
  const executionStatus =
    toCleanString(paymentRun.executionStatus)?.toLowerCase() ?? 'not_started';

  return (
    !PAYMENT_RUN_TERMINAL_STATUSES.has(status) &&
    !PAYMENT_RUN_TERMINAL_EXECUTION_STATUSES.has(executionStatus)
  );
};

const assertDirectPaymentDoesNotBypassActivePaymentRun = async ({
  businessId,
  requestedPaymentRunId,
  transaction,
  vendorBillId,
}) => {
  if (requestedPaymentRunId) return;

  const activeRunsQuery = db
    .collection(`businesses/${businessId}/accountsPayablePaymentRuns`)
    .where('eligibleVendorBillIds', 'array-contains', vendorBillId);
  const activeRunsSnap = await transaction.get(activeRunsQuery);
  const activePaymentRun = (Array.isArray(activeRunsSnap.docs)
    ? activeRunsSnap.docs
    : []
  )
    .map(buildPaymentRunRecordFromSnapshot)
    .find(isActivePaymentRunReservation);

  if (!activePaymentRun) return;

  throw new HttpsError(
    'failed-precondition',
    `La cuenta por pagar ${vendorBillId} ya está incluida en la corrida CxP ${activePaymentRun.id}. Ejecute el pago desde esa corrida o cancélela antes de registrar un pago directo.`,
  );
};

const buildPaymentRunExecutionPatch = ({
  authUid,
  occurredAt,
  paymentId,
  paymentRun,
  settlementAmount,
  totalAmount,
  vendorBillId,
  withholdingAmount,
}) => {
  const lines = Array.isArray(paymentRun.lines) ? paymentRun.lines : [];
  if (!lines.length) return null;

  const updatedLines = lines.map((line) => {
    const lineRecord = asRecord(line);
    if (toCleanString(lineRecord.vendorBillId) !== vendorBillId) {
      return lineRecord;
    }

    const currentSnapshot = buildPaymentRunLineSnapshot(lineRecord);
    const nextSnapshot = {
      ...currentSnapshot,
      paidCashAmount: roundToTwoDecimals(
        currentSnapshot.paidCashAmount + totalAmount,
      ),
      paidSettlementAmount: roundToTwoDecimals(
        currentSnapshot.paidSettlementAmount + settlementAmount,
      ),
      paidWithholdingAmount: roundToTwoDecimals(
        currentSnapshot.paidWithholdingAmount + withholdingAmount,
      ),
      paymentIds: [...new Set([...currentSnapshot.paymentIds, paymentId])],
    };
    const nextExecutionStatus = isPaymentRunLineComplete(nextSnapshot)
      ? 'executed'
      : 'partial';

    return {
      ...lineRecord,
      executionStatus: nextExecutionStatus,
      lastPaymentAt: occurredAt,
      lastPaymentId: paymentId,
      paidCashAmount: nextSnapshot.paidCashAmount,
      paidSettlementAmount: nextSnapshot.paidSettlementAmount,
      paidWithholdingAmount: nextSnapshot.paidWithholdingAmount,
      paymentIds: nextSnapshot.paymentIds,
    };
  });

  const lineSnapshots = updatedLines.map(buildPaymentRunLineSnapshot);
  const executedLineCount = lineSnapshots.filter(isPaymentRunLineComplete).length;
  const partialLineCount = lineSnapshots.filter(
    (line) =>
      !isPaymentRunLineComplete(line) &&
      (line.paidCashAmount > THRESHOLD ||
        line.paidSettlementAmount > THRESHOLD ||
        line.paidWithholdingAmount > THRESHOLD),
  ).length;
  const totalLineCount = lineSnapshots.length;
  const allLinesExecuted =
    totalLineCount > 0 && executedLineCount === totalLineCount;

  return {
    executionStatus: allLinesExecuted ? 'executed' : 'in_progress',
    ...(allLinesExecuted ? { executedAt: occurredAt, executedBy: authUid } : {}),
    lines: updatedLines,
    status: allLinesExecuted ? 'executed' : paymentRun.status,
    updatedAt: occurredAt,
    updatedBy: authUid,
    executionSummary: {
      executedLineCount,
      lastPaymentAt: occurredAt,
      lastPaymentId: paymentId,
      paidCashAmount: roundToTwoDecimals(
        lineSnapshots.reduce((sum, line) => sum + line.paidCashAmount, 0),
      ),
      paidSettlementAmount: roundToTwoDecimals(
        lineSnapshots.reduce((sum, line) => sum + line.paidSettlementAmount, 0),
      ),
      paidWithholdingAmount: roundToTwoDecimals(
        lineSnapshots.reduce((sum, line) => sum + line.paidWithholdingAmount, 0),
      ),
      partialLineCount,
      pendingLineCount: Math.max(
        totalLineCount - executedLineCount - partialLineCount,
        0,
      ),
      totalLineCount,
    },
  };
};

const validatePaymentRunForVendorBill = ({
  authUid,
  currentVendorBillRecord,
  paymentRunId,
  paymentRunSnap,
  settlementAmount,
  totalAmount,
  vendorBillId,
  withholdingAmount,
}) => {
  if (!paymentRunId) return null;

  if (!paymentRunSnap?.exists) {
    throw new HttpsError('not-found', 'La corrida CxP indicada no existe.');
  }

  const paymentRun = asRecord(paymentRunSnap.data());
  const status = toCleanString(paymentRun.status)?.toLowerCase() ?? 'draft';
  const approvalStatus =
    toCleanString(paymentRun.approvalStatus)?.toLowerCase() ??
    'pending_review';
  const executionStatus =
    toCleanString(paymentRun.executionStatus)?.toLowerCase() ?? 'not_started';

  if (status !== 'approved' || approvalStatus !== 'approved') {
    throw new HttpsError(
      'failed-precondition',
      'La corrida CxP debe estar aprobada antes de registrar pagos contra ella.',
    );
  }

  if (!PAYMENT_RUN_EXECUTION_STATUSES_ALLOWING_PAYMENT.has(executionStatus)) {
    throw new HttpsError(
      'failed-precondition',
      'La corrida CxP no está disponible para registrar pagos adicionales.',
    );
  }

  const approvedBy = resolveActorId(paymentRun.approvedBy);
  const approvedAtMillis = toMillis(paymentRun.approvedAt);
  if (!approvedBy || approvedAtMillis == null) {
    throw new HttpsError(
      'failed-precondition',
      'La corrida CxP debe conservar una aprobación explícita antes de ejecutar pagos.',
    );
  }

  assertDifferentActor({
    authUid,
    actorId: approvedBy,
    message:
      'El pago de una corrida CxP debe registrarlo un usuario distinto al que aprobó la corrida.',
  });

  const eligibleVendorBillIds = resolvePaymentRunEligibleVendorBillIds(
    paymentRun,
  );
  if (!eligibleVendorBillIds.has(vendorBillId)) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta por pagar no pertenece al lote aprobado de la corrida CxP.',
    );
  }

  const approvedLineSource = resolvePaymentRunLineForVendorBill(
    paymentRun,
    vendorBillId,
  );
  if (!approvedLineSource) {
    throw new HttpsError(
      'failed-precondition',
      'La corrida CxP no conserva el detalle aprobado de esta cuenta por pagar.',
    );
  }

  const approvedLine = buildPaymentRunLineSnapshot(approvedLineSource.line);
  assertPaymentMatchesApprovedRunLine({
    approvedLine,
    settlementAmount,
    totalAmount,
    withholdingAmount,
  });
  assertApprovedRunLineStillMatchesCurrentVendorBill({
    approvedLine,
    currentVendorBillRecord,
    vendorBillId,
  });

  return {
    paymentRun,
    statusSnapshot: {
      id: paymentRunId,
      approvalStatus,
      approvedBy,
      approvedLine,
      executionStatus,
      status,
    },
  };
};

const emptyWithholdingSummary = () => ({
  isr: 0,
  itbis: 0,
  unclassified: 0,
});

const addWithholdingToSummary = (summary, type, amount) => {
  const normalizedAmount = roundToTwoDecimals(amount);
  if (normalizedAmount <= THRESHOLD) return summary;

  if (type === 'itbis' || type === 'isr') {
    summary[type] = roundToTwoDecimals(summary[type] + normalizedAmount);
    return summary;
  }

  summary.unclassified = roundToTwoDecimals(
    summary.unclassified + normalizedAmount,
  );
  return summary;
};

const summarizeWithholdingApplications = (applications) =>
  applications.reduce((summary, application) => {
    const type = normalizeWithholdingType(
      application.type ?? application.taxType ?? application.code,
    );
    return addWithholdingToSummary(summary, type, application.amount);
  }, emptyWithholdingSummary());

const summarizeActivePaymentWithholdings = (paymentRecords) =>
  paymentRecords.reduce((summary, paymentRecord) => {
    if (!isActiveSupplierPaymentRecord(paymentRecord)) return summary;

    const applications =
      normalizeWithholdingApplicationsForAggregation(paymentRecord);
    if (applications.length > 0) {
      const paymentSummary = summarizeWithholdingApplications(applications);
      summary.itbis = roundToTwoDecimals(summary.itbis + paymentSummary.itbis);
      summary.isr = roundToTwoDecimals(summary.isr + paymentSummary.isr);
      summary.unclassified = roundToTwoDecimals(
        summary.unclassified + paymentSummary.unclassified,
      );
      return summary;
    }

    return addWithholdingToSummary(
      summary,
      null,
      resolvePaymentWithholdingAmount(paymentRecord),
    );
  }, emptyWithholdingSummary());

const resolveFirstAmount = (...values) => {
  for (const value of values) {
    const amount = safeNumber(value);
    if (amount != null) return roundToTwoDecimals(amount);
  }

  return 0;
};

const resolvePurchaseWithholdingCaps = (purchaseRecord) => {
  const monetary = asRecord(purchaseRecord.monetary);
  const documentTotals = asRecord(monetary.documentTotals);
  const legacyTotals = asRecord(
    purchaseRecord.totals ?? purchaseRecord.totalPurchase,
  );

  return {
    isr: resolveFirstAmount(
      documentTotals.withholdingISRAmount,
      documentTotals.isrWithheld,
      legacyTotals.withholdingISRAmount,
      legacyTotals.isrWithheld,
      purchaseRecord.withholdingISRAmount,
      purchaseRecord.isrWithheld,
    ),
    itbis: resolveFirstAmount(
      documentTotals.withholdingITBISAmount,
      documentTotals.itbisWithheld,
      legacyTotals.withholdingITBISAmount,
      legacyTotals.itbisWithheld,
      purchaseRecord.withholdingITBISAmount,
      purchaseRecord.itbisWithheld,
    ),
  };
};

const WITHHOLDING_TYPE_LABELS = Object.freeze({
  isr: 'ISR',
  itbis: 'ITBIS',
});

const assertWithholdingApplicationsWithinFiscalCaps = ({
  activePaymentRecords,
  purchaseRecord,
  withholdingApplications,
}) => {
  if (!withholdingApplications.length) return;

  const requestedSummary =
    summarizeWithholdingApplications(withholdingApplications);
  const previousSummary =
    summarizeActivePaymentWithholdings(activePaymentRecords);
  if (previousSummary.unclassified > THRESHOLD) {
    throw new HttpsError(
      'failed-precondition',
      'Existen retenciones previas sin detalle fiscal. Regularícelas antes de aplicar nuevas retenciones.',
    );
  }

  const caps = resolvePurchaseWithholdingCaps(purchaseRecord);
  ['itbis', 'isr'].forEach((type) => {
    const requestedAmount = requestedSummary[type];
    if (requestedAmount <= THRESHOLD) return;

    const alreadyApplied = previousSummary[type];
    const availableAmount = roundToTwoDecimals(
      Math.max(caps[type] - alreadyApplied, 0),
    );
    if (requestedAmount - availableAmount <= THRESHOLD) return;

    throw new HttpsError(
      'failed-precondition',
      `La retención ${WITHHOLDING_TYPE_LABELS[type]} aplicada excede el tope fiscal disponible de la compra.`,
    );
  });
};

const aggregateCreditNoteRequests = (paymentMethods) =>
  paymentMethods.reduce((accumulator, method) => {
    if (method.method !== 'supplierCreditNote') {
      return accumulator;
    }

    const noteId = toCleanString(method.supplierCreditNoteId);
    if (!noteId) {
      throw new HttpsError(
        'invalid-argument',
        'Debe seleccionar una nota de crédito del suplidor.',
      );
    }

    accumulator.set(
      noteId,
      roundToTwoDecimals((accumulator.get(noteId) || 0) + method.value),
    );
    return accumulator;
  }, new Map());

const resolveSupplierCreditNoteBalanceSnapshot = (creditNoteRecord) => {
  const creditTotal = roundToTwoDecimals(
    creditNoteRecord.totalAmount ??
      creditNoteRecord.amount ??
      creditNoteRecord.value,
  );
  const explicitRemainingAmount =
    creditNoteRecord.remainingAmount ?? creditNoteRecord.balance;
  const hasAppliedAmount = creditNoteRecord.appliedAmount != null;
  const hasRemainingAmount = explicitRemainingAmount != null;
  const fallbackRemainingAmount = hasRemainingAmount
    ? explicitRemainingAmount
    : creditTotal;
  const currentAppliedAmount = roundToTwoDecimals(
    hasAppliedAmount
      ? creditNoteRecord.appliedAmount
      : Math.max(creditTotal - roundToTwoDecimals(fallbackRemainingAmount), 0),
  );
  const currentRemainingAmount = roundToTwoDecimals(
    hasRemainingAmount
      ? explicitRemainingAmount
      : Math.max(creditTotal - currentAppliedAmount, 0),
  );
  const balanceDelta = roundToTwoDecimals(
    currentAppliedAmount + currentRemainingAmount - creditTotal,
  );

  if (
    creditTotal <= THRESHOLD ||
    currentAppliedAmount < -THRESHOLD ||
    currentRemainingAmount < -THRESHOLD ||
    currentAppliedAmount - creditTotal > THRESHOLD ||
    currentRemainingAmount - creditTotal > THRESHOLD ||
    (hasAppliedAmount &&
      hasRemainingAmount &&
      Math.abs(balanceDelta) > THRESHOLD)
  ) {
    throw new HttpsError(
      'failed-precondition',
      'La nota de crédito seleccionada tiene saldos internos inconsistentes. Repárela antes de aplicarla.',
    );
  }

  return {
    creditTotal,
    currentAppliedAmount,
    currentRemainingAmount,
  };
};

const loadSupportingDocumentsForPayment = async ({
  businessId,
  paymentMethods,
  accountingSettings,
  transaction,
}) => {
  const bankAccountsEnabled = accountingSettings?.bankAccountsEnabled !== false;
  const uniqueCashCountIds = Array.from(
    new Set(
      paymentMethods
        .filter((method) => paymentMethodRequiresCashCount(method.method))
        .map((method) => toCleanString(method.cashCountId))
        .filter(Boolean),
    ),
  );
  const uniqueBankAccountIds = Array.from(
    new Set(
      paymentMethods
        .filter(
          (method) =>
            bankAccountsEnabled &&
            paymentMethodRequiresBankAccount(method.method),
        )
        .map((method) => toCleanString(method.bankAccountId))
        .filter(Boolean),
    ),
  );

  const cashCountRefs = uniqueCashCountIds.map((cashCountId) =>
    db.doc(`businesses/${businessId}/cashCounts/${cashCountId}`),
  );
  const bankAccountRefs = uniqueBankAccountIds.map((bankAccountId) =>
    db.doc(`businesses/${businessId}/bankAccounts/${bankAccountId}`),
  );
  const [cashCountSnaps, bankAccountSnaps] = await Promise.all([
    Promise.all(
      cashCountRefs.map((cashCountRef) => transaction.get(cashCountRef)),
    ),
    Promise.all(
      bankAccountRefs.map((bankAccountRef) => transaction.get(bankAccountRef)),
    ),
  ]);

  return {
    bankAccountSnaps,
    cashAccountIdsByCashCountId: cashCountSnaps.reduce(
      (accumulator, snapshot) => {
        accumulator[snapshot.id] =
          toCleanString(snapshot.data()?.cashAccountId) ??
          toCleanString(snapshot.data()?.cashCount?.cashAccountId) ??
          null;
        return accumulator;
      },
      {},
    ),
    cashCountSnaps,
  };
};

const assertSupportingDocumentsUsable = ({
  bankAccountSnaps,
  cashCountSnaps,
}) => {
  cashCountSnaps.forEach((snapshot) => {
    if (!snapshot.exists) {
      throw new HttpsError(
        'failed-precondition',
        'El cuadre de caja seleccionado no existe.',
      );
    }
    const state = toCleanString(
      snapshot.data()?.cashCount?.state,
    )?.toLowerCase();
    if (state !== 'open') {
      throw new HttpsError(
        'failed-precondition',
        'El cuadre de caja seleccionado no está abierto.',
      );
    }
  });

  bankAccountSnaps.forEach((snapshot) => {
    if (!snapshot.exists) {
      throw new HttpsError(
        'failed-precondition',
        'La cuenta bancaria seleccionada no existe.',
      );
    }
    const status = toCleanString(snapshot.data()?.status)?.toLowerCase();
    if (status && status !== 'active') {
      throw new HttpsError(
        'failed-precondition',
        'La cuenta bancaria seleccionada no está activa.',
      );
    }
  });
};

const resolvePaymentMethodsWithSupportingDocuments = ({
  paymentMethods,
  supportingDocuments,
}) =>
  paymentMethods.map((method) => ({
    ...method,
    cashAccountId:
      method.cashAccountId ??
      supportingDocuments.cashAccountIdsByCashCountId?.[method.cashCountId] ??
      null,
  }));

const buildPaymentResponse = ({
  paymentRecord,
  paymentState,
  appliedCreditNotes,
  withholdingApplications = [],
  reused = false,
}) => ({
  ok: true,
  reused,
  paymentId: paymentRecord.id,
  purchaseId: paymentRecord.purchaseId ?? null,
  vendorBillId: paymentRecord.vendorBillId ?? null,
  receiptNumber: paymentRecord.receiptNumber ?? null,
  paymentState: sanitizeForResponse(paymentState),
  appliedCreditNotes: sanitizeForResponse(appliedCreditNotes),
  withholdingApplications: sanitizeForResponse(withholdingApplications),
  payment: sanitizeForResponse(paymentRecord),
});

export const addSupplierPayment = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    null;
  const requestedPurchaseId = toCleanString(payload.purchaseId);
  const requestedVendorBillId = toCleanString(payload.vendorBillId);
  const requestedPaymentRunId = resolveRequestedPaymentRunId(payload);
  const idempotencyKey = toCleanString(payload.idempotencyKey);
  const note = toCleanString(payload.note);
  const evidenceNote = normalizeEvidenceNote(payload.evidenceNote);
  const evidenceUrls = normalizeEvidenceUrls(payload.evidenceUrls);
  const requestedOccurredAtMillis = toMillis(payload.occurredAt);
  const requestedNextPaymentAtMillis = toMillis(payload.nextPaymentAt);
  const hasOccurredAt = payload.occurredAt != null;
  const hasNextPaymentAt = payload.nextPaymentAt != null;
  const hasValidOccurredAt =
    typeof requestedOccurredAtMillis === 'number' &&
    Number.isFinite(requestedOccurredAtMillis) &&
    requestedOccurredAtMillis > 0;
  const hasValidNextPaymentAt =
    typeof requestedNextPaymentAtMillis === 'number' &&
    Number.isFinite(requestedNextPaymentAtMillis) &&
    requestedNextPaymentAtMillis > 0;
  const occurredAtMillis = hasValidOccurredAt
    ? Math.trunc(requestedOccurredAtMillis)
    : null;
  const nextPaymentAtMillis = hasValidNextPaymentAt
    ? Math.trunc(requestedNextPaymentAtMillis)
    : null;

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido.');
  }
  if (!requestedPurchaseId && !requestedVendorBillId) {
    throw new HttpsError(
      'invalid-argument',
      'Debe indicar purchaseId o vendorBillId.',
    );
  }
  if (!idempotencyKey) {
    throw new HttpsError('invalid-argument', 'idempotencyKey es requerido.');
  }
  if (hasOccurredAt && occurredAtMillis == null) {
    throw new HttpsError('invalid-argument', 'La fecha del pago es inválida.');
  }
  if (hasNextPaymentAt && nextPaymentAtMillis == null) {
    throw new HttpsError(
      'invalid-argument',
      'La próxima fecha de pago es inválida.',
    );
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
      'El registro de pagos a suplidor no está habilitado para este negocio.',
    );
  }

  const paymentMethods = normalizeRequestedPaymentMethods(
    payload.paymentMethods,
  );
  const withholdingApplications = normalizeRequestedWithholdingApplications(
    payload.withholdingApplications ??
      payload.appliedWithholdings ??
      payload.withholdings,
  );
  const totalAmount = roundToTwoDecimals(
    paymentMethods.reduce((sum, method) => sum + method.value, 0),
  );
  const withholdingAmount = roundToTwoDecimals(
    withholdingApplications.reduce(
      (sum, application) => sum + application.amount,
      0,
    ),
  );
  const settlementAmount = roundToTwoDecimals(totalAmount + withholdingAmount);
  if (totalAmount <= THRESHOLD) {
    throw new HttpsError(
      'invalid-argument',
      'El monto del pago debe ser mayor que 0.',
    );
  }

  validateMethodRequirements({
    paymentMethods,
    accountingSettings,
  });
  validatePaymentOperationalEvidence({
    evidenceNote,
    evidenceUrls,
    paymentMethods,
    withholdingApplications,
  });

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

  const idempotencyRef = db.doc(
    `businesses/${businessId}/accountsPayablePaymentIdempotency/${idempotencyKey}`,
  );
  const buildRequestHashForPaymentMethods = (methods) =>
    buildIdempotencyRequestHash({
      businessId,
      purchaseId: requestedPurchaseId,
      vendorBillId: requestedVendorBillId,
      paymentRunId: requestedPaymentRunId,
      occurredAt: occurredAtMillis,
      nextPaymentAt: nextPaymentAtMillis,
      note,
      evidenceNote,
      evidenceUrls,
      paymentMethods: methods.map((method) => ({
        ...method,
        supplierCreditNoteId: toCleanString(method.supplierCreditNoteId),
      })),
      withholdingApplications,
    });

  let result = null;

  await db.runTransaction(async (transaction) => {
    const requestedVendorBillRef = requestedVendorBillId
      ? db.doc(`businesses/${businessId}/vendorBills/${requestedVendorBillId}`)
      : null;
    const requestedPaymentRunRef = requestedPaymentRunId
      ? db.doc(
          `businesses/${businessId}/accountsPayablePaymentRuns/${requestedPaymentRunId}`,
        )
      : null;
    const [
      requestedVendorBillSnap,
      idempotencySnap,
      requestedPaymentRunSnap,
    ] = await Promise.all([
      requestedVendorBillRef
        ? transaction.get(requestedVendorBillRef)
        : Promise.resolve(null),
      transaction.get(idempotencyRef),
      requestedPaymentRunRef
        ? transaction.get(requestedPaymentRunRef)
        : Promise.resolve(null),
    ]);
    const supportingDocuments = await loadSupportingDocumentsForPayment({
      businessId,
      paymentMethods,
      accountingSettings,
      transaction,
    });
    const normalizedPaymentMethods =
      resolvePaymentMethodsWithSupportingDocuments({
        paymentMethods,
        supportingDocuments,
      });
    const requestHash = buildRequestHashForPaymentMethods(
      normalizedPaymentMethods,
    );
    const requestHashBeforeSupportingDocuments =
      buildRequestHashForPaymentMethods(paymentMethods);

    if (idempotencySnap.exists) {
      const idempotencyRecord = asRecord(idempotencySnap.data());
      const storedHash = toCleanString(idempotencyRecord.requestHash);
      if (
        storedHash &&
        storedHash !== requestHash &&
        storedHash !== requestHashBeforeSupportingDocuments
      ) {
        throw new HttpsError(
          'already-exists',
          'La llave de idempotencia ya fue utilizada con otro payload.',
        );
      }

      const existingPaymentId = toCleanString(idempotencyRecord.paymentId);
      if (!existingPaymentId) {
        throw new HttpsError(
          'failed-precondition',
          'El registro de idempotencia no apunta a un pago válido.',
        );
      }

      const existingPaymentRef = db.doc(
        `businesses/${businessId}/accountsPayablePayments/${existingPaymentId}`,
      );
      const existingPaymentSnap = await transaction.get(existingPaymentRef);
      if (!existingPaymentSnap.exists) {
        throw new HttpsError(
          'failed-precondition',
          'El pago reutilizado por idempotencia ya no existe.',
        );
      }

      result = buildPaymentResponse({
        paymentRecord: {
          id: existingPaymentSnap.id,
          ...existingPaymentSnap.data(),
        },
        paymentState: existingPaymentSnap.data()?.paymentStateSnapshot ?? null,
        appliedCreditNotes:
          existingPaymentSnap.data()?.metadata?.appliedCreditNotes ?? [],
        withholdingApplications:
          existingPaymentSnap.data()?.withholdingApplications ??
          existingPaymentSnap.data()?.metadata?.withholdingApplications ??
          [],
        reused: true,
      });
      return;
    }
    assertSupportingDocumentsUsable(supportingDocuments);

    const resolvedVendorBillId =
      requestedVendorBillId ??
      buildCanonicalVendorBillIdFromPurchaseId(requestedPurchaseId);
    if (!resolvedVendorBillId) {
      throw new HttpsError(
        'failed-precondition',
        'No fue posible resolver la cuenta por pagar a pagar.',
      );
    }

    if (
      requestedVendorBillRef &&
      requestedVendorBillId &&
      !requestedVendorBillSnap?.exists
    ) {
      throw new HttpsError('not-found', 'La cuenta por pagar no existe.');
    }

    const resolvedVendorBillRef =
      requestedVendorBillRef ??
      db.doc(`businesses/${businessId}/vendorBills/${resolvedVendorBillId}`);
    const resolvedVendorBillSnap =
      requestedVendorBillSnap ??
      (resolvedVendorBillRef
        ? await transaction.get(resolvedVendorBillRef)
        : null);
    const vendorBillRecord = resolvedVendorBillSnap?.exists
      ? asRecord(resolvedVendorBillSnap.data())
      : {};
    const purchaseIdFromVendorBill = resolvePurchaseIdFromVendorBillRecord(
      vendorBillRecord,
      resolvedVendorBillId,
    );
    if (
      requestedPurchaseId &&
      purchaseIdFromVendorBill &&
      requestedPurchaseId !== purchaseIdFromVendorBill
    ) {
      throw new HttpsError(
        'failed-precondition',
        'La cuenta por pagar no corresponde a la compra indicada.',
      );
    }

    const purchaseId = requestedPurchaseId ?? purchaseIdFromVendorBill;
    if (!purchaseId) {
      throw new HttpsError(
        'failed-precondition',
        'La cuenta por pagar no está vinculada a una compra válida.',
      );
    }

    const purchaseRef = db.doc(
      `businesses/${businessId}/purchases/${purchaseId}`,
    );
    const purchaseSnap = await transaction.get(purchaseRef);
    if (!purchaseSnap.exists) {
      throw new HttpsError('not-found', 'La compra no existe.');
    }

    const purchaseRecord = asRecord(purchaseSnap.data());
    const now = Timestamp.now();
    const effectiveOccurredAtMillis = occurredAtMillis ?? toMillis(now);

    await assertAccountingPeriodOpenInTransaction({
      transaction,
      businessId,
      effectiveDate: effectiveOccurredAtMillis,
      settings: accountingSettings,
      rolloutEnabled: true,
      operationLabel: 'registrar este pago a suplidor',
      createError: (message) => new HttpsError('failed-precondition', message),
    });

    const purchaseStatus = toCleanString(
      purchaseRecord.workflowStatus ?? purchaseRecord.status,
    )?.toLowerCase();
    if (purchaseStatus === 'canceled') {
      throw new HttpsError(
        'failed-precondition',
        'No se puede registrar pago sobre una compra cancelada.',
      );
    }

    const currentVendorBillProjection = buildVendorBillProjection({
      purchaseId,
      purchaseRecord,
      paymentState:
        purchaseRecord.paymentState ?? vendorBillRecord.paymentState ?? null,
      paymentTerms:
        purchaseRecord.paymentTerms ?? vendorBillRecord.paymentTerms ?? null,
      vendorBillId: resolvedVendorBillId,
    });
    if (!currentVendorBillProjection) {
      throw new HttpsError(
        'failed-precondition',
        'La cuenta por pagar todavía no está materializada para pago.',
      );
    }

    const projectedPaymentBlock = resolveVendorBillPaymentBlock(
      currentVendorBillProjection,
      purchaseRecord,
    );
    if (projectedPaymentBlock.blocked) {
      throw new HttpsError(
        'failed-precondition',
        projectedPaymentBlock.message,
      );
    }

    if (resolvedVendorBillSnap?.exists) {
      const persistedPaymentBlock = resolveVendorBillPaymentBlock(
        vendorBillRecord,
        purchaseRecord,
      );
      if (persistedPaymentBlock.blocked) {
        throw new HttpsError(
          'failed-precondition',
          persistedPaymentBlock.message,
        );
      }
    }

    assertAccountsPayableCanBePaid({
      authUid,
      purchaseRecord,
      vendorBillRecord,
    });
    await assertDirectPaymentDoesNotBypassActivePaymentRun({
      businessId,
      requestedPaymentRunId,
      transaction,
      vendorBillId: resolvedVendorBillId,
    });
    const paymentRunValidation = validatePaymentRunForVendorBill({
      authUid,
      currentVendorBillRecord: currentVendorBillProjection,
      paymentRunId: requestedPaymentRunId,
      paymentRunSnap: requestedPaymentRunSnap,
      settlementAmount,
      totalAmount,
      vendorBillId: resolvedVendorBillId,
      withholdingAmount,
    });

    const supplierId = resolvePurchaseSupplierId(purchaseRecord);
    if (!supplierId) {
      throw new HttpsError(
        'failed-precondition',
        'La compra no tiene un suplidor válido.',
      );
    }

    const total = resolvePurchaseDocumentTotal(purchaseRecord);
    if (total <= THRESHOLD) {
      throw new HttpsError(
        'failed-precondition',
        'La compra no tiene un total válido para registrar pagos.',
      );
    }

    const paymentStateSnapshot = asRecord(purchaseRecord.paymentState);
    const paidBefore = roundToTwoDecimals(paymentStateSnapshot.paid ?? 0);
    const currentBalance = roundToTwoDecimals(
      paymentStateSnapshot.balance ?? total,
    );
    if (currentBalance <= THRESHOLD) {
      throw new HttpsError(
        'failed-precondition',
        'La compra no tiene balance pendiente.',
      );
    }
    if (settlementAmount - currentBalance > THRESHOLD) {
      throw new HttpsError(
        'failed-precondition',
        'El monto liquidado no puede superar el balance actual de la compra.',
      );
    }

    if (withholdingApplications.length > 0) {
      const paymentsQuery = db
        .collection(`businesses/${businessId}/accountsPayablePayments`)
        .where('purchaseId', '==', purchaseId);
      const paymentsSnap = await transaction.get(paymentsQuery);
      const activePaymentRecords = paymentsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...asRecord(docSnap.data()),
      }));

      assertWithholdingApplicationsWithinFiscalCaps({
        activePaymentRecords,
        purchaseRecord,
        withholdingApplications,
      });
    }

    const balanceAfter = roundToTwoDecimals(
      Math.max(currentBalance - settlementAmount, 0),
    );
    if (balanceAfter > THRESHOLD && !nextPaymentAtMillis) {
      throw new HttpsError(
        'invalid-argument',
        'Debe indicar la próxima fecha de pago cuando el abono es parcial.',
      );
    }

    const paymentId = nanoid();
    const paymentRef = db.doc(
      `businesses/${businessId}/accountsPayablePayments/${paymentId}`,
    );
    const paymentSnap = await transaction.get(paymentRef);
    if (paymentSnap.exists) {
      throw new HttpsError(
        'already-exists',
        'No fue posible registrar el pago porque el identificador generado ya existe. Intente nuevamente.',
      );
    }

    const occurredAt =
      occurredAtMillis == null ? now : Timestamp.fromMillis(occurredAtMillis);
    const nextPaymentAt =
      balanceAfter > THRESHOLD && nextPaymentAtMillis
        ? Timestamp.fromMillis(nextPaymentAtMillis)
        : null;
    const paymentRunExecutionPatch =
      requestedPaymentRunRef && paymentRunValidation
        ? buildPaymentRunExecutionPatch({
            authUid,
            occurredAt,
            paymentId,
            paymentRun: paymentRunValidation.paymentRun,
            settlementAmount,
            totalAmount,
            vendorBillId: resolvedVendorBillId,
            withholdingAmount,
          })
        : null;
    const creditNoteRequests = aggregateCreditNoteRequests(
      normalizedPaymentMethods,
    );
    const appliedCreditNotes = [];
    const creditNoteWrites = [];
    const creditNoteApplicationWrites = [];
    for (const [
      creditNoteId,
      requestedAmount,
    ] of creditNoteRequests.entries()) {
      const creditNoteRef = db.doc(
        `businesses/${businessId}/supplierCreditNotes/${creditNoteId}`,
      );
      const creditNoteSnap = await transaction.get(creditNoteRef);
      if (!creditNoteSnap.exists) {
        throw new HttpsError(
          'not-found',
          'La nota de crédito de suplidor no existe.',
        );
      }

      const creditNoteRecord = asRecord(creditNoteSnap.data());
      const creditSupplierId = toCleanString(creditNoteRecord.supplierId);
      if (!creditSupplierId || creditSupplierId !== supplierId) {
        throw new HttpsError(
          'failed-precondition',
          'La nota de crédito no pertenece al suplidor de la compra.',
        );
      }

      const creditStatus = toCleanString(
        creditNoteRecord.status,
      )?.toLowerCase();
      if (
        !creditStatus ||
        !APPLICABLE_SUPPLIER_CREDIT_NOTE_STATUSES.has(creditStatus)
      ) {
        throw new HttpsError(
          'failed-precondition',
          'La nota de crédito seleccionada no está abierta para aplicar.',
        );
      }

      const {
        creditTotal,
        currentAppliedAmount,
        currentRemainingAmount,
      } = resolveSupplierCreditNoteBalanceSnapshot(
        creditNoteRecord,
      );

      if (requestedAmount - currentRemainingAmount > THRESHOLD) {
        throw new HttpsError(
          'failed-precondition',
          'El saldo a favor disponible no es suficiente para este pago.',
        );
      }

      const nextAppliedAmount = roundToTwoDecimals(
        currentAppliedAmount + requestedAmount,
      );
      const nextRemainingAmount = roundToTwoDecimals(
        Math.max(creditTotal - nextAppliedAmount, 0),
      );
      const applicationId = buildSupplierCreditNoteApplicationId({
        creditNoteId,
        paymentId,
      });

      appliedCreditNotes.push({
        id: creditNoteId,
        applicationId,
        appliedAmount: requestedAmount,
        remainingAmount: nextRemainingAmount,
      });

      creditNoteWrites.push({
        ref: creditNoteRef,
        payload: {
          appliedAmount: nextAppliedAmount,
          remainingAmount: nextRemainingAmount,
          status: nextRemainingAmount <= THRESHOLD ? 'applied' : 'open',
          updatedAt: now,
          updatedBy: authUid,
          lastAppliedAt: occurredAt,
          lastAppliedPaymentId: paymentId,
        },
      });
      creditNoteApplicationWrites.push({
        ref: db.doc(
          `businesses/${businessId}/supplierCreditNoteApplications/${applicationId}`,
        ),
        payload: {
          id: applicationId,
          businessId,
          supplierCreditNoteId: creditNoteId,
          paymentId,
          purchaseId,
          vendorBillId: resolvedVendorBillId,
          supplierId,
          status: 'applied',
          amount: requestedAmount,
          appliedAmount: requestedAmount,
          previousAppliedAmount: currentAppliedAmount,
          nextAppliedAmount,
          previousRemainingAmount: currentRemainingAmount,
          nextRemainingAmount,
          occurredAt,
          createdAt: now,
          createdBy: authUid,
          updatedAt: now,
          updatedBy: authUid,
          sourceType: 'accountsPayablePayment',
          sourceId: paymentId,
          metadata: {
            purchaseNumber: purchaseRecord.numberId ?? null,
            note,
          },
        },
      });
    }

    const paymentMonetarySnapshot =
      await resolvePilotMonetarySnapshotForBusiness({
        businessId,
        source: purchaseRecord,
        operationType: 'payable-payment',
        totals: {
          total: totalAmount,
          paid: totalAmount,
          balance: 0,
        },
        capturedBy: authUid,
        capturedAt: occurredAt,
        settings: accountingSettings,
      });
    const paymentRecord = {
      id: paymentId,
      businessId,
      operationType: 'payable-payment',
      sourceId: resolvedVendorBillId,
      sourceDocumentId: resolvedVendorBillId,
      sourceDocumentType: 'vendorBill',
      counterpartyType: 'supplier',
      counterpartyId: supplierId,
      purchaseId,
      vendorBillId: resolvedVendorBillId,
      paymentRunId: requestedPaymentRunId ?? null,
      supplierId,
      paymentMethods: normalizedPaymentMethods,
      totalAmount,
      withholdingAmount,
      withholdingApplications,
      settlementAmount,
      cashCountId: resolvePaymentRecordCashCountId(normalizedPaymentMethods),
      cashAccountId: resolvePaymentRecordCashAccountId(
        normalizedPaymentMethods,
      ),
      bankAccountId: resolvePaymentRecordBankAccountId(
        normalizedPaymentMethods,
      ),
      reference: resolvePaymentRecordReference(normalizedPaymentMethods),
      evidenceNote: evidenceNote ?? null,
      evidenceUrls,
      occurredAt,
      createdAt: now,
      updatedAt: now,
      createdBy: authUid,
      updatedBy: authUid,
      monetary: paymentMonetarySnapshot ?? null,
      exchangeRateSnapshot:
        paymentMonetarySnapshot?.exchangeRateSnapshot ?? null,
      paymentStateSnapshot: null,
      status: 'posted',
      receiptNumber: `CPP-${paymentId.slice(0, 8).toUpperCase()}`,
      nextPaymentAt,
      metadata: {
        purchaseNumber: purchaseRecord.numberId ?? null,
        purchaseStatus:
          toCleanString(
            purchaseRecord.workflowStatus ?? purchaseRecord.status,
          ) ?? null,
        vendorBillId: resolvedVendorBillId,
        paymentRunId: requestedPaymentRunId ?? null,
        paymentRunStatusSnapshot:
          paymentRunValidation?.statusSnapshot ?? null,
        note,
        paymentEvidence: {
          note: evidenceNote ?? null,
          urls: evidenceUrls,
        },
        idempotencyKey,
        appliedCreditNotes,
        withholdingApplications,
        withholdingAmount,
      },
    };

    const paymentCountBefore = Math.max(
      Math.trunc(safeNumber(paymentStateSnapshot.paymentCount) ?? 0),
      0,
    );
    const previousLastPaymentAt = paymentStateSnapshot.lastPaymentAt ?? null;
    const previousLastPaymentAtMillis = toMillis(previousLastPaymentAt);
    const isCurrentPaymentLatest =
      previousLastPaymentAtMillis == null ||
      effectiveOccurredAtMillis >= previousLastPaymentAtMillis;
    const lastPaymentAt = isCurrentPaymentLatest
      ? occurredAt
      : previousLastPaymentAt;
    const lastPaymentId = isCurrentPaymentLatest
      ? paymentId
      : (toCleanString(paymentStateSnapshot.lastPaymentId) ?? paymentId);
    const resolvedNextPaymentAt =
      balanceAfter > THRESHOLD
        ? isCurrentPaymentLatest
          ? (nextPaymentAt ??
            purchaseRecord.paymentTerms?.nextPaymentAt ??
            purchaseRecord.paymentTerms?.expectedPaymentAt ??
            null)
          : (purchaseRecord.paymentTerms?.nextPaymentAt ??
            purchaseRecord.paymentTerms?.expectedPaymentAt ??
            nextPaymentAt ??
            null)
        : null;
    const paymentState = buildPurchasePaymentState({
      purchaseRecord,
      total,
      paid: roundToTwoDecimals(paidBefore + settlementAmount),
      paymentCount: paymentCountBefore + 1,
      lastPaymentAt,
      lastPaymentId,
      nextPaymentAt: resolvedNextPaymentAt,
    });
    paymentRecord.paymentStateSnapshot = paymentState;

    transaction.set(paymentRef, paymentRecord);
    transaction.set(
      purchaseRef,
      {
        paymentState,
        paymentTerms: {
          ...asRecord(purchaseRecord.paymentTerms),
          nextPaymentAt: resolvedNextPaymentAt,
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
        nextPaymentAt: resolvedNextPaymentAt,
      },
      vendorBillId: resolvedVendorBillId,
    });
    if (vendorBillProjection) {
      transaction.set(
        db.doc(`businesses/${businessId}/vendorBills/${resolvedVendorBillId}`),
        preserveVendorBillControlDetails({
          existingVendorBill: vendorBillRecord,
          vendorBillProjection,
        }),
        { merge: true },
      );
    }
    if (requestedPaymentRunRef && paymentRunExecutionPatch) {
      const nextPaymentRun = {
        ...paymentRunValidation.paymentRun,
        ...paymentRunExecutionPatch,
      };
      const eventId = `payment_run_payment__${paymentId}`;

      transaction.set(requestedPaymentRunRef, paymentRunExecutionPatch, {
        merge: true,
      });
      transaction.set(
        db.doc(
          `businesses/${businessId}/accountsPayablePaymentRunEvents/${eventId}`,
        ),
        {
          id: eventId,
          businessId,
          paymentRunId: requestedPaymentRunId,
          action: 'record_payment',
          reason:
            note ??
            evidenceNote ??
            `Pago registrado contra la cuenta por pagar ${resolvedVendorBillId}.`,
          evidenceNote: evidenceNote ?? null,
          evidenceUrls,
          previousStatus: buildPaymentRunStatusSnapshot(
            paymentRunValidation.paymentRun,
          ),
          nextStatus: buildPaymentRunStatusSnapshot(nextPaymentRun),
          createdAt: now,
          createdBy: authUid,
          sourceType: 'accountsPayablePayment',
          sourceId: paymentId,
          payment: {
            paymentId,
            vendorBillId: resolvedVendorBillId,
            purchaseId,
            totalAmount,
            withholdingAmount,
            settlementAmount,
          },
        },
      );
    }
    transaction.set(idempotencyRef, {
      id: idempotencyKey,
      paymentId,
      purchaseId,
      vendorBillId: resolvedVendorBillId,
      paymentRunId: requestedPaymentRunId ?? null,
      requestHash,
      createdAt: now,
      createdBy: authUid,
    });

    creditNoteWrites.forEach((entry) => {
      transaction.set(entry.ref, entry.payload, { merge: true });
    });
    creditNoteApplicationWrites.forEach((entry) => {
      transaction.set(entry.ref, entry.payload, { merge: true });
    });

    result = buildPaymentResponse({
      paymentRecord,
      paymentState,
      appliedCreditNotes,
      withholdingApplications,
    });
  });

  return result;
});
