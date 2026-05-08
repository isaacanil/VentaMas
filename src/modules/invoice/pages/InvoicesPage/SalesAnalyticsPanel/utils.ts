import type { InvoiceData } from '@/types/invoice';
import type { TimestampLike } from '@/utils/date/types';
import {
  formatLocaleDate,
  formatLocaleMonthYear,
} from '@/utils/date/dateUtils';

export type SalesRecord = {
  data: InvoiceData;
};

export type SalesChartDateFormat = 'shortDate' | 'longDate' | 'monthYear';
export type SalesPeriodType = 'monthly' | 'quarterly';

export type SalesDateSpan = {
  min: number;
  max: number;
};

const MONTH_IN_MS = 1000 * 60 * 60 * 24 * 30;

export const resolveTimestampSeconds = (
  value: TimestampLike | { seconds?: number } | null | undefined,
): number | null => {
  if (!value) return null;
  if (typeof value === 'number') {
    return value > 1e12 ? Math.floor(value / 1000) : value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return null;
    return parsed > 1e12 ? Math.floor(parsed / 1000) : parsed;
  }
  if (value instanceof Date) {
    return Math.floor(value.getTime() / 1000);
  }
  if (typeof (value as { seconds?: number }).seconds === 'number') {
    return (value as { seconds?: number }).seconds ?? null;
  }
  if (typeof (value as { toMillis?: () => number }).toMillis === 'function') {
    const millis = (value as { toMillis?: () => number }).toMillis?.();
    if (typeof millis === 'number') {
      return Math.floor(millis / 1000);
    }
  }
  return null;
};

export const getInvoiceDateSeconds = (
  invoice?: InvoiceData | null,
): number | null => resolveTimestampSeconds(invoice?.date ?? null);

export const formatSalesChartDate = (
  seconds: number,
  format: SalesChartDateFormat = 'shortDate',
) => {
  const date = new Date(seconds * 1000);
  if (format === 'monthYear') return formatLocaleMonthYear(date);
  if (format === 'longDate') {
    return formatLocaleDate(date, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  return formatLocaleDate(date);
};

export const getSalesDateSpan = (sales: SalesRecord[]): SalesDateSpan =>
  sales.reduce<SalesDateSpan>(
    (span, sale) => {
      const seconds = getInvoiceDateSeconds(sale.data);
      if (!seconds) return span;
      const millis = seconds * 1000;
      return {
        min: Math.min(span.min, millis),
        max: Math.max(span.max, millis),
      };
    },
    { min: Infinity, max: -Infinity },
  );

export const shouldGroupSalesByMonth = (sales: SalesRecord[]) => {
  if (!sales.length) return false;
  const dateSpan = getSalesDateSpan(sales);
  if (!Number.isFinite(dateSpan.min) || !Number.isFinite(dateSpan.max)) {
    return false;
  }
  return (dateSpan.max - dateSpan.min) / MONTH_IN_MS > 2;
};

export const getSalesPeriodKey = (
  date: Date,
  periodType: SalesPeriodType,
) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (periodType === 'monthly') {
    return `${year}-${month.toString().padStart(2, '0')}`;
  }

  const quarter = Math.floor(month / 3) + 1;
  return `${year}-Q${quarter}`;
};

export const formatSalesPeriodDisplay = (
  period: string,
  periodType: SalesPeriodType,
) => {
  if (periodType === 'monthly') {
    const [year, month] = period.split('-');
    const yearNumber = Number(year);
    const monthNumber = Number(month);
    const date = new Date(
      Number.isFinite(yearNumber) ? yearNumber : new Date().getFullYear(),
      Number.isFinite(monthNumber) ? monthNumber : 0,
      1,
    );
    return formatLocaleMonthYear(date);
  }

  const [year, quarter] = period.split('-');
  return `${quarter} ${year}`;
};

export const getAvailableSalesPeriods = (
  sales: SalesRecord[],
  periodType: SalesPeriodType,
) => {
  const periods = new Set<string>();
  sales.forEach((sale) => {
    const seconds = getInvoiceDateSeconds(sale.data);
    if (!seconds) return;
    periods.add(getSalesPeriodKey(new Date(seconds * 1000), periodType));
  });
  return Array.from(periods).sort();
};

export const filterSalesByPeriod = (
  sales: SalesRecord[],
  period: string,
  periodType: SalesPeriodType,
) =>
  sales.filter((sale) => {
    const seconds = getInvoiceDateSeconds(sale.data);
    if (!seconds) return false;
    const salePeriod = getSalesPeriodKey(new Date(seconds * 1000), periodType);
    return salePeriod === period;
  });

export const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number')
    return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};
