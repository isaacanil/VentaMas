import { notification } from 'antd';

import { downloadInvoicePdf } from '@/firebase/quotation/downloadQuotationPDF';
import type { InvoiceBusinessInfo, InvoiceData } from '@/types/invoice';
import { isProgrammaticLetterPdfTemplate } from '@/utils/invoice/template';
import { resolveInvoiceDateMillis } from '@/utils/invoice/date';

interface TriggerPreorderPrintArgs {
  business: InvoiceBusinessInfo;
  invoiceType: string | null | undefined;
  setPendingPreorderPrint: (value: boolean) => void;
  setPreorderPrintData: (data: InvoiceData | null) => void;
  source: InvoiceData;
}

export const convertTimestampsToMillis = (obj: unknown): unknown => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date || (obj as any).isLuxonDateTime) {
    return obj;
  }

  if (typeof (obj as any).toMillis === 'function') {
    return (obj as any).toMillis();
  }

  if (
    typeof (obj as any).seconds === 'number' &&
    typeof (obj as any).nanoseconds === 'number'
  ) {
    return (
      (obj as any).seconds * 1000 +
      Math.floor((obj as any).nanoseconds / 1000000)
    );
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertTimestampsToMillis(item));
  }

  const isPlainObject =
    obj.constructor === Object || Object.getPrototypeOf(obj) === null;
  if (!isPlainObject) {
    return obj;
  }

  const converted: Record<string, unknown> = {};
  Object.keys(obj).forEach((key) => {
    converted[key] = convertTimestampsToMillis((obj as any)[key]);
  });
  return converted;
};

export const normalizePreorderForPrint = (
  source: InvoiceData | null | undefined,
): InvoiceData | null => {
  if (!source) return null;

  const fallbackMillis = Date.now();
  const preorderMillis = resolveInvoiceDateMillis(source?.preorderDetails?.date);
  const invoiceMillis = resolveInvoiceDateMillis(source?.date);
  const resolvedPreorderMillis = preorderMillis ?? invoiceMillis ?? fallbackMillis;
  const resolvedInvoiceMillis = invoiceMillis ?? resolvedPreorderMillis;

  return {
    ...source,
    numberID: source?.numberID || source?.preorderDetails?.numberID,
    date: resolvedInvoiceMillis,
    preorderDetails: {
      ...(source?.preorderDetails ?? {}),
      date: resolvedPreorderMillis,
    },
    copyType: source?.copyType || 'PREVENTA',
    type: source?.type || 'preorder',
  };
};

export const resolvePreorderInvoiceType = (
  invoiceType: string | null | undefined,
  source?: InvoiceData | null,
) => {
  const resolvedType =
    invoiceType ||
    (source as any)?.billing?.invoiceType ||
    (source as any)?.invoiceType ||
    (source as any)?.preorderDetails?.invoiceType ||
    null;

  return typeof resolvedType === 'string' && resolvedType
    ? resolvedType.toLowerCase()
    : null;
};

export const triggerPreorderPrint = async ({
  business,
  invoiceType,
  setPendingPreorderPrint,
  setPreorderPrintData,
  source,
}: TriggerPreorderPrintArgs) => {
  const printablePreorder = normalizePreorderForPrint(source);
  if (!printablePreorder) return;

  const printableData =
    (convertTimestampsToMillis(printablePreorder) as InvoiceData) ??
    printablePreorder;
  const resolvedInvoiceType = resolvePreorderInvoiceType(
    invoiceType,
    printableData,
  );

  setPreorderPrintData(printableData);

  if (isProgrammaticLetterPdfTemplate(resolvedInvoiceType)) {
    try {
      await downloadInvoicePdf({
        business,
        data: printableData,
        onDialogClose: () => {},
        invoiceType: resolvedInvoiceType,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'No se pudo generar el PDF de la preventa.';
      console.error('[InvoiceSummary] downloadInvoiceLetterPdf failed', error);
      notification.error({
        message: 'Error al imprimir',
        description: errorMessage,
      });
    }
    return;
  }

  setPendingPreorderPrint(true);
};
