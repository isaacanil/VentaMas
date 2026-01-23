import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';
import { printPdfBase64 } from '@/utils/printPdf';
// import { generateInvoiceLetterPdf, generateInvoiceLetterPdfNoLogo } from "@/pdf/invoices/templates/template2-pdf-lib/InvoiceLetterPdf";

type BusinessData = Record<string, unknown>;
type QuotationData = Record<string, unknown>;
type DialogCloseHandler = (() => void) | undefined;

export function sanitizeNumbers<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value: unknown) =>
      typeof value === 'number' && !Number.isFinite(value) ? null : value,
    ),
  ) as T;
}

export async function downloadQuotationPdf(
  business: BusinessData,
  data: QuotationData,
  onDialogClose?: DialogCloseHandler,
): Promise<void> {
  try {
    const fn = httpsCallable<{ business: BusinessData; data: QuotationData }, string>(
      functions,
      'quotationPdf',
    );
    const { data: base64 } = await fn({ business, data });
    printPdfBase64(base64, { onPrintDialogClose: onDialogClose });
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    console.error('PDF generation failed', error.message);
    console.error(error.stack);
  }
}

export async function downloadInvoiceLetterPdf(
  business: BusinessData,
  data: QuotationData,
  onDialogClose?: DialogCloseHandler,
): Promise<void> {
  try {
    // Generating PDF for quotation
    const { generateInvoiceLetterPdf } = (await import(
      '../../pdf/invoicesAndQuotation/invoices/templates/template2/InvoiceLetterPdf'
    )) as {
      generateInvoiceLetterPdf: (
        business: BusinessData,
        data: QuotationData,
      ) => Promise<string>;
    };
    const base64 = await generateInvoiceLetterPdf(business, data);

    printPdfBase64(base64, { onPrintDialogClose: onDialogClose });
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    console.error('❌ PDF generation with logo failed:', error.message);
    console.error(error.stack);
  }
}

