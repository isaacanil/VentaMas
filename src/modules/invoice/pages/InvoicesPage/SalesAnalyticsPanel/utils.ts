import type { InvoiceData } from '@/types/invoice';
import type { TimestampLike } from '@/utils/date/types';

export type SalesRecord = {
  data: InvoiceData;
};

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

export const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number')
    return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};
