import { toMillis } from '@/utils/date/toMillis';
import { formatPrice } from '@/utils/format/formatPrice';
import { isSettledPaymentStateStatus } from '@/utils/payments/paymentState';
import type { Purchase, PurchasePaymentCondition } from '@/utils/purchase/types';
import { resolveVendorBillDueAtMillis } from '@/utils/vendorBills/fromPurchase';
import type { VendorBill } from '@/utils/vendorBills/types';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const startOfDay = (millis: number): number => {
  const date = new Date(millis);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const endOfDay = (millis: number): number => {
  const date = new Date(millis);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
};

const PAYMENT_CONDITION_LABELS: Record<string, string> = {
  cash: 'Contado',
  one_week: '1 semana',
  fifteen_days: '15 días',
  thirty_days: '30 días',
  other: 'Otro',
};

export type AccountsPayableAgingBucket =
  | 'current'
  | 'due_1_30'
  | 'due_31_60'
  | 'due_61_plus'
  | 'no_due_date';

export type AccountsPayableTraceabilityFilter =
  | 'all'
  | 'with_payments'
  | 'with_evidence'
  | 'missing_evidence'
  | 'overdue';

export type AccountsPayableGroupBy = 'provider' | 'aging' | 'none';

export interface AccountsPayableAgingSnapshot {
  bucket: AccountsPayableAgingBucket;
  daysOverdue: number | null;
  daysUntilDue: number | null;
  dueAt: number | null;
  label: string;
  tone: 'danger' | 'warning' | 'neutral' | 'success';
}

export interface AccountsPayableRow {
  id: string;
  vendorBill: VendorBill;
  purchase: Purchase;
  reference: string;
  providerName: string;
  providerId: string | null;
  conditionLabel: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentCount: number;
  evidenceCount: number;
  dueAt: number | null;
  lastPaymentAt: number | null;
  agingBucket: AccountsPayableAgingBucket;
  agingLabel: string;
  agingTone: AccountsPayableAgingSnapshot['tone'];
  agingDays: number | null;
  providerGroup: string;
  agingGroup: string;
  traceabilitySummary: string;
}

export interface AccountsPayableSummaryBucket {
  key: AccountsPayableAgingBucket;
  label: string;
  count: number;
  balanceAmount: number;
}

export interface AccountsPayableSummary {
  totalCount: number;
  totalBalanceAmount: number;
  totalWithPayments: number;
  totalWithEvidence: number;
  buckets: AccountsPayableSummaryBucket[];
}

export const ACCOUNTS_PAYABLE_AGING_BUCKET_LABELS: Record<
  AccountsPayableAgingBucket,
  string
> = {
  current: 'Al día',
  due_1_30: 'Vencido 1-30',
  due_31_60: 'Vencido 31-60',
  due_61_plus: 'Vencido 61+',
  no_due_date: 'Sin fecha',
};

export const resolveAccountsPayableProviderName = (
  vendorBill: VendorBill,
): string => {
  if (vendorBill.supplierName?.trim()) {
    return vendorBill.supplierName.trim();
  }

  const { purchase } = vendorBill;
  if (purchase.provider && typeof purchase.provider === 'object') {
    const provider = purchase.provider as { name?: string | null };
    return provider.name?.trim() || 'Sin proveedor';
  }

  return 'Sin proveedor';
};

export const resolveAccountsPayableConditionLabel = (
  vendorBill: VendorBill,
): string => {
  const condition =
    toCleanString(vendorBill.paymentTerms?.condition) ??
    toCleanString(vendorBill.purchase.condition);

  return condition
    ? PAYMENT_CONDITION_LABELS[condition as PurchasePaymentCondition] ?? condition
    : 'Sin condición';
};

export const resolveAccountsPayableDueAt = (
  vendorBill: VendorBill,
): number | null => {
  return resolveVendorBillDueAtMillis(vendorBill);
};

export const resolveAccountsPayableAgingSnapshot = (
  vendorBill: VendorBill,
  now = Date.now(),
): AccountsPayableAgingSnapshot => {
  const dueAt = resolveAccountsPayableDueAt(vendorBill);
  const settledAt = toMillis(vendorBill.paymentState?.lastPaymentAt);

  if (isSettledPaymentStateStatus(vendorBill.paymentState?.status)) {
    if (!dueAt) {
      return {
        bucket: 'current',
        daysOverdue: null,
        daysUntilDue: null,
        dueAt: null,
        label: 'Pagada',
        tone: 'success',
      };
    }

    if (settledAt == null || endOfDay(settledAt) <= endOfDay(dueAt)) {
      return {
        bucket: 'current',
        daysOverdue: 0,
        daysUntilDue: null,
        dueAt,
        label: 'Pagada a tiempo',
        tone: 'success',
      };
    }

    const daysLate = Math.max(
      1,
      Math.ceil((startOfDay(settledAt) - endOfDay(dueAt)) / DAY_IN_MS),
    );

    return {
      bucket: 'current',
      daysOverdue: daysLate,
      daysUntilDue: null,
      dueAt,
      label: `Pagada con ${daysLate} día${daysLate === 1 ? '' : 's'} de atraso`,
      tone: 'warning',
    };
  }

  if (!dueAt) {
    return {
      bucket: 'no_due_date',
      daysOverdue: null,
      daysUntilDue: null,
      dueAt: null,
      label: 'Sin fecha pactada',
      tone: 'neutral',
    };
  }

  const todayStart = startOfDay(now);
  const dueDayStart = startOfDay(dueAt);
  const dueDayEnd = endOfDay(dueAt);
  const daysUntilDue = Math.ceil((dueDayStart - todayStart) / DAY_IN_MS);

  if (now <= dueDayEnd) {
    if (daysUntilDue <= 0) {
      return {
        bucket: 'current',
        daysOverdue: 0,
        daysUntilDue: 0,
        dueAt,
        label: 'Vence hoy',
        tone: 'warning',
      };
    }

    return {
      bucket: 'current',
      daysOverdue: 0,
      daysUntilDue,
      dueAt,
      label:
        daysUntilDue <= 7 ? `Vence en ${daysUntilDue} día${daysUntilDue === 1 ? '' : 's'}` : 'Al día',
      tone: daysUntilDue <= 7 ? 'warning' : 'success',
    };
  }

  const daysOverdue = Math.max(
    1,
    Math.ceil((todayStart - dueDayEnd) / DAY_IN_MS),
  );

  if (daysOverdue <= 30) {
    return {
      bucket: 'due_1_30',
      daysOverdue,
      daysUntilDue: -daysOverdue,
      dueAt,
      label: `Vencido hace ${daysOverdue} día${daysOverdue === 1 ? '' : 's'}`,
      tone: 'danger',
    };
  }

  if (daysOverdue <= 60) {
    return {
      bucket: 'due_31_60',
      daysOverdue,
      daysUntilDue: -daysOverdue,
      dueAt,
      label: `Vencido hace ${daysOverdue} días`,
      tone: 'danger',
    };
  }

  return {
    bucket: 'due_61_plus',
    daysOverdue,
    daysUntilDue: -daysOverdue,
    dueAt,
    label: `Vencido hace ${daysOverdue} días`,
    tone: 'danger',
  };
};

export const buildAccountsPayableRow = (
  vendorBill: VendorBill,
  fallbackProviderName?: string | null,
  now = Date.now(),
): AccountsPayableRow => {
  const paymentState = vendorBill.paymentState ?? null;
  const providerName =
    toCleanString(fallbackProviderName) ??
    resolveAccountsPayableProviderName(vendorBill);
  const aging = resolveAccountsPayableAgingSnapshot(vendorBill, now);
  const totalAmount = Number(paymentState?.total ?? 0);
  const paidAmount = Number(paymentState?.paid ?? 0);
  const balanceAmount = Number(paymentState?.balance ?? totalAmount);
  const paymentCount = Number(paymentState?.paymentCount ?? 0);
  const evidenceCount = Array.isArray(vendorBill.attachmentUrls)
    ? vendorBill.attachmentUrls.length
    : 0;
  const reference = String(vendorBill.reference ?? vendorBill.id ?? 'Sin número');

  return {
    id: String(vendorBill.id ?? reference),
    vendorBill,
    purchase: vendorBill.purchase,
    reference,
    providerName,
    providerId: toCleanString(vendorBill.supplierId),
    conditionLabel: resolveAccountsPayableConditionLabel(vendorBill),
    totalAmount,
    paidAmount,
    balanceAmount,
    paymentCount,
    evidenceCount,
    dueAt: aging.dueAt,
    lastPaymentAt: toMillis(paymentState?.lastPaymentAt) ?? null,
    agingBucket: aging.bucket,
    agingLabel: aging.label,
    agingTone: aging.tone,
    agingDays: aging.daysOverdue,
    providerGroup: providerName,
    agingGroup: ACCOUNTS_PAYABLE_AGING_BUCKET_LABELS[aging.bucket],
    traceabilitySummary: `${paymentCount} pago${paymentCount === 1 ? '' : 's'} · ${evidenceCount} evidencia${evidenceCount === 1 ? '' : 's'}`,
  };
};

export const buildAccountsPayableSummary = (
  rows: AccountsPayableRow[],
): AccountsPayableSummary => {
  const buckets = (
    Object.keys(
      ACCOUNTS_PAYABLE_AGING_BUCKET_LABELS,
    ) as AccountsPayableAgingBucket[]
  ).map((key) => ({
    key,
    label: ACCOUNTS_PAYABLE_AGING_BUCKET_LABELS[key],
    count: 0,
    balanceAmount: 0,
  }));

  rows.forEach((row) => {
    const bucket = buckets.find((entry) => entry.key === row.agingBucket);
    if (bucket) {
      bucket.count += 1;
      bucket.balanceAmount += row.balanceAmount;
    }
  });

  return {
    totalCount: rows.length,
    totalBalanceAmount: rows.reduce((sum, row) => sum + row.balanceAmount, 0),
    totalWithPayments: rows.filter((row) => row.paymentCount > 0).length,
    totalWithEvidence: rows.filter((row) => row.evidenceCount > 0).length,
    buckets,
  };
};

export const matchesAccountsPayableTraceabilityFilter = (
  row: AccountsPayableRow,
  filter: AccountsPayableTraceabilityFilter,
): boolean => {
  switch (filter) {
    case 'with_payments':
      return row.paymentCount > 0;
    case 'with_evidence':
      return row.evidenceCount > 0;
    case 'missing_evidence':
      return row.evidenceCount === 0;
    case 'overdue':
      return row.agingBucket !== 'current' && row.agingBucket !== 'no_due_date';
    default:
      return true;
  }
};

export const formatAccountsPayableCompactMoney = (value: number): string =>
  formatPrice(value);
