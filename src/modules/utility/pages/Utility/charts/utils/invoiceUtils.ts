import type { InvoiceData } from '@/types/invoice';
import type { UtilityInvoiceEntry } from '@/modules/utility/pages/Utility/types';

type InvoiceWithData = { data?: InvoiceData | null } & Record<string, unknown>;

const resolveInvoiceData = (invoice: UtilityInvoiceEntry): InvoiceData | null => {
  if (!invoice) return null;
  if (typeof invoice === 'object' && 'data' in invoice) {
    const data = (invoice as InvoiceWithData).data;
    if (data) return data;
  }
  return invoice as InvoiceData;
};

export const getInvoiceTimestamp = (
  invoice: UtilityInvoiceEntry,
): number | null => {
  const data = resolveInvoiceData(invoice);
  const rawDate = data?.date;
  if (typeof rawDate === 'number') return rawDate;
  if (typeof rawDate === 'string') {
    const parsed = Date.parse(rawDate);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (rawDate instanceof Date) return rawDate.getTime();
  if (rawDate && typeof rawDate === 'object') {
    if (typeof rawDate.toMillis === 'function') return rawDate.toMillis();
    if (typeof rawDate.seconds === 'number') return rawDate.seconds * 1000;
  }
  return null;
};

export const getInvoiceTotalValue = (invoice: UtilityInvoiceEntry): number => {
  const data = resolveInvoiceData(invoice);
  const rawValue = data?.totalPurchase?.value;
  if (typeof rawValue === 'number') return rawValue;
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : 0;
};
