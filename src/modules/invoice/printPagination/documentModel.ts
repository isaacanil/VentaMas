import type { DebitNoteRecord } from '@/modules/invoice/types/debitNote';
import {
  resolveElectronicTaxReceiptSnapshot,
  resolveElectronicTaxReceiptStatusKey,
  resolveElectronicTaxReceiptStatusLabel,
} from '@/modules/invoice/utils/electronicTaxReceipt';
import {
  creditNoteToInvoicePrintData,
  debitNoteToInvoicePrintData,
} from '@/modules/invoice/utils/adjustmentNotePrintData';
import type { CreditNoteRecord } from '@/types/creditNote';
import type {
  ElectronicTaxReceiptSnapshot,
  InvoiceBusinessInfo,
  InvoiceData,
  InvoicePaymentMethod,
  InvoiceProduct,
  InvoiceSignatureAssets,
} from '@/types/invoice';
import type { SupportedDocumentCurrency } from '@/types/products';
import {
  resolveDisplayTaxForCurrency,
  resolveDisplayTotalForCurrency,
  resolveDisplayUnitPriceForCurrency,
} from '@/utils/accounting/lineMonetary';
import { formatPriceByCurrency } from '@/utils/format';
import { formatInvoiceDate } from '@/utils/invoice/date';
import { resolveInvoiceDocumentCurrency } from '@/utils/invoice/documentCurrency';
import {
  resolveDocumentIdentity,
  resolveDocumentNumberLine,
} from '@/utils/invoice/documentIdentity';
import { resolveInvoicePaymentLabel } from '@/utils/invoice/paymentMethods';
import { resolveInvoiceProductQuantity } from '@/utils/invoice/product';
import {
  getProductIndividualDiscount,
  getProductsIndividualDiscounts,
} from '@/utils/pricing';
import { cleanString } from '@/utils/text';

export type InvoicePrintDocumentKind = 'invoice' | 'creditNote' | 'debitNote';

export type InvoicePrintPartyModel = {
  address: string | null;
  email: string | null;
  fiscalId: string | null;
  fiscalLines: string[];
  logoUrl: string | null;
  name: string;
  phone: string | null;
  secondaryPhone: string | null;
};

export type InvoicePrintAssetTransform = {
  offsetX: number;
  offsetY: number;
  opacity?: number;
  scale: number;
};

export type InvoicePrintSignatureAssetsModel = {
  enabled: boolean;
  signature: InvoicePrintAssetTransform;
  signatureUrl: string | null;
  stamp: InvoicePrintAssetTransform & { opacity: number };
  stampUrl: string | null;
};

export type InvoicePrintLineModel = {
  billingIndicator: string;
  code: string;
  descriptionLines: string[];
  discount: string | null;
  id: string;
  quantity: number;
  tax: string;
  taxRate: number;
  total: string;
  unitPrice: string;
};

export type InvoicePrintSummaryRow = {
  emphasis?: boolean;
  label: string;
  value: string;
};

export type InvoicePrintElectronicModel = {
  documentType: string | null;
  eNcf: string | null;
  qrUrl: string | null;
  securityCode: string | null;
  sequenceExpirationDate: string | null;
  signatureDate: string | null;
  statusKey: string | null;
  statusLabel: string | null;
  statusNote: string | null;
  trackId: string | null;
  verifyUrl: string | null;
};

export type InvoicePrintBodyBlockRole = 'product-line' | 'summary' | 'notes';

export type InvoicePrintBodyBlock = {
  id: string;
  keepTogether: boolean;
  role: InvoicePrintBodyBlockRole;
};

export type InvoicePrintDocumentModel = {
  affectedDocument: string | null;
  bodyBlocks: InvoicePrintBodyBlock[];
  business: InvoicePrintPartyModel;
  client: InvoicePrintPartyModel;
  copyType: string | null;
  currency: SupportedDocumentCurrency;
  documentLabel: string;
  documentNumberLine: string;
  documentTitle: string;
  documentValue: string | number | null;
  dueDate: string | null;
  electronic: InvoicePrintElectronicModel | null;
  id: string | null;
  issueDate: string;
  kind: InvoicePrintDocumentKind;
  lines: InvoicePrintLineModel[];
  notes: string[];
  paymentLines: string[];
  preorderDate: string | null;
  sellerName: string | null;
  signatureAssets: InvoicePrintSignatureAssetsModel;
  source: InvoiceData;
  summaryRows: InvoicePrintSummaryRow[];
};

export type BuildInvoicePrintDocumentModelArgs = {
  business?: InvoiceBusinessInfo | null;
  data?: InvoiceData | null;
  kind?: InvoicePrintDocumentKind;
  previewSignatureAssets?: InvoiceSignatureAssets | null;
};

const EMPTY_PARTY: InvoicePrintPartyModel = {
  address: null,
  email: null,
  fiscalId: null,
  fiscalLines: [],
  logoUrl: null,
  name: '-',
  phone: null,
  secondaryPhone: null,
};

const DEFAULT_SIGNATURE_SCALE = 1;
const DEFAULT_STAMP_SCALE = 0.82;
const DEFAULT_STAMP_OPACITY = 0.92;

const toRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const cleanDisplayString = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  const direct = cleanString(value);
  if (direct) return direct;

  const record = toRecord(value);
  if (!record) return null;

  return cleanRecordString(record, ['label', 'name', 'value', 'code', 'id']);
};

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

const normalizeDocumentKind = (
  data?: InvoiceData | null,
  explicitKind?: InvoicePrintDocumentKind,
): InvoicePrintDocumentKind => {
  if (explicitKind) return explicitKind;

  if (data?.documentKind === 'creditNote' || data?.type === 'creditNote') {
    return 'creditNote';
  }

  if (data?.documentKind === 'debitNote' || data?.type === 'debitNote') {
    return 'debitNote';
  }

  return 'invoice';
};

const formatMoney = (
  value: number | string | null | undefined,
  currency: SupportedDocumentCurrency,
): string => formatPriceByCurrency(Number(value ?? 0), currency);

const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const sanitizeBlockIdSegment = (value: unknown): string | null => {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || null;
};

const buildLineId = (product: InvoiceProduct, index: number): string => {
  const stablePart =
    sanitizeBlockIdSegment(product.id) ||
    sanitizeBlockIdSegment(product.barcode) ||
    sanitizeBlockIdSegment(product.sku) ||
    sanitizeBlockIdSegment(product.cid) ||
    sanitizeBlockIdSegment(product.productId) ||
    sanitizeBlockIdSegment(product.name) ||
    'line';

  return `product-line-${index + 1}-${stablePart}`;
};

const formatDocumentDate = (value: unknown): string => {
  if (typeof value === 'string') {
    const dateOnlyMatch = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return `${day}/${month}/${year}`;
    }
  }

  return formatInvoiceDate(value);
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

const cleanRecordDisplayString = (
  source: Record<string, unknown> | null | undefined,
  keys: string[],
): string | null => {
  if (!source) return null;

  for (const key of keys) {
    const value = cleanDisplayString(source[key]);
    if (value) return value;
  }

  return null;
};

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

const buildFiscalLocationLines = ({
  includeBranch,
  source,
}: {
  includeBranch: boolean;
  source?: Record<string, unknown> | null;
}): string[] => {
  const info = resolveFiscalLocationInfo(source);
  const municipality = formatNameWithCode(
    info.municipality,
    info.municipalityCode,
  );
  const province = formatNameWithCode(info.province, info.provinceCode);
  const locationLine = [municipality, province].filter(Boolean).join(', ');
  const country = formatNameWithCode(info.country, info.countryCode);

  return [
    includeBranch && info.branch ? `Sucursal: ${info.branch}` : null,
    info.sector ? `Sector: ${info.sector}` : null,
    locationLine ? `Municipio/Provincia: ${locationLine}` : null,
    country ? `Pais: ${country}` : null,
  ].filter((line): line is string => Boolean(line));
};

const resolvePartyModel = (
  source?: InvoiceBusinessInfo | InvoiceData['client'] | null,
  fallbackName = '-',
  options: { includeBranch?: boolean; includeLogo?: boolean } = {},
): InvoicePrintPartyModel => {
  if (!source) {
    return { ...EMPTY_PARTY, name: fallbackName };
  }

  const sourceRecord = toRecord(source);
  const fiscalNode =
    options.includeBranch && sourceRecord
      ? (toRecord(sourceRecord.fiscal) ?? toRecord(sourceRecord.issuerProfile))
      : null;
  const fiscalSource = {
    ...(sourceRecord ?? {}),
    ...(fiscalNode ?? {}),
  };
  const primaryPhone = cleanString(source.tel);
  const secondaryPhone = cleanString(source.tel2);

  return {
    address: cleanString(source.address),
    email: cleanString((source as InvoiceBusinessInfo).email),
    fiscalId: cleanString(source.rnc) || cleanString(source.personalID),
    fiscalLines: buildFiscalLocationLines({
      includeBranch: Boolean(options.includeBranch),
      source: fiscalSource,
    }),
    logoUrl: options.includeLogo
      ? cleanString((source as InvoiceBusinessInfo).logoUrl) ||
        cleanString((source as InvoiceBusinessInfo).logo)
      : null,
    name: cleanString(source.name) || fallbackName,
    phone: primaryPhone || secondaryPhone,
    secondaryPhone:
      primaryPhone && secondaryPhone && secondaryPhone !== primaryPhone
        ? secondaryPhone
        : null,
  };
};

const resolveSignatureAssetsModel = (
  assets?: InvoiceSignatureAssets | null,
): InvoicePrintSignatureAssetsModel => {
  return {
    enabled: Boolean(assets?.enabled),
    signature: {
      offsetX:
        typeof assets?.signature?.offsetX === 'number'
          ? assets.signature.offsetX
          : 0,
      offsetY:
        typeof assets?.signature?.offsetY === 'number'
          ? assets.signature.offsetY
          : 0,
      scale:
        typeof assets?.signature?.scale === 'number'
          ? assets.signature.scale
          : DEFAULT_SIGNATURE_SCALE,
    },
    signatureUrl: cleanString(assets?.signatureUrl),
    stamp: {
      offsetX:
        typeof assets?.stamp?.offsetX === 'number' ? assets.stamp.offsetX : 0,
      offsetY:
        typeof assets?.stamp?.offsetY === 'number' ? assets.stamp.offsetY : 0,
      opacity:
        typeof assets?.stamp?.opacity === 'number'
          ? assets.stamp.opacity
          : DEFAULT_STAMP_OPACITY,
      scale:
        typeof assets?.stamp?.scale === 'number'
          ? assets.stamp.scale
          : DEFAULT_STAMP_SCALE,
    },
    stampUrl: cleanString(assets?.stampUrl),
  };
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

const resolveLineTaxRate = (product: InvoiceProduct): number => {
  const selectedPricing = toRecord(product.selectedSaleUnit?.pricing);
  const pricing = toRecord(product.pricing);
  const selectedTax = product.selectedSaleUnit?.pricing?.tax;
  const pricingTax = product.pricing?.tax;
  const selectedTaxRecord = toRecord(selectedTax);
  const pricingTaxRecord = toRecord(pricingTax);
  const rawTax =
    (selectedTaxRecord ? selectedTaxRecord.tax : selectedTax) ??
    (pricingTaxRecord ? pricingTaxRecord.tax : pricingTax) ??
    selectedPricing?.taxRate ??
    pricing?.taxRate ??
    product.taxRate ??
    product.taxPercentage ??
    product.itbisRate ??
    0;
  const taxRate = Number(rawTax);

  return Number.isFinite(taxRate) ? taxRate : 0;
};

const resolveBillingIndicator = (product: InvoiceProduct): string => {
  const selectedPricing = toRecord(product.selectedSaleUnit?.pricing);
  const pricing = toRecord(product.pricing);
  const selectedTaxRecord = toRecord(product.selectedSaleUnit?.pricing?.tax);
  const pricingTaxRecord = toRecord(product.pricing?.tax);
  const taxRecord = toRecord(product.tax);
  const explicit =
    normalizeBillingIndicator(product.billingIndicator) ||
    normalizeBillingIndicator(product.indicadorFacturacion) ||
    normalizeBillingIndicator(product.taxBillingIndicator) ||
    normalizeBillingIndicator(selectedPricing?.billingIndicator) ||
    normalizeBillingIndicator(pricing?.billingIndicator) ||
    normalizeBillingIndicator(selectedTaxRecord) ||
    normalizeBillingIndicator(pricingTaxRecord) ||
    normalizeBillingIndicator(taxRecord?.billingIndicator);

  if (explicit) return explicit;

  const taxRate = resolveLineTaxRate(product);
  if (taxRate === 18) return '1';
  if (taxRate === 16) return '2';
  if (taxRate === 0) return '4';
  return taxRate > 0 ? '1' : '4';
};

const resolveLineUnitTax = (
  product: InvoiceProduct,
  currency: SupportedDocumentCurrency,
): number =>
  resolveDisplayTaxForCurrency(
    { ...product, amountToBuy: 1 } as InvoiceProduct,
    currency,
  );

const parsePositiveNumber = (value: unknown): number | null => {
  const numeric =
    typeof value === 'string'
      ? Number(value.trim().replace(',', '.'))
      : Number(value);

  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const resolveWeightUnit = (product: InvoiceProduct): string | null => {
  const weightDetail = toRecord(product.weightDetail);

  return (
    cleanString(weightDetail?.weightUnit) ||
    cleanString(weightDetail?.unit) ||
    null
  );
};

const resolveLineQuantity = (product: InvoiceProduct): number =>
  parsePositiveNumber(resolveInvoiceProductQuantity(product)) ??
  parsePositiveNumber(toRecord(product.weightDetail)?.weight) ??
  0;

const buildDescriptionLines = (product: InvoiceProduct): string[] => {
  const measurement = cleanString(product.measurement);
  const weightUnit = resolveWeightUnit(product);

  return [
    cleanString(product.name) ||
      cleanString(product.productName) ||
      'Producto sin nombre',
    cleanString(product.brand) && product.brand !== 'Sin marca'
      ? `Marca: ${product.brand}`
      : null,
    cleanString(product.comment) ? `Nota: ${product.comment}` : null,
    measurement
      ? `Unidad: ${measurement}`
      : weightUnit
        ? `Unidad: ${weightUnit}`
        : null,
  ].filter((line): line is string => Boolean(line));
};

const buildInvoiceLineModel = ({
  currency,
  index,
  product,
}: {
  currency: SupportedDocumentCurrency;
  index: number;
  product: InvoiceProduct;
}): InvoicePrintLineModel => {
  const discount = getProductIndividualDiscount(product);

  return {
    billingIndicator: resolveBillingIndicator(product),
    code: cleanString(product.barcode) || cleanString(product.sku) || '-',
    descriptionLines: buildDescriptionLines(product),
    discount: discount > 0 ? `-${formatMoney(discount, currency)}` : null,
    id: buildLineId(product, index),
    quantity: resolveLineQuantity(product),
    tax: formatMoney(resolveLineUnitTax(product, currency), currency),
    taxRate: resolveLineTaxRate(product),
    total: formatMoney(
      resolveDisplayTotalForCurrency(product, currency),
      currency,
    ),
    unitPrice: formatMoney(
      resolveDisplayUnitPriceForCurrency(product, currency),
      currency,
    ),
  };
};

const resolveProducts = (data?: InvoiceData | null): InvoiceProduct[] =>
  Array.isArray(data?.products) ? data.products : [];

const buildSummaryRows = (
  data: InvoiceData,
  currency: SupportedDocumentCurrency,
): InvoicePrintSummaryRow[] => {
  const sourceProducts = resolveProducts(data);
  const individualDiscounts = getProductsIndividualDiscounts(sourceProducts);
  const hasIndividualDiscounts = individualDiscounts > 0;
  const generalDiscount = hasIndividualDiscounts
    ? 0
    : resolveInvoiceGeneralDiscount(
        sourceProducts,
        currency,
        data.discount?.value,
      );
  const rows: Array<InvoicePrintSummaryRow | null> = [
    {
      label: 'Sub-total',
      value: formatMoney(data.totalPurchaseWithoutTaxes?.value, currency),
    },
    ...buildFiscalSummaryRows(sourceProducts, currency),
    {
      label: 'ITBIS',
      value: formatMoney(data.totalTaxes?.value, currency),
    },
    hasIndividualDiscounts
      ? {
          label: 'Descuentos productos',
          value: `-${formatMoney(individualDiscounts, currency)}`,
        }
      : Number(data.discount?.value)
        ? {
            label: 'Descuento general',
            value: `-${formatMoney(generalDiscount, currency)}`,
          }
        : null,
    data.delivery?.status
      ? {
          label: 'Delivery',
          value: formatMoney(data.delivery.value, currency),
        }
      : null,
    {
      emphasis: true,
      label: 'Total',
      value: formatMoney(data.totalPurchase?.value, currency),
    },
  ];

  return rows.filter((row): row is InvoicePrintSummaryRow => Boolean(row));
};

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

  const taxRate = resolveLineTaxRate(product);

  if (taxRate === 18) return '18';
  if (taxRate === 16) return '16';
  if (taxRate === 0) return 'E';

  return '18';
};

const buildFiscalSummaryRows = (
  products: InvoiceProduct[],
  currency: SupportedDocumentCurrency,
): InvoicePrintSummaryRow[] => {
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
      exempt: 0,
      itbis: { '18': 0, '16': 0, '0': 0 },
      taxable: 0,
    } as {
      exempt: number;
      itbis: Record<'18' | '16' | '0', number>;
      taxable: number;
    },
  );

  return [
    fiscalTotals.taxable > 0
      ? {
          label: 'Monto gravado',
          value: formatMoney(roundMoney(fiscalTotals.taxable), currency),
        }
      : null,
    fiscalTotals.exempt > 0
      ? {
          label: 'Monto exento',
          value: formatMoney(roundMoney(fiscalTotals.exempt), currency),
        }
      : null,
    fiscalTotals.itbis['18'] > 0
      ? {
          label: 'ITBIS 18%',
          value: formatMoney(roundMoney(fiscalTotals.itbis['18']), currency),
        }
      : null,
    fiscalTotals.itbis['16'] > 0
      ? {
          label: 'ITBIS 16%',
          value: formatMoney(roundMoney(fiscalTotals.itbis['16']), currency),
        }
      : null,
    fiscalTotals.itbis['0'] > 0
      ? {
          label: 'ITBIS 0%',
          value: formatMoney(roundMoney(fiscalTotals.itbis['0']), currency),
        }
      : null,
  ].filter((row): row is InvoicePrintSummaryRow => Boolean(row));
};

const resolveInvoiceGeneralDiscount = (
  products: InvoiceProduct[],
  currency: SupportedDocumentCurrency,
  discountValue?: number | string | null,
): number => {
  const discountPercentage = Number(discountValue) || 0;

  if (!discountPercentage || products.length === 0) {
    return 0;
  }

  const subtotal = products.reduce(
    (total, product) => total + resolveProductSubtotal(product, currency),
    0,
  );

  return roundMoney(subtotal * (discountPercentage / 100));
};

const resolvePaymentLines = (
  data: InvoiceData,
  currency: SupportedDocumentCurrency,
): string[] =>
  ((data.paymentMethod || []) as InvoicePaymentMethod[])
    .filter((method) => method?.status)
    .map((method) => {
      const label =
        method.method?.toLowerCase() === 'creditnote'
          ? 'Nota de crédito'
          : resolveInvoicePaymentLabel(method);
      const reference = method.reference ? `, ref. ${method.reference}` : '';
      return `${label}: ${formatMoney(method.value || 0, currency)}${reference}`;
    });

const resolveCreditNotePaymentLines = (
  data: InvoiceData,
  currency: SupportedDocumentCurrency,
): string[] =>
  (data.creditNotePayment || []).map(
    (note) =>
      `NCF ${note.ncf || '-'}: ${formatMoney(note.amountUsed || 0, currency)}`,
  );

const resolveNotes = (
  data: InvoiceData,
  business?: InvoiceBusinessInfo | null,
) =>
  [
    cleanString((data as { invoiceComment?: unknown }).invoiceComment),
    cleanString(business?.invoice?.invoiceMessage),
  ].filter((line): line is string => Boolean(line));

const resolveAffectedDocument = (data: InvoiceData): string | null => {
  const affected =
    cleanString(data.affectedInvoiceNcf) ||
    cleanString(data.invoiceNcf) ||
    cleanString(data.affectedInvoiceNumber) ||
    cleanString(data.invoiceNumber);

  return affected ? `Documento afectado: ${affected}` : null;
};

const cleanElectronicString = (
  source: ElectronicTaxReceiptSnapshot | null,
  key: keyof ElectronicTaxReceiptSnapshot,
): string | null => cleanString(source?.[key]);

const resolveQrUrl = (
  snapshot?: ElectronicTaxReceiptSnapshot | null,
): string | null => {
  if (!snapshot) return null;
  if (typeof snapshot.qr === 'string') return cleanString(snapshot.qr);

  const qrRecord = toRecord(snapshot.qr);
  const printData = toRecord(snapshot.printData);

  return (
    cleanString(qrRecord?.url) ||
    cleanString(qrRecord?.qrUrl) ||
    cleanString(qrRecord?.value) ||
    cleanString(snapshot.officialVerifyUrl) ||
    cleanString(printData?.qrUrl) ||
    cleanString(printData?.qr) ||
    cleanString(printData?.officialVerifyUrl) ||
    cleanString(printData?.consultaUrl) ||
    cleanString(printData?.urlConsulta) ||
    null
  );
};

const formatElectronicDate = (value: unknown): string | null => {
  if (value == null || value === '') return null;

  const formatted = formatDocumentDate(value);

  return formatted === '-' ? cleanDisplayString(value) : formatted;
};

const resolveSignatureDate = (
  snapshot?: ElectronicTaxReceiptSnapshot | null,
): string | null => {
  if (!snapshot) return null;

  const printData = toRecord(snapshot.printData);
  const snapshotRecord = toRecord(snapshot);

  return formatElectronicDate(
    snapshotRecord?.signedAt ??
      snapshotRecord?.issuedAt ??
      printData?.signedAt ??
      printData?.issuedAt ??
      printData?.fechaFirmaDigital ??
      printData?.fechaFirma,
  );
};

const resolveSequenceExpirationDate = ({
  data,
  snapshot,
}: {
  data: InvoiceData;
  snapshot?: ElectronicTaxReceiptSnapshot | null;
}): string | null => {
  if (!snapshot) return null;

  const printData = toRecord(snapshot.printData);
  const snapshotRecord = toRecord(snapshot);

  return formatElectronicDate(
    snapshotRecord?.sequenceExpirationDate ??
      snapshotRecord?.eNcfExpirationDate ??
      snapshotRecord?.ncfExpirationDate ??
      snapshotRecord?.expirationDate ??
      snapshotRecord?.expiresAt ??
      printData?.sequenceExpirationDate ??
      printData?.eNcfExpirationDate ??
      printData?.ncfExpirationDate ??
      printData?.fechaVencimientoSecuencia ??
      printData?.fechaVencimientoENCF ??
      printData?.fechaVencimientoNCF ??
      printData?.fechaVencimiento ??
      data.sequenceExpirationDate ??
      data.eNcfExpirationDate ??
      data.ncfExpirationDate,
  );
};

const resolveElectronicStatusNote = (
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

const buildElectronicModel = (
  data: InvoiceData,
): InvoicePrintElectronicModel | null => {
  const snapshot = resolveElectronicTaxReceiptSnapshot(data);
  if (!snapshot) return null;

  const printData = toRecord(snapshot.printData);
  const eNcf =
    cleanElectronicString(snapshot, 'eNcf') ||
    cleanString(data.eNcf) ||
    cleanString(data.NCF);
  const securityCode =
    cleanElectronicString(snapshot, 'securityCode') ||
    cleanString(printData?.securityCode) ||
    cleanString(printData?.codigoSeguridad);
  const qrUrl = resolveQrUrl(snapshot);
  const signatureDate = resolveSignatureDate(snapshot);
  const sequenceExpirationDate = resolveSequenceExpirationDate({
    data,
    snapshot,
  });
  const verifyUrl =
    cleanElectronicString(snapshot, 'officialVerifyUrl') ||
    cleanString(printData?.officialVerifyUrl) ||
    cleanString(printData?.consultaUrl);

  if (!eNcf && !securityCode && !qrUrl && !signatureDate) return null;

  return {
    documentType:
      cleanElectronicString(snapshot, 'documentType')?.toUpperCase() || null,
    eNcf,
    qrUrl,
    securityCode,
    sequenceExpirationDate,
    signatureDate,
    statusKey: resolveElectronicTaxReceiptStatusKey(snapshot),
    statusLabel: resolveElectronicTaxReceiptStatusLabel(snapshot),
    statusNote: resolveElectronicStatusNote(snapshot),
    trackId:
      cleanElectronicString(snapshot, 'dgiiTrackId') ||
      cleanElectronicString(snapshot, 'trackId') ||
      cleanElectronicString(snapshot, 'rfceTrackId'),
    verifyUrl,
  };
};

const buildBodyBlocks = (
  lines: InvoicePrintLineModel[],
  notes: string[],
): InvoicePrintBodyBlock[] => [
  ...lines.map((line) => ({
    id: line.id,
    keepTogether: true,
    role: 'product-line' as const,
  })),
  {
    id: 'document-summary',
    keepTogether: true,
    role: 'summary',
  },
  ...(notes.length
    ? [
        {
          id: 'document-notes',
          keepTogether: true,
          role: 'notes' as const,
        },
      ]
    : []),
];

export const buildInvoicePrintDocumentModel = ({
  business,
  data,
  kind,
  previewSignatureAssets,
}: BuildInvoicePrintDocumentModelArgs): InvoicePrintDocumentModel => {
  const source = data ?? {};
  const documentKind = normalizeDocumentKind(source, kind);
  const currency = resolveInvoiceDocumentCurrency(source);
  const identity = resolveDocumentIdentity(source);
  const lines = resolveProducts(source).map((product, index) =>
    buildInvoiceLineModel({ currency, index, product }),
  );
  const paymentLines = [
    ...resolvePaymentLines(source, currency),
    ...resolveCreditNotePaymentLines(source, currency),
  ];
  const affectedDocument = resolveAffectedDocument(source);
  const notes = [
    ...(affectedDocument ? [affectedDocument] : []),
    ...resolveNotes(source, business),
  ];
  const preorderDate = source.preorderDetails?.date
    ? formatDocumentDate(source.preorderDetails.date)
    : null;

  return {
    affectedDocument,
    bodyBlocks: buildBodyBlocks(lines, notes),
    business: resolvePartyModel(business, 'Empresa', {
      includeBranch: true,
      includeLogo: true,
    }),
    client: resolvePartyModel(source.client, 'Cliente generico'),
    copyType: cleanString(source.copyType),
    currency,
    documentLabel: identity.label,
    documentNumberLine: resolveDocumentNumberLine(identity, source),
    documentTitle: identity.title,
    documentValue: identity.value,
    dueDate: source.dueDate ? formatDocumentDate(source.dueDate) : null,
    electronic: buildElectronicModel(source),
    id: cleanString(source.id),
    issueDate: formatDocumentDate(source.date) || '-',
    kind: documentKind,
    lines,
    notes,
    paymentLines,
    preorderDate,
    sellerName: cleanString(source.seller?.name),
    signatureAssets: resolveSignatureAssetsModel(
      previewSignatureAssets ?? business?.invoice?.signatureAssets,
    ),
    source,
    summaryRows: buildSummaryRows(source, currency),
  };
};

export const buildCreditNotePrintDocumentModel = ({
  business,
  note,
}: {
  business?: InvoiceBusinessInfo | null;
  note: CreditNoteRecord;
}): InvoicePrintDocumentModel =>
  buildInvoicePrintDocumentModel({
    business,
    data: creditNoteToInvoicePrintData(note),
    kind: 'creditNote',
  });

export const buildDebitNotePrintDocumentModel = ({
  business,
  note,
}: {
  business?: InvoiceBusinessInfo | null;
  note: DebitNoteRecord;
}): InvoicePrintDocumentModel =>
  buildInvoicePrintDocumentModel({
    business,
    data: debitNoteToInvoicePrintData(note),
    kind: 'debitNote',
  });
