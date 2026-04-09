import { formatPriceByCurrency } from '@/utils/format';
import type { InvoiceData } from '@/types/invoice';
import {
  DEFAULT_FUNCTIONAL_CURRENCY,
  normalizeSupportedDocumentCurrency,
  type SupportedDocumentCurrency,
} from '@/utils/accounting/currencies';
import type { NumberInput } from '@/utils/number/number';

type InvoiceLike = InvoiceData | Record<string, unknown> | null | undefined;

const normalizeCurrency = (value: unknown): SupportedDocumentCurrency =>
  normalizeSupportedDocumentCurrency(value, DEFAULT_FUNCTIONAL_CURRENCY);

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export const resolveInvoiceDocumentCurrency = (
  data: InvoiceLike,
): SupportedDocumentCurrency => {
  const record = asRecord(data);
  if (!record) return DEFAULT_FUNCTIONAL_CURRENCY;

  if (typeof record.documentCurrency === 'string') {
    const directCurrency = normalizeCurrency(record.documentCurrency);
    return directCurrency;
  }

  const monetary = asRecord(record.monetary);
  const monetaryDocumentCurrency = asRecord(monetary?.documentCurrency);
  if (typeof monetaryDocumentCurrency?.code === 'string') {
    return normalizeCurrency(monetaryDocumentCurrency.code);
  }

  const documentTotals = asRecord(monetary?.documentTotals);
  const documentTotalsCurrency = asRecord(documentTotals?.currency);
  if (typeof documentTotalsCurrency?.code === 'string') {
    return normalizeCurrency(documentTotalsCurrency.code);
  }

  return DEFAULT_FUNCTIONAL_CURRENCY;
};

export const formatInvoicePrice = (
  value: NumberInput,
  data: InvoiceLike,
): string => formatPriceByCurrency(value, resolveInvoiceDocumentCurrency(data));
