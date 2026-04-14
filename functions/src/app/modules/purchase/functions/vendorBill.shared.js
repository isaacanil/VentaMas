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
  const sourceDocumentType = toCleanString(vendorBillRecord?.sourceDocumentType);
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

const resolvePurchaseWorkflowStatus = (purchaseRecord) =>
  toCleanString(purchaseRecord.workflowStatus ?? purchaseRecord.status)?.toLowerCase() ??
  null;

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
  const workflowStatus = resolvePurchaseWorkflowStatus(purchaseRecord);
  if (workflowStatus === 'canceled' || workflowStatus === 'cancelled') {
    return Boolean(purchaseRecord.completedAt) || hasFinancialAccountsPayableActivity(purchaseRecord);
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

export const resolvePurchaseSettlementTiming = (purchaseRecord) => {
  const paymentTerms = asRecord(purchaseRecord.paymentTerms);
  if (paymentTerms.isImmediate === true) {
    return 'immediate';
  }
  const condition = toCleanString(paymentTerms.condition ?? purchaseRecord.condition)?.toLowerCase();
  return condition === 'cash' ? 'immediate' : 'deferred';
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

const resolveVendorBillSupplierName = (purchaseRecord) => {
  const providerRecord = asRecord(purchaseRecord.provider);
  return (
    toCleanString(providerRecord.name) ??
    toCleanString(purchaseRecord.providerName) ??
    null
  );
};

const resolveVendorBillDueAt = ({ purchaseRecord, paymentTerms, paymentState }) =>
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

  if (!shouldMaterializeVendorBillFromPurchaseRecord(projectionPurchaseRecord)) {
    return null;
  }

  const id =
    toCleanString(vendorBillId) ??
    buildCanonicalVendorBillIdFromPurchaseId(resolvedPurchaseId);
  const status = resolveVendorBillStatus({ purchaseRecord, paymentState });
  const total = roundToTwoDecimals(paymentState?.total);
  const paid = roundToTwoDecimals(paymentState?.paid);
  const balance = roundToTwoDecimals(paymentState?.balance);
  const documentNature = resolvePurchaseDocumentNature(projectionPurchaseRecord);
  const settlementTiming = resolvePurchaseSettlementTiming(projectionPurchaseRecord);
  const issueAt =
    projectionPurchaseRecord.completedAt ?? projectionPurchaseRecord.createdAt ?? null;

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
    approvalStatus: resolveVendorBillApprovalStatus(status),
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
    totals: {
      total,
      paid,
      balance,
    },
    documentNature,
    settlementTiming,
    purchase: {
      ...projectionPurchaseRecord,
      paymentTerms,
      paymentState,
    },
  };
};
