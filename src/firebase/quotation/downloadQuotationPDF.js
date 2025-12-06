import { httpsCallable } from 'firebase/functions';

import { generateInvoiceLetterPdf } from '../../pdf/invoicesAndQuotation/invoices/templates/template2/InvoiceLetterPdf';
import { printPdfBase64 } from '../../utils/printPdf';
import { functions } from '../firebaseconfig';
// import { generateInvoiceLetterPdf, generateInvoiceLetterPdfNoLogo } from "../../pdf/invoices/templates/template2-pdf-lib/InvoiceLetterPdf";

export function sanitizeNumbers(obj) {
  return JSON.parse(
    JSON.stringify(obj, (k, v) =>
      typeof v === 'number' && !Number.isFinite(v) ? null : v,
    ),
  );
}

export async function downloadQuotationPdf(business, data, onDialogClose) {
  try {
    const fn = httpsCallable(functions, 'quotationPdf');
    const { data: base64 } = await fn({ business, data });
    printPdfBase64(base64, { onPrintDialogClose: onDialogClose });
  } catch (e) {
    console.error('PDF generation failed', e.message);
    console.error(e.stack);
  }
}

export async function downloadInvoiceLetterPdf(business, data, onDialogClose) {
  try {
    // Generating PDF for quotation
    const base64 = await generateInvoiceLetterPdf(business, data);

    printPdfBase64(base64, { onPrintDialogClose: onDialogClose });
  } catch (e) {
    console.error('❌ PDF generation with logo failed:', e.message);
    console.error(e.stack);
  }
}
