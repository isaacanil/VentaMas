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
} from '../../../versions/v2/accounting/utils/accountingRollout.util.js';
import { assertAccountingPeriodOpenInTransaction } from '../../../versions/v2/accounting/utils/periodClosure.util.js';
import {
  THRESHOLD,
  asRecord,
  sanitizeForResponse,
  toCleanString,
} from './payablePayments.shared.js';
import {
  buildCanonicalVendorBillIdFromPurchaseId,
  buildPurchaseAccountsPayableMirror,
  buildVendorBillProjection,
  resolveVendorBillDuplicateIdentity,
  resolveVendorBillDuplicateMatch,
  resolvePurchaseIdFromVendorBillRecord,
} from './vendorBill.shared.js';

const SUPPORTED_ACTIONS = new Set([
  'approve',
  'request_approval',
  'reject',
  'place_hold',
  'release_hold',
  'open_dispute',
  'resolve_dispute',
  'void',
]);

const EVIDENCE_REQUIRED_ACTIONS = new Set([
  'approve',
  'reject',
  'place_hold',
  'release_hold',
  'open_dispute',
  'resolve_dispute',
  'void',
]);

const ADMIN_CONTROL_ACTIONS = new Set([
  'approve',
  'reject',
  'release_hold',
  'resolve_dispute',
  'void',
]);

const ACTIVE_CONTROL_STATUSES = new Set([
  'active',
  'blocked',
  'disputed',
  'held',
  'in_dispute',
  'on_hold',
  'open',
  'payment_hold',
  'pending',
]);

const RELEASED_CONTROL_STATUSES = new Set([
  'cancelled',
  'canceled',
  'closed',
  'cleared',
  'inactive',
  'released',
  'resolved',
  'void',
  'voided',
]);

const TERMINAL_VENDOR_BILL_STATUSES = new Set(['voided']);
const TERMINAL_PAYMENT_RUN_STATUSES = new Set([
  'canceled',
  'cancelled',
  'executed',
]);
const TERMINAL_PAYMENT_RUN_EXECUTION_STATUSES = new Set([
  'canceled',
  'cancelled',
  'executed',
]);

const normalizeAction = (value) => {
  const action = toCleanString(value)
    ?.toLowerCase()
    .replace(/[-\s]+/g, '_');
  switch (action) {
    case 'approval_requested':
    case 'pending_approval':
    case 'requestapproval':
      return 'request_approval';
    case 'approve_bill':
    case 'approved':
      return 'approve';
    case 'reject_bill':
    case 'rejected':
      return 'reject';
    case 'hold':
    case 'placehold':
      return 'place_hold';
    case 'release':
    case 'releasehold':
      return 'release_hold';
    case 'dispute':
    case 'opendispute':
      return 'open_dispute';
    case 'resolve':
    case 'resolvedispute':
      return 'resolve_dispute';
    case 'cancel':
    case 'cancel_bill':
    case 'cancel_vendor_bill':
    case 'void_bill':
    case 'void_vendor_bill':
      return 'void';
    default:
      return action ?? null;
  }
};

const validateControlReason = (reason) => {
  const normalizedReason = toCleanString(reason);
  if (!normalizedReason || normalizedReason.length < 5) {
    throw new HttpsError(
      'invalid-argument',
      'Debe indicar un motivo de control con al menos 5 caracteres.',
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

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const pickCleanString = (...values) => {
  for (const value of values) {
    const cleaned = toCleanString(value);
    if (cleaned) return cleaned;
  }

  return null;
};

const pickFiscalNumber = (source, keys) => {
  const records = [
    asRecord(source?.monetary?.fiscalTotals),
    asRecord(source?.monetary?.documentTotals),
    asRecord(source?.monetary),
    asRecord(source?.fiscalTotals),
    asRecord(source),
  ];

  for (const record of records) {
    for (const key of keys) {
      const amount = toFiniteNumber(record[key]);
      if (amount != null) return amount;
    }
  }

  return null;
};

const resolveAllowedRolesForControlAction = (action) =>
  ADMIN_CONTROL_ACTIONS.has(action)
    ? MEMBERSHIP_ROLE_GROUPS.ACCOUNTING_ADMIN
    : MEMBERSHIP_ROLE_GROUPS.ACCOUNTING_WRITE;

const validateControlEvidence = ({ action, evidenceNote, evidenceUrls }) => {
  if (!EVIDENCE_REQUIRED_ACTIONS.has(action)) {
    return;
  }

  if ((evidenceNote && evidenceNote.length >= 3) || evidenceUrls.length > 0) {
    return;
  }

  throw new HttpsError(
    'invalid-argument',
    'Debe indicar una evidencia o referencia para este control de CxP.',
  );
};

const isActiveControlRecord = (value) => {
  if (value === true) return true;

  const record = asRecord(value);
  if (record.active === true || record.isActive === true) return true;
  if (record.active === false || record.isActive === false) return false;

  const status = toCleanString(
    record.status ?? record.state ?? record.approvalStatus,
  )?.toLowerCase();
  if (!status || RELEASED_CONTROL_STATUSES.has(status)) return false;

  return ACTIVE_CONTROL_STATUSES.has(status);
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

const resolvePurchaseCreatorId = ({ vendorBillRecord, purchaseRecord }) =>
  resolveActorId(
    vendorBillRecord.createdBy ??
      vendorBillRecord.createdByUser ??
      purchaseRecord.createdBy ??
      purchaseRecord.createdByUser ??
      purchaseRecord.createdById,
  );

const assertDifferentActor = ({ authUid, actorId, message }) => {
  if (!actorId || actorId !== authUid) return;

  throw new HttpsError('failed-precondition', message);
};

const resolveCurrentPaymentHold = ({ vendorBillRecord, accountsPayable }) =>
  vendorBillRecord.paymentHold ??
  vendorBillRecord.hold ??
  accountsPayable.paymentHold ??
  accountsPayable.hold ??
  null;

const resolveCurrentDispute = ({ vendorBillRecord, accountsPayable }) =>
  vendorBillRecord.dispute ?? accountsPayable.dispute ?? null;

const resolveCurrentApprovalStatus = ({ vendorBillRecord, accountsPayable }) =>
  toCleanString(
    vendorBillRecord.approvalStatus ?? accountsPayable.approvalStatus,
  )?.toLowerCase() ?? null;

const resolveCurrentApprovalActorId = ({ accountsPayable, vendorBillRecord }) =>
  resolveActorId(accountsPayable.approvedBy ?? vendorBillRecord.approvedBy);

const resolveApprovalRequesterId = ({ accountsPayable, vendorBillRecord }) =>
  resolveActorId(
    accountsPayable.approvalRequestedBy ??
      accountsPayable.requestedBy ??
      accountsPayable.submittedBy ??
      vendorBillRecord.approvalRequestedBy ??
      vendorBillRecord.requestedBy ??
      vendorBillRecord.submittedBy ??
      asRecord(asRecord(vendorBillRecord.purchase).accountsPayable)
        .approvalRequestedBy ??
      asRecord(asRecord(vendorBillRecord.purchase).accountsPayable)
        .requestedBy ??
      asRecord(asRecord(vendorBillRecord.purchase).accountsPayable).submittedBy,
  );

const assertBillCanBeControlled = ({ action, vendorBillProjection }) => {
  const status = toCleanString(vendorBillProjection.status)?.toLowerCase();
  if (TERMINAL_VENDOR_BILL_STATUSES.has(status)) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta por pagar está anulada y no admite cambios de control.',
    );
  }

  const balance = Number(
    vendorBillProjection.paymentState?.balance ??
      vendorBillProjection.totals?.balance ??
      0,
  );
  const paid = Number(
    vendorBillProjection.paymentState?.paid ??
      vendorBillProjection.totals?.paid ??
      0,
  );
  const paymentCount = Number(
    vendorBillProjection.paymentState?.paymentCount ?? 0,
  );
  const lastPaymentId = toCleanString(
    vendorBillProjection.paymentState?.lastPaymentId,
  );
  if (
    action === 'void' &&
    (paid > THRESHOLD || paymentCount > 0 || lastPaymentId)
  ) {
    throw new HttpsError(
      'failed-precondition',
      'No se puede anular una CxP con pagos registrados. Anule primero los pagos asociados.',
    );
  }
  if (
    status === 'paid' &&
    balance <= THRESHOLD &&
    !['release_hold', 'resolve_dispute'].includes(action)
  ) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta por pagar ya está saldada.',
    );
  }
};

const resolveApprovalReadinessSnapshot = (vendorBillProjection) => {
  const purchaseRecord = asRecord(vendorBillProjection.purchase);
  const taxReceipt = asRecord(purchaseRecord.taxReceipt);
  const classification = asRecord(purchaseRecord.classification);
  const ncf = pickCleanString(
    taxReceipt.ncf,
    purchaseRecord.ncf,
    purchaseRecord.NCF,
    purchaseRecord.proofOfPurchase,
  );
  const documentType = pickCleanString(
    purchaseRecord.documentType,
    taxReceipt.documentType,
    taxReceipt.type,
  );
  const dgii606ExpenseType = pickCleanString(
    classification.dgii606ExpenseType,
    purchaseRecord.dgii606ExpenseType,
  );
  const taxAmount =
    pickFiscalNumber(vendorBillProjection, [
      'taxAmount',
      'taxes',
      'tax',
      'totalItbis',
      'itbisAmount',
    ]) ??
    pickFiscalNumber(purchaseRecord, [
      'taxAmount',
      'taxes',
      'tax',
      'totalItbis',
      'itbisAmount',
    ]) ??
    0;
  const withholdingITBISAmount =
    pickFiscalNumber(vendorBillProjection, [
      'withholdingITBISAmount',
      'itbisWithheld',
    ]) ??
    pickFiscalNumber(purchaseRecord, [
      'withholdingITBISAmount',
      'itbisWithheld',
    ]) ??
    0;
  const withholdingISRAmount =
    pickFiscalNumber(vendorBillProjection, [
      'withholdingISRAmount',
      'isrWithheld',
    ]) ??
    pickFiscalNumber(purchaseRecord, [
      'withholdingISRAmount',
      'isrWithheld',
    ]) ??
    0;
  const fiscalDocumentRequired =
    Boolean(ncf || documentType || dgii606ExpenseType) ||
    taxAmount > THRESHOLD ||
    withholdingITBISAmount > THRESHOLD ||
    withholdingISRAmount > THRESHOLD;

  return {
    dgii606ExpenseType,
    dueAt: vendorBillProjection.dueAt ?? null,
    fiscalDocumentRequired,
    ncf,
    vendorReference: pickCleanString(
      vendorBillProjection.vendorReference,
      purchaseRecord.vendorReference,
      purchaseRecord.invoiceNumber,
      purchaseRecord.reference,
    ),
  };
};

const assertApprovalDocumentReadiness = ({ action, vendorBillProjection }) => {
  if (action !== 'approve') return;

  const readiness = resolveApprovalReadinessSnapshot(vendorBillProjection);
  const missingItems = [];

  if (!readiness.vendorReference) {
    missingItems.push('factura o referencia del suplidor');
  }
  if (!readiness.dueAt) {
    missingItems.push('fecha de vencimiento');
  }
  if (readiness.fiscalDocumentRequired && !readiness.ncf) {
    missingItems.push('NCF del comprobante fiscal');
  }
  if (readiness.fiscalDocumentRequired && !readiness.dgii606ExpenseType) {
    missingItems.push('clasificación DGII 606');
  }

  if (!missingItems.length) return;

  throw new HttpsError(
    'failed-precondition',
    `No se puede aprobar la CxP porque falta ${missingItems.join(', ')}. Complete los datos fiscales/documentales antes de aprobar.`,
  );
};

const buildDuplicateVendorBillRecordFromSnapshot = (snapshot) => ({
  id: snapshot.id,
  ...asRecord(snapshot.data()),
});

const assertVendorBillHasNoActiveDuplicateForApproval = async ({
  action,
  businessId,
  transaction,
  vendorBillId,
  vendorBillProjection,
}) => {
  if (action !== 'approve') return;

  const identity = resolveVendorBillDuplicateIdentity(vendorBillProjection);
  if (!identity.supplierId || !identity.hasDocumentKey) return;

  const duplicatesQuery = db
    .collection(`businesses/${businessId}/vendorBills`)
    .where('supplierId', '==', identity.supplierId);
  const duplicatesSnap = await transaction.get(duplicatesQuery);
  const duplicateDocs = Array.isArray(duplicatesSnap.docs)
    ? duplicatesSnap.docs
    : [];
  const duplicate = duplicateDocs
    .map(buildDuplicateVendorBillRecordFromSnapshot)
    .find((candidate) => {
      const candidateId = toCleanString(candidate.id);
      if (!candidateId || candidateId === vendorBillId) return false;

      return Boolean(
        resolveVendorBillDuplicateMatch(vendorBillProjection, candidate),
      );
    });

  if (!duplicate) return;

  const match = resolveVendorBillDuplicateMatch(vendorBillProjection, duplicate);

  throw new HttpsError(
    'failed-precondition',
    `No se puede aprobar la CxP porque coincide con la CxP ${duplicate.id} del mismo suplidor (${match.label}). Revise duplicados antes de aprobar.`,
  );
};

const buildActivePaymentHold = ({
  reason,
  evidenceUrls,
  evidenceNote,
  now,
  authUid,
}) => ({
  active: true,
  status: 'active',
  reason,
  evidenceUrls,
  evidenceNote: evidenceNote ?? null,
  createdAt: now,
  createdBy: authUid,
  placedAt: now,
  placedBy: authUid,
});

const buildReleasedPaymentHold = ({
  currentControl,
  reason,
  evidenceUrls,
  evidenceNote,
  now,
  authUid,
}) => ({
  ...asRecord(currentControl),
  active: false,
  status: 'released',
  releasedAt: now,
  releasedBy: authUid,
  releaseReason: reason,
  releaseEvidenceNote: evidenceNote ?? null,
  releaseEvidenceUrls: evidenceUrls,
});

const buildActiveDispute = ({
  reason,
  evidenceUrls,
  evidenceNote,
  now,
  authUid,
}) => ({
  active: true,
  status: 'open',
  reason,
  evidenceUrls,
  evidenceNote: evidenceNote ?? null,
  createdAt: now,
  createdBy: authUid,
  openedAt: now,
  openedBy: authUid,
});

const buildResolvedDispute = ({
  currentControl,
  reason,
  evidenceUrls,
  evidenceNote,
  now,
  authUid,
}) => ({
  ...asRecord(currentControl),
  active: false,
  status: 'resolved',
  resolvedAt: now,
  resolvedBy: authUid,
  resolutionReason: reason,
  resolutionEvidenceNote: evidenceNote ?? null,
  resolutionEvidenceUrls: evidenceUrls,
});

const buildVoidedControl = ({
  currentControl,
  reason,
  evidenceUrls,
  evidenceNote,
  now,
  authUid,
}) => ({
  ...asRecord(currentControl),
  active: false,
  status: 'voided',
  voidedAt: now,
  voidedBy: authUid,
  voidReason: reason,
  voidEvidenceNote: evidenceNote ?? null,
  voidEvidenceUrls: evidenceUrls,
});

const clearApprovalDecisionFields = (accountsPayable) => {
  accountsPayable.approvedAt = null;
  accountsPayable.approvedBy = null;
  accountsPayable.approvalReason = null;
  accountsPayable.approvalEvidenceNote = null;
  accountsPayable.approvalEvidenceUrls = [];
};

const clearRejectionDecisionFields = (accountsPayable) => {
  accountsPayable.rejectedAt = null;
  accountsPayable.rejectedBy = null;
  accountsPayable.rejectionReason = null;
  accountsPayable.rejectionEvidenceNote = null;
  accountsPayable.rejectionEvidenceUrls = [];
};

const clearApprovalRequestFields = (accountsPayable) => {
  accountsPayable.approvalRequestedAt = null;
  accountsPayable.approvalRequestedBy = null;
  accountsPayable.approvalRequestReason = null;
  accountsPayable.approvalRequestEvidenceNote = null;
  accountsPayable.approvalRequestEvidenceUrls = [];
};

const buildNextAccountsPayableControl = ({
  action,
  authUid,
  currentApprovalStatus,
  currentDispute,
  currentPaymentHold,
  currentAccountsPayable,
  evidenceUrls,
  evidenceNote,
  now,
  reason,
}) => {
  const nextAccountsPayable = {
    ...currentAccountsPayable,
    approvalStatus: currentApprovalStatus ?? 'approved',
    paymentHold: currentPaymentHold ?? null,
    dispute: currentDispute ?? null,
    updatedAt: now,
    updatedBy: authUid,
  };

  switch (action) {
    case 'approve':
      nextAccountsPayable.approvalStatus = 'approved';
      nextAccountsPayable.approvedAt = now;
      nextAccountsPayable.approvedBy = authUid;
      nextAccountsPayable.approvalReason = reason;
      nextAccountsPayable.approvalEvidenceNote = evidenceNote ?? null;
      nextAccountsPayable.approvalEvidenceUrls = evidenceUrls;
      clearRejectionDecisionFields(nextAccountsPayable);
      clearApprovalRequestFields(nextAccountsPayable);
      break;
    case 'request_approval':
      nextAccountsPayable.approvalStatus = 'pending_approval';
      nextAccountsPayable.approvalRequestedAt = now;
      nextAccountsPayable.approvalRequestedBy = authUid;
      nextAccountsPayable.approvalRequestReason = reason;
      nextAccountsPayable.approvalRequestEvidenceNote = evidenceNote ?? null;
      nextAccountsPayable.approvalRequestEvidenceUrls = evidenceUrls;
      clearApprovalDecisionFields(nextAccountsPayable);
      clearRejectionDecisionFields(nextAccountsPayable);
      break;
    case 'reject':
      nextAccountsPayable.approvalStatus = 'rejected';
      nextAccountsPayable.rejectedAt = now;
      nextAccountsPayable.rejectedBy = authUid;
      nextAccountsPayable.rejectionReason = reason;
      nextAccountsPayable.rejectionEvidenceNote = evidenceNote ?? null;
      nextAccountsPayable.rejectionEvidenceUrls = evidenceUrls;
      clearApprovalDecisionFields(nextAccountsPayable);
      clearApprovalRequestFields(nextAccountsPayable);
      break;
    case 'place_hold':
      nextAccountsPayable.paymentHold = buildActivePaymentHold({
        reason,
        evidenceUrls,
        evidenceNote,
        now,
        authUid,
      });
      break;
    case 'release_hold':
      nextAccountsPayable.paymentHold = buildReleasedPaymentHold({
        currentControl: currentPaymentHold,
        reason,
        evidenceUrls,
        evidenceNote,
        now,
        authUid,
      });
      break;
    case 'open_dispute':
      nextAccountsPayable.dispute = buildActiveDispute({
        reason,
        evidenceUrls,
        evidenceNote,
        now,
        authUid,
      });
      break;
    case 'resolve_dispute':
      nextAccountsPayable.dispute = buildResolvedDispute({
        currentControl: currentDispute,
        reason,
        evidenceUrls,
        evidenceNote,
        now,
        authUid,
      });
      break;
    case 'void':
      nextAccountsPayable.approvalStatus = 'voided';
      nextAccountsPayable.status = 'voided';
      nextAccountsPayable.voidedAt = now;
      nextAccountsPayable.voidedBy = authUid;
      nextAccountsPayable.voidReason = reason;
      nextAccountsPayable.voidEvidenceNote = evidenceNote ?? null;
      nextAccountsPayable.voidEvidenceUrls = evidenceUrls;
      if (isActiveControlRecord(currentPaymentHold)) {
        nextAccountsPayable.paymentHold = buildVoidedControl({
          currentControl: currentPaymentHold,
          reason,
          evidenceUrls,
          evidenceNote,
          now,
          authUid,
        });
      }
      if (isActiveControlRecord(currentDispute)) {
        nextAccountsPayable.dispute = buildVoidedControl({
          currentControl: currentDispute,
          reason,
          evidenceUrls,
          evidenceNote,
          now,
          authUid,
        });
      }
      break;
    default:
      throw new HttpsError(
        'invalid-argument',
        'Acción de control no soportada.',
      );
  }

  nextAccountsPayable.lastControlAction = action;
  nextAccountsPayable.lastControlReason = reason;
  nextAccountsPayable.lastControlAt = now;
  nextAccountsPayable.lastControlBy = authUid;

  return nextAccountsPayable;
};

const assertActionPreconditions = ({
  action,
  authUid,
  approvalRequesterId,
  currentApprovalStatus,
  currentDispute,
  currentPaymentHold,
  approvalActorId,
  purchaseCreatorId,
}) => {
  if (action === 'approve') {
    if (currentApprovalStatus !== 'pending_approval') {
      throw new HttpsError(
        'failed-precondition',
        'La cuenta por pagar debe estar pendiente de aprobación antes de aprobarse. Solicite un nuevo ciclo de aprobación para cambiar una decisión existente.',
      );
    }

    assertDifferentActor({
      authUid,
      actorId: purchaseCreatorId,
      message:
        'La aprobación de CxP debe realizarla un usuario distinto al que originó la compra.',
    });
  }

  if (action === 'void') {
    assertDifferentActor({
      authUid,
      actorId: purchaseCreatorId,
      message:
        'La anulación de CxP debe realizarla un usuario distinto al que originó la compra.',
    });
    assertDifferentActor({
      authUid,
      actorId: approvalActorId,
      message:
        'La anulación de CxP debe realizarla un usuario distinto al que aprobó la cuenta por pagar.',
    });
  }

  if (
    action === 'request_approval' &&
    currentApprovalStatus === 'pending_approval'
  ) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta por pagar ya está pendiente de aprobación.',
    );
  }

  if (
    ['approve', 'reject'].includes(action) &&
    currentApprovalStatus === 'pending_approval'
  ) {
    assertDifferentActor({
      authUid,
      actorId: approvalRequesterId,
      message:
        'La decisión de aprobación debe realizarla un usuario distinto al que envió la CxP a aprobación.',
    });
  }

  if (action === 'place_hold' && isActiveControlRecord(currentPaymentHold)) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta por pagar ya tiene un hold activo.',
    );
  }

  if (action === 'release_hold') {
    if (!isActiveControlRecord(currentPaymentHold)) {
      throw new HttpsError(
        'failed-precondition',
        'La cuenta por pagar no tiene un hold activo.',
      );
    }

    assertDifferentActor({
      authUid,
      actorId: resolveActorId(
        asRecord(currentPaymentHold).createdBy ??
          asRecord(currentPaymentHold).placedBy,
      ),
      message:
        'La liberación del hold debe realizarla un usuario distinto al que lo colocó.',
    });
  }

  if (action === 'open_dispute' && isActiveControlRecord(currentDispute)) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta por pagar ya tiene una disputa activa.',
    );
  }

  if (action === 'resolve_dispute') {
    if (!isActiveControlRecord(currentDispute)) {
      throw new HttpsError(
        'failed-precondition',
        'La cuenta por pagar no tiene una disputa activa.',
      );
    }

    assertDifferentActor({
      authUid,
      actorId: resolveActorId(
        asRecord(currentDispute).createdBy ?? asRecord(currentDispute).openedBy,
      ),
      message:
        'La resolución de la disputa debe realizarla un usuario distinto al que la abrió.',
    });
  }
};

const buildControlSnapshot = ({
  approvalStatus,
  paymentHold,
  dispute,
  status,
}) => ({
  approvalStatus: approvalStatus ?? null,
  paymentHold: paymentHold ?? null,
  dispute: dispute ?? null,
  status: status ?? null,
});

const hasPaymentActivity = (paymentState) => {
  const record = asRecord(paymentState);
  const paid = Number(record.paid ?? 0);
  const paymentCount = Number(record.paymentCount ?? 0);
  const lastPaymentId = toCleanString(record.lastPaymentId);
  const status = toCleanString(record.status)?.toLowerCase();

  return (
    paid > THRESHOLD ||
    paymentCount > 0 ||
    Boolean(lastPaymentId) ||
    ['paid', 'partial', 'partially_paid', 'overpaid'].includes(status)
  );
};

const resolveProjectionPaymentState = ({
  purchaseRecord,
  vendorBillRecord,
}) => {
  const purchasePaymentState = purchaseRecord.paymentState ?? null;
  const vendorBillPaymentState = vendorBillRecord.paymentState ?? null;

  if (hasPaymentActivity(purchasePaymentState)) return purchasePaymentState;
  if (hasPaymentActivity(vendorBillPaymentState)) return vendorBillPaymentState;

  return purchasePaymentState ?? vendorBillPaymentState ?? null;
};

const resolveVendorBillVoidSourceDate = (purchaseRecord, fallbackDate) =>
  purchaseRecord.accountingDate ??
  purchaseRecord.postedAt ??
  purchaseRecord.completedAt ??
  purchaseRecord.updatedAt ??
  purchaseRecord.createdAt ??
  fallbackDate;

const assertVendorBillVoidAccountingPeriodsOpen = async ({
  accountingRolloutEnabled,
  accountingSettings,
  businessId,
  purchaseRecord,
  transaction,
  voidedAt,
}) => {
  await assertAccountingPeriodOpenInTransaction({
    transaction,
    businessId,
    effectiveDate: resolveVendorBillVoidSourceDate(purchaseRecord, voidedAt),
    settings: accountingSettings,
    rolloutEnabled: accountingRolloutEnabled,
    operationLabel: 'anular esta CxP',
    createError: (message) => new HttpsError('failed-precondition', message),
  });

  await assertAccountingPeriodOpenInTransaction({
    transaction,
    businessId,
    effectiveDate: voidedAt,
    settings: accountingSettings,
    rolloutEnabled: accountingRolloutEnabled,
    operationLabel: 'registrar el reverso de esta CxP',
    createError: (message) => new HttpsError('failed-precondition', message),
  });
};

const isBlockingPaymentRunForVendorBillVoid = (paymentRunRecord) => {
  const status = toCleanString(paymentRunRecord.status)?.toLowerCase() ?? null;
  const executionStatus =
    toCleanString(paymentRunRecord.executionStatus)?.toLowerCase() ?? null;

  return (
    !TERMINAL_PAYMENT_RUN_STATUSES.has(status) &&
    !TERMINAL_PAYMENT_RUN_EXECUTION_STATUSES.has(executionStatus)
  );
};

const assertVendorBillNotInActivePaymentRun = async ({
  businessId,
  transaction,
  vendorBillId,
}) => {
  const paymentRunsQuery = db
    .collection(`businesses/${businessId}/accountsPayablePaymentRuns`)
    .where('eligibleVendorBillIds', 'array-contains', vendorBillId);
  const paymentRunsSnap = await transaction.get(paymentRunsQuery);
  const blockingRun = paymentRunsSnap.docs
    .map((doc) => ({
      id: doc.id,
      ...asRecord(doc.data()),
    }))
    .find(isBlockingPaymentRunForVendorBillVoid);

  if (!blockingRun) return;

  throw new HttpsError(
    'failed-precondition',
    `La cuenta por pagar está incluida en la corrida CxP ${blockingRun.id}. Cancele o regenere la corrida antes de anular la CxP.`,
  );
};

export const manageVendorBillControl = onCall(async (request) => {
  const authUid = await resolveCallableAuthUid(request);
  if (!authUid) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request?.data);
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(payload.businessID) ||
    null;
  const requestedVendorBillId = toCleanString(payload.vendorBillId);
  const requestedPurchaseId = toCleanString(payload.purchaseId);
  const action = normalizeAction(payload.action);
  const reason = validateControlReason(payload.reason);
  const evidenceUrls = normalizeEvidenceUrls(payload.evidenceUrls);
  const evidenceNote = normalizeEvidenceNote(payload.evidenceNote);

  if (!businessId) {
    throw new HttpsError('invalid-argument', 'businessId es requerido.');
  }
  if (!requestedVendorBillId && !requestedPurchaseId) {
    throw new HttpsError(
      'invalid-argument',
      'Debe indicar vendorBillId o purchaseId.',
    );
  }
  if (!action || !SUPPORTED_ACTIONS.has(action)) {
    throw new HttpsError('invalid-argument', 'Acción de control no soportada.');
  }
  validateControlEvidence({ action, evidenceNote, evidenceUrls });

  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: resolveAllowedRolesForControlAction(action),
  });
  await assertBusinessSubscriptionAccess({
    businessId,
    action: 'write',
    operation: LIMIT_OPERATION_KEYS.ACCOUNTS_PAYABLE_PAYMENT,
  });
  const accountingSettings =
    action === 'void'
      ? await getPilotAccountingSettingsForBusiness(businessId)
      : null;
  const accountingRolloutEnabled =
    action === 'void'
      ? isAccountingRolloutEnabledForBusiness(businessId, accountingSettings)
      : false;

  const resolvedVendorBillId =
    requestedVendorBillId ??
    buildCanonicalVendorBillIdFromPurchaseId(requestedPurchaseId);
  if (!resolvedVendorBillId) {
    throw new HttpsError(
      'failed-precondition',
      'No fue posible resolver la cuenta por pagar.',
    );
  }

  const vendorBillRef = db.doc(
    `businesses/${businessId}/vendorBills/${resolvedVendorBillId}`,
  );
  const eventId = nanoid();
  const eventRef = db.doc(
    `businesses/${businessId}/vendorBillControlEvents/${eventId}`,
  );

  let result = null;

  await db.runTransaction(async (transaction) => {
    const vendorBillSnap = await transaction.get(vendorBillRef);
    const vendorBillRecord = vendorBillSnap.exists
      ? {
          id: vendorBillSnap.id,
          ...asRecord(vendorBillSnap.data()),
        }
      : {};
    if (requestedVendorBillId && !vendorBillSnap.exists) {
      throw new HttpsError('not-found', 'La cuenta por pagar no existe.');
    }

    const purchaseIdFromVendorBill = vendorBillSnap.exists
      ? resolvePurchaseIdFromVendorBillRecord(
          vendorBillRecord,
          resolvedVendorBillId,
        )
      : null;
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
      throw new HttpsError('not-found', 'La compra asociada no existe.');
    }

    const purchaseRecord = asRecord(purchaseSnap.data());
    const currentAccountsPayable =
      resolvePurchaseAccountsPayable(purchaseRecord);
    const currentPaymentHold = resolveCurrentPaymentHold({
      vendorBillRecord,
      accountsPayable: currentAccountsPayable,
    });
    const currentDispute = resolveCurrentDispute({
      vendorBillRecord,
      accountsPayable: currentAccountsPayable,
    });
    const currentApprovalStatus = resolveCurrentApprovalStatus({
      vendorBillRecord,
      accountsPayable: currentAccountsPayable,
    });
    const projectionPaymentState = resolveProjectionPaymentState({
      purchaseRecord,
      vendorBillRecord,
    });

    const currentProjection = buildVendorBillProjection({
      purchaseId,
      purchaseRecord,
      paymentState: projectionPaymentState,
      paymentTerms:
        purchaseRecord.paymentTerms ?? vendorBillRecord.paymentTerms ?? null,
      vendorBillId: resolvedVendorBillId,
    });
    if (!currentProjection) {
      throw new HttpsError(
        'failed-precondition',
        'La cuenta por pagar todavía no está materializada para control.',
      );
    }

    assertBillCanBeControlled({
      action,
      vendorBillProjection: currentProjection,
    });
    assertApprovalDocumentReadiness({
      action,
      vendorBillProjection: currentProjection,
    });
    await assertVendorBillHasNoActiveDuplicateForApproval({
      action,
      businessId,
      transaction,
      vendorBillId: resolvedVendorBillId,
      vendorBillProjection: currentProjection,
    });
    assertActionPreconditions({
      action,
      authUid,
      approvalRequesterId: resolveApprovalRequesterId({
        accountsPayable: currentAccountsPayable,
        vendorBillRecord,
      }),
      approvalActorId: resolveCurrentApprovalActorId({
        accountsPayable: currentAccountsPayable,
        vendorBillRecord,
      }),
      currentApprovalStatus,
      currentDispute,
      currentPaymentHold,
      purchaseCreatorId: resolvePurchaseCreatorId({
        vendorBillRecord,
        purchaseRecord,
      }),
    });

    const now = Timestamp.now();
    if (action === 'void') {
      await assertVendorBillNotInActivePaymentRun({
        businessId,
        transaction,
        vendorBillId: resolvedVendorBillId,
      });
      await assertVendorBillVoidAccountingPeriodsOpen({
        accountingRolloutEnabled,
        accountingSettings,
        businessId,
        purchaseRecord,
        transaction,
        voidedAt: now,
      });
    }

    const nextAccountsPayable = buildNextAccountsPayableControl({
      action,
      authUid,
      currentApprovalStatus,
      currentDispute,
      currentPaymentHold,
      currentAccountsPayable,
      evidenceUrls,
      evidenceNote,
      now,
      reason,
    });
    const nextPurchaseRecord = {
      ...purchaseRecord,
      accountsPayable: nextAccountsPayable,
    };
    const nextProjection = buildVendorBillProjection({
      purchaseId,
      purchaseRecord: nextPurchaseRecord,
      paymentState: projectionPaymentState,
      paymentTerms:
        purchaseRecord.paymentTerms ?? vendorBillRecord.paymentTerms ?? null,
      vendorBillId: resolvedVendorBillId,
    });

    if (!nextProjection) {
      throw new HttpsError(
        'failed-precondition',
        'La cuenta por pagar no puede actualizarse con este control.',
      );
    }

    const previousControl = buildControlSnapshot({
      approvalStatus: currentApprovalStatus,
      paymentHold: currentPaymentHold,
      dispute: currentDispute,
      status: currentProjection.status,
    });
    const nextControl = buildControlSnapshot({
      approvalStatus: nextProjection.approvalStatus,
      paymentHold: nextProjection.paymentHold,
      dispute: nextProjection.dispute,
      status: nextProjection.status,
    });
    const controlEvent = {
      id: eventId,
      businessId,
      vendorBillId: resolvedVendorBillId,
      purchaseId,
      action,
      reason,
      evidenceUrls,
      evidenceNote: evidenceNote ?? null,
      previousControl,
      nextControl,
      createdAt: now,
      createdBy: authUid,
      sourceType: 'vendorBill',
      sourceId: resolvedVendorBillId,
    };

    transaction.set(
      purchaseRef,
      {
        accountsPayable: buildPurchaseAccountsPayableMirror({
          ...nextAccountsPayable,
          lastControlEventId: eventId,
        }),
        updatedAt: now,
        updatedBy: authUid,
      },
      { merge: true },
    );
    transaction.set(
      vendorBillRef,
      {
        ...nextProjection,
        lastControlEventId: eventId,
        updatedAt: now,
        updatedBy: authUid,
      },
      { merge: true },
    );
    transaction.set(eventRef, controlEvent);

    result = {
      ok: true,
      action,
      businessId,
      vendorBillId: resolvedVendorBillId,
      purchaseId,
      controlEventId: eventId,
      status: nextProjection.status,
      approvalStatus: nextProjection.approvalStatus,
      paymentHold: nextProjection.paymentHold ?? null,
      dispute: nextProjection.dispute ?? null,
      control: nextControl,
    };
  });

  return sanitizeForResponse(result);
});
