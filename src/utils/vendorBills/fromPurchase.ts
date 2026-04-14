import { toMillis } from '@/utils/date/toMillis';
import {
  resolvePurchaseDisplayNextPaymentAt,
  resolvePurchaseMonetaryTotals,
  resolvePurchasePaymentState,
  resolvePurchasePaymentTerms,
} from '@/utils/purchase/financials';
import {
  resolvePurchaseWorkflowStatus,
} from '@/utils/purchase/workflow';
import type { Purchase } from '@/utils/purchase/types';

import type { VendorBill, VendorBillStatus } from './types';

const OPEN_BALANCE_THRESHOLD = 0.01;
const ACCOUNTS_PAYABLE_VISIBLE_STATUSES = new Set<VendorBillStatus>([
  'approved',
  'partially_paid',
]);

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const resolveSupplierIdentity = (
  purchase: Purchase,
): { supplierId: string | null; supplierName: string | null } => {
  if (purchase.provider && typeof purchase.provider === 'object') {
    const provider = purchase.provider as {
      id?: string | null;
      name?: string | null;
    };

    return {
      supplierId: toCleanString(purchase.providerId) ?? toCleanString(provider.id),
      supplierName: toCleanString(provider.name),
    };
  }

  if (typeof purchase.provider === 'string') {
    return {
      supplierId: toCleanString(purchase.providerId) ?? toCleanString(purchase.provider),
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

const hasHistoricallyPostedVendorBillGrounds = (purchase: Purchase): boolean =>
  toMillis(purchase.completedAt) != null;

export const shouldMaterializeVendorBillFromPurchase = (
  purchase: Purchase,
): boolean => {
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

  return {
    id: `purchase:${purchaseId}`,
    reference: String(purchase.numberId ?? purchaseId),
    vendorReference:
      toCleanString(
        purchase.vendorReference ?? purchase.invoiceNumber ?? purchase.reference,
      ) ?? null,
    status: resolveVendorBillStatus(purchase, balance, paid),
    approvalStatus:
      resolvePurchaseWorkflowStatus(purchase) === 'completed'
        ? 'approved'
        : resolvePurchaseWorkflowStatus(purchase) === 'canceled'
          ? 'voided'
          : 'draft',
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
    totals: {
      total: Number(paymentState?.total ?? totals.total ?? 0),
      paid: Number(paymentState?.paid ?? 0),
      balance: Number(paymentState?.balance ?? totals.total ?? 0),
    },
    documentNature: Array.isArray(purchase.replenishments) &&
      purchase.replenishments.length
      ? 'inventory'
      : 'expense',
    settlementTiming: paymentTerms?.isImmediate === true ? 'immediate' : 'deferred',
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
