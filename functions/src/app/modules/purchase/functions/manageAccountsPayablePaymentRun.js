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
  THRESHOLD,
  asRecord,
  safeNumber,
  sanitizeForResponse,
  toCleanString,
  toMillis,
} from './payablePayments.shared.js';
import { buildRunLine } from './createAccountsPayablePaymentRun.js';

const SUPPORTED_ACTIONS = new Set(['submit', 'approve', 'reject', 'cancel']);
const TERMINAL_STATUSES = new Set(['canceled', 'cancelled', 'executed']);
const REVIEW_DECISION_ACTIONS = new Set(['approve', 'reject']);
const EVIDENCE_REQUIRED_ACTIONS = new Set(['approve', 'reject', 'cancel']);

const normalizeAction = (value) => {
  const action = toCleanString(value)
    ?.toLowerCase()
    .replace(/[-\s]+/g, '_');
  switch (action) {
    case 'submit_for_approval':
    case 'send_for_approval':
    case 'request_approval':
    case 'submitted':
      return 'submit';
    case 'approved':
      return 'approve';
    case 'rejected':
      return 'reject';
    case 'void':
    case 'voided':
    case 'cancelled':
      return 'cancel';
    default:
      return action ?? null;
  }
};

const validateReason = (value) => {
  const reason = toCleanString(value);
  if (!reason || reason.length < 5) {
    throw new HttpsError(
      'invalid-argument',
      'Debe indicar un motivo con al menos 5 caracteres.',
    );
  }

  return reason.slice(0, 500);
};

const normalizeEvidenceUrls = (value) =>
  (Array.isArray(value) ? value : [])
    .map((entry) => toCleanString(entry))
    .filter(Boolean)
    .slice(0, 10);

const validateEvidence = ({ action, evidenceNote, evidenceUrls }) => {
  if (!EVIDENCE_REQUIRED_ACTIONS.has(action)) return;
  if (evidenceNote || evidenceUrls.length) return;

  throw new HttpsError(
    'invalid-argument',
    'Debe indicar una evidencia o referencia para esta acción de corrida CxP.',
  );
};

const resolveAllowedRolesForAction = (action) =>
  action === 'submit'
    ? MEMBERSHIP_ROLE_GROUPS.TREASURY_OPERATOR
    : MEMBERSHIP_ROLE_GROUPS.ACCOUNTING_ADMIN;

const resolvePaymentRunStatus = (paymentRun) =>
  toCleanString(paymentRun.status)?.toLowerCase() ?? 'draft';

const resolvePaymentRunApprovalStatus = (paymentRun) =>
  toCleanString(paymentRun.approvalStatus)?.toLowerCase() ?? 'pending_review';

const resolveExecutionStatus = (paymentRun) =>
  toCleanString(paymentRun.executionStatus)?.toLowerCase() ?? 'not_started';

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

const resolveVendorBillApprovalSnapshot = (vendorBillRecord) => {
  const purchaseAccountsPayable = asRecord(
    asRecord(vendorBillRecord.purchase).accountsPayable,
  );

  return {
    approvedAtMillis: toMillis(
      vendorBillRecord.approvedAt ?? purchaseAccountsPayable.approvedAt,
    ),
    approvedBy: resolveActorId(
      vendorBillRecord.approvedBy ?? purchaseAccountsPayable.approvedBy,
    ),
    approvalStatus:
      toCleanString(
        vendorBillRecord.approvalStatus ??
          purchaseAccountsPayable.approvalStatus,
      )?.toLowerCase() ?? null,
  };
};

const resolveEligibleVendorBillIds = (paymentRun) => {
  const directIds = Array.isArray(paymentRun.eligibleVendorBillIds)
    ? paymentRun.eligibleVendorBillIds
    : [];
  const lineIds = Array.isArray(paymentRun.lines)
    ? paymentRun.lines.map((line) => asRecord(line).vendorBillId)
    : [];

  return [...new Set([...directIds, ...lineIds].map(toCleanString).filter(Boolean))];
};

const resolveLineDueAtMillis = (line) =>
  safeNumber(line?.dueAtMillis) ?? toMillis(line?.dueAt);

const resolveLineSnapshotsByVendorBillId = (paymentRun) => {
  const snapshots = new Map();
  (Array.isArray(paymentRun.lines) ? paymentRun.lines : []).forEach((line) => {
    const lineRecord = asRecord(line);
    const vendorBillId = toCleanString(lineRecord.vendorBillId);
    if (vendorBillId) {
      snapshots.set(vendorBillId, lineRecord);
    }
  });
  return snapshots;
};

const assertLineSnapshotMatchesCurrent = ({
  currentLine,
  snapshotLine,
  vendorBillId,
}) => {
  const driftFields = [];
  const moneyFields = [
    'balanceAmount',
    'cashRequirementAmount',
    'paidAmount',
    'totalAmount',
    'withholdingAmount',
  ];
  const stringFields = [
    'approvalStatus',
    'paymentControlStatus',
    'purchaseId',
    'status',
    'supplierId',
  ];
  const fiscalFields = [
    'netPayableAmount',
    'withholdingITBISAmount',
    'withholdingISRAmount',
  ];

  moneyFields.forEach((field) => {
    const current = safeNumber(currentLine[field]) ?? 0;
    const snapshot = safeNumber(snapshotLine[field]) ?? 0;
    if (Math.abs(current - snapshot) > THRESHOLD) {
      driftFields.push(field);
    }
  });

  stringFields.forEach((field) => {
    const current = toCleanString(currentLine[field])?.toLowerCase() ?? null;
    const snapshot = toCleanString(snapshotLine[field])?.toLowerCase() ?? null;
    if (current !== snapshot) {
      driftFields.push(field);
    }
  });

  fiscalFields.forEach((field) => {
    const current = safeNumber(asRecord(currentLine.fiscalSnapshot)[field]) ?? 0;
    const snapshot = safeNumber(asRecord(snapshotLine.fiscalSnapshot)[field]) ?? 0;
    if (Math.abs(current - snapshot) > THRESHOLD) {
      driftFields.push(`fiscalSnapshot.${field}`);
    }
  });

  if (resolveLineDueAtMillis(currentLine) !== resolveLineDueAtMillis(snapshotLine)) {
    driftFields.push('dueAt');
  }

  if (!driftFields.length) return;

  throw new HttpsError(
    'failed-precondition',
    `La cuenta por pagar ${vendorBillId} cambió desde que se creó la corrida. Revise o regenere la corrida antes de aprobarla.`,
  );
};

const assertRunCanTransition = ({ action, paymentRun }) => {
  const status = resolvePaymentRunStatus(paymentRun);
  const approvalStatus = resolvePaymentRunApprovalStatus(paymentRun);
  const executionStatus = resolveExecutionStatus(paymentRun);

  if (executionStatus !== 'not_started') {
    throw new HttpsError(
      'failed-precondition',
      'La corrida ya inició ejecución y no admite esta acción.',
    );
  }

  if (TERMINAL_STATUSES.has(status)) {
    throw new HttpsError(
      'failed-precondition',
      'La corrida ya está cerrada y no admite esta acción.',
    );
  }

  if (action === 'submit' && status !== 'draft' && status !== 'rejected') {
    throw new HttpsError(
      'failed-precondition',
      'Solo se pueden enviar corridas en borrador o rechazadas.',
    );
  }

  if (
    REVIEW_DECISION_ACTIONS.has(action) &&
    (status !== 'submitted' || approvalStatus !== 'pending_approval')
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Solo se pueden aprobar o rechazar corridas enviadas a aprobación.',
    );
  }
};

const assertMakerChecker = ({ action, authUid, paymentRun }) => {
  const runStatus = resolvePaymentRunStatus(paymentRun);
  const requiresReviewSegregation = REVIEW_DECISION_ACTIONS.has(action);
  const requiresCancelSegregation =
    action === 'cancel' && ['approved', 'submitted'].includes(runStatus);
  if (!requiresReviewSegregation && !requiresCancelSegregation) return;

  const forbiddenActors = new Set(
    [
      toCleanString(paymentRun.createdBy),
      toCleanString(paymentRun.submittedBy),
      toCleanString(paymentRun.approvedBy),
    ].filter(Boolean),
  );

  if (!forbiddenActors.has(authUid)) return;

  const actionMessage =
    action === 'cancel'
      ? 'La corrida enviada o aprobada debe ser cancelada por un usuario distinto al creador, solicitante o aprobador.'
      : 'La corrida debe ser aprobada o rechazada por un usuario distinto al creador o solicitante.';

  throw new HttpsError('failed-precondition', actionMessage);
};

const assertRunVendorBillsStillCurrentAndPayable = async ({
  businessId,
  paymentRun,
  transaction,
}) => {
  const vendorBillIds = resolveEligibleVendorBillIds(paymentRun);
  if (!vendorBillIds.length) {
    throw new HttpsError(
      'failed-precondition',
      'La corrida no tiene cuentas por pagar elegibles para aprobar.',
    );
  }

  const vendorBillSnapshots = await Promise.all(
    vendorBillIds.map((vendorBillId) =>
      transaction.get(
        db.doc(`businesses/${businessId}/vendorBills/${vendorBillId}`),
      ),
    ),
  );

  const lineSnapshots = resolveLineSnapshotsByVendorBillId(paymentRun);
  let checkedVendorBillCount = 0;
  for (const [index, vendorBillSnap] of vendorBillSnapshots.entries()) {
    const vendorBillId = vendorBillIds[index];
    if (!vendorBillSnap.exists) {
      throw new HttpsError(
        'failed-precondition',
        `La cuenta por pagar ${vendorBillId} ya no existe para aprobar la corrida.`,
      );
    }

    const vendorBillRecord = asRecord(vendorBillSnap.data());
    const currentLine = buildRunLine({ vendorBillId, vendorBillRecord });
    if (!currentLine.eligible) {
      throw new HttpsError(
        'failed-precondition',
        currentLine.exclusionReason ??
          `La cuenta por pagar ${vendorBillId} ya no está disponible para pago.`,
      );
    }

    const snapshotLine = lineSnapshots.get(vendorBillId);
    if (!snapshotLine) {
      throw new HttpsError(
        'failed-precondition',
        `La corrida no conserva el snapshot de la cuenta por pagar ${vendorBillId}. Regenere la corrida antes de aprobarla.`,
      );
    }
    assertLineSnapshotMatchesCurrent({
      currentLine,
      snapshotLine,
      vendorBillId,
    });

    const approvalSnapshot = resolveVendorBillApprovalSnapshot(vendorBillRecord);
    if (
      approvalSnapshot.approvalStatus !== 'approved' ||
      !approvalSnapshot.approvedBy ||
      approvalSnapshot.approvedAtMillis == null
    ) {
      throw new HttpsError(
        'failed-precondition',
        `La cuenta por pagar ${vendorBillId} debe conservar una aprobación explícita antes de aprobar la corrida.`,
      );
    }
    checkedVendorBillCount += 1;
  }

  return {
    checkedVendorBillCount,
  };
};

const buildNextPatch = ({ action, authUid, evidenceNote, evidenceUrls, now, reason }) => {
  const basePatch = {
    lastAction: action,
    lastActionAt: now,
    lastActionBy: authUid,
    lastActionReason: reason,
    updatedAt: now,
    updatedBy: authUid,
  };

  if (action === 'submit') {
    return {
      ...basePatch,
      status: 'submitted',
      approvalStatus: 'pending_approval',
      submittedAt: now,
      submittedBy: authUid,
      submittedReason: reason,
    };
  }

  if (action === 'approve') {
    return {
      ...basePatch,
      status: 'approved',
      approvalStatus: 'approved',
      approvedAt: now,
      approvedBy: authUid,
      approvalReason: reason,
      approvalEvidenceNote: evidenceNote ?? null,
      approvalEvidenceUrls: evidenceUrls,
    };
  }

  if (action === 'reject') {
    return {
      ...basePatch,
      status: 'rejected',
      approvalStatus: 'rejected',
      rejectedAt: now,
      rejectedBy: authUid,
      rejectionReason: reason,
      rejectionEvidenceNote: evidenceNote ?? null,
      rejectionEvidenceUrls: evidenceUrls,
    };
  }

  return {
    ...basePatch,
    status: 'canceled',
    approvalStatus: 'canceled',
    canceledAt: now,
    canceledBy: authUid,
    cancelReason: reason,
    cancelEvidenceNote: evidenceNote ?? null,
    cancelEvidenceUrls: evidenceUrls,
  };
};

const buildRunStatusSnapshot = (paymentRun) => ({
  approvalStatus: resolvePaymentRunApprovalStatus(paymentRun),
  executionStatus: resolveExecutionStatus(paymentRun),
  status: resolvePaymentRunStatus(paymentRun),
});

export const manageAccountsPayablePaymentRun = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    null;
  const paymentRunId =
    toCleanString(payload.paymentRunId) || toCleanString(payload.runId);
  const action = normalizeAction(payload.action);
  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido.');
  }
  if (!paymentRunId) {
    throw new HttpsError(
      'invalid-argument',
      'paymentRunId es requerido.',
    );
  }
  if (!action || !SUPPORTED_ACTIONS.has(action)) {
    throw new HttpsError(
      'invalid-argument',
      'Acción de corrida CxP no soportada.',
    );
  }

  const reason = validateReason(payload.reason);
  const evidenceNote = toCleanString(payload.evidenceNote);
  const evidenceUrls = normalizeEvidenceUrls(payload.evidenceUrls);
  validateEvidence({ action, evidenceNote, evidenceUrls });

  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: resolveAllowedRolesForAction(action),
  });
  await assertBusinessSubscriptionAccess({
    businessId,
    action: 'write',
    operation: LIMIT_OPERATION_KEYS.ACCOUNTS_PAYABLE_PAYMENT,
  });

  let result = null;
  await db.runTransaction(async (transaction) => {
    const paymentRunRef = db.doc(
      `businesses/${businessId}/accountsPayablePaymentRuns/${paymentRunId}`,
    );
    const paymentRunSnap = await transaction.get(paymentRunRef);
    if (!paymentRunSnap.exists) {
      throw new HttpsError('not-found', 'La corrida CxP no existe.');
    }

    const paymentRun = {
      id: paymentRunSnap.id,
      ...asRecord(paymentRunSnap.data()),
    };
    assertRunCanTransition({ action, paymentRun });
    assertMakerChecker({ action, authUid, paymentRun });
    const approvalValidation =
      action === 'approve'
        ? await assertRunVendorBillsStillCurrentAndPayable({
            businessId,
            paymentRun,
            transaction,
          })
        : null;

    const now = Timestamp.now();
    const eventId = nanoid();
    const patch = {
      ...buildNextPatch({
        action,
        authUid,
        evidenceNote,
        evidenceUrls,
        now,
        reason,
      }),
    };
    const nextRun = { ...paymentRun, ...patch };
    const eventRecord = {
      id: eventId,
      businessId,
      paymentRunId,
      action,
      reason,
      evidenceNote: evidenceNote ?? null,
      evidenceUrls,
      previousStatus: buildRunStatusSnapshot(paymentRun),
      nextStatus: buildRunStatusSnapshot(nextRun),
      createdAt: now,
      createdBy: authUid,
      sourceType: 'accountsPayablePaymentRun',
      sourceId: paymentRunId,
      ...(approvalValidation
        ? {
            validation: {
              checkedVendorBillCount:
                approvalValidation.checkedVendorBillCount,
            },
          }
        : {}),
    };

    transaction.set(paymentRunRef, patch, { merge: true });
    transaction.set(
      db.doc(
        `businesses/${businessId}/accountsPayablePaymentRunEvents/${eventId}`,
      ),
      eventRecord,
    );

    result = {
      ok: true,
      action,
      businessId,
      eventId,
      paymentRun: nextRun,
      paymentRunId,
      status: nextRun.status,
      approvalStatus: nextRun.approvalStatus,
      executionStatus: nextRun.executionStatus,
    };
  });

  return sanitizeForResponse(result);
});
