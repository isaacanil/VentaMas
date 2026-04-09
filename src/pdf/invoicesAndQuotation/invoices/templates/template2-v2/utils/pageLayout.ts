import type {
  InvoicePdfBusiness,
  InvoicePdfData,
} from '@/pdf/invoicesAndQuotation/types';
import type { DocumentIdentity } from '@/utils/invoice/documentIdentity';

const LAYOUT = {
  headerTopOffset: 22,
  headerBottomPadding: 12,
  headerContentGap: 12,
  headerSeparatorGap: 10,
  pageTopBuffer: 16,
  logoWidth: 88,
  logoHeight: 64,
  businessNameCharsPerLine: 24,
  businessInfoCharsPerLine: 34,
  documentInfoCharsPerLine: 28,
  clientLeftCharsPerLine: 48,
  clientRightCharsPerLine: 30,
  titleLineHeight: 15,
  textLineHeight: 11,
  clientMinHeight: 48,
} as const;

const normalizePrintableValue = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
};

const estimateWrappedLineCount = (
  text: string | null | undefined,
  charsPerLine: number,
): number => {
  if (!text) return 0;

  return text.split(/\r?\n/).reduce((total, segment) => {
    const normalizedSegment = segment.trim();
    if (!normalizedSegment) return total + 1;
    return (
      total + Math.max(1, Math.ceil(normalizedSegment.length / charsPerLine))
    );
  }, 0);
};

const estimateStackHeight = (
  lines: Array<string | null | undefined>,
  charsPerLine: number,
  lineHeight: number,
  marginBottom = 2,
): number =>
  lines.reduce((total, line) => {
    const wrappedLines = estimateWrappedLineCount(line, charsPerLine);
    if (!wrappedLines) return total;
    return total + wrappedLines * lineHeight + marginBottom;
  }, 0);

const buildReferenceLine = (
  identity: DocumentIdentity,
  data: InvoicePdfData,
): string => {
  if (identity.type === 'preorder') {
    return `Preventa # ${identity.value || data?.preorderDetails?.numberID || data?.numberID || '-'}`;
  }

  if (identity.type === 'receipt') {
    return `Recibo # ${identity.value || data?.numberID || '-'}`;
  }

  return `${identity.title || 'Factura'} # ${data?.numberID || '-'}`;
};

const buildClientColumns = (data: InvoicePdfData) => {
  const left = [
    `Cliente: ${normalizePrintableValue(data?.client?.name) || 'Cliente generico'}`,
    data?.client?.address ? `Direccion: ${data.client.address}` : null,
    data?.client?.tel ? `Tel: ${data.client.tel}` : null,
  ].filter(Boolean) as string[];

  const right = [
    data?.client?.rnc
      ? `RNC/Cedula: ${data.client.rnc}`
      : data?.client?.personalID
        ? `RNC/Cedula: ${data.client.personalID}`
        : null,
    data?.seller?.name ? `Vendedor: ${data.seller.name}` : null,
    data?.NCF ? `NCF: ${data.NCF}` : null,
    data?.preorderDetails?.date ? 'Fecha pedido' : null,
  ].filter(Boolean) as string[];

  return {
    left,
    right,
  };
};

export const betaInvoicePageLayout = {
  logoWidth: LAYOUT.logoWidth,
  logoHeight: LAYOUT.logoHeight,
};

export const estimateInvoicePageLayout = ({
  business,
  data,
  identity,
}: {
  business: InvoicePdfBusiness;
  data: InvoicePdfData;
  identity: DocumentIdentity;
}) => {
  const businessLines = [
    business?.name,
    business?.address,
    business?.tel ? `Tel: ${business.tel}` : null,
    business?.email,
    business?.rnc ? `RNC: ${business.rnc}` : null,
  ];

  const documentLines = [
    identity.title || 'Factura',
    `Fecha: ${data?.date ? 'fecha' : '-'}`,
    identity.label &&
    identity.type !== 'preorder' &&
    identity.type !== 'receipt'
      ? `${identity.label}: ${identity.value || '-'}`
      : null,
    buildReferenceLine(identity, data),
    data?.dueDate ? 'Vence: fecha' : null,
    data?.preorderDetails?.date && identity.type === 'preorder'
      ? 'Fecha pedido'
      : null,
  ];

  const businessHeight =
    estimateWrappedLineCount(business?.name, LAYOUT.businessNameCharsPerLine) *
      LAYOUT.titleLineHeight +
    estimateStackHeight(
      businessLines.slice(1),
      LAYOUT.businessInfoCharsPerLine,
      LAYOUT.textLineHeight,
    );

  const documentHeight =
    estimateWrappedLineCount(identity.title, LAYOUT.documentInfoCharsPerLine) *
      LAYOUT.titleLineHeight +
    estimateStackHeight(
      documentLines.slice(1),
      LAYOUT.documentInfoCharsPerLine,
      LAYOUT.textLineHeight,
    );

  const topRowHeight = Math.max(
    business?.logoUrl ? LAYOUT.logoHeight : 0,
    businessHeight,
    documentHeight,
  );

  const clientColumns = buildClientColumns(data);
  const hasClientBlock =
    clientColumns.left.length > 0 || clientColumns.right.length > 0;
  const clientHeight = hasClientBlock
    ? Math.max(
        LAYOUT.clientMinHeight,
        estimateStackHeight(
          clientColumns.left,
          LAYOUT.clientLeftCharsPerLine,
          LAYOUT.textLineHeight,
        ),
        estimateStackHeight(
          clientColumns.right,
          LAYOUT.clientRightCharsPerLine,
          LAYOUT.textLineHeight,
        ),
      )
    : 0;

  const headerHeight =
    LAYOUT.headerTopOffset +
    topRowHeight +
    LAYOUT.headerContentGap +
    (hasClientBlock ? LAYOUT.headerSeparatorGap + clientHeight : 0) +
    LAYOUT.headerBottomPadding;

  return {
    hasClientBlock,
    pagePaddingTop: headerHeight + LAYOUT.pageTopBuffer,
  };
};
