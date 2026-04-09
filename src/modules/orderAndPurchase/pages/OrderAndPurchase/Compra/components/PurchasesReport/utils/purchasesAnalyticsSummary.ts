import { DateTime } from 'luxon';

import {
  formatLocaleDate,
  formatLocaleMonthYear,
} from '@/utils/date/dateUtils';
import { toMillis } from '@/utils/date/toMillis';
import { calculateReplenishmentTotals } from '@/utils/order/totals';
import type { Purchase, PurchaseReplenishment } from '@/utils/purchase/types';

type BreakdownSeed = {
  key: string;
  label: string;
  value: number;
  count: number;
};

type TrendSeed = {
  key: string;
  label: string;
  total: number;
  purchases: number;
  items: number;
  pending: number;
  paid: number;
};

type NormalizedPurchase = {
  dateMillis: number | null;
  total: number;
  balance: number;
  paid: number;
  items: number;
  provider: string;
  condition: string;
  paymentStatus: string;
  categories: Array<{ label: string; total: number }>;
};

export type PurchaseTrendPoint = {
  key: string;
  label: string;
  total: number;
  purchases: number;
  items: number;
  pending: number;
  paid: number;
};

export type PurchaseBreakdownItem = {
  key: string;
  label: string;
  value: number;
  count: number;
  share: number;
};

export type PurchasesAnalyticsSummary = {
  totals: {
    spend: number;
    paid: number;
    pending: number;
    averageTicket: number;
    purchases: number;
    providers: number;
    items: number;
    purchasesWithBalance: number;
  };
  trend: {
    groupBy: 'day' | 'month';
    points: PurchaseTrendPoint[];
    strongest: PurchaseTrendPoint | null;
    latest: PurchaseTrendPoint | null;
    averageSpend: number;
  };
  providers: PurchaseBreakdownItem[];
  conditions: PurchaseBreakdownItem[];
  categories: PurchaseBreakdownItem[];
  paymentStatuses: PurchaseBreakdownItem[];
};

const FALLBACK_PROVIDER = 'Sin suplidor';
const FALLBACK_CONDITION = 'Sin condicion';
const FALLBACK_CATEGORY = 'Sin categoria';

const CONDITION_LABELS: Record<string, string> = {
  cash: 'Contado',
  one_week: 'Una semana',
  fifteen_days: 'Quince dias',
  thirty_days: 'Treinta dias',
  other: 'Otra condicion',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: 'Pagada',
  partial: 'Parcial',
  partially_paid: 'Parcial',
  unpaid: 'Sin pagar',
  pending: 'Pendiente',
};

const toSafeNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolvePurchaseDateMillis = (purchase: Purchase): number | null => {
  const rawDate =
    purchase?.createdAt ??
    purchase?.deliveryAt ??
    purchase?.completedAt ??
    purchase?.dates?.deliveryDate ??
    purchase?.paymentAt ??
    purchase?.dates?.paymentDate ??
    purchase?.paymentTerms?.nextPaymentAt;

  const millis = toMillis(rawDate);
  return Number.isFinite(millis) ? (millis as number) : null;
};

const resolvePurchaseTotal = (purchase: Purchase): number => {
  const directCandidates = [
    toSafeNumber(purchase?.total),
    toSafeNumber((purchase as { totalAmount?: unknown }).totalAmount),
    toSafeNumber((purchase as { totalPurchase?: unknown }).totalPurchase),
    toSafeNumber(purchase?.paymentState?.total),
  ];

  const directTotal = directCandidates.find((value) => value > 0);
  if (directTotal !== undefined) {
    return directTotal;
  }

  const totals = calculateReplenishmentTotals(purchase?.replenishments || []);
  return toSafeNumber(totals.grandTotal);
};

const resolvePurchaseBalance = (purchase: Purchase, total: number): number => {
  const explicitBalance = toSafeNumber(purchase?.paymentState?.balance);
  if (explicitBalance > 0) {
    return explicitBalance;
  }

  const status = String(purchase?.paymentState?.status ?? '').toLowerCase();
  if (status === 'paid') {
    return 0;
  }

  return total;
};

const resolveProviderName = (provider: Purchase['provider']): string => {
  if (typeof provider === 'string' && provider.trim()) {
    return provider.trim();
  }

  if (
    provider &&
    typeof provider === 'object' &&
    'name' in provider &&
    typeof (provider as { name?: unknown }).name === 'string' &&
    (provider as { name: string }).name.trim()
  ) {
    return (provider as { name: string }).name.trim();
  }

  return FALLBACK_PROVIDER;
};

const resolveConditionLabel = (purchase: Purchase): string => {
  const rawCondition =
    purchase?.paymentTerms?.condition ?? purchase?.condition ?? null;

  if (typeof rawCondition !== 'string' || !rawCondition.trim()) {
    return FALLBACK_CONDITION;
  }

  const normalized = rawCondition.trim().toLowerCase();
  if (CONDITION_LABELS[normalized]) {
    return CONDITION_LABELS[normalized];
  }

  return normalized
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

const resolvePaymentStatusLabel = (
  purchase: Purchase,
  balance: number,
  paid: number,
): string => {
  const rawStatus = String(purchase?.paymentState?.status ?? '')
    .trim()
    .toLowerCase();

  if (PAYMENT_STATUS_LABELS[rawStatus]) {
    return PAYMENT_STATUS_LABELS[rawStatus];
  }

  if (balance <= 0.01) {
    return 'Pagada';
  }
  if (paid > 0.01) {
    return 'Parcial';
  }
  return 'Sin pagar';
};

const resolvePurchasedItems = (purchase: Purchase): number => {
  const replenishments = Array.isArray(purchase?.replenishments)
    ? purchase.replenishments
    : [];

  const totalItems = replenishments.reduce((sum, replenishment) => {
    const quantity = [
      replenishment?.purchaseQuantity,
      replenishment?.quantity,
      replenishment?.orderedQuantity,
      replenishment?.receivedQuantity,
      replenishment?.newStock,
    ]
      .map(toSafeNumber)
      .find((value) => value > 0);

    return sum + (quantity ?? 0);
  }, 0);

  return totalItems > 0 ? totalItems : replenishments.length;
};

const resolveReplenishmentTotal = (replenishment: PurchaseReplenishment) => {
  const directCandidates = [
    toSafeNumber(replenishment?.subTotal),
    toSafeNumber(replenishment?.subtotal),
  ];
  const directTotal = directCandidates.find((value) => value > 0);
  if (directTotal !== undefined) {
    return directTotal;
  }

  const totals = calculateReplenishmentTotals([replenishment]);
  return toSafeNumber(totals.grandTotal);
};

const resolveCategories = (
  purchase: Purchase,
  purchaseTotal: number,
): Array<{ label: string; total: number }> => {
  const replenishments = Array.isArray(purchase?.replenishments)
    ? purchase.replenishments
    : [];

  if (!replenishments.length) {
    return [{ label: FALLBACK_CATEGORY, total: purchaseTotal }];
  }

  const categories = replenishments.map((replenishment) => {
    const label =
      typeof replenishment?.category === 'string' &&
      replenishment.category.trim()
        ? replenishment.category.trim()
        : FALLBACK_CATEGORY;

    return {
      label,
      total: resolveReplenishmentTotal(replenishment),
    };
  });

  const totalFromLines = categories.reduce((sum, item) => sum + item.total, 0);
  if (totalFromLines > 0) {
    return categories;
  }

  return [{ label: FALLBACK_CATEGORY, total: purchaseTotal }];
};

const createBreakdownEntry = (
  map: Map<string, BreakdownSeed>,
  key: string,
  label: string,
) => {
  if (!map.has(key)) {
    map.set(key, { key, label, value: 0, count: 0 });
  }

  return map.get(key)!;
};

const createTrendEntry = (
  map: Map<string, TrendSeed>,
  key: string,
  label: string,
) => {
  if (!map.has(key)) {
    map.set(key, {
      key,
      label,
      total: 0,
      purchases: 0,
      items: 0,
      pending: 0,
      paid: 0,
    });
  }

  return map.get(key)!;
};

const resolveTrendKey = (
  millis: number,
  groupBy: 'day' | 'month',
): { key: string; label: string } => {
  const date = DateTime.fromMillis(millis);

  if (groupBy === 'month') {
    return {
      key: date.toFormat('yyyy-MM'),
      label: formatLocaleMonthYear(millis),
    };
  }

  return {
    key: date.toFormat('yyyy-MM-dd'),
    label: formatLocaleDate(millis),
  };
};

const sortBreakdownItems = (items: PurchaseBreakdownItem[]) =>
  items.sort((left, right) => {
    if (right.value !== left.value) {
      return right.value - left.value;
    }
    return right.count - left.count;
  });

const formatBreakdown = (
  source: Map<string, BreakdownSeed>,
  totalBase: number,
): PurchaseBreakdownItem[] =>
  sortBreakdownItems(
    Array.from(source.values()).map((item) => ({
      key: item.key,
      label: item.label,
      value: item.value,
      count: item.count,
      share: totalBase > 0 ? item.value / totalBase : 0,
    })),
  );

export const formatPurchaseTrendHighlight = (
  point: PurchaseTrendPoint | null,
): string => {
  if (!point) {
    return 'N/D';
  }

  return `${point.label} · ${point.purchases} compras · ${point.total.toLocaleString(
    'es-DO',
    {
      style: 'currency',
      currency: 'DOP',
      maximumFractionDigits: 2,
    },
  )}`;
};

export const buildPurchasesAnalyticsSummary = (
  purchases: Purchase[],
): PurchasesAnalyticsSummary => {
  const safePurchases = Array.isArray(purchases) ? purchases : [];
  const normalizedPurchases: NormalizedPurchase[] = [];
  const providers = new Map<string, BreakdownSeed>();
  const conditions = new Map<string, BreakdownSeed>();
  const categories = new Map<string, BreakdownSeed>();
  const paymentStatuses = new Map<string, BreakdownSeed>();
  const providerIds = new Set<string>();

  let totalSpend = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let totalItems = 0;
  let purchasesWithBalance = 0;
  let minDateMillis = Number.POSITIVE_INFINITY;
  let maxDateMillis = Number.NEGATIVE_INFINITY;

  safePurchases.forEach((purchase) => {
    const total = resolvePurchaseTotal(purchase);
    const balance = Math.max(resolvePurchaseBalance(purchase, total), 0);
    const paid = Math.max(total - balance, 0);
    const items = resolvePurchasedItems(purchase);
    const provider = resolveProviderName(purchase?.provider);
    const condition = resolveConditionLabel(purchase);
    const paymentStatus = resolvePaymentStatusLabel(purchase, balance, paid);
    const dateMillis = resolvePurchaseDateMillis(purchase);
    const purchaseCategories = resolveCategories(purchase, total);

    normalizedPurchases.push({
      dateMillis,
      total,
      balance,
      paid,
      items,
      provider,
      condition,
      paymentStatus,
      categories: purchaseCategories,
    });

    totalSpend += total;
    totalPaid += paid;
    totalPending += balance;
    totalItems += items;

    if (balance > 0.01) {
      purchasesWithBalance += 1;
    }

    if (provider !== FALLBACK_PROVIDER) {
      providerIds.add(provider);
    }

    const providerEntry = createBreakdownEntry(providers, provider, provider);
    providerEntry.value += total;
    providerEntry.count += 1;

    const conditionEntry = createBreakdownEntry(
      conditions,
      condition,
      condition,
    );
    conditionEntry.value += total;
    conditionEntry.count += 1;

    const paymentStatusEntry = createBreakdownEntry(
      paymentStatuses,
      paymentStatus,
      paymentStatus,
    );
    paymentStatusEntry.value += total;
    paymentStatusEntry.count += 1;

    purchaseCategories.forEach((category) => {
      const entry = createBreakdownEntry(
        categories,
        category.label,
        category.label,
      );
      entry.value += category.total;
      entry.count += 1;
    });

    if (typeof dateMillis === 'number') {
      minDateMillis = Math.min(minDateMillis, dateMillis);
      maxDateMillis = Math.max(maxDateMillis, dateMillis);
    }
  });

  const hasDateRange =
    Number.isFinite(minDateMillis) && Number.isFinite(maxDateMillis);
  const rangeDays = hasDateRange
    ? Math.max((maxDateMillis - minDateMillis) / (1000 * 60 * 60 * 24), 0)
    : 0;
  const groupBy: 'day' | 'month' = rangeDays > 90 ? 'month' : 'day';

  const trend = new Map<string, TrendSeed>();
  normalizedPurchases.forEach((purchase) => {
    if (typeof purchase.dateMillis !== 'number') {
      return;
    }

    const trendKey = resolveTrendKey(purchase.dateMillis, groupBy);
    const entry = createTrendEntry(trend, trendKey.key, trendKey.label);
    entry.total += purchase.total;
    entry.purchases += 1;
    entry.items += purchase.items;
    entry.pending += purchase.balance;
    entry.paid += purchase.paid;
  });

  const trendPoints = Array.from(trend.values())
    .sort((left, right) => left.key.localeCompare(right.key))
    .map(
      (point) =>
        ({
          key: point.key,
          label: point.label,
          total: point.total,
          purchases: point.purchases,
          items: point.items,
          pending: point.pending,
          paid: point.paid,
        }) satisfies PurchaseTrendPoint,
    );

  const strongest =
    trendPoints.reduce<PurchaseTrendPoint | null>((best, point) => {
      if (!best || point.total > best.total) {
        return point;
      }
      return best;
    }, null) ?? null;

  const latest =
    trendPoints.length > 0 ? trendPoints[trendPoints.length - 1] : null;

  return {
    totals: {
      spend: totalSpend,
      paid: totalPaid,
      pending: totalPending,
      averageTicket:
        normalizedPurchases.length > 0
          ? totalSpend / normalizedPurchases.length
          : 0,
      purchases: normalizedPurchases.length,
      providers: providerIds.size,
      items: totalItems,
      purchasesWithBalance,
    },
    trend: {
      groupBy,
      points: trendPoints,
      strongest,
      latest,
      averageSpend:
        trendPoints.length > 0
          ? trendPoints.reduce((sum, point) => sum + point.total, 0) /
            trendPoints.length
          : 0,
    },
    providers: formatBreakdown(providers, totalSpend),
    conditions: formatBreakdown(conditions, totalSpend),
    categories: formatBreakdown(categories, totalSpend),
    paymentStatuses: formatBreakdown(paymentStatuses, totalSpend),
  };
};
