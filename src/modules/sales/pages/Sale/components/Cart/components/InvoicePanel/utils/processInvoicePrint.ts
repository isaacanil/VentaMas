import { notification } from 'antd';

import { downloadInvoicePdf } from '@/firebase/quotation/downloadQuotationPDF';
import type { InvoiceData } from '@/types/invoice';
import { isProgrammaticLetterPdfTemplate } from '@/utils/invoice/template';
import { measure } from '@/utils/perf/measure';

type BusinessLike = {
  id?: string | null;
  businessID?: string | null;
  businessId?: string | null;
  [key: string]: unknown;
};

interface ProcessInvoicePrintArgs {
  business: BusinessLike;
  handleAfterPrint: () => void;
  invoice: InvoiceData;
  invoiceType: string;
  setPendingPrint: (value: boolean) => void;
}

export const processInvoicePrint = async ({
  business,
  handleAfterPrint,
  invoice,
  invoiceType,
  setPendingPrint,
}: ProcessInvoicePrintArgs) => {
  if (isProgrammaticLetterPdfTemplate(invoiceType)) {
    try {
      await measure('downloadInvoicePdf', () =>
        downloadInvoicePdf({
          business,
          data: invoice,
          onDialogClose: handleAfterPrint,
          invoiceType,
        }),
      );
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

  setPendingPrint(true);
};
