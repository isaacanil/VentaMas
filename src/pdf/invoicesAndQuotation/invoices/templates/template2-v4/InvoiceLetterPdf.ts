import { getPdfMake } from '@/pdf/utils/pdfMakeLoader';

import { buildContent } from '../template2/builders/content';
import { buildHeader } from '../template2/builders/header';
import {
  calcFooterHeight,
  calcHeaderHeight,
} from '../template2/utils/documentHeightCalculator';
import {
  getDiscount,
  getProductsIndividualDiscounts,
  hasIndividualDiscounts,
  money,
  resolvePdfCurrency,
} from '../template2/utils/formatters';

import type {
  PdfContent,
  PdfDocDefinition,
  PdfHeaderFooter,
  PdfImageMap,
  PdfMakeLike,
  PdfTableBody,
} from '@/pdf/types';
import type {
  InvoicePdfBusiness,
  InvoicePdfData,
} from '@/pdf/invoicesAndQuotation/types';

const HEADER_SAFETY_MARGIN = 18;
const FOOTER_SAFETY_MARGIN = 28;
const SIGNATURE_ASSET_EXTRA_HEIGHT = 70;
const SIGNATURE_ASSET_WIDTH = 104;
const SIGNATURE_ASSET_HEIGHT = 42;
const STAMP_ASSET_SIZE = 46;

const PAYMENT_METHODS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  creditnote: 'Nota de Credito',
};

const clampOpacity = (value: unknown) => {
  const candidate = Number(value);

  return Number.isFinite(candidate) ? Math.min(1, Math.max(0, candidate)) : 0.92;
};

const resolveSignatureAssets = (biz: InvoicePdfBusiness) => {
  const assets = biz?.invoice?.signatureAssets;
  const enabled = Boolean(assets?.enabled);
  const signatureUrl =
    enabled && typeof assets?.signatureUrl === 'string'
      ? assets.signatureUrl
      : '';
  const stampUrl =
    enabled && typeof assets?.stampUrl === 'string' ? assets.stampUrl : '';

  return {
    enabled,
    signatureUrl,
    stampUrl,
    signature: {
      scale:
        typeof assets?.signature?.scale === 'number'
          ? assets.signature.scale
          : 1,
      offsetX:
        typeof assets?.signature?.offsetX === 'number'
          ? assets.signature.offsetX
          : 0,
      offsetY:
        typeof assets?.signature?.offsetY === 'number'
          ? assets.signature.offsetY
          : 0,
    },
    stamp: {
      scale:
        typeof assets?.stamp?.scale === 'number' ? assets.stamp.scale : 0.82,
      offsetX:
        typeof assets?.stamp?.offsetX === 'number' ? assets.stamp.offsetX : 0,
      offsetY:
        typeof assets?.stamp?.offsetY === 'number' ? assets.stamp.offsetY : 0,
      opacity: clampOpacity(assets?.stamp?.opacity),
    },
  };
};

const buildSignatureVisual = (
  images: PdfImageMap,
  biz: InvoicePdfBusiness,
): PdfContent[] => {
  const assets = resolveSignatureAssets(biz);
  const columns: PdfContent[] = [];

  if (assets.signatureUrl && images.signature) {
    columns.push({
      image: 'signature',
      fit: [
        SIGNATURE_ASSET_WIDTH * assets.signature.scale,
        SIGNATURE_ASSET_HEIGHT * assets.signature.scale,
      ],
      margin: [assets.signature.offsetX, assets.signature.offsetY, 0, 0],
    });
  }

  if (assets.stampUrl && images.stamp) {
    columns.push({
      image: 'stamp',
      fit: [
        STAMP_ASSET_SIZE * assets.stamp.scale,
        STAMP_ASSET_SIZE * assets.stamp.scale,
      ],
      opacity: assets.stamp.opacity,
      margin: [assets.stamp.offsetX, assets.stamp.offsetY, 0, 0],
    });
  }

  return columns.length
    ? [
        {
          columns,
          columnGap: 4,
          height: 54,
          margin: [0, 0, 0, 4],
        },
      ]
    : [];
};

const signatureBlock = ({
  label,
  extraLine,
  images,
  biz,
  showAssets,
}: {
  label: string;
  extraLine?: string;
  images: PdfImageMap;
  biz: InvoicePdfBusiness;
  showAssets?: boolean;
}): PdfContent => ({
  stack: [
    ...(showAssets ? buildSignatureVisual(images, biz) : []),
    {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 130, y2: 0, lineWidth: 1 }],
      margin: [0, 0, 0, 6],
    },
    { text: label, bold: true, margin: [0, 0, 0, 10] },
    extraLine && {
      text: extraLine,
      alignment: 'center',
      margin: [0, 4, 0, 0],
    },
  ].filter(Boolean),
});

const buildFooter = (
  biz: InvoicePdfBusiness,
  d: InvoicePdfData,
  images: PdfImageMap,
): PdfHeaderFooter => {
  const currency = resolvePdfCurrency(d);
  const paymentMethods = d.paymentMethod?.filter((m) => m?.status) || [];
  const paymentStack: PdfContent[] = paymentMethods.length
    ? [
        { text: 'Metodos de Pago:', bold: true, margin: [0, 0, 0, 4] },
        {
          ul: paymentMethods.map((m) => ({
            text:
              `${PAYMENT_METHODS[m.method?.toLowerCase()] || m.method}: ` +
              money(m.value || 0, currency) +
              (m.reference ? ` - Ref: ${m.reference}` : ''),
            margin: [0, 0, 0, 0],
          })),
        },
      ]
    : [];
  const creditNotesStack: PdfContent[] = d.creditNotePayment?.length
    ? [
        {
          text: 'Notas de Credito Aplicadas:',
          bold: true,
          margin: [0, 8, 0, 4],
        },
        {
          ul: d.creditNotePayment.map((note) => ({
            text: `NCF: ${note.ncf} - ${money(note.amountUsed, currency)}`,
            margin: [0, 0, 0, 0],
          })),
        },
      ]
    : [];
  const individualDiscounts = getProductsIndividualDiscounts(d.products || []);
  const hasIndividualDisc = hasIndividualDiscounts(d.products || []);
  const generalDiscount = hasIndividualDisc ? 0 : getDiscount(d);
  const totalsBody: PdfTableBody = [
    [
      'Sub-Total:',
      {
        text: money(d.totalPurchaseWithoutTaxes?.value ?? 0, currency),
        style: 'totalsValue',
        margin: [0, 0],
      },
    ],
    [
      'ITBIS:',
      {
        text: money(d.totalTaxes?.value ?? 0, currency),
        style: 'totalsValue',
        margin: [0, 0],
      },
    ],
    !hasIndividualDisc &&
      d.discount?.value && [
        'Descuento General:',
        {
          text: `-${money(generalDiscount, currency)}`,
          style: 'totalsValue',
          margin: [0, 0],
        },
      ],
    hasIndividualDisc && [
      'Descuentos Productos:',
      {
        text: `-${money(individualDiscounts, currency)}`,
        style: 'totalsValue',
        margin: [0, 0],
      },
    ],
    d.delivery?.status && [
      'Delivery:',
      {
        text: money(d.delivery?.value ?? 0, currency),
        style: 'totalsValue',
        margin: [0, 0],
      },
    ],
    [
      { text: 'Total:', bold: true, margin: [0, 4, 0, 2] },
      {
        text: money(d.totalPurchase?.value ?? 0, currency),
        style: 'totalsValue',
        bold: true,
        margin: [0, 4, 0, 2],
      },
    ],
  ].filter(Boolean);

  return () => ({
    margin: [32, 0, 32, 0],
    stack: [
      {
        columnGap: 25,
        columns: [
          {
            width: '*',
            stack: [
              signatureBlock({
                label: 'Despachado Por:',
                images,
                biz,
                showAssets: true,
              }),
              ...paymentStack,
              ...creditNotesStack,
            ],
          },
          {
            width: '*',
            stack: [
              signatureBlock({
                label: 'Recibido Conforme:',
                extraLine: d.copyType || 'COPIA',
                images,
                biz,
              }),
            ],
          },
          {
            width: '*',
            margin: [0, 2, 0, 0],
            table: { widths: ['*', '*'], body: totalsBody },
            layout: 'noBorders',
          },
        ],
      },
      ...(d.invoiceComment
        ? [{ text: d.invoiceComment, margin: [0, 8, 0, 0] }]
        : []),
      ...(biz?.invoice?.invoiceMessage
        ? [{ text: biz.invoice.invoiceMessage, margin: [0, 4, 0, 0] }]
        : []),
    ],
  });
};

export const generateInvoiceLetterPdf = async (
  biz: InvoicePdfBusiness,
  d: InvoicePdfData,
): Promise<string> => {
  const images: PdfImageMap = {};
  const signatureAssets = resolveSignatureAssets(biz);

  if (biz.logoUrl) {
    images.logo = biz.logoUrl;
  }

  if (signatureAssets.signatureUrl) {
    images.signature = signatureAssets.signatureUrl;
  }

  if (signatureAssets.stampUrl) {
    images.stamp = signatureAssets.stampUrl;
  }

  const top = calcHeaderHeight(biz, d) + HEADER_SAFETY_MARGIN;
  const bottom =
    calcFooterHeight(biz, d) +
    FOOTER_SAFETY_MARGIN +
    (signatureAssets.signatureUrl || signatureAssets.stampUrl
      ? SIGNATURE_ASSET_EXTRA_HEIGHT
      : 0);
  const docDefinition: PdfDocDefinition = {
    images,
    pageSize: 'A4',
    pageMargins: [32, top, 32, bottom],
    defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.15 },
    styles: {
      title: { fontSize: 14, bold: true, margin: [0, 0, 0, 6] },
      headerInfo: { fontSize: 11, margin: [0, 1, 0, 1] },
      tableHeader: { bold: true, fontSize: 11, color: 'white' },
      separator: {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 515,
            y2: 0,
            lineWidth: 1,
            lineColor: '#e0e0e0',
          },
        ],
      },
      totalsLabel: { bold: true },
      totalsValue: { bold: true, alignment: 'right' },
    },
    header: buildHeader(biz, d, images),
    content: buildContent(d),
    footer: buildFooter(biz, d, images),
  };

  const pdfMake = (await getPdfMake()) as PdfMakeLike;

  try {
    return await new Promise<string>((res, rej) =>
      pdfMake.createPdf(docDefinition).getBase64(res, rej),
    );
  } catch (error) {
    console.error('PDFMake V4 invoice creation failed:', error);
    throw error;
  }
};
