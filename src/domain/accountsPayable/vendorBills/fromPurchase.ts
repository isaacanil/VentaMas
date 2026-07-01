import { toMillis } from '@/utils/date/toMillis';
import {
  resolvePurchaseDisplayNextPaymentAt,
  resolvePurchaseMonetaryTotals,
  resolvePurchasePaymentState,
  resolvePurchasePaymentTerms,
} from '@/utils/purchase/financials';
import { resolvePurchaseWorkflowStatus } from '@/utils/purchase/workflow';
import type { Purchase } from '@/utils/purchase/types';
import { toCleanString } from '@/utils/text';

import type {
  VendorBill,
  VendorBillApprovalStatus,
  VendorBillStatus,
} from './types';

const OPEN_BALANCE_THRESHOLD = 0.01;
export const OPEN_VENDOR_BILL_STATUSES = [
  'approved',
  'on_hold',
  'disputed',
  'partially_paid',
] as const satisfies readonly VendorBillStatus[];

const ACCOUNTS_PAYABLE_VISIBLE_STATUSES = new Set<VendorBillStatus>(
  OPEN_VENDOR_BILL_STATUSES,
);

const resolveSupplierIdentity = (
  purchase: Purchase,
): { supplierId: string | null; supplierName: string | null } => {
  if (purchase.provider && typeof purchase.provider === 'object') {
    const provider = purchase.provider as {
      id?: string | null;
      name?: string | null;
    };

    return {
      supplierId:
        toCleanString(purchase.providerId) ?? toCleanString(provider.id),
      supplierName: toCleanString(provider.name),
    };
  }

  if (typeof purchase.provider === 'string') {
    return {
      supplierId:
        toCleanString(purchase.providerId) ?? toCleanString(purchase.provider),
      supplierName: null,
    };
  }

  return {
    supplierId: toCleanString(purchase.providerId),
    supplierName: null,
  };
};

const resolveVendorBillStatus = (
  purchase: Purchase,
  balance: number,
  paid: number,
): VendorBillStatus => {
  const workflowStatus = resolvePurchaseWorkflowStatus(purchase);
  if (workflowStatus === 'canceled') return 'voided';
  if (workflowStatus !== 'completed') return 'draft';
  if (balance <= OPEN_BALANCE_THRESHOLD) return 'paid';
  if (paid > OPEN_BALANCE_THRESHOLD) return 'partially_paid';
  return 'approved';
};

const hasFinancialAccountsPayableActivity = (purchase: Purchase): boolean => {
  const paymentState = purchase.paymentState;
  const paid = Number(paymentState?.paid ?? 0);
  const paymentCount = Number(paymentState?.paymentCount ?? 0);
  const hasLastPaymentId = Boolean(toCleanString(paymentState?.lastPaymentId));
  const normalizedStatus = toCleanString(paymentState?.status)?.toLowerCase();

  return (
    paid > OPEN_BALANCE_THRESHOLD ||
    paymentCount > 0 ||
    hasLastPaymentId ||
    normalizedStatus === 'partial' ||
    normalizedStatus === 'paid' ||
    normalizedStatus === 'overpaid' ||
    paymentState?.migratedFromLegacy === true
  );
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

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

const VOIDED_CONTROL_STATUSES = new Set([
  'cancelled',
  'canceled',
  'void',
  'voided',
]);

const isActiveControlRecord = (value: unknown): boolean => {
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

const resolvePurchaseAccountsPayableControls = (
  purchase: Purchase,
): Record<string, unknown> =>
  asRecord(
    (purchase as Record<string, unknown>).accountsPayable ??
      (purchase as Record<string, unknown>).payables ??
      (purchase as Record<string, unknown>).vendorBill,
  );

const isVoidedAccountsPayableControl = (
  accountsPayable: Record<string, unknown>,
): boolean => {
  const status = toCleanString(
    accountsPayable.status ??
      accountsPayable.state ??
      accountsPayable.approvalStatus,
  )?.toLowerCase();

  return (
    VOIDED_CONTROL_STATUSES.has(status ?? '') ||
    Boolean(accountsPayable.voidedAt) ||
    Boolean(toCleanString(accountsPayable.voidedBy))
  );
};

const resolveVendorBillControlledStatus = ({
  baseStatus,
  isVoided,
  paymentHold,
  dispute,
}: {
  baseStatus: VendorBillStatus;
  isVoided: boolean;
  paymentHold: unknown;
  dispute: unknown;
}): VendorBillStatus => {
  if (isVoided) return 'voided';
  if (isActiveControlRecord(dispute)) return 'disputed';
  if (isActiveControlRecord(paymentHold)) return 'on_hold';
  return baseStatus;
};

const resolveControlReason = (value: unknown): string | null => {
  const record = asRecord(value);
  return (
    toCleanString(
      record.reason ?? record.note ?? record.comment ?? record.description,
    ) ?? null
  );
};

const resolveVendorBillPaymentControlSnapshot = ({
  approvalStatus,
  dispute,
  paymentHold,
  status,
}: Pick<
  VendorBill,
  'approvalStatus' | 'dispute' | 'paymentHold' | 'status'
>) => {
  if (status === 'paid' || status === 'voided') {
    return {
      canRegisterPayment: false,
      label: 'Cerrada',
      reason: null,
      status: 'closed' as const,
      tone: 'neutral' as const,
    };
  }

  if (status === 'disputed' || isActiveControlRecord(dispute)) {
    return {
      canRegisterPayment: false,
      label: 'En disputa',
      reason: resolveControlReason(dispute),
      status: 'disputed' as const,
      tone: 'danger' as const,
    };
  }

  if (status === 'on_hold' || isActiveControlRecord(paymentHold)) {
    return {
      canRegisterPayment: false,
      label: 'Retenida',
      reason: resolveControlReason(paymentHold),
      status: 'on_hold' as const,
      tone: 'warning' as const,
    };
  }

  const normalizedApprovalStatus = toCleanString(approvalStatus)?.toLowerCase();
  if (
    normalizedApprovalStatus &&
    ['draft', 'pending', 'pending_approval', 'rejected'].includes(
      normalizedApprovalStatus,
    )
  ) {
    return {
      canRegisterPayment: false,
      label: 'No aprobada',
      reason: null,
      status: 'pending_approval' as const,
      tone: 'neutral' as const,
    };
  }

  return {
    canRegisterPayment: true,
    label: 'Aprobada',
    reason: null,
    status: 'payable' as const,
    tone: 'success' as const,
  };
};

const hasHistoricallyPostedVendorBillGrounds = (purchase: Purchase): boolean =>
  toMillis(purchase.completedAt) != null;

export const isPurchaseReceiptInventoryPending = (
  purchase: Purchase,
): boolean => {
  const status = toCleanString(
    purchase.receiptInventoryState?.status,
  )?.toLowerCase();

  return (
    status === 'pending' ||
    status === 'pending_inventory' ||
    status === 'applying'
  );
};

export const shouldMaterializeVendorBillFromPurchase = (
  purchase: Purchase,
): boolean => {
  if (isPurchaseReceiptInventoryPending(purchase)) {
    return false;
  }

  const workflowStatus = resolvePurchaseWorkflowStatus(purchase);
  if (workflowStatus === 'canceled') {
    return (
      hasHistoricallyPostedVendorBillGrounds(purchase) ||
      hasFinancialAccountsPayableActivity(purchase)
    );
  }

  if (workflowStatus === 'completed') {
    return true;
  }

  return hasFinancialAccountsPayableActivity(purchase);
};

export const buildVendorBillFromPurchase = (
  purchase: Purchase,
): VendorBill | null => {
  const purchaseId = toCleanString(purchase.id);
  if (!purchaseId) return null;

  if (!shouldMaterializeVendorBillFromPurchase(purchase)) {
    return null;
  }

  const paymentTerms = resolvePurchasePaymentTerms(purchase);
  const totals = resolvePurchaseMonetaryTotals(purchase);
  const paymentState =
    resolvePurchasePaymentState({
      purchase: { ...purchase, paymentTerms },
      total: totals.total,
    }) ??
    purchase.paymentState ??
    null;
  const balance = Number(paymentState?.balance ?? 0);
  const paid = Number(paymentState?.paid ?? 0);
  const dueAt =
    resolvePurchaseDisplayNextPaymentAt({
      ...purchase,
      paymentTerms,
      paymentState,
    }) ??
    paymentTerms.expectedPaymentAt ??
    purchase.paymentAt ??
    purchase.dates?.paymentDate ??
    null;

  const { supplierId, supplierName } = resolveSupplierIdentity(purchase);
  const accountsPayable = resolvePurchaseAccountsPayableControls(purchase);
  const isVoided = isVoidedAccountsPayableControl(accountsPayable);
  const paymentHold = (accountsPayable.paymentHold ??
    accountsPayable.hold ??
    null) as VendorBill['paymentHold'];
  const dispute = (accountsPayable.dispute ?? null) as VendorBill['dispute'];
  const baseStatus = resolveVendorBillStatus(purchase, balance, paid);
  const status = resolveVendorBillControlledStatus({
    baseStatus,
    isVoided,
    paymentHold,
    dispute,
  });
  const approvalStatus =
    (isVoided ? 'voided' : null) ??
    (toCleanString(accountsPayable.approvalStatus)?.toLowerCase() as
      | VendorBillApprovalStatus
      | undefined) ??
    (resolvePurchaseWorkflowStatus(purchase) === 'completed'
      ? 'approved'
      : resolvePurchaseWorkflowStatus(purchase) === 'canceled'
        ? 'voided'
        : 'draft');

  return {
    id: `purchase:${purchaseId}`,
    reference: String(purchase.numberId ?? purchaseId),
    vendorReference:
      toCleanString(
        purchase.vendorReference ??
          purchase.invoiceNumber ??
          purchase.reference,
      ) ?? null,
    status,
    approvalStatus,
    voidedAt: (accountsPayable.voidedAt as VendorBill['voidedAt']) ?? null,
    voidedBy: toCleanString(accountsPayable.voidedBy) ?? null,
    voidReason: toCleanString(accountsPayable.voidReason) ?? null,
    voidEvidenceNote: toCleanString(accountsPayable.voidEvidenceNote) ?? null,
    voidEvidenceUrls: Array.isArray(accountsPayable.voidEvidenceUrls)
      ? (accountsPayable.voidEvidenceUrls
          .map((entry) => toCleanString(entry))
          .filter(Boolean) as string[])
      : [],
    sourceDocumentType: 'purchase',
    sourceDocumentId: purchaseId,
    supplierId,
    supplierName,
    issueAt: purchase.completedAt ?? purchase.createdAt ?? null,
    billDate: purchase.completedAt ?? purchase.createdAt ?? null,
    accountingDate: purchase.completedAt ?? purchase.createdAt ?? null,
    dueAt,
    postedAt: purchase.completedAt ?? null,
    attachmentUrls: purchase.attachmentUrls,
    monetary: purchase.monetary ?? null,
    paymentTerms,
    paymentState,
    paymentControl: resolveVendorBillPaymentControlSnapshot({
      approvalStatus,
      dispute,
      paymentHold,
      status,
    }),
    paymentHold,
    dispute,
    totals: {
      total: Number(paymentState?.total ?? totals.total ?? 0),
      paid: Number(paymentState?.paid ?? 0),
      balance: Number(paymentState?.balance ?? totals.total ?? 0),
    },
    documentNature:
      Array.isArray(purchase.replenishments) && purchase.replenishments.length
        ? 'inventory'
        : 'expense',
    settlementTiming:
      paymentTerms?.isImmediate === true ? 'immediate' : 'deferred',
    purchase: {
      ...purchase,
      paymentTerms,
      paymentState,
    },
  };
};

export const isOpenVendorBill = (vendorBill: VendorBill): boolean => {
  const balance = Number(vendorBill.paymentState?.balance ?? 0);
  return (
    ACCOUNTS_PAYABLE_VISIBLE_STATUSES.has(vendorBill.status) &&
    Number.isFinite(balance) &&
    balance > OPEN_BALANCE_THRESHOLD
  );
};

export const resolveVendorBillDueAtMillis = (
  vendorBill: VendorBill,
): number | null => {
  const dueAt = toMillis(vendorBill.dueAt);
  return typeof dueAt === 'number' && Number.isFinite(dueAt) ? dueAt : null;
};
