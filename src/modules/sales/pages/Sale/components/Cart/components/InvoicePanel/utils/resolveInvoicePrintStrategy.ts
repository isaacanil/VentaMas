import {
  isPaginatedDomInvoiceTemplate,
  isProgrammaticLetterPdfTemplate,
} from '@/utils/invoice/template';
import { resolveBusinessFiscalRollout } from '@/utils/fiscal/fiscalRollout';

export type InvoicePrintStrategy =
  | 'legacy-react-print'
  | 'paginated-dom'
  | 'programmatic-pdf';

export type BusinessLike = {
  [key: string]: unknown;
};

export const PAGINATED_INVOICE_PRINT_FEATURE = 'printPaginationEnabled';

export const isPaginatedInvoicePrintEnabled = (
  business: BusinessLike | null | undefined,
) => resolveBusinessFiscalRollout(business).printPaginationEnabled;

export const resolveInvoicePrintStrategy = ({
  business,
  invoiceType,
}: {
  business?: BusinessLike | null;
  invoiceType: string;
}): InvoicePrintStrategy => {
  if (isPaginatedDomInvoiceTemplate(invoiceType)) {
    return 'paginated-dom';
  }

  if (isProgrammaticLetterPdfTemplate(invoiceType)) {
    return 'programmatic-pdf';
  }

  if (isPaginatedInvoicePrintEnabled(business)) {
    return 'paginated-dom';
  }

  return 'legacy-react-print';
};
