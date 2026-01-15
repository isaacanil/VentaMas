import { DateTime } from 'luxon';

import { getTotalPrice, getTax } from '@/utils/pricing';
import type { InvoiceData, InvoiceProduct } from '@/types/invoice';
import type { ProductPricing } from '@/types/products';
import type {
  UtilityDateRange,
  UtilityDistributionColors,
  UtilityDistributionSegment,
  UtilityMetricsResult,
  UtilitySummary,
  UtilityDailyMetric,
  UtilityHourlyMetric,
  UtilityProductBreakdown,
  UtilityInvoiceEntry,
  UtilityExpenseEntry,
} from '@/modules/utility/pages/Utility/types';

type PricingLike =
  | ProductPricing
  | (Record<string, unknown> & { cost?: unknown });
type InvoiceDataLike = InvoiceData & Record<string, unknown>;
type CostDetails = {
  unit?: unknown;
  value?: unknown;
  perUnit?: unknown;
  total?: unknown;
  amountTotal?: unknown;
  amount?: unknown;
  totalCost?: unknown;
};
type UtilityProductInput = InvoiceProduct & {
  selectedSaleUnit?: { pricing?: PricingLike };
  pricing?: PricingLike;
  amountToBuy?:
  | number
  | string
  | {
    total?: number;
    unit?: number;
  };
  price?: { total?: number | string; unit?: number | string } | number | string;
  totalPrice?: number | string;
  unitPrice?: number | string;
  quantity?: number | string;
  units?: number | string;
  amount?: number | string;
  cost?: { unit?: number; total?: number } | number | string;
  tax?: { total?: number; value?: number };
  customName?: string;
  shortName?: string;
  description?: string;
  sku?: string;
  productName?: string;
};


const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toNullableNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const pickNumber = (...candidates: unknown[]): number | null => {
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) continue;
    if (typeof candidate === 'string' && candidate.trim() === '') continue;
    const numeric = toNullableNumber(candidate);
    if (numeric !== null) {
      return numeric;
    }
  }
  return null;
};

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const resolveInvoiceData = (invoice: UtilityInvoiceEntry): InvoiceDataLike => {
  const record = toRecord(invoice);
  const candidate = record.data;
  if (candidate && typeof candidate === 'object') {
    return candidate as InvoiceDataLike;
  }
  return record as InvoiceDataLike;
};

const getDateFromData = (dateLike: unknown): number | null => {
  if (!dateLike) return null;
  if (typeof dateLike === 'number') return dateLike;
  if (dateLike instanceof Date) return dateLike.getTime();
  const candidate = dateLike as { seconds?: number; _seconds?: number };
  if (candidate?.seconds) return candidate.seconds * 1000;
  if (candidate?._seconds) return candidate._seconds * 1000;
  return null;
};

const resolveProductName = (product: UtilityProductInput): string | null => {
  const candidates = [
    product?.name,
    product?.productName,
    product?.customName,
    product?.shortName,
    product?.description,
    product?.sku,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed) return trimmed;
    }
  }

  return null;
};

const resolvePricing = (product: UtilityProductInput): PricingLike => {
  if (product?.selectedSaleUnit?.pricing) {
    return product.selectedSaleUnit.pricing;
  }

  if (product?.pricing && typeof product.pricing === 'object') {
    return product.pricing;
  }

  return {};
};

const resolveQuantity = (product: UtilityProductInput): number => {
  const rawAmount = product?.amountToBuy;
  if (typeof rawAmount === 'number') {
    return rawAmount > 0 ? rawAmount : 0;
  }
  if (typeof rawAmount === 'string') {
    const parsed = Number(rawAmount);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }
  if (rawAmount && typeof rawAmount === 'object') {
    const total = Number(rawAmount.total);
    if (Number.isFinite(total) && total > 0) return total;
    const unit = Number(rawAmount.unit);
    if (Number.isFinite(unit) && unit > 0) return unit;
  }
  const fallbackCandidates = [
    product?.quantity,
    product?.units,
    product?.amount,
  ];
  const fallback = pickNumber(...fallbackCandidates);
  return fallback !== null && fallback > 0 ? fallback : 1;
};

const resolveSaleTotal = (
  product: UtilityProductInput,
  taxEnabled: boolean,
): number => {
  const computedTotal = getTotalPrice(product, taxEnabled);
  if (Number.isFinite(computedTotal) && computedTotal > 0) {
    return computedTotal;
  }

  const priceTotal =
    toNullableNumber(product?.price?.total) ??
    toNullableNumber(product?.totalPrice) ??
    null;
  if (priceTotal !== null && Number.isFinite(priceTotal)) {
    return priceTotal;
  }

  const priceUnit =
    toNullableNumber(product?.price?.unit) ??
    toNullableNumber(product?.unitPrice) ??
    null;
  const quantity = resolveQuantity(product);
  if (
    priceUnit !== null &&
    Number.isFinite(priceUnit) &&
    Number.isFinite(quantity)
  ) {
    return priceUnit * quantity;
  }

  const directPrice = toNullableNumber(product?.price);
  if (
    directPrice !== null &&
    Number.isFinite(directPrice) &&
    Number.isFinite(quantity)
  ) {
    return directPrice * quantity;
  }

  return 0;
};

const resolveExpenseAmount = (expenseEntry: UtilityExpenseEntry): number => {
  const expense = expenseEntry?.expense ?? expenseEntry ?? {};
  const expenseRecord = toRecord(expense);
  const nestedAmount =
    expenseRecord.amount && typeof expenseRecord.amount === 'object'
      ? (expenseRecord.amount as { value?: unknown }).value
      : undefined;
  const amount = pickNumber(
    expenseRecord.amount,
    expenseRecord.value,
    expenseRecord.total,
    nestedAmount,
  );
  return amount ?? 0;
};

const resolveExpenseTimestamp = (expenseEntry: UtilityExpenseEntry): number | null => {
  const entryRecord = toRecord(expenseEntry);
  const expenseValue = entryRecord.expense;
  const expenseRecord =
    expenseValue && typeof expenseValue === 'object'
      ? (expenseValue as Record<string, unknown>)
      : entryRecord;
  const dates = toRecord(expenseRecord.dates);
  const candidates = [
    dates.expenseDate,
    dates.createdAt,
    dates.updatedAt,
    expenseRecord.expenseDate,
    expenseRecord.createdAt,
    expenseRecord.updatedAt,
  ];

  for (const candidate of candidates) {
    const millis = getDateFromData(candidate);
    if (Number.isFinite(millis)) {
      return millis;
    }
  }

  return null;
};

export const buildFinancialMetrics = (
  invoices: UtilityInvoiceEntry[] | null | undefined,
  expenses: UtilityExpenseEntry[] | null | undefined,
  range?: UtilityDateRange | null,
): UtilityMetricsResult => {
  const safeInvoices: UtilityInvoiceEntry[] = Array.isArray(invoices) ? invoices : [];
  const safeExpenses: UtilityExpenseEntry[] = Array.isArray(expenses) ? expenses : [];

  const perProduct = new Map<string, UtilityProductBreakdown>();
  const daily = new Map<string, { sales: number; cost: number; taxes: number; expenses: number }>();
  const hourly = new Map<number, { sales: number; cost: number; taxes: number; expenses: number }>();

  const ensureDailyEntry = (
    millis?: number | null,
  ): { sales: number; cost: number; taxes: number; expenses: number } | null => {
    if (!millis) return null;
    const isoDate = DateTime.fromMillis(millis).startOf('day').toISODate() || '';
    if (!daily.has(isoDate)) {
      daily.set(isoDate, {
        sales: 0,
        cost: 0,
        taxes: 0,
        expenses: 0,
      });
    }
    return daily.get(isoDate) || null;
  };

  const ensureHourlyEntry = (
    millis?: number | null,
  ): { sales: number; cost: number; taxes: number; expenses: number } | null => {
    if (!millis) return null;
    const hourKey = DateTime.fromMillis(millis).startOf('hour').toMillis();
    if (!hourly.has(hourKey)) {
      hourly.set(hourKey, {
        sales: 0,
        cost: 0,
        taxes: 0,
        expenses: 0,
      });
    }
    return hourly.get(hourKey);
  };

  const totalExpenses = safeExpenses.reduce(
    (acc, item) => acc + resolveExpenseAmount(item),
    0,
  );

  safeExpenses.forEach((item) => {
    const expenseDate = resolveExpenseTimestamp(item);
    const expenseAmount = resolveExpenseAmount(item);

    const entry = ensureDailyEntry(expenseDate);
    if (entry) {
      entry.expenses += expenseAmount;
    }

    const hourlyEntry = ensureHourlyEntry(expenseDate);
    if (hourlyEntry) {
      hourlyEntry.expenses += expenseAmount;
    }
  });

  const summary: UtilitySummary = {
    totalSales: 0,
    totalCost: 0,
    totalTaxes: 0,
    totalExpenses,
    profitBeforeExpenses: 0,
    netProfit: 0,
  };

  safeInvoices.forEach((invoice) => {
    const invoiceData = resolveInvoiceData(invoice);
    const invoiceProducts = Array.isArray(invoiceData.products)
      ? invoiceData.products
      : [];
    const taxReceipt = invoiceData.taxReceipt;
    const taxReceiptEnabled =
      taxReceipt && typeof taxReceipt === 'object'
        ? (taxReceipt as { enabled?: unknown }).enabled
        : undefined;
    const taxEnabled =
      typeof taxReceiptEnabled === 'boolean'
        ? taxReceiptEnabled
        : typeof invoiceData.taxReceiptEnabled === 'boolean'
          ? invoiceData.taxReceiptEnabled
          : true;

    const invoiceSales =
      toNumber(invoiceData?.totalPurchase?.value) ||
      invoiceProducts.reduce((acc, entry) => {
        const product = (entry as { product?: UtilityProductInput })?.product ??
          entry ??
          {};
        return acc + resolveSaleTotal(product as UtilityProductInput, taxEnabled);
      }, 0);
    let invoiceCost = 0;
    let aggregatedProductTaxes = 0;

    invoiceProducts.forEach((productEntry) => {
      if (!productEntry || typeof productEntry !== 'object') return;

      const { product: nestedProduct, ...productRest } = productEntry ?? {};
      const nestedRecord =
        nestedProduct && typeof nestedProduct === 'object'
          ? (nestedProduct as Record<string, unknown>)
          : null;
      const hasNestedDetails = Boolean(
        nestedRecord &&
        (nestedRecord.pricing ||
          nestedRecord.selectedSaleUnit ||
          nestedRecord.amountToBuy ||
          nestedRecord.cost ||
          nestedRecord.quantity ||
          nestedRecord.units),
      );
      const product = (hasNestedDetails
        ? { ...productRest, ...nestedRecord }
        : productRest) as UtilityProductInput;

      const pricing = resolvePricing(product);

      const quantity = resolveQuantity(product);
      const totalSale = resolveSaleTotal(product, taxEnabled);
      const validQuantity = Number.isFinite(quantity) && quantity > 0;

      const pricingCost = pricing?.cost;
      const costDetails =
        pricingCost && typeof pricingCost === 'object'
          ? (pricingCost as CostDetails)
          : null;
      const pricingCostNumber =
        pricingCost && typeof pricingCost === 'number'
          ? toNullableNumber(pricingCost)
          : null;

      const rawCost = product?.cost;
      const costRecord =
        rawCost && typeof rawCost === 'object'
          ? (rawCost as { unit?: unknown; total?: unknown })
          : null;
      const unitCost =
        pickNumber(
          costRecord?.unit,
          rawCost,
          pricingCostNumber,
          costDetails?.unit,
          costDetails?.value,
          costDetails?.perUnit,
        ) ?? 0;

      const explicitTotalCost = pickNumber(
        costRecord?.total,
        costDetails?.total,
        costDetails?.amountTotal,
        costDetails?.amount,
        costDetails?.totalCost,
      );

      const totalCost =
        explicitTotalCost !== null
          ? explicitTotalCost
          : pricingCostNumber !== null
            ? pricingCostNumber * quantity
            : unitCost * quantity;

      let totalTaxes = getTax(product, taxEnabled);
      if (!(totalTaxes > 0)) {
        totalTaxes = toNumber(product?.tax?.total);
      }
      if (!(totalTaxes > 0)) {
        const taxRate = toNumber(product?.tax?.value);
        if (taxRate > 0 && totalSale > 0) {
          const saleWithoutTax = totalSale / (1 + taxRate);
          totalTaxes = totalSale - saleWithoutTax;
        }
      }
      totalTaxes = toNumber(totalTaxes);

      invoiceCost += totalCost;
      aggregatedProductTaxes += totalTaxes;

      const productName = resolveProductName(product) || 'Producto sin nombre';

      const productKey =
        [product?.id, product?.cid, product?.sku, productName.toLowerCase()]
          .filter(Boolean)
          .join('-') ||
        product?.id ||
        productName ||
        `producto-${perProduct.size + 1}`;

      const stored = perProduct.get(productKey) || {
        name: productName,
        quantity: 0,
        sales: 0,
        cost: 0,
        taxes: 0,
        profit: 0,
        instances: 0,
        averageUnitPrice: 0,
      };

      if (validQuantity) {
        stored.quantity += quantity;
      }
      stored.sales += totalSale;
      stored.cost += totalCost;
      stored.taxes += totalTaxes;
      stored.profit += totalSale - totalCost - totalTaxes;
      stored.instances += 1;

      perProduct.set(productKey, stored);
    });

    const invoiceTaxes = toNumber(invoiceData.totalTaxes?.value);
    const taxesForInvoice = invoiceTaxes || aggregatedProductTaxes;

    summary.totalSales += invoiceSales;
    summary.totalCost += invoiceCost;
    summary.totalTaxes += taxesForInvoice;

    const dateMillis = getDateFromData(invoiceData.date);
    const dailyEntry = ensureDailyEntry(dateMillis);
    if (dailyEntry) {
      dailyEntry.sales += invoiceSales;
      dailyEntry.cost += invoiceCost;
      dailyEntry.taxes += taxesForInvoice;
    }

    const hourlyEntry = ensureHourlyEntry(dateMillis);
    if (hourlyEntry) {
      hourlyEntry.sales += invoiceSales;
      hourlyEntry.cost += invoiceCost;
      hourlyEntry.taxes += taxesForInvoice;
    }
  });

  summary.profitBeforeExpenses =
    summary.totalSales - summary.totalCost - summary.totalTaxes;
  summary.netProfit = summary.profitBeforeExpenses - summary.totalExpenses;

  let startDay = range?.startDate
    ? DateTime.fromMillis(range.startDate).startOf('day')
    : null;
  let endDay = range?.endDate
    ? DateTime.fromMillis(range.endDate).startOf('day')
    : null;

  if (startDay && endDay) {
    let cursor = startDay;
    while (cursor.toMillis() <= endDay.toMillis()) {
      const key = cursor.toISODate() || '';
      if (!daily.has(key)) {
        daily.set(key, {
          sales: 0,
          cost: 0,
          taxes: 0,
          expenses: 0,
        });
      }
      cursor = cursor.plus({ days: 1 });
    }
  }

  if (range?.startDate && range?.endDate) {
    const startHour = DateTime.fromMillis(range.startDate).startOf('hour');
    const endHour = DateTime.fromMillis(range.endDate).endOf('hour');
    const totalHours = Math.max(
      0,
      Math.floor(endHour.diff(startHour, 'hours').hours),
    );
    if (totalHours <= 24 * 7) {
      let cursor = startHour;
      while (cursor.toMillis() <= endHour.toMillis()) {
        const key = cursor.toMillis();
        if (!hourly.has(key)) {
          hourly.set(key, {
            sales: 0,
            cost: 0,
            taxes: 0,
            expenses: 0,
          });
        }
        cursor = cursor.plus({ hours: 1 });
      }
    }
  }

  const dailyMetrics: UtilityDailyMetric[] = Array.from(daily.entries()).map(([key, value]) => {
    const date = DateTime.fromISO(key);
    const profitBeforeExpenses = value.sales - value.cost - value.taxes;
    const netProfit = profitBeforeExpenses - value.expenses;

    return {
      isoDate: key,
      timestamp: date.toMillis(),
      dateLabel: (date.isValid ? date.setLocale('es').toFormat('cccc dd/LL/yyyy') : 'Fecha inválida'),
      sales: value.sales,
      cost: value.cost,
      taxes: value.taxes,
      expenses: value.expenses,
      profitBeforeExpenses,
      netProfit,
    };
  });

  dailyMetrics.sort((a, b) => a.timestamp - b.timestamp);

  const hourlyMetrics: UtilityHourlyMetric[] = Array.from(hourly.entries()).map(([key, value]) => {
    const date = DateTime.fromMillis(key);
    const profitBeforeExpenses = value.sales - value.cost - value.taxes;
    const netProfit = profitBeforeExpenses - value.expenses;

    return {
      isoDate: date.toISO() || '',
      timestamp: date.toMillis(),
      dateLabel: date.setLocale('es').toFormat('HH:mm'),
      sales: value.sales,
      cost: value.cost,
      taxes: value.taxes,
      expenses: value.expenses,
      profitBeforeExpenses,
      netProfit,
    };
  });

  hourlyMetrics.sort((a, b) => a.timestamp - b.timestamp);

  const productsBreakdown: UtilityProductBreakdown[] = Array.from(perProduct.values())
    .map((item) => ({
      ...item,
      averageUnitPrice:
        item.quantity > 0 && item.sales > 0 ? item.sales / item.quantity : 0,
    }))
    .filter((item) => item.sales > 0)
    .sort((a, b) => b.sales - a.sales);

  return { summary, productsBreakdown, dailyMetrics, hourlyMetrics };
};

export const getDistributionDetails = (
  summary: UtilitySummary | null | undefined,
  colors: UtilityDistributionColors,
): UtilityDistributionSegment[] => {
  if (!summary) return [];

  const totalCost = toNumber(summary.totalCost);
  const totalExpenses = toNumber(summary.totalExpenses);
  const totalTaxes = toNumber(summary.totalTaxes);
  const netProfitValue = toNumber(summary.netProfit);

  type DistributionBase = Omit<
    UtilityDistributionSegment,
    'chartValue' | 'rawPercentage' | 'percentage'
  >;
  const netSegment: DistributionBase =
    netProfitValue >= 0
      ? {
        key: 'netProfit',
        label: 'Ganancia neta',
        value: netProfitValue,
        color: colors.netProfit,
      }
      : {
        key: 'netLoss',
        label: 'Pérdida neta',
        value: netProfitValue,
        color: colors.netLoss,
      };

  const segments: DistributionBase[] = [
    { key: 'cost', label: 'Costos', value: totalCost, color: colors.cost },
    {
      key: 'expenses',
      label: 'Gastos operativos',
      value: totalExpenses,
      color: colors.expenses,
    },
    netSegment,
    { key: 'taxes', label: 'ITBIS', value: totalTaxes, color: colors.taxes },
  ];

  const totalForChart = segments.reduce(
    (acc, segment) => acc + Math.max(segment.value, 0),
    0,
  );

  const segmentsWithPercentages = segments.map((segment) => {
    const chartValue = Math.max(segment.value, 0);
    const rawPercentage =
      totalForChart > 0 ? (chartValue / totalForChart) * 100 : 0;

    return {
      ...segment,
      chartValue,
      rawPercentage,
    };
  });

  const lastPositiveIndex = segmentsWithPercentages.reduce(
    (lastIndex, segment, index) => (segment.chartValue > 0 ? index : lastIndex),
    -1,
  );

  let accumulatedRounded = 0;

  return segmentsWithPercentages.map((segment, index) => {
    if (segment.chartValue <= 0 || lastPositiveIndex === -1) {
      return {
        ...segment,
        percentage: 0,
        rawPercentage: segment.rawPercentage,
      };
    }

    if (index === lastPositiveIndex) {
      const adjusted = Math.max(
        0,
        Number((100 - accumulatedRounded).toFixed(1)),
      );
      return {
        ...segment,
        percentage: adjusted,
        rawPercentage: segment.rawPercentage,
      };
    }

    const rounded = Math.round(segment.rawPercentage * 10) / 10;
    accumulatedRounded += rounded;

    return {
      ...segment,
      percentage: rounded,
      rawPercentage: segment.rawPercentage,
    };
  });
};

export const formatPercentage = (value: number | null | undefined): string => {
  if (!Number.isFinite(value)) return '0%';
  const formatted = value.toFixed(1);
  return `${value >= 0 ? '+' : ''}${formatted}%`;
};

export { toNumber, getDateFromData };
