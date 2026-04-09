import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';
import { printPdfBase64 } from '@/utils/printPdf';
import { isInvoiceTemplateV2Beta } from '@/utils/invoice/template';
// import { generateInvoiceLetterPdf, generateInvoiceLetterPdfNoLogo } from "@/pdf/invoices/templates/template2-pdf-lib/InvoiceLetterPdf";

type BusinessData = Record<string, unknown>;
type QuotationData = Record<string, unknown>;
type DialogCloseHandler = (() => void) | undefined;
type NonFinitePath = string;
type InvoicePdfModule = {
  generateInvoiceLetterPdf: (
    business: BusinessData,
    data: QuotationData,
  ) => Promise<string>;
};

export function sanitizeNumbers<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value: unknown) =>
      typeof value === 'number' && !Number.isFinite(value) ? null : value,
    ),
  ) as T;
}

function collectNonFiniteNumberPaths(
  value: unknown,
  path = 'root',
  visited = new WeakSet<object>(),
): NonFinitePath[] {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? [] : [path];
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  if (visited.has(value)) {
    return [];
  }
  visited.add(value);

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectNonFiniteNumberPaths(item, `${path}[${index}]`, visited),
    );
  }

  return Object.entries(value).flatMap(([key, nestedValue]) =>
    collectNonFiniteNumberPaths(nestedValue, `${path}.${key}`, visited),
  );
}

export async function downloadQuotationPdf(
  business: BusinessData,
  data: QuotationData,
  onDialogClose?: DialogCloseHandler,
): Promise<void> {
  try {
    const invalidBusinessPaths = collectNonFiniteNumberPaths(business, 'business');
    const invalidQuotationPaths = collectNonFiniteNumberPaths(data, 'quotation');
    const invalidPaths = [...invalidBusinessPaths, ...invalidQuotationPaths];

    if (invalidPaths.length > 0) {
      console.warn('[QuotationDebug][PDF] Non-finite values before sanitize', {
        count: invalidPaths.length,
        paths: invalidPaths.slice(0, 30),
      });
    } else {
      console.info('[QuotationDebug][PDF] Payload validated before sanitize', {
        quotationId: data?.id ?? null,
      });
    }

    const fn = httpsCallable<
      { business: BusinessData; data: QuotationData },
      string
    >(functions, 'quotationPdf');
    const payload = sanitizeNumbers({ business, data });
    console.info('[QuotationDebug][PDF] Calling quotationPdf', {
      quotationId: data?.id ?? null,
    });
    const { data: base64 } = await fn(payload);
    console.info('[QuotationDebug][PDF] quotationPdf success', {
      quotationId: data?.id ?? null,
      hasBase64: typeof base64 === 'string' && base64.length > 0,
      base64Length: typeof base64 === 'string' ? base64.length : 0,
    });
    await printPdfBase64(base64, { onPrintDialogClose: onDialogClose });
    console.info('[QuotationDebug][PDF] printPdfBase64 dispatched', {
      quotationId: data?.id ?? null,
    });
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    console.error('PDF generation failed', error.message);
    console.error(error.stack);
    console.error('[QuotationDebug][PDF] quotation flow failed', {
      quotationId: data?.id ?? null,
      message: error.message,
      rawError: e,
    });
    throw error;
  }
}

export async function downloadInvoiceLetterPdf(
  business: BusinessData,
  data: QuotationData,
  onDialogClose?: DialogCloseHandler,
): Promise<void> {
  return downloadInvoicePdf({
    business,
    data,
    onDialogClose,
    invoiceType: 'template2',
  });
}

export async function downloadInvoicePdf({
  business,
  data,
  onDialogClose,
  invoiceType,
}: {
  business: BusinessData;
  data: QuotationData;
  onDialogClose?: DialogCloseHandler;
  invoiceType?: string | null;
}): Promise<void> {
  try {
    const templateModule: InvoicePdfModule = isInvoiceTemplateV2Beta(invoiceType)
      ? await import(
          '../../pdf/invoicesAndQuotation/invoices/templates/template2-v2/InvoiceLetterPdf'
        )
      : await import(
          '../../pdf/invoicesAndQuotation/invoices/templates/template2/InvoiceLetterPdf'
        );
    const { generateInvoiceLetterPdf } = templateModule;
    const base64 = await generateInvoiceLetterPdf(business, data);

    await printPdfBase64(base64, { onPrintDialogClose: onDialogClose });
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    console.error('❌ PDF generation with logo failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}
