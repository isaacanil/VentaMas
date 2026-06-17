import { formatPriceByCurrency } from '@/utils/format';
import { resolveInvoiceDocumentCurrency } from '@/utils/invoice/documentCurrency';

import type { SupportedDocumentCurrency } from '@/types/products';
import type { InvoicePdfData } from '@/pdf/invoicesAndQuotation/types';

export {
  formatDate,
  getDiscount,
  getProductIndividualDiscount,
  getProductsIndividualDiscounts,
  hasIndividualDiscounts,
} from '@/pdf/invoicesAndQuotation/utils/formatters';

export const resolvePdfCurrency = (
  data?: InvoicePdfData | null,
): SupportedDocumentCurrency => resolveInvoiceDocumentCurrency(data);

export function money(
  value: number | string | null | undefined,
  currency: SupportedDocumentCurrency = 'DOP',
): string {
  return formatPriceByCurrency(value ?? 0, currency);
}
