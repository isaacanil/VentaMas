import { notification } from 'antd';

import { downloadInvoicePdf } from '@/firebase/quotation/downloadQuotationPDF';
import type { InvoiceData } from '@/types/invoice';
import { measure } from '@/utils/perf/measure';

import {
  resolveInvoicePrintStrategy,
  type BusinessLike,
} from './resolveInvoicePrintStrategy';

interface ProcessInvoicePrintArgs {
  business: BusinessLike;
  handleAfterPrint: () => void;
  invoice: InvoiceData;
  invoiceType: string;
  setPendingPaginatedPrint?: (value: boolean) => void;
  setPendingPrint: (value: boolean) => void;
}

export const processInvoicePrint = async ({
  business,
  handleAfterPrint,
  invoice,
  invoiceType,
  setPendingPaginatedPrint,
  setPendingPrint,
}: ProcessInvoicePrintArgs) => {
  const strategy = resolveInvoicePrintStrategy({ business, invoiceType });

  if (strategy === 'programmatic-pdf') {
    try {
      await measure('downloadInvoicePdf', () =>
        downloadInvoicePdf({
          business,
          data: invoice,
          onDialogClose: handleAfterPrint,
          invoiceType,
        }),
      );
      handleAfterPrint();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      notification.error({
        message: 'Error al imprimir',
        description: `No se pudo generar el PDF: ${errorMessage}`,
        duration: 4,
      });
      handleAfterPrint();
    }
    return;
  }

  if (strategy === 'paginated-dom' && setPendingPaginatedPrint) {
    setPendingPaginatedPrint(true);
    return;
  }

  setPendingPrint(true);
};
