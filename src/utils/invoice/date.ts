import { toMillis, formatDate } from '@/utils/date/dateUtils';

// Re-use central logic
export const resolveInvoiceDateMillis = (value: unknown): number | null => {
  return toMillis(value) ?? null;
};

export const formatInvoiceDate = (value: unknown): string => {
  return formatDate(value, 'dd/MM/yyyy');
};
