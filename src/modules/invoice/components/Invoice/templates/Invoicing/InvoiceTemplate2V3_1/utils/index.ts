import { resolveDocumentIdentity } from '@/utils/invoice/documentIdentity';
import { resolveInvoiceDocumentCurrency } from '@/utils/invoice/documentCurrency';
import { toMillis } from '@/utils/date/dateUtils';
import {
  resolveDisplayTaxForCurrency,
  resolveDisplayTotalForCurrency,
} from '@/utils/accounting/lineMonetary';
import {
  resolveElectronicTaxReceiptSnapshot,
  resolveElectronicTaxReceiptStatusKey,
  resolveElectronicTaxReceiptStatusLabel,
} from '@/modules/invoice/utils/electronicTaxReceipt';
import {
  getDiscount,
  getProductIndividualDiscount,
  getProductsIndividualDiscounts,
  hasIndividualDiscounts,
  money,
} from '@/pdf/invoicesAndQuotation/invoices/templates/template2/utils/formatters';
import type {
  ElectronicTaxReceiptSnapshot,
  InvoiceBusinessInfo,
  InvoiceData,
  InvoicePaymentMethod,
  InvoiceProduct,
} from '@/types/invoice';
import type { SupportedDocumentCurrency } from '@/types/products';
import { cleanString } from '@/utils/text';

const PAYMENT_METHODS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  creditnote: 'Nota de crédito',
};

const DEFAULT_PAGE_CAPACITY = 12;

export type PreviewInvoiceProduct = InvoiceProduct & {
  previewDuplicateKey?: string;
};

export type ElectronicPrintInfo = {
  documentType: string | null;
  eNcf: string | null;
  qrUrl: string | null;
  securityCode: string | null;
  signatureDate: string | null;
  sequenceExpirationDate: string | null;
  statusKey: string | null;
  statusLabel: string | null;
  statusNote: string | null;
  trackId: string | null;
  verifyUrl: string | null;
};

export type InvoicePrintPageSummary = {
  subtotal: string;
  tax: string;
  total: string;
};

type FiscalLocationInfo = {
  branch: string | null;
  country: string | null;
  countryCode: string | null;
  municipality: string | null;
  municipalityCode: string | null;
  province: string | null;
  provinceCode: string | null;
  sector: string | null;
};

const toRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

function cleanDisplayString(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  const direct = cleanString(value);
  if (direct) return direct;

  const record = toRecord(value);
  if (!record) return null;

  return cleanRecordDisplayString(record, [
    'label',
    'name',
    'value',
    'code',
    'id',
  ]);
}

const cleanRecordString = (
  source: Record<string, unknown> | null | undefined,
  keys: string[],
): string | null => {
  if (!source) return null;

  for (const key of keys) {
    const value = cleanString(source[key]);
    if (value) return value;
  }

  return null;
};

function cleanRecordDisplayString(
  source: Record<string, unknown> | null | undefined,
  keys: string[],
): string | null {
  if (!source) return null;

  for (const key of keys) {
    const value = cleanDisplayString(source[key]);
    if (value) return value;
  }

  return null;
}

const formatNameWithCode = (
  name: string | null,
  code: string | null,
): string | null => {
  const normalizedCode =
    code && /^[a-z]{2,3}$/i.test(code) ? code.toUpperCase() : code;
  const normalizedName =
    name && /^[a-z]{2,3}$/i.test(name) ? name.toUpperCase() : name;

  if (!normalizedName) return normalizedCode;
  if (!normalizedCode || normalizedName.includes(normalizedCode)) {
    return normalizedName;
  }
  return `${normalizedName} (${normalizedCode})`;
};

const resolveQrUrl = (
  snapshot?: ElectronicTaxReceiptSnapshot | null,
): string | null => {
  if (!snapshot) return null;

  if (typeof snapshot.qr === 'string') {
    const directQr = cleanString(snapshot.qr);
    if (directQr) return directQr;
  }

  const qrRecord = toRecord(snapshot.qr);
  const qrUrl = cleanRecordString(qrRecord, ['url', 'qrUrl', 'value']);
  if (qrUrl) return qrUrl;

  const officialVerifyUrl = cleanString(snapshot.officialVerifyUrl);
  if (officialVerifyUrl) return officialVerifyUrl;

  const printData = toRecord(snapshot.printData);
  return cleanRecordString(printData, [
    'qrUrl',
    'qr',
    'officialVerifyUrl',
    'consultaUrl',
    'urlConsulta',
  ]);
};

const resolveSignatureDate = (
  snapshot?: ElectronicTaxReceiptSnapshot | null,
): string | null => {
  if (!snapshot) return null;

  const printData = toRecord(snapshot.printData);
  const candidate =
    snapshot.signedAt ??
    snapshot.issuedAt ??
    printData?.signedAt ??
    printData?.issuedAt ??
    printData?.fechaFirmaDigital ??
    printData?.fechaFirma;

  return candidate == null || candidate === ''
    ? null
    : formatInvoiceDate(candidate);
};

const resolveSequenceExpirationDate = ({
  data,
  snapshot,
}: {
  data?: InvoiceData | null;
  snapshot?: ElectronicTaxReceiptSnapshot | null;
}): string | null => {
  if (!snapshot) return null;

  const printData = toRecord(snapshot.printData);
  const candidate =
    snapshot.sequenceExpirationDate ??
    snapshot.eNcfExpirationDate ??
    snapshot.ncfExpirationDate ??
    snapshot.expirationDate ??
    snapshot.expiresAt ??
    printData?.sequenceExpirationDate ??
    printData?.eNcfExpirationDate ??
    printData?.ncfExpirationDate ??
    printData?.fechaVencimientoSecuencia ??
    printData?.fechaVencimientoENCF ??
    printData?.fechaVencimientoNCF ??
    printData?.fechaVencimiento ??
    data?.sequenceExpirationDate ??
    data?.eNcfExpirationDate ??
    data?.ncfExpirationDate;

  if (candidate == null || candidate === '') return null;

  const formatted = formatInvoiceDate(candidate);
  return formatted === '-' ? cleanDisplayString(candidate) : formatted;
};

const resolveStatusNote = (
  snapshot?: ElectronicTaxReceiptSnapshot | null,
): string | null => {
  const statusKey = resolveElectronicTaxReceiptStatusKey(snapshot);
  if (!statusKey) return null;

  if (statusKey === 'accepted' || statusKey === 'accepted_conditional') {
    return 'Consulte la validez fiscal escaneando el QR.';
  }

  if (statusKey === 'issued') {
    return 'e-CF emitido en envío diferido. Consulte la validez fiscal dentro de las 24 horas.';
  }

  if (
    statusKey === 'rejected' ||
    statusKey === 'error' ||
    statusKey === 'failed' ||
    statusKey === 'local_failed'
  ) {
    return 'Este e-CF no es válido fiscalmente hasta que DGII/RFCE lo acepte.';
  }

  return 'e-CF pendiente de validación fiscal.';
};

export const formatInvoiceDate = (value: unknown): string => {
  if (typeof value === 'string') {
    const dateOnlyMatch = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return `${day}/${month}/${year}`;
    }
  }

  const millis = toMillis(value as Parameters<typeof toMillis>[0]);
  if (!millis) return '-';

  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(millis);
};

const resolveFiscalLocationInfo = (
  source?: Record<string, unknown> | null,
): FiscalLocationInfo => ({
  branch: cleanRecordDisplayString(source, [
    'branchName',
    'sucursal',
    'branch',
    'locationName',
    'storeName',
  ]),
  country: cleanRecordDisplayString(source, [
    'countryName',
    'paisNombre',
    'countryLabel',
    'paisLabel',
    'country',
    'pais',
  ]),
  countryCode: cleanRecordDisplayString(source, [
    'countryCode',
    'codigoPais',
    'paisCodigo',
  ]),
  municipality: cleanRecordDisplayString(source, [
    'municipalityName',
    'municipioNombre',
    'municipalityLabel',
    'municipioLabel',
    'municipality',
    'municipio',
    'city',
  ]),
  municipalityCode: cleanRecordDisplayString(source, [
    'municipalityCode',
    'codigoMunicipio',
    'municipioCodigo',
  ]),
  province: cleanRecordDisplayString(source, [
    'provinceName',
    'provinciaNombre',
    'provinceLabel',
    'provinciaLabel',
    'province',
    'provincia',
    'state',
  ]),
  provinceCode: cleanRecordDisplayString(source, [
    'provinceCode',
    'codigoProvincia',
    'provinciaCodigo',
  ]),
  sector: cleanRecordDisplayString(source, [
    'sectorName',
    'sectorLabel',
    'sector',
  ]),
});

export const resolveBusinessFiscalLines = (
  business?: InvoiceBusinessInfo | null,
): string[] => {
  const source = toRecord(business);
  const fiscalNode = toRecord(source?.fiscal) ?? toRecord(source?.issuerProfile);
  const info = resolveFiscalLocationInfo({
    ...(source ?? {}),
    ...(fiscalNode ?? {}),
  });
  const municipality = formatNameWithCode(
    info.municipality,
    info.municipalityCode,
  );
  const province = formatNameWithCode(info.province, info.provinceCode);
  const locationLine = [municipality, province]
    .filter(Boolean)
    .join(', ');
  const country = formatNameWithCode(info.country, info.countryCode);

  return [
    info.branch ? `Sucursal: ${info.branch}` : null,
    info.sector ? `Sector: ${info.sector}` : null,
    locationLine ? `Municipio/Provincia: ${locationLine}` : null,
    country ? `Pais: ${country}` : null,
  ].filter((line): line is string => Boolean(line));
};

export const resolveClientFiscalLines = (
  client?: InvoiceData['client'] | null,
): string[] => {
  const source = toRecord(client);
  const info = resolveFiscalLocationInfo(source);
  const municipality = formatNameWithCode(
    info.municipality,
    info.municipalityCode,
  );
  const province = formatNameWithCode(info.province, info.provinceCode);
  const locationLine = [municipality, province]
    .filter(Boolean)
    .join(', ');
  const country = formatNameWithCode(info.country, info.countryCode);

  return [
    info.sector ? `Sector: ${info.sector}` : null,
    locationLine ? `Municipio/Provincia: ${locationLine}` : null,
    country ? `Pais: ${country}` : null,
  ].filter((line): line is string => Boolean(line));
};

export const resolveElectronicPrintInfo = (
  data?: InvoiceData | null,
): ElectronicPrintInfo | null => {
  const snapshot = resolveElectronicTaxReceiptSnapshot(data);
  if (!snapshot) return null;

  const printData = toRecord(snapshot.printData);
  const qrUrl = resolveQrUrl(snapshot);
  const securityCode =
    cleanString(snapshot.securityCode) ||
    cleanRecordString(printData, ['securityCode', 'codigoSeguridad']);
  const signatureDate = resolveSignatureDate(snapshot);
  const verifyUrl =
    cleanString(snapshot.officialVerifyUrl) ||
    cleanRecordString(printData, ['officialVerifyUrl', 'consultaUrl']);
  const eNcf =
    cleanString(snapshot.eNcf) ||
    cleanString(data?.eNcf) ||
    cleanString(data?.NCF);

  if (!qrUrl && !securityCode && !signatureDate && !eNcf) {
    return null;
  }

  return {
    documentType: cleanString(snapshot.documentType)?.toUpperCase() || null,
    eNcf,
    qrUrl,
    securityCode,
    signatureDate,
    sequenceExpirationDate: resolveSequenceExpirationDate({ data, snapshot }),
    statusKey: resolveElectronicTaxReceiptStatusKey(snapshot),
    statusLabel: resolveElectronicTaxReceiptStatusLabel(snapshot),
    statusNote: resolveStatusNote(snapshot),
    trackId:
      cleanString(snapshot.dgiiTrackId) ||
      cleanString(snapshot.trackId) ||
      cleanString(snapshot.rfceTrackId),
    verifyUrl,
  };
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
  const selectedTax = product?.selectedSaleUnit?.pricing?.tax;
  const pricingTax = product?.pricing?.tax;
  const selectedTaxRecord = toRecord(selectedTax);
  const pricingTaxRecord = toRecord(pricingTax);
  const rawTax =
    (selectedTaxRecord ? selectedTaxRecord.tax : selectedTax) ??
    (pricingTaxRecord ? pricingTaxRecord.tax : pricingTax) ??
    product?.taxRate ??
    product?.taxPercentage ??
    product?.itbisRate ??
    0;
  const rate = Number(rawTax);
  return Number.isFinite(rate) ? rate : 0;
};

const normalizeBillingIndicator = (value: unknown): string | null => {
  const record = toRecord(value);
  if (record) {
    return normalizeBillingIndicator(
      record.billingIndicator ??
        record.indicadorFacturacion ??
        record.indicator ??
        record.type ??
        record.ref ??
        record.label ??
        record.name ??
        record.value ??
        record.code ??
        record.id,
    );
  }

  const raw = cleanDisplayString(value);
  if (!raw) return null;

  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

  if (normalized.includes('NO FACTURABLE')) return '0';
  if (/^[0-4]$/.test(normalized)) return normalized;
  if (normalized === 'E' || normalized.includes('EXENTO')) return '4';
  if (/ITBIS\s*1|TASA\s*1/.test(normalized)) return '1';
  if (/ITBIS\s*2|TASA\s*2/.test(normalized)) return '2';
  if (/ITBIS\s*3|TASA\s*3/.test(normalized)) return '3';
  if (normalized.includes('18')) return '1';
  if (normalized.includes('16')) return '2';
  if (normalized.includes('0')) return '3';
  return null;
};

export const resolveBillingIndicator = (product: InvoiceProduct): string => {
  const selectedPricing = product?.selectedSaleUnit?.pricing as
    | Record<string, unknown>
    | undefined;
  const pricing = product?.pricing as Record<string, unknown> | undefined;
  const taxRecord = toRecord(product?.tax);
  const selectedPricingTaxRecord = toRecord(selectedPricing?.tax);
  const pricingTaxRecord = toRecord(pricing?.tax);
  const explicit =
    normalizeBillingIndicator(product?.billingIndicator) ||
    normalizeBillingIndicator(product?.indicadorFacturacion) ||
    normalizeBillingIndicator(product?.taxBillingIndicator) ||
    normalizeBillingIndicator(selectedPricing?.billingIndicator) ||
    normalizeBillingIndicator(pricing?.billingIndicator) ||
    normalizeBillingIndicator(selectedPricingTaxRecord) ||
    normalizeBillingIndicator(pricingTaxRecord) ||
    normalizeBillingIndicator(taxRecord?.billingIndicator);

  if (explicit) return explicit;

  const taxRate = resolveTaxRate(product);
  if (taxRate === 18) return '1';
  if (taxRate === 16) return '2';
  if (taxRate === 0) return '4';
  return taxRate > 0 ? '1' : '4';
};

export const resolveProductLineDiscount = (
  product: InvoiceProduct,
  currency: SupportedDocumentCurrency = 'DOP',
): string | null => {
  const individualDiscount = getProductIndividualDiscount(product);
  return individualDiscount > 0
    ? formatInvoiceMoney(individualDiscount, currency)
    : null;
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

  if (product?.measurement) {
    lines.push(`Unidad: ${product.measurement}`);
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
  repeatCount = 1,
): PreviewInvoiceProduct[] => {
  const safeRepeatCount = Math.max(1, Math.floor(Number(repeatCount) || 1));

  if (safeRepeatCount <= 1) {
    return sourceProducts;
  }

  return Array.from({ length: safeRepeatCount }).flatMap(
    (_, duplicateIndex) =>
      sourceProducts.map((product, productIndex) => ({
        ...product,
        previewDuplicateKey: [
          product?.id,
          product?.barcode,
          product?.cid,
          product?.name,
          duplicateIndex,
          productIndex,
        ]
          .filter((value) => value !== undefined && value !== null)
          .join('-'),
      })),
  );
};

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

export const resolvePageSummary = (
  products: PreviewInvoiceProduct[],
  documentCurrency: SupportedDocumentCurrency = 'DOP',
): InvoicePrintPageSummary => {
  const totals = products.reduce<{ subtotal: number; tax: number; total: number }>(
    (accumulator, product) => {
      const tax = resolveDisplayTaxForCurrency(product, documentCurrency);
      const total = resolveDisplayTotalForCurrency(product, documentCurrency);
      const subtotal = Math.max(total - tax, 0);

      return {
        subtotal: accumulator.subtotal + subtotal,
        tax: accumulator.tax + tax,
        total: accumulator.total + total,
      };
    },
    { subtotal: 0, tax: 0, total: 0 },
  );

  return {
    subtotal: formatInvoiceMoney(roundMoney(totals.subtotal), documentCurrency),
    tax: formatInvoiceMoney(roundMoney(totals.tax), documentCurrency),
    total: formatInvoiceMoney(roundMoney(totals.total), documentCurrency),
  };
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

const resolveProductSubtotal = (
  product: InvoiceProduct,
  currency: SupportedDocumentCurrency,
): number => {
  const tax = resolveDisplayTaxForCurrency(product, currency);
  const total = resolveDisplayTotalForCurrency(product, currency);
  return Math.max(total - tax, 0);
};

const resolveTaxBucket = (product: InvoiceProduct): '18' | '16' | '0' | 'E' => {
  const indicator = resolveBillingIndicator(product);
  if (indicator === '1') return '18';
  if (indicator === '2') return '16';
  if (indicator === '3') return '0';
  if (indicator === '4' || indicator === '0') return 'E';

  const taxRate = resolveTaxRate(product);
  if (taxRate === 18) return '18';
  if (taxRate === 16) return '16';
  if (taxRate === 0) return 'E';
  return '18';
};

const resolveFiscalTotalRows = (
  products: InvoiceProduct[],
  currency: SupportedDocumentCurrency,
): Array<[string, string]> => {
  const fiscalTotals = products.reduce(
    (accumulator, product) => {
      const bucket = resolveTaxBucket(product);
      const subtotal = resolveProductSubtotal(product, currency);
      const tax = resolveDisplayTaxForCurrency(product, currency);

      if (bucket === 'E') {
        accumulator.exempt += subtotal;
      } else {
        accumulator.taxable += subtotal;
        accumulator.itbis[bucket] += tax;
      }

      return accumulator;
    },
    {
      taxable: 0,
      exempt: 0,
      itbis: { '18': 0, '16': 0, '0': 0 },
    } as {
      taxable: number;
      exempt: number;
      itbis: Record<'18' | '16' | '0', number>;
    },
  );

  return [
    ...(fiscalTotals.taxable > 0
      ? [
          [
            'Monto gravado',
            formatInvoiceMoney(roundMoney(fiscalTotals.taxable), currency),
          ] as [string, string],
        ]
      : []),
    ...(fiscalTotals.exempt > 0
      ? [
          [
            'Monto exento',
            formatInvoiceMoney(roundMoney(fiscalTotals.exempt), currency),
          ] as [string, string],
        ]
      : []),
    ...(fiscalTotals.itbis['18'] > 0
      ? [
          [
            'ITBIS 18%',
            formatInvoiceMoney(roundMoney(fiscalTotals.itbis['18']), currency),
          ] as [string, string],
        ]
      : []),
    ...(fiscalTotals.itbis['16'] > 0
      ? [
          [
            'ITBIS 16%',
            formatInvoiceMoney(roundMoney(fiscalTotals.itbis['16']), currency),
          ] as [string, string],
        ]
      : []),
    ...(fiscalTotals.itbis['0'] > 0
      ? [
          [
            'ITBIS 0%',
            formatInvoiceMoney(roundMoney(fiscalTotals.itbis['0']), currency),
          ] as [string, string],
        ]
      : []),
  ];
};

export const resolveInvoiceTotals = (
  data?: InvoiceData | null,
): Array<[string, string]> => {
  const sourceProducts = Array.isArray(data?.products) ? data.products : [];
  const individualDiscounts = getProductsIndividualDiscounts(sourceProducts);
  const hasIndividualDisc = hasIndividualDiscounts(sourceProducts);
  const generalDiscount = hasIndividualDisc ? 0 : getDiscount(data);
  const currency = resolveInvoiceDocumentCurrency(data);
  const fiscalRows = resolveFiscalTotalRows(sourceProducts, currency);

  return [
    [
      'Sub-total',
      formatInvoiceMoney(data?.totalPurchaseWithoutTaxes?.value ?? 0, currency),
    ],
    ...fiscalRows,
    ['ITBIS', formatInvoiceMoney(data?.totalTaxes?.value ?? 0, currency)],
    ...(hasIndividualDisc
      ? [
          [
            'Descuentos productos',
            `-${formatInvoiceMoney(individualDiscounts, currency)}`,
          ] as [string, string],
        ]
      : Number(data?.discount?.value)
        ? [
            [
              'Descuento general',
              `-${formatInvoiceMoney(generalDiscount, currency)}`,
            ] as [string, string],
          ]
        : []),
    ...(data?.delivery?.status
      ? [
          [
            'Delivery',
            formatInvoiceMoney(data?.delivery?.value ?? 0, currency),
          ] as [string, string],
        ]
      : []),
    ['Total', formatInvoiceMoney(data?.totalPurchase?.value ?? 0, currency)],
  ];
};
