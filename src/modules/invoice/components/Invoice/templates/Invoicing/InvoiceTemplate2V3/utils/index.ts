import { resolveDocumentIdentity } from '@/utils/invoice/documentIdentity';
import { resolveInvoiceDocumentCurrency } from '@/utils/invoice/documentCurrency';
import { toMillis } from '@/utils/date/dateUtils';
import {
  getDiscount,
  getProductIndividualDiscount,
  getProductsIndividualDiscounts,
  hasIndividualDiscounts,
  money,
} from '@/pdf/invoicesAndQuotation/invoices/templates/template2/utils/formatters';
import type {
  InvoiceBusinessInfo,
  InvoiceData,
  InvoicePaymentMethod,
  InvoiceProduct,
} from '@/types/invoice';
import type { SupportedDocumentCurrency } from '@/types/products';

const PAYMENT_METHODS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  creditnote: 'Nota de crédito',
};

const DEFAULT_PAGE_CAPACITY = 4.8;

export type PreviewInvoiceProduct = InvoiceProduct & {
  previewDuplicateKey?: string;
};

export const formatInvoiceDate = (value: unknown): string => {
  const millis = toMillis(value as Parameters<typeof toMillis>[0]);
  if (!millis) return '-';

  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(millis);
};

export const formatInvoiceMoney = (
  value: number | string | null | undefined,
  currency: SupportedDocumentCurrency = 'DOP',
): string => money(value, currency);

export const resolveInvoiceIdentity = (data?: InvoiceData | null) =>
  resolveDocumentIdentity(data);

export const resolveQuantity = (product: InvoiceProduct): number => {
  const rawQuantity = product?.amountToBuy;

  if (typeof rawQuantity === 'number') {
    return rawQuantity;
  }

  if (rawQuantity && typeof rawQuantity === 'object') {
    const candidate = Number(rawQuantity.total ?? rawQuantity.unit ?? 0);
    return Number.isFinite(candidate) ? candidate : 0;
  }

  const fallback =
    Number(rawQuantity ?? 0) || Number(product?.weightDetail?.weight ?? 0);
  return Number.isFinite(fallback) ? fallback : 0;
};

export const resolveUnitPrice = (product: InvoiceProduct): number => {
  const candidate =
    Number(product?.selectedSaleUnit?.pricing?.price) ||
    Number(product?.pricing?.price) ||
    Number(product?.price?.unit) ||
    0;

  return Number.isFinite(candidate) ? candidate : 0;
};

export const resolveTaxRate = (product: InvoiceProduct): number => {
  const rate = Number(product?.pricing?.tax ?? 0);
  return Number.isFinite(rate) ? rate : 0;
};

export const buildDescriptionLines = (
  product: InvoiceProduct,
  currency: SupportedDocumentCurrency = 'DOP',
): string[] => {
  const lines = [
    product?.name || product?.productName || 'Producto sin nombre',
  ];

  if (product?.brand && product.brand !== 'Sin marca') {
    lines.push(`Marca: ${product.brand}`);
  }

  if (product?.comment) {
    lines.push(`Nota: ${product.comment}`);
  }

  const individualDiscount = getProductIndividualDiscount(product);
  if (individualDiscount > 0) {
    lines.push(
      `Descuento aplicado: -${formatInvoiceMoney(individualDiscount, currency)}`,
    );
  }

  return lines;
};

export const buildPreviewProducts = (
  sourceProducts: InvoiceProduct[],
): PreviewInvoiceProduct[] => sourceProducts;

export const resolveRowUnits = (descriptionLineCount: number): number => {
  const extraLines = Math.max(0, descriptionLineCount - 1);
  return 1 + extraLines * 0.45;
};

export const paginatePreviewProducts = (
  products: PreviewInvoiceProduct[],
  pageCapacity = DEFAULT_PAGE_CAPACITY,
): PreviewInvoiceProduct[][] => {
  if (products.length === 0) {
    return [[]];
  }

  const pages: PreviewInvoiceProduct[][] = [];
  let currentPage: PreviewInvoiceProduct[] = [];
  let currentUnits = 0;

  products.forEach((product) => {
    const rowUnits = resolveRowUnits(buildDescriptionLines(product).length);

    if (currentPage.length > 0 && currentUnits + rowUnits > pageCapacity) {
      pages.push(currentPage);
      currentPage = [];
      currentUnits = 0;
    }

    currentPage.push(product);
    currentUnits += rowUnits;
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
};

export const resolvePaymentLines = (data?: InvoiceData | null): string[] =>
  ((data?.paymentMethod || []) as InvoicePaymentMethod[])
    .filter((method) => method?.status)
    .map((method) => {
      const currency = resolveInvoiceDocumentCurrency(data);
      const key = method?.method?.toLowerCase() || '';
      const label =
        PAYMENT_METHODS[key] || method?.name || method?.method || 'Pago';
      const reference = method?.reference ? `, ref. ${method.reference}` : '';
      return `${label}: ${formatInvoiceMoney(method?.value || 0, currency)}${reference}`;
    });

export const resolveCreditNoteLines = (data?: InvoiceData | null): string[] =>
  (data?.creditNotePayment || []).map((note) => {
    const currency = resolveInvoiceDocumentCurrency(data);
    return `NCF ${note?.ncf || '-'}: ${formatInvoiceMoney(note?.amountUsed || 0, currency)}`;
  });

export const resolveInvoiceNotes = (
  business?: InvoiceBusinessInfo | null,
  data?: InvoiceData | null,
): string =>
  [data?.invoiceComment, business?.invoice?.invoiceMessage]
    .filter(Boolean)
    .join('\n\n');

export const resolveInvoiceTotals = (
  data?: InvoiceData | null,
): Array<[string, string]> => {
  const sourceProducts = Array.isArray(data?.products) ? data.products : [];
  const individualDiscounts = getProductsIndividualDiscounts(sourceProducts);
  const hasIndividualDisc = hasIndividualDiscounts(sourceProducts);
  const generalDiscount = hasIndividualDisc ? 0 : getDiscount(data);
  const currency = resolveInvoiceDocumentCurrency(data);

  return [
    ['Sub-total', formatInvoiceMoney(data?.totalPurchaseWithoutTaxes?.value ?? 0, currency)],
    ['ITBIS', formatInvoiceMoney(data?.totalTaxes?.value ?? 0, currency)],
    ...(hasIndividualDisc
      ? [['Descuentos productos', `-${formatInvoiceMoney(individualDiscounts, currency)}`] as [string, string]]
      : Number(data?.discount?.value)
        ? [['Descuento general', `-${formatInvoiceMoney(generalDiscount, currency)}`] as [string, string]]
        : []),
    ...(data?.delivery?.status
      ? [['Delivery', formatInvoiceMoney(data?.delivery?.value ?? 0, currency)] as [string, string]]
      : []),
    ['Total', formatInvoiceMoney(data?.totalPurchase?.value ?? 0, currency)],
  ];
};
