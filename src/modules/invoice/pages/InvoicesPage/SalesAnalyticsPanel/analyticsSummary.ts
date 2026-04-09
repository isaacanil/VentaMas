import { DateTime } from 'luxon';

import {
  formatLocaleDate,
  formatLocaleMonthYear,
} from '@/utils/date/dateUtils';
import { formatPrice } from '@/utils/format';
import { getInvoicePaymentInfo } from '@/utils/invoice';

import { getInvoiceDateSeconds, toNumber, type SalesRecord } from './utils';

type BreakdownSeed = {
  key: string;
  label: string;
  value: number;
  count: number;
};

type CategorySeed = {
  key: string;
  label: string;
  total: number;
  items: number;
};

export type CustomerProductRow = {
  nombre?: string;
  precio: number;
  cantidad: number;
  subtotal: number;
};

export type CustomerInvoiceRow = {
  key: string;
  numberID?: string | number;
  fecha: string;
  productos: CustomerProductRow[];
  total: number;
  items: number;
};

export type CustomerSummaryRow = {
  key: string;
  cliente: string;
  items: number;
  total: number;
  invoiceCount: number;
  averageTicket: number;
  lastPurchaseDate: string;
  lastPurchaseSeconds: number | null;
  facturas: CustomerInvoiceRow[];
  share: number;
  isGeneric: boolean;
};

export type TrendPoint = {
  key: string;
  label: string;
  total: number;
  invoices: number;
  items: number;
  discounts: number;
  taxes: number;
};

export type BreakdownItem = {
  key: string;
  label: string;
  value: number;
  count: number;
  share: number;
};

export type CategoryPerformanceItem = {
  key: string;
  label: string;
  total: number;
  items: number;
  share: number;
};

export type SalesAnalyticsSummary = {
  totals: {
    sales: number;
    paid: number;
    pending: number;
    invoices: number;
    customers: number;
    items: number;
    averageTicket: number;
    discounts: number;
    taxes: number;
    genericSales: number;
    namedSales: number;
  };
  trend: {
    groupBy: 'hour' | 'day' | 'month';
    points: TrendPoint[];
    strongest: TrendPoint | null;
    latest: TrendPoint | null;
    averageSales: number;
  };
  paymentMethods: BreakdownItem[];
  purchaseTypes: BreakdownItem[];
  categories: CategoryPerformanceItem[];
  topCustomers: CustomerSummaryRow[];
  customers: CustomerSummaryRow[];
};

type TrendSeed = {
  key: string;
  label: string;
  total: number;
  invoices: number;
  items: number;
  discounts: number;
  taxes: number;
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  creditNote: 'Nota de credito',
};

const FALLBACK_CATEGORY = 'Sin categoria';
const FALLBACK_CUSTOMER = 'Cliente sin nombre';
const FALLBACK_PURCHASE_TYPE = 'Sin origen';
const GENERIC_CUSTOMER_KEY = '__generic_customer__';
const GENERIC_CUSTOMER_LABEL = 'Cliente generico';

const isGenericCustomer = (value: string) =>
  /generico|gen[eé]rico|generic client/i.test(value);

const normalizeCustomerName = (sale: SalesRecord) =>
  sale.data.client?.name?.trim() || FALLBACK_CUSTOMER;

const normalizeCategoryName = (categoryValue: unknown) => {
  if (typeof categoryValue === 'string' && categoryValue.trim()) {
    return categoryValue.trim();
  }

  if (
    categoryValue &&
    typeof categoryValue === 'object' &&
    'name' in categoryValue &&
    typeof (categoryValue as { name?: unknown }).name === 'string'
  ) {
    return (
      (categoryValue as { name: string }).name || FALLBACK_CATEGORY
    ).trim();
  }

  return FALLBACK_CATEGORY;
};

const normalizePurchaseType = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) {
    return FALLBACK_PURCHASE_TYPE;
  }

  return value
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
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

const createCategoryEntry = (map: Map<string, CategorySeed>, label: string) => {
  if (!map.has(label)) {
    map.set(label, {
      key: label,
      label,
      total: 0,
      items: 0,
    });
  }

  return map.get(label)!;
};

const createCustomerEntry = (
  map: Map<string, CustomerSummaryRow>,
  key: string,
  label: string,
) => {
  if (!map.has(key)) {
    map.set(key, {
      key,
      cliente: label,
      items: 0,
      total: 0,
      invoiceCount: 0,
      averageTicket: 0,
      lastPurchaseDate: 'N/A',
      lastPurchaseSeconds: null,
      facturas: [],
      share: 0,
      isGeneric: isGenericCustomer(label),
    });
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
      invoices: 0,
      items: 0,
      discounts: 0,
      taxes: 0,
    });
  }

  return map.get(key)!;
};

const resolveTrendKey = (
  seconds: number,
  groupBy: 'hour' | 'day' | 'month',
): { key: string; label: string } => {
  const date = DateTime.fromSeconds(seconds);

  if (groupBy === 'month') {
    return {
      key: date.toFormat('yyyy-MM'),
      label: formatLocaleMonthYear(date.toJSDate()),
    };
  }

  if (groupBy === 'hour') {
    return {
      key: date.toFormat('yyyy-MM-dd-HH'),
      label: date.toFormat('HH:mm'),
    };
  }

  return {
    key: date.toFormat('yyyy-MM-dd'),
    label: formatLocaleDate(date.toJSDate()),
  };
};

const sortBreakdown = (items: BreakdownItem[]) =>
  items.sort((left, right) => {
    if (right.value !== left.value) return right.value - left.value;
    return right.count - left.count;
  });

export const buildSalesAnalyticsSummary = (
  sales: SalesRecord[],
): SalesAnalyticsSummary => {
  const safeSales = Array.isArray(sales) ? sales : [];

  const paymentMethods = new Map<string, BreakdownSeed>();
  const purchaseTypes = new Map<string, BreakdownSeed>();
  const categories = new Map<string, CategorySeed>();
  const customers = new Map<string, CustomerSummaryRow>();

  let totalSales = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let totalItems = 0;
  let totalDiscounts = 0;
  let totalTaxes = 0;
  let genericSales = 0;
  let namedSales = 0;
  let minDateSeconds = Number.POSITIVE_INFINITY;
  let maxDateSeconds = Number.NEGATIVE_INFINITY;

  safeSales.forEach((sale, saleIndex) => {
    const seconds = getInvoiceDateSeconds(sale.data);
    const totalPurchase = toNumber(sale.data.totalPurchase?.value);
    const items = toNumber(sale.data.totalShoppingItems?.value);
    const discount = toNumber(sale.data.discount?.value);
    const taxes = toNumber(sale.data.totalTaxes?.value);
    const customerName = normalizeCustomerName(sale);
    const customerIsGeneric = isGenericCustomer(customerName);
    const customerKey = customerIsGeneric
      ? GENERIC_CUSTOMER_KEY
      : String(sale.data.client?.id ?? customerName);
    const customerLabel = customerIsGeneric
      ? GENERIC_CUSTOMER_LABEL
      : customerName;
    const customerEntry = createCustomerEntry(
      customers,
      customerKey,
      customerLabel,
    );
    const paymentInfo = getInvoicePaymentInfo(sale.data);
    const invoiceDateLabel =
      typeof seconds === 'number'
        ? DateTime.fromSeconds(seconds).toFormat('dd/MM/yyyy')
        : 'N/A';

    totalSales += totalPurchase;
    totalPaid += toNumber(paymentInfo.paid);
    totalPending += toNumber(paymentInfo.pending);
    totalItems += items;
    totalDiscounts += discount;
    totalTaxes += taxes;

    if (customerEntry.isGeneric) {
      genericSales += totalPurchase;
    } else {
      namedSales += totalPurchase;
    }

    customerEntry.items += items;
    customerEntry.total += totalPurchase;
    customerEntry.invoiceCount += 1;

    if (typeof seconds === 'number') {
      minDateSeconds = Math.min(minDateSeconds, seconds);
      maxDateSeconds = Math.max(maxDateSeconds, seconds);

      if (
        customerEntry.lastPurchaseSeconds === null ||
        seconds > customerEntry.lastPurchaseSeconds
      ) {
        customerEntry.lastPurchaseSeconds = seconds;
        customerEntry.lastPurchaseDate = invoiceDateLabel;
      }
    }

    customerEntry.facturas.push({
      key: `${customerKey}-${sale.data.numberID ?? saleIndex}`,
      numberID: sale.data.numberID,
      fecha: invoiceDateLabel,
      total: totalPurchase,
      items,
      productos: (sale.data.products ?? []).map((product, productIndex) => {
        const taxPercent = toNumber(product.pricing?.tax);
        const price = toNumber(product.pricing?.price);
        const quantity = toNumber(
          typeof product.amountToBuy === 'number'
            ? product.amountToBuy
            : (product.amountToBuy?.total ?? product.amountToBuy?.unit),
        );
        const unitPrice = price + price * (taxPercent / 100);

        return {
          nombre:
            product.name ??
            product.productName ??
            `Producto ${productIndex + 1}`,
          precio: unitPrice,
          cantidad: quantity,
          subtotal: unitPrice * quantity,
        };
      }),
    });

    (sale.data.paymentMethod ?? []).forEach((method, methodIndex) => {
      if (!method.status) return;

      const key = String(method.method ?? `method-${methodIndex}`);
      const label = PAYMENT_METHOD_LABELS[key] ?? key;
      const entry = createBreakdownEntry(paymentMethods, key, label);

      entry.value += toNumber(method.value);
      entry.count += 1;
    });

    const purchaseType = normalizePurchaseType(sale.data.sourceOfPurchase);
    const purchaseTypeEntry = createBreakdownEntry(
      purchaseTypes,
      purchaseType,
      purchaseType,
    );
    purchaseTypeEntry.count += 1;
    purchaseTypeEntry.value += totalPurchase;

    (sale.data.products ?? []).forEach((product) => {
      const category = normalizeCategoryName(product.category);
      const categoryEntry = createCategoryEntry(categories, category);
      const price = toNumber(product.pricing?.price);
      const taxPercent = toNumber(product.pricing?.tax);
      const quantity = toNumber(
        typeof product.amountToBuy === 'number'
          ? product.amountToBuy
          : (product.amountToBuy?.total ?? product.amountToBuy?.unit),
      );
      const subtotal = price * quantity;

      categoryEntry.items += quantity;
      categoryEntry.total += subtotal + subtotal * (taxPercent / 100);
    });
  });

  const hasDates =
    Number.isFinite(minDateSeconds) && Number.isFinite(maxDateSeconds);
  const spanInDays = hasDates
    ? Math.max(1, Math.ceil((maxDateSeconds - minDateSeconds) / 86400) + 1)
    : 0;
  const trendGroupBy =
    spanInDays <= 1 ? 'hour' : spanInDays > 62 ? 'month' : 'day';
  const trendMap = new Map<string, TrendSeed>();

  safeSales.forEach((sale) => {
    const seconds = getInvoiceDateSeconds(sale.data);

    if (typeof seconds !== 'number') return;

    const trendKey = resolveTrendKey(seconds, trendGroupBy);
    const trendEntry = createTrendEntry(trendMap, trendKey.key, trendKey.label);

    trendEntry.total += toNumber(sale.data.totalPurchase?.value);
    trendEntry.invoices += 1;
    trendEntry.items += toNumber(sale.data.totalShoppingItems?.value);
    trendEntry.discounts += toNumber(sale.data.discount?.value);
    trendEntry.taxes += toNumber(sale.data.totalTaxes?.value);
  });

  const trendPoints = [...trendMap.values()].sort((left, right) =>
    left.key.localeCompare(right.key),
  );
  const strongest =
    trendPoints.length > 0
      ? trendPoints.reduce((currentStrongest, point) =>
          point.total > currentStrongest.total ? point : currentStrongest,
        )
      : null;
  const latest =
    trendPoints.length > 0 ? trendPoints[trendPoints.length - 1] : null;
  const averageSales =
    trendPoints.length > 0
      ? trendPoints.reduce((acc, point) => acc + point.total, 0) /
        trendPoints.length
      : 0;

  const paymentMethodItems = sortBreakdown(
    [...paymentMethods.values()].map((item) => ({
      ...item,
      share: totalSales > 0 ? item.value / totalSales : 0,
    })),
  );

  const purchaseTypeItems = sortBreakdown(
    [...purchaseTypes.values()].map((item) => ({
      ...item,
      share: safeSales.length > 0 ? item.count / safeSales.length : 0,
    })),
  );

  const categoryItems = [...categories.values()]
    .map((item) => ({
      ...item,
      share: totalSales > 0 ? item.total / totalSales : 0,
    }))
    .sort((left, right) => right.total - left.total);

  const customerItems = [...customers.values()]
    .map((item) => ({
      ...item,
      averageTicket: item.invoiceCount > 0 ? item.total / item.invoiceCount : 0,
      share: totalSales > 0 ? item.total / totalSales : 0,
      facturas: [...item.facturas].sort((left, right) => {
        const leftValue = DateTime.fromFormat(
          left.fecha,
          'dd/MM/yyyy',
        ).toMillis();
        const rightValue = DateTime.fromFormat(
          right.fecha,
          'dd/MM/yyyy',
        ).toMillis();

        return rightValue - leftValue;
      }),
    }))
    .sort((left, right) => right.total - left.total);

  return {
    totals: {
      sales: totalSales,
      paid: totalPaid,
      pending: totalPending,
      invoices: safeSales.length,
      customers: customerItems.length,
      items: totalItems,
      averageTicket: safeSales.length > 0 ? totalSales / safeSales.length : 0,
      discounts: totalDiscounts,
      taxes: totalTaxes,
      genericSales,
      namedSales,
    },
    trend: {
      groupBy: trendGroupBy,
      points: trendPoints,
      strongest,
      latest,
      averageSales,
    },
    paymentMethods: paymentMethodItems,
    purchaseTypes: purchaseTypeItems,
    categories: categoryItems.slice(0, 8),
    topCustomers: customerItems.filter((item) => !item.isGeneric).slice(0, 6),
    customers: customerItems,
  };
};

export const formatTrendHighlight = (point: TrendPoint | null) => {
  if (!point) return 'Sin registros en el rango actual';

  return `${point.label} · ${formatPrice(point.total)}`;
};
