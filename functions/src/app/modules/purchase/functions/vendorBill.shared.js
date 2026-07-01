import {
  THRESHOLD,
  asRecord,
  resolvePurchaseSupplierId,
  toCleanString,
  roundToTwoDecimals,
} from './payablePayments.shared.js';

export const buildCanonicalVendorBillIdFromPurchaseId = (purchaseId) => {
  const normalizedPurchaseId = toCleanString(purchaseId);
  return normalizedPurchaseId ? `purchase:${normalizedPurchaseId}` : null;
};

export const resolvePurchaseIdFromVendorBillRecord = (
  vendorBillRecord,
  vendorBillId = null,
) => {
  const sourceDocumentType = toCleanString(
    vendorBillRecord?.sourceDocumentType,
  );
  const sourceDocumentId = toCleanString(vendorBillRecord?.sourceDocumentId);
  if (sourceDocumentType === 'purchase' && sourceDocumentId) {
    return sourceDocumentId;
  }

  const normalizedVendorBillId = toCleanString(vendorBillId);
  if (normalizedVendorBillId?.startsWith('purchase:')) {
    const derivedPurchaseId = normalizedVendorBillId.slice('purchase:'.length);
    return toCleanString(derivedPurchaseId);
  }

  return null;
};

const PAYMENT_BLOCKING_VENDOR_BILL_STATUSES = new Set([
  'blocked',
  'disputed',
  'held',
  'in_dispute',
  'on_hold',
  'payment_hold',
]);

const PAYMENT_CLOSED_VENDOR_BILL_STATUSES = new Set(['paid', 'voided']);

const PAYMENT_BLOCKING_APPROVAL_STATUSES = new Set([
  'draft',
  'pending',
  'pending_approval',
  'rejected',
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

const PAYMENT_CONTROL_STATUS_MESSAGES = {
  closed: 'La cuenta por pagar está cerrada. No admite nuevos pagos.',
  disputed:
    'La cuenta por pagar está en disputa. Resuelva la disputa antes de registrar pagos.',
  on_hold:
    'La cuenta por pagar está retenida. Libérela antes de registrar pagos.',
  pending_approval:
    'La cuenta por pagar no está aprobada para pago. Complete la aprobación antes de registrar pagos.',
};

const isActiveControlRecord = (value) => {
  const record = asRecord(value);
  if (Object.keys(record).length === 0) {
    return value === true;
  }

  if (record.active === true || record.isActive === true) {
    return true;
  }
  if (record.active === false || record.isActive === false) {
    return false;
  }

  const status = toCleanString(
    record.status ?? record.state ?? record.approvalStatus,
  )?.toLowerCase();
  if (!status) {
    return false;
  }

  if (RELEASED_CONTROL_STATUSES.has(status)) {
    return false;
  }

  return ACTIVE_CONTROL_STATUSES.has(status);
};

const resolvePaymentControlBlock = (paymentControlValue) => {
  const paymentControl = asRecord(paymentControlValue);
  const status = toCleanString(paymentControl.status)?.toLowerCase() ?? null;
  const canRegisterPayment = paymentControl.canRegisterPayment;

  if (!status && canRegisterPayment !== false) {
    return { blocked: false };
  }

  if (status === 'payable' && canRegisterPayment !== false) {
    return { blocked: false };
  }

  const normalizedStatus = status ?? 'blocked';
  return {
    blocked: true,
    code: 'vendor-bill-payment-control',
    message:
      PAYMENT_CONTROL_STATUS_MESSAGES[normalizedStatus] ??
      'La cuenta por pagar no está habilitada para registrar pagos.',
    status: normalizedStatus,
  };
};

export const resolveVendorBillPaymentBlock = (
  vendorBillRecord,
  purchaseRecord = null,
) => {
  const vendorBill = asRecord(vendorBillRecord);
  const purchase = asRecord(purchaseRecord);
  const purchaseAccountsPayable = asRecord(
    purchase.accountsPayable ?? purchase.payables ?? purchase.vendorBill,
  );

  const status = toCleanString(vendorBill.status)?.toLowerCase();
  if (PAYMENT_CLOSED_VENDOR_BILL_STATUSES.has(status)) {
    return {
      blocked: true,
      code: 'vendor-bill-closed',
      message: 'La cuenta por pagar está cerrada. No admite nuevos pagos.',
      status,
    };
  }

  if (PAYMENT_BLOCKING_VENDOR_BILL_STATUSES.has(status)) {
    return {
      blocked: true,
      code: 'vendor-bill-status',
      message:
        'La cuenta por pagar está en hold o disputa. Libérela antes de registrar pagos.',
      status,
    };
  }

  const approvalStatus = toCleanString(
    vendorBill.approvalStatus ?? purchaseAccountsPayable.approvalStatus,
  )?.toLowerCase();
  if (PAYMENT_BLOCKING_APPROVAL_STATUSES.has(approvalStatus)) {
    return {
      blocked: true,
      code: 'vendor-bill-approval',
      message:
        'La cuenta por pagar no está aprobada para pago. Complete la aprobación antes de registrar pagos.',
      status: approvalStatus,
    };
  }

  const paymentControlBlock = resolvePaymentControlBlock(
    vendorBill.paymentControl,
  );
  if (paymentControlBlock.blocked) {
    return paymentControlBlock;
  }

  const controlEntries = [
    ['payment-hold', vendorBill.paymentHold],
    ['hold', vendorBill.hold],
    ['dispute', vendorBill.dispute],
    ['payment-hold', purchaseAccountsPayable.paymentHold],
    ['hold', purchaseAccountsPayable.hold],
    ['dispute', purchaseAccountsPayable.dispute],
  ];

  const activeControl = controlEntries.find(([, value]) =>
    isActiveControlRecord(value),
  );
  if (activeControl) {
    return {
      blocked: true,
      code: activeControl[0],
      message:
        'La cuenta por pagar está retenida o en disputa. Libérela antes de registrar pagos.',
      status:
        toCleanString(
          asRecord(activeControl[1]).status ?? asRecord(activeControl[1]).state,
        )?.toLowerCase() ?? null,
    };
  }

  return { blocked: false };
};

const resolvePurchaseWorkflowStatus = (purchaseRecord) =>
  toCleanString(
    purchaseRecord.workflowStatus ?? purchaseRecord.status,
  )?.toLowerCase() ?? null;

export const isPurchaseReceiptInventoryPending = (purchaseRecord) => {
  const receiptInventoryState = asRecord(purchaseRecord.receiptInventoryState);
  const status = toCleanString(receiptInventoryState.status)?.toLowerCase();

  return (
    status === 'pending' ||
    status === 'pending_inventory' ||
    status === 'applying'
  );
};

const hasFinancialAccountsPayableActivity = (purchaseRecord) => {
  const paymentState = asRecord(purchaseRecord.paymentState);
  const paid = Number(paymentState.paid ?? 0);
  const paymentCount = Number(paymentState.paymentCount ?? 0);
  const hasLastPaymentId = Boolean(toCleanString(paymentState.lastPaymentId));
  const normalizedStatus = toCleanString(paymentState.status)?.toLowerCase();

  return (
    paid > THRESHOLD ||
    paymentCount > 0 ||
    hasLastPaymentId ||
    normalizedStatus === 'partial' ||
    normalizedStatus === 'paid' ||
    normalizedStatus === 'overpaid' ||
    paymentState.migratedFromLegacy === true
  );
};

export const shouldMaterializeVendorBillFromPurchaseRecord = (
  purchaseRecord,
) => {
  if (isPurchaseReceiptInventoryPending(purchaseRecord)) {
    return false;
  }

  const workflowStatus = resolvePurchaseWorkflowStatus(purchaseRecord);
  if (workflowStatus === 'canceled' || workflowStatus === 'cancelled') {
    return (
      Boolean(purchaseRecord.completedAt) ||
      hasFinancialAccountsPayableActivity(purchaseRecord)
    );
  }

  if (workflowStatus === 'completed') {
    return true;
  }

  return hasFinancialAccountsPayableActivity(purchaseRecord);
};

export const resolvePurchaseDocumentNature = (purchaseRecord) => {
  const explicitNature = toCleanString(
    purchaseRecord.financialType ??
      purchaseRecord.purchaseNature ??
      purchaseRecord.accountingCategory ??
      purchaseRecord.purchaseCategory,
  )?.toLowerCase();

  switch (explicitNature) {
    case 'asset':
    case 'fixed_asset':
    case 'fixed-asset':
    case 'capex':
      return 'asset';
    case 'expense':
    case 'operating_expense':
    case 'operating-expense':
      return 'expense';
    case 'service':
      return 'service';
    case 'inventory':
    case 'stock':
      return 'inventory';
    default:
      return Array.isArray(purchaseRecord.replenishments) &&
        purchaseRecord.replenishments.length
        ? 'inventory'
        : 'expense';
  }
};

const pickCleanString = (...values) => {
  for (const value of values) {
    const cleaned = toCleanString(value);
    if (cleaned) return cleaned;
  }

  return null;
};

const normalizeDuplicateDocumentToken = (value) =>
  pickCleanString(value)?.toUpperCase().replace(/[\s-]+/g, '') ?? null;

const resolveVendorBillDuplicateTotal = (vendorBillRecord) => {
  const vendorBill = asRecord(vendorBillRecord);
  const totals = asRecord(vendorBill.totals);
  const paymentState = asRecord(vendorBill.paymentState);
  const monetary = asRecord(vendorBill.monetary);
  const documentTotals = asRecord(monetary.documentTotals);
  const purchase = asRecord(vendorBill.purchase);
  const purchaseMonetary = asRecord(purchase.monetary);
  const purchaseDocumentTotals = asRecord(purchaseMonetary.documentTotals);
  const purchaseTotals = asRecord(purchase.totals ?? purchase.totalPurchase);

  return roundToTwoDecimals(
    totals.total ??
      paymentState.total ??
      documentTotals.total ??
      documentTotals.gross ??
      vendorBill.totalAmount ??
      vendorBill.amount ??
      purchaseDocumentTotals.total ??
      purchaseDocumentTotals.gross ??
      purchaseTotals.total ??
      purchaseTotals.gross ??
      purchase.totalAmount ??
      purchase.total ??
      purchase.amount,
  );
};

export const resolveVendorBillDuplicateIdentity = (vendorBillRecord) => {
  const vendorBill = asRecord(vendorBillRecord);
  const purchase = asRecord(vendorBill.purchase);
  const vendorBillTaxReceipt = asRecord(vendorBill.taxReceipt);
  const purchaseTaxReceipt = asRecord(purchase.taxReceipt);
  const supplierId =
    toCleanString(vendorBill.supplierId) ??
    resolvePurchaseSupplierId(purchase) ??
    null;
  const ncf = normalizeDuplicateDocumentToken(
    vendorBillTaxReceipt.ncf ??
      vendorBill.ncf ??
      vendorBill.NCF ??
      purchaseTaxReceipt.ncf ??
      purchase.ncf ??
      purchase.NCF ??
      purchase.proofOfPurchase,
  );
  const vendorReference = normalizeDuplicateDocumentToken(
    vendorBill.vendorReference ??
      purchase.vendorReference ??
      purchase.invoiceNumber ??
      purchase.reference,
  );
  const totalAmount = resolveVendorBillDuplicateTotal(vendorBill);

  return {
    supplierId,
    ncf,
    vendorReference,
    totalAmount,
    hasDocumentKey: Boolean(ncf || vendorReference),
  };
};

const INACTIVE_DUPLICATE_VENDOR_BILL_STATUSES = new Set([
  'canceled',
  'cancelled',
  'rejected',
  'void',
  'voided',
]);

export const isInactiveVendorBillForDuplicateCheck = (vendorBillRecord) => {
  const vendorBill = asRecord(vendorBillRecord);
  const status = toCleanString(vendorBill.status)?.toLowerCase() ?? null;
  const approvalStatus =
    toCleanString(vendorBill.approvalStatus)?.toLowerCase() ?? null;

  return (
    INACTIVE_DUPLICATE_VENDOR_BILL_STATUSES.has(status) ||
    INACTIVE_DUPLICATE_VENDOR_BILL_STATUSES.has(approvalStatus)
  );
};

export const resolveVendorBillDuplicateMatch = (leftRecord, rightRecord) => {
  if (
    isInactiveVendorBillForDuplicateCheck(leftRecord) ||
    isInactiveVendorBillForDuplicateCheck(rightRecord)
  ) {
    return null;
  }

  const left = resolveVendorBillDuplicateIdentity(leftRecord);
  const right = resolveVendorBillDuplicateIdentity(rightRecord);
  if (!left.supplierId || left.supplierId !== right.supplierId) return null;

  if (left.ncf && right.ncf && left.ncf === right.ncf) {
    return {
      code: 'ncf',
      label: `NCF ${left.ncf}`,
    };
  }

  if (
    left.vendorReference &&
    right.vendorReference &&
    left.vendorReference === right.vendorReference &&
    left.totalAmount > THRESHOLD &&
    Math.abs(left.totalAmount - right.totalAmount) <= THRESHOLD
  ) {
    return {
      code: 'vendor_reference_amount',
      label: `factura ${left.vendorReference} por ${left.totalAmount.toFixed(
        2,
      )}`,
    };
  }

  return null;
};

const hasPurchasePaymentEvidence = (purchaseRecord) => {
  const payment = asRecord(purchaseRecord.payment);
  const paymentState = asRecord(purchaseRecord.paymentState);
  const rawPaymentMethods = Array.isArray(purchaseRecord.paymentMethods)
    ? purchaseRecord.paymentMethods
    : Array.isArray(purchaseRecord.paymentMethod)
      ? purchaseRecord.paymentMethod
      : [];
  const hasPaymentMethod = rawPaymentMethods.some((entry) => {
    const record = asRecord(entry);
    const method = toCleanString(record.method ?? record.code ?? entry);
    const amount = roundToTwoDecimals(record.amount ?? record.value);
    return Boolean(method && amount > THRESHOLD && record.status !== false);
  });

  return (
    hasPaymentMethod ||
    roundToTwoDecimals(paymentState.paid) > THRESHOLD ||
    Number(paymentState.paymentCount ?? 0) > 0 ||
    Boolean(toCleanString(paymentState.lastPaymentId)) ||
    Boolean(toCleanString(payment.method)) ||
    Boolean(toCleanString(payment.sourceType))
  );
};

export const resolvePurchaseSettlementTiming = (purchaseRecord) => {
  const paymentTerms = asRecord(purchaseRecord.paymentTerms);
  const condition = toCleanString(
    paymentTerms.condition ?? purchaseRecord.condition,
  )?.toLowerCase();
  const immediateByTerms =
    paymentTerms.isImmediate === true || condition === 'cash';

  if (immediateByTerms && hasPurchasePaymentEvidence(purchaseRecord)) {
    return 'immediate';
  }

  return 'deferred';
};

export const resolveVendorBillStatus = ({ purchaseRecord, paymentState }) => {
  const workflowStatus = resolvePurchaseWorkflowStatus(purchaseRecord);
  if (workflowStatus === 'canceled' || workflowStatus === 'cancelled') {
    return 'voided';
  }
  if (workflowStatus !== 'completed') {
    return 'draft';
  }

  const balance = roundToTwoDecimals(paymentState?.balance);
  const paid = roundToTwoDecimals(paymentState?.paid);

  if (balance <= THRESHOLD) {
    return 'paid';
  }
  if (paid > THRESHOLD) {
    return 'partially_paid';
  }
  return 'approved';
};

export const resolveVendorBillApprovalStatus = (vendorBillStatus) => {
  if (vendorBillStatus === 'draft') return 'draft';
  if (vendorBillStatus === 'voided') return 'voided';
  return 'approved';
};

const resolvePurchaseAccountsPayableControls = (purchaseRecord) =>
  asRecord(
    purchaseRecord.accountsPayable ??
      purchaseRecord.payables ??
      purchaseRecord.vendorBill,
  );

const VOIDED_CONTROL_STATUSES = new Set([
  'cancelled',
  'canceled',
  'void',
  'voided',
]);

const isVoidedAccountsPayableControl = (accountsPayable) => {
  const status = toCleanString(
    accountsPayable.status ??
      accountsPayable.state ??
      accountsPayable.approvalStatus,
  )?.toLowerCase();
  return (
    VOIDED_CONTROL_STATUSES.has(status) ||
    Boolean(accountsPayable.voidedAt) ||
    Boolean(toCleanString(accountsPayable.voidedBy))
  );
};

const resolveVendorBillControlledStatus = ({
  baseStatus,
  isVoided,
  paymentHold,
  dispute,
}) => {
  if (isVoided) return 'voided';
  if (isActiveControlRecord(dispute)) return 'disputed';
  if (isActiveControlRecord(paymentHold)) return 'on_hold';
  return baseStatus;
};

const resolveControlReason = (value) => {
  const record = asRecord(value);
  return (
    toCleanString(
      record.reason ?? record.note ?? record.comment ?? record.description,
    ) ?? null
  );
};

const normalizeEvidenceUrls = (value) =>
  (Array.isArray(value) ? value : [])
    .map((entry) => toCleanString(entry))
    .filter(Boolean);

const CONTROL_DETAIL_FIELDS = [
  'reason',
  'note',
  'comment',
  'description',
  'evidenceNote',
  'evidenceUrls',
  'releaseReason',
  'releaseEvidenceNote',
  'releaseEvidenceUrls',
  'resolutionReason',
  'resolutionEvidenceNote',
  'resolutionEvidenceUrls',
  'voidReason',
  'voidEvidenceNote',
  'voidEvidenceUrls',
];

const TOP_LEVEL_CONTROL_DETAIL_FIELDS = [
  'approvalReason',
  'approvalEvidenceNote',
  'approvalEvidenceUrls',
  'approvalRequestReason',
  'approvalRequestEvidenceNote',
  'approvalRequestEvidenceUrls',
  'rejectionReason',
  'rejectionEvidenceNote',
  'rejectionEvidenceUrls',
  'voidReason',
  'voidEvidenceNote',
  'voidEvidenceUrls',
];

const hasMeaningfulValue = (value) =>
  Array.isArray(value)
    ? value.length > 0
    : value !== null && value !== undefined && value !== '';

const preserveFieldFromExisting = ({ existingRecord, field, nextRecord }) => {
  if (hasMeaningfulValue(nextRecord[field])) return;
  if (!hasMeaningfulValue(existingRecord[field])) return;

  nextRecord[field] = existingRecord[field];
};

const preserveControlStateDetails = (nextControl, existingControl) => {
  if (nextControl == null) return nextControl;

  const nextRecord = { ...asRecord(nextControl) };
  const existingRecord = asRecord(existingControl);

  CONTROL_DETAIL_FIELDS.forEach((field) =>
    preserveFieldFromExisting({ existingRecord, field, nextRecord }),
  );

  return nextRecord;
};

const resolvePreservedControlReason = (control) => {
  const record = asRecord(control);
  return (
    toCleanString(
      record.reason ?? record.note ?? record.comment ?? record.description,
    ) ?? null
  );
};

export const preserveVendorBillControlDetails = ({
  existingVendorBill,
  vendorBillProjection,
}) => {
  if (!vendorBillProjection) return vendorBillProjection;

  const existingRecord = asRecord(existingVendorBill);
  if (!Object.keys(existingRecord).length) return vendorBillProjection;

  const nextProjection = { ...vendorBillProjection };

  TOP_LEVEL_CONTROL_DETAIL_FIELDS.forEach((field) =>
    preserveFieldFromExisting({
      existingRecord,
      field,
      nextRecord: nextProjection,
    }),
  );

  nextProjection.paymentHold = preserveControlStateDetails(
    nextProjection.paymentHold,
    existingRecord.paymentHold,
  );
  nextProjection.dispute = preserveControlStateDetails(
    nextProjection.dispute,
    existingRecord.dispute,
  );
  if (
    nextProjection.paymentControl?.status === 'on_hold' &&
    !hasMeaningfulValue(nextProjection.paymentControl.reason)
  ) {
    nextProjection.paymentControl = {
      ...nextProjection.paymentControl,
      reason: resolvePreservedControlReason(nextProjection.paymentHold),
    };
  }
  if (
    nextProjection.paymentControl?.status === 'disputed' &&
    !hasMeaningfulValue(nextProjection.paymentControl.reason)
  ) {
    nextProjection.paymentControl = {
      ...nextProjection.paymentControl,
      reason: resolvePreservedControlReason(nextProjection.dispute),
    };
  }

  return nextProjection;
};

const resolveMirrorActorId = (value) => {
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

const buildSanitizedPurchaseControlState = (controlState) => {
  const control = asRecord(controlState);
  if (!Object.keys(control).length) return null;

  return {
    active: control.active ?? control.isActive ?? null,
    status:
      toCleanString(control.status ?? control.state ?? control.approvalStatus) ??
      null,
    createdAt: control.createdAt ?? null,
    createdBy: resolveMirrorActorId(control.createdBy) ?? null,
    placedAt: control.placedAt ?? null,
    placedBy: resolveMirrorActorId(control.placedBy) ?? null,
    openedAt: control.openedAt ?? null,
    openedBy: resolveMirrorActorId(control.openedBy) ?? null,
    releasedAt: control.releasedAt ?? null,
    releasedBy: resolveMirrorActorId(control.releasedBy) ?? null,
    resolvedAt: control.resolvedAt ?? null,
    resolvedBy: resolveMirrorActorId(control.resolvedBy) ?? null,
    voidedAt: control.voidedAt ?? null,
    voidedBy: resolveMirrorActorId(control.voidedBy) ?? null,
    reason: null,
    note: null,
    comment: null,
    description: null,
    evidenceNote: null,
    evidenceUrls: [],
    releaseReason: null,
    releaseEvidenceNote: null,
    releaseEvidenceUrls: [],
    resolutionReason: null,
    resolutionEvidenceNote: null,
    resolutionEvidenceUrls: [],
    voidReason: null,
    voidEvidenceNote: null,
    voidEvidenceUrls: [],
  };
};

export const buildPurchaseAccountsPayableMirror = (accountsPayable) => {
  const control = asRecord(accountsPayable);

  return {
    approvalStatus: toCleanString(control.approvalStatus) ?? null,
    status: toCleanString(control.status) ?? null,
    approvedAt: control.approvedAt ?? null,
    approvedBy: resolveMirrorActorId(control.approvedBy) ?? null,
    approvalReason: null,
    approvalEvidenceNote: null,
    approvalEvidenceUrls: [],
    approvalRequestedAt: control.approvalRequestedAt ?? null,
    approvalRequestedBy: resolveMirrorActorId(control.approvalRequestedBy) ?? null,
    approvalRequestReason: null,
    approvalRequestEvidenceNote: null,
    approvalRequestEvidenceUrls: [],
    rejectedAt: control.rejectedAt ?? null,
    rejectedBy: resolveMirrorActorId(control.rejectedBy) ?? null,
    rejectionReason: null,
    rejectionEvidenceNote: null,
    rejectionEvidenceUrls: [],
    voidedAt: control.voidedAt ?? null,
    voidedBy: resolveMirrorActorId(control.voidedBy) ?? null,
    voidReason: null,
    voidEvidenceNote: null,
    voidEvidenceUrls: [],
    paymentHold: buildSanitizedPurchaseControlState(control.paymentHold),
    dispute: buildSanitizedPurchaseControlState(control.dispute),
    updatedAt: control.updatedAt ?? null,
    updatedBy: resolveMirrorActorId(control.updatedBy) ?? null,
    lastControlAction: toCleanString(control.lastControlAction) ?? null,
    lastControlReason: null,
    lastControlAt: control.lastControlAt ?? null,
    lastControlBy: resolveMirrorActorId(control.lastControlBy) ?? null,
    lastControlEventId: toCleanString(control.lastControlEventId) ?? null,
  };
};

const hasSensitiveControlDetail = (controlState) => {
  const control = asRecord(controlState);
  return CONTROL_DETAIL_FIELDS.some((field) =>
    hasMeaningfulValue(control[field]),
  );
};

export const hasSensitivePurchaseAccountsPayableDetails = (accountsPayable) => {
  const control = asRecord(accountsPayable);
  if (!Object.keys(control).length) return false;

  return (
    TOP_LEVEL_CONTROL_DETAIL_FIELDS.some((field) =>
      hasMeaningfulValue(control[field]),
    ) ||
    hasSensitiveControlDetail(control.paymentHold) ||
    hasSensitiveControlDetail(control.hold) ||
    hasSensitiveControlDetail(control.dispute) ||
    hasMeaningfulValue(control.lastControlReason)
  );
};

export const resolveVendorBillPaymentControlSnapshot = ({
  approvalStatus,
  dispute,
  paymentHold,
  status,
}) => {
  if (status === 'paid' || status === 'voided') {
    return {
      canRegisterPayment: false,
      label: 'Cerrada',
      reason: null,
      status: 'closed',
      tone: 'neutral',
    };
  }

  if (status === 'disputed' || isActiveControlRecord(dispute)) {
    return {
      canRegisterPayment: false,
      label: 'En disputa',
      reason: resolveControlReason(dispute),
      status: 'disputed',
      tone: 'danger',
    };
  }

  if (status === 'on_hold' || isActiveControlRecord(paymentHold)) {
    return {
      canRegisterPayment: false,
      label: 'Retenida',
      reason: resolveControlReason(paymentHold),
      status: 'on_hold',
      tone: 'warning',
    };
  }

  if (
    ['draft', 'pending', 'pending_approval', 'rejected'].includes(
      toCleanString(approvalStatus)?.toLowerCase(),
    )
  ) {
    return {
      canRegisterPayment: false,
      label: 'No aprobada',
      reason: null,
      status: 'pending_approval',
      tone: 'neutral',
    };
  }

  return {
    canRegisterPayment: true,
    label: 'Aprobada',
    reason: null,
    status: 'payable',
    tone: 'success',
  };
};

const resolveVendorBillSupplierName = (purchaseRecord) => {
  const providerRecord = asRecord(purchaseRecord.provider);
  return (
    toCleanString(providerRecord.name) ??
    toCleanString(purchaseRecord.providerName) ??
    null
  );
};

const resolveVendorBillDueAt = ({
  purchaseRecord,
  paymentTerms,
  paymentState,
}) =>
  paymentState?.nextPaymentAt ??
  paymentTerms?.nextPaymentAt ??
  paymentTerms?.expectedPaymentAt ??
  purchaseRecord.paymentAt ??
  asRecord(purchaseRecord.dates).paymentDate ??
  null;

export const buildVendorBillProjection = ({
  purchaseId,
  purchaseRecord,
  paymentState,
  paymentTerms,
  vendorBillId = null,
}) => {
  const resolvedPurchaseId = toCleanString(purchaseId);
  if (!resolvedPurchaseId) {
    return null;
  }

  const projectionPurchaseRecord = {
    ...purchaseRecord,
    paymentState: paymentState ?? purchaseRecord.paymentState ?? null,
  };

  if (
    !shouldMaterializeVendorBillFromPurchaseRecord(projectionPurchaseRecord)
  ) {
    return null;
  }

  const id =
    toCleanString(vendorBillId) ??
    buildCanonicalVendorBillIdFromPurchaseId(resolvedPurchaseId);
  const baseStatus = resolveVendorBillStatus({ purchaseRecord, paymentState });
  const purchaseAccountsPayable = resolvePurchaseAccountsPayableControls(
    projectionPurchaseRecord,
  );
  const isVoided = isVoidedAccountsPayableControl(purchaseAccountsPayable);
  const paymentHold =
    purchaseAccountsPayable.paymentHold ?? purchaseAccountsPayable.hold ?? null;
  const dispute = purchaseAccountsPayable.dispute ?? null;
  const status = resolveVendorBillControlledStatus({
    baseStatus,
    isVoided,
    paymentHold,
    dispute,
  });
  const approvalStatus =
    (isVoided ? 'voided' : null) ??
    toCleanString(purchaseAccountsPayable.approvalStatus)?.toLowerCase() ??
    resolveVendorBillApprovalStatus(baseStatus);
  const total = roundToTwoDecimals(paymentState?.total);
  const paid = roundToTwoDecimals(paymentState?.paid);
  const balance = roundToTwoDecimals(paymentState?.balance);
  const documentNature = resolvePurchaseDocumentNature(
    projectionPurchaseRecord,
  );
  const settlementTiming = resolvePurchaseSettlementTiming(
    projectionPurchaseRecord,
  );
  const issueAt =
    projectionPurchaseRecord.completedAt ??
    projectionPurchaseRecord.createdAt ??
    null;

  return {
    id,
    reference: String(projectionPurchaseRecord.numberId ?? resolvedPurchaseId),
    vendorReference:
      toCleanString(
        projectionPurchaseRecord.vendorReference ??
          projectionPurchaseRecord.invoiceNumber ??
          projectionPurchaseRecord.reference,
      ) ?? null,
    status,
    approvalStatus,
    approvedAt: purchaseAccountsPayable.approvedAt ?? null,
    approvedBy: toCleanString(purchaseAccountsPayable.approvedBy) ?? null,
    approvalReason:
      toCleanString(purchaseAccountsPayable.approvalReason) ?? null,
    approvalEvidenceNote:
      toCleanString(purchaseAccountsPayable.approvalEvidenceNote) ?? null,
    approvalEvidenceUrls: normalizeEvidenceUrls(
      purchaseAccountsPayable.approvalEvidenceUrls,
    ),
    approvalRequestedAt: purchaseAccountsPayable.approvalRequestedAt ?? null,
    approvalRequestedBy:
      toCleanString(purchaseAccountsPayable.approvalRequestedBy) ?? null,
    approvalRequestReason:
      toCleanString(purchaseAccountsPayable.approvalRequestReason) ?? null,
    approvalRequestEvidenceNote:
      toCleanString(purchaseAccountsPayable.approvalRequestEvidenceNote) ??
      null,
    approvalRequestEvidenceUrls: normalizeEvidenceUrls(
      purchaseAccountsPayable.approvalRequestEvidenceUrls,
    ),
    rejectedAt: purchaseAccountsPayable.rejectedAt ?? null,
    rejectedBy: toCleanString(purchaseAccountsPayable.rejectedBy) ?? null,
    rejectionReason:
      toCleanString(purchaseAccountsPayable.rejectionReason) ?? null,
    rejectionEvidenceNote:
      toCleanString(purchaseAccountsPayable.rejectionEvidenceNote) ?? null,
    rejectionEvidenceUrls: normalizeEvidenceUrls(
      purchaseAccountsPayable.rejectionEvidenceUrls,
    ),
    voidedAt: purchaseAccountsPayable.voidedAt ?? null,
    voidedBy: toCleanString(purchaseAccountsPayable.voidedBy) ?? null,
    voidReason: toCleanString(purchaseAccountsPayable.voidReason) ?? null,
    voidEvidenceNote:
      toCleanString(purchaseAccountsPayable.voidEvidenceNote) ?? null,
    voidEvidenceUrls: normalizeEvidenceUrls(
      purchaseAccountsPayable.voidEvidenceUrls,
    ),
    sourceDocumentType: 'purchase',
    sourceDocumentId: resolvedPurchaseId,
    supplierId: resolvePurchaseSupplierId(projectionPurchaseRecord),
    supplierName: resolveVendorBillSupplierName(projectionPurchaseRecord),
    issueAt,
    billDate: issueAt,
    accountingDate: issueAt,
    dueAt: resolveVendorBillDueAt({
      purchaseRecord: projectionPurchaseRecord,
      paymentTerms,
      paymentState,
    }),
    postedAt: projectionPurchaseRecord.completedAt ?? null,
    attachmentUrls: Array.isArray(projectionPurchaseRecord.attachmentUrls)
      ? projectionPurchaseRecord.attachmentUrls
      : [],
    monetary: projectionPurchaseRecord.monetary ?? null,
    paymentTerms: paymentTerms ?? null,
    paymentState: paymentState ?? null,
    paymentControl: resolveVendorBillPaymentControlSnapshot({
      approvalStatus,
      dispute,
      paymentHold,
      status,
    }),
    paymentHold,
    dispute,
    totals: {
      total,
      paid,
      balance,
    },
    documentNature,
    settlementTiming,
    purchase: {
      ...projectionPurchaseRecord,
      id: resolvedPurchaseId,
      paymentTerms,
      paymentState,
    },
  };
};
