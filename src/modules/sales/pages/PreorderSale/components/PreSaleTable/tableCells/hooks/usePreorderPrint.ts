import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { notification } from 'antd';
import { useReactToPrint } from 'react-to-print';

import { downloadInvoicePdf } from '@/firebase/quotation/downloadQuotationPDF';
import type { InvoiceBusinessInfo, InvoiceData } from '@/types/invoice';
import { isProgrammaticLetterPdfTemplate } from '@/utils/invoice/template';

import { convertTimestampsToMillis } from '../utils';

type UsePreorderPrintParams = {
  business: InvoiceBusinessInfo;
  cartSettings: unknown;
  data: InvoiceData | null;
};

export const usePreorderPrint = ({
  business,
  cartSettings,
  data,
}: UsePreorderPrintParams) => {
  const printRef = useRef<HTMLDivElement | null>(null);
  const [isPrintableMounted, setIsPrintableMounted] = useState(false);
  const [pendingPrint, setPendingPrint] = useState(false);

  const printablePreorder = useMemo<InvoiceData | null>(() => {
    if (!data) return null;

    return {
      ...data,
      numberID: data?.numberID || data?.preorderDetails?.numberID,
      date: data?.date || data?.preorderDetails?.date || null,
      copyType: data?.copyType || 'PREVENTA',
      type: data?.type || 'preorder',
    };
  }, [data]);

  const resolvedInvoiceType = useMemo(() => {
    const invoiceTypeFromSettings = (
      cartSettings as { billing?: { invoiceType?: string | null } } | null
    )?.billing?.invoiceType;

    const printableBilling = printablePreorder as
      | (InvoiceData & {
          billing?: { invoiceType?: string | null };
          invoiceType?: string | null;
        })
      | null;

    const type =
      invoiceTypeFromSettings ||
      printableBilling?.billing?.invoiceType ||
      printableBilling?.invoiceType ||
      null;

    return typeof type === 'string' && type ? type.toLowerCase() : null;
  }, [cartSettings, printablePreorder]);

  const printableInvoiceData = useMemo<InvoiceData | null>(() => {
    const source = printablePreorder || data;
    if (!source) return null;
    return (convertTimestampsToMillis(source) as InvoiceData) ?? source;
  }, [data, printablePreorder]);

  const triggerPrint = useReactToPrint({
    contentRef: printRef,
  });

  useEffect(() => {
    if (!isPrintableMounted || !pendingPrint) return;

    const frameId = requestAnimationFrame(() => {
      triggerPrint();
      setPendingPrint(false);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isPrintableMounted, pendingPrint, triggerPrint]);

  const handlePrintPreorder = useCallback(async () => {
    if (!printablePreorder) {
      notification.warning({
        message: 'No se puede imprimir la preventa',
        description:
          'Los datos de la preventa no están disponibles para imprimir.',
      });
      return;
    }

    const printableData = (printableInvoiceData ??
      (convertTimestampsToMillis(printablePreorder) as InvoiceData) ??
      printablePreorder) as InvoiceData;

    if (isProgrammaticLetterPdfTemplate(resolvedInvoiceType)) {
      try {
        await downloadInvoicePdf({
          business,
          data: printableData,
          invoiceType: resolvedInvoiceType,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'No se pudo generar el PDF de la preventa.';

        console.error('[PreSaleTable] downloadInvoiceLetterPdf failed', error);
        notification.error({
          message: 'Error al imprimir',
          description: errorMessage,
        });
      }
      return;
    }

    if (!isPrintableMounted) {
      setIsPrintableMounted(true);
      setPendingPrint(true);
      return;
    }

    triggerPrint();
  }, [
    business,
    isPrintableMounted,
    printableInvoiceData,
    printablePreorder,
    resolvedInvoiceType,
    triggerPrint,
  ]);

  return {
    handlePrintPreorder,
    printRef,
    printableData: printableInvoiceData || printablePreorder || data,
    printableTemplate: resolvedInvoiceType,
    shouldRenderPrintable: isPrintableMounted,
  };
};
