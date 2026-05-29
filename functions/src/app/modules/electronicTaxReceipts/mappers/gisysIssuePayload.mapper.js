import { stableHash } from '../../../versions/v2/invoice/utils/hash.util.js';
import { resolveGisysDocumentType } from '../utils/gisysDocumentType.util.js';

const DEFAULT_CURRENCY = 'DOP';
const DEFAULT_BUYER_NAME = 'Consumidor Final';
const GISYS_INVOICE_INTERNAL_ID_MAX_LENGTH = 20;
const GISYS_INVOICE_INTERNAL_ID_HASH_PREFIX = 'VM';
const PROVINCE_MUNICIPALITY_CODE_PATTERN = /^\d{6}$/;
const BILLING_INDICATOR = Object.freeze({
  NOT_BILLABLE: '0',
  ITBIS_18: '1',
  ITBIS_16: '2',
  ITBIS_0: '3',
  EXEMPT: '4',
});
const BILLING_INDICATOR_TAX_RATE = Object.freeze({
  [BILLING_INDICATOR.ITBIS_18]: 18,
  [BILLING_INDICATOR.ITBIS_16]: 16,
  [BILLING_INDICATOR.ITBIS_0]: 0,
  [BILLING_INDICATOR.EXEMPT]: 0,
  [BILLING_INDICATOR.NOT_BILLABLE]: 0,
});
const TAXABLE_BILLING_INDICATORS = new Set([
  BILLING_INDICATOR.ITBIS_18,
  BILLING_INDICATOR.ITBIS_16,
  BILLING_INDICATOR.ITBIS_0,
]);
const DOMINICAN_PROVINCE_CODES = new Map(
  [
    ['Distrito Nacional', '010000'],
    ['Azua', '020000'],
    ['Bahoruco', '030000'],
    ['Baoruco', '030000'],
    ['Barahona', '040000'],
    ['Dajabon', '050000'],
    ['Duarte', '060000'],
    ['Elias Pina', '070000'],
    ['El Seibo', '080000'],
    ['Espaillat', '090000'],
    ['Independencia', '100000'],
    ['La Altagracia', '110000'],
    ['La Romana', '120000'],
    ['La Vega', '130000'],
    ['Maria Trinidad Sanchez', '140000'],
    ['Monte Cristi', '150000'],
    ['Pedernales', '160000'],
    ['Peravia', '170000'],
    ['Puerto Plata', '180000'],
    ['Hermanas Mirabal', '190000'],
    ['Samana', '200000'],
    ['San Cristobal', '210000'],
    ['San Juan', '220000'],
    ['San Pedro de Macoris', '230000'],
    ['Sanchez Ramirez', '240000'],
    ['Santiago', '250000'],
    ['Santiago Rodriguez', '260000'],
    ['Valverde', '270000'],
    ['Monsenor Nouel', '280000'],
    ['Monte Plata', '290000'],
    ['Hato Mayor', '300000'],
    ['San Jose de Ocoa', '310000'],
    ['Santo Domingo', '320000'],
  ].map(([province, code]) => [province.toUpperCase(), code]),
);

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toFiniteNumber = (value, fallback = null) => {
  if (value && typeof value === 'object') {
    return toFiniteNumber(value.value ?? value.total ?? value.unit, fallback);
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundAmount = (value) => {
  const numeric = toFiniteNumber(value, 0);
  return Math.round((numeric + Number.EPSILON) * 100) / 100;
};

const pickString = (...values) => {
  for (const value of values) {
    const normalized = toCleanString(value);
    if (normalized) return normalized;
  }
  return null;
};

const pickNumber = (...values) => {
  for (const value of values) {
    const normalized = toFiniteNumber(value, null);
    if (normalized != null) return normalized;
  }
  return null;
};

const toAsciiUpperKey = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Ñ/g, 'N')
    .replace(/ñ/g, 'n')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

const isNearTaxRate = (value, expected) =>
  Math.abs(Number(value) - expected) < 0.01;

const normalizeTaxRate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = toFiniteNumber(value, null);
  if (numeric == null) return null;
  if (numeric === 0) return 0;
  const scaled = Math.abs(numeric) < 1 ? numeric * 100 : numeric;
  return roundAmount(scaled);
};

const normalizeBillingIndicatorCode = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^[0-4]$/.test(raw)) return raw;

  const normalized = toAsciiUpperKey(raw).replace(/[_-]+/g, ' ');
  if (normalized === 'E' || normalized.includes('EXENTO')) {
    return BILLING_INDICATOR.EXEMPT;
  }
  if (normalized.includes('NO FACTURABLE')) {
    return BILLING_INDICATOR.NOT_BILLABLE;
  }
  if (/ITBIS\s*1|TASA\s*1|18\s*%/.test(normalized)) {
    return BILLING_INDICATOR.ITBIS_18;
  }
  if (/ITBIS\s*2|TASA\s*2|16\s*%/.test(normalized)) {
    return BILLING_INDICATOR.ITBIS_16;
  }
  if (
    /ITBIS\s*3|TASA\s*3|0\s*%/.test(normalized) ||
    (normalized.includes('GRAVAD') && normalized.includes('0'))
  ) {
    return BILLING_INDICATOR.ITBIS_0;
  }

  return null;
};

const normalizeBillingIndicator = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return normalizeBillingIndicator(
      value.billingIndicator ??
        value.indicadorFacturacion ??
        value.indicator ??
        value.type ??
        value.ref ??
        value.label ??
        value.name,
    );
  }

  return normalizeBillingIndicatorCode(value);
};

const resolveExplicitBillingIndicator = (product) =>
  normalizeBillingIndicator(
    product?.billingIndicator ??
      product?.indicadorFacturacion ??
      product?.taxBillingIndicator ??
      product?.selectedSaleUnit?.pricing?.billingIndicator ??
      product?.pricing?.billingIndicator ??
      product?.selectedSaleUnit?.pricing?.tax?.billingIndicator ??
      product?.pricing?.tax?.billingIndicator ??
      product?.tax?.billingIndicator,
  );

const resolveTaxTypeBillingIndicator = (product) =>
  normalizeBillingIndicator(
    product?.taxType ??
      product?.tipoImpuesto ??
      product?.taxCategory ??
      product?.selectedSaleUnit?.pricing?.taxType ??
      product?.pricing?.taxType ??
      product?.selectedSaleUnit?.pricing?.tax?.type ??
      product?.selectedSaleUnit?.pricing?.tax?.ref ??
      product?.selectedSaleUnit?.pricing?.tax?.label ??
      product?.pricing?.tax?.type ??
      product?.pricing?.tax?.ref ??
      product?.pricing?.tax?.label ??
      product?.tax?.type ??
      product?.tax?.ref ??
      product?.tax?.label,
  );

const resolveBillingIndicatorFromTaxRate = (taxRate) => {
  if (taxRate == null) return BILLING_INDICATOR.ITBIS_18;
  if (isNearTaxRate(taxRate, 18)) return BILLING_INDICATOR.ITBIS_18;
  if (isNearTaxRate(taxRate, 16)) return BILLING_INDICATOR.ITBIS_16;
  if (isNearTaxRate(taxRate, 0)) return BILLING_INDICATOR.EXEMPT;
  return taxRate > 0 ? BILLING_INDICATOR.ITBIS_18 : BILLING_INDICATOR.EXEMPT;
};

const resolveBillingIndicator = (product, taxRate) => {
  const explicit = resolveExplicitBillingIndicator(product);
  if (explicit) return explicit;

  const taxType = resolveTaxTypeBillingIndicator(product);
  if (taxType) return taxType;

  if (product?.isVisible === false || product?.billable === false) {
    return BILLING_INDICATOR.NOT_BILLABLE;
  }

  return resolveBillingIndicatorFromTaxRate(taxRate);
};

const resolveEffectiveTaxRate = (billingIndicator, taxRate) => {
  if (BILLING_INDICATOR_TAX_RATE[billingIndicator] != null) {
    return BILLING_INDICATOR_TAX_RATE[billingIndicator];
  }
  return taxRate ?? 18;
};

const normalizeLocationCode = (...values) => {
  const raw = pickString(...values);
  if (!raw) return null;
  return PROVINCE_MUNICIPALITY_CODE_PATTERN.test(raw) ? raw : null;
};

const normalizeProvinceCode = (...values) => {
  const raw = pickString(...values);
  if (!raw) return null;
  if (PROVINCE_MUNICIPALITY_CODE_PATTERN.test(raw)) return raw;
  const normalizedKey = toAsciiUpperKey(raw).replace(/^PROVINCIA\s+/, '');
  return DOMINICAN_PROVINCE_CODES.get(normalizedKey) || null;
};

const normalizePhone = (...values) => {
  for (const value of values) {
    const raw = toCleanString(value);
    if (!raw) continue;

    const candidates = raw.match(/\+?\d[\d\s().-]{7,}\d/g) || [raw];
    for (const candidate of candidates) {
      const normalized = normalizePhoneCandidate(candidate);
      if (normalized) return normalized;
    }
  }

  return null;
};

const normalizePhoneCandidate = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  const localDigits =
    digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;

  if (localDigits.length !== 10) return null;
  return `${localDigits.slice(0, 3)}-${localDigits.slice(3, 6)}-${localDigits.slice(6)}`;
};

const resolveGisysInvoiceInternalId = ({ businessId, invoiceId }) => {
  const resolvedInvoiceId = toCleanString(invoiceId);
  const digest = stableHash({ businessId, invoiceId: resolvedInvoiceId })
    .slice(
      0,
      GISYS_INVOICE_INTERNAL_ID_MAX_LENGTH -
        GISYS_INVOICE_INTERNAL_ID_HASH_PREFIX.length,
    )
    .toUpperCase();

  return `${GISYS_INVOICE_INTERNAL_ID_HASH_PREFIX}${digest}`;
};

const normalizeDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') {
    return normalizeDate(value.toDate());
  }
  if (typeof value.toMillis === 'function') {
    return normalizeDate(value.toMillis());
  }
  if (value instanceof Date) {
    const millis = value.getTime();
    return Number.isFinite(millis) ? new Date(millis).toISOString() : null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? new Date(value).toISOString() : null;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
  }
  if (typeof value === 'object') {
    const seconds =
      typeof value.seconds === 'number'
        ? value.seconds
        : typeof value._seconds === 'number'
          ? value._seconds
          : null;
    if (seconds != null) {
      return new Date(seconds * 1000).toISOString();
    }
  }
  return null;
};

const pruneUndefined = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => pruneUndefined(entry))
      .filter((entry) => entry !== undefined && entry !== null);
  }
  if (!value || typeof value !== 'object') return value;

  const entries = Object.entries(value)
    .map(([key, entry]) => [key, pruneUndefined(entry)])
    .filter(([, entry]) => entry !== undefined && entry !== null);
  return Object.fromEntries(entries);
};

const resolveCurrency = (cart) =>
  pickString(
    cart?.functionalCurrency,
    cart?.documentCurrency,
    cart?.monetary?.functionalCurrency?.code,
    cart?.monetary?.functionalCurrency,
    cart?.monetary?.documentCurrency,
  ) || DEFAULT_CURRENCY;

const resolveTaxRate = (product) =>
  normalizeTaxRate(
    pickNumber(
      product?.selectedSaleUnit?.pricing?.tax?.tax,
      product?.selectedSaleUnit?.pricing?.tax,
      product?.pricing?.tax?.tax,
      product?.pricing?.tax,
      product?.tax?.tax,
      product?.tax?.value,
      product?.taxRate,
      product?.taxPercentage,
      product?.itbisRate,
    ),
  );

const resolveUnitPrice = (product) =>
  pickNumber(
    product?.monetary?.functionalUnitPrice,
    product?.selectedSaleUnit?.pricing?.price,
    product?.pricing?.price,
    product?.price?.unit,
    product?.price,
    product?.unitPrice,
  ) ?? 0;

const resolveQuantity = (product) => {
  const quantity =
    pickNumber(
      product?.amountToBuy,
      product?.quantity,
      product?.qty,
      product?.price?.quantity,
    ) ?? 1;
  return quantity > 0 ? quantity : 1;
};

const resolveLineDiscount = (product, grossAmount) => {
  const fixedDiscount = pickNumber(
    product?.monetary?.functionalDiscount,
    product?.discountAmount,
  );
  if (fixedDiscount != null) return Math.max(fixedDiscount, 0);

  const discountPercent = pickNumber(
    product?.discount?.value,
    product?.promotion?.discount,
  );
  if (discountPercent != null && discountPercent > 0) {
    return grossAmount * (discountPercent / 100);
  }

  return 0;
};

const sumItemAmounts = (items, billingIndicator, amountKey) =>
  roundAmount(
    items
      .filter((item) => item.billingIndicator === billingIndicator)
      .reduce((total, item) => total + (Number(item[amountKey]) || 0), 0),
  );

const whenPositive = (value) => (value > 0 ? roundAmount(value) : undefined);
const whenPresent = (condition, value) =>
  condition ? roundAmount(value) : undefined;

const buildItems = (cart) => {
  const products = Array.isArray(cart?.products) ? cart.products : [];
  return products.map((rawProduct, index) => {
    const product = asRecord(rawProduct);
    const quantity = resolveQuantity(product);
    const unitPrice = resolveUnitPrice(product);
    const grossAmount = unitPrice * quantity;
    const discountAmount = resolveLineDiscount(product, grossAmount);
    const lineAmount = Math.max(grossAmount - discountAmount, 0);
    const declaredTaxRate = resolveTaxRate(product);
    const billingIndicator = resolveBillingIndicator(product, declaredTaxRate);
    const taxRate = resolveEffectiveTaxRate(billingIndicator, declaredTaxRate);
    const declaredTaxAmount =
      pickNumber(
        product?.monetary?.functionalTax,
        product?.taxAmount,
        product?.itbis,
      ) ?? lineAmount * (taxRate / 100);
    const isTaxableLine = TAXABLE_BILLING_INDICATORS.has(billingIndicator);
    const taxAmount = isTaxableLine && taxRate > 0 ? declaredTaxAmount : 0;

    return pruneUndefined({
      lineNumber: index + 1,
      codes: product.id
        ? [{ type: 'internal', value: String(product.id) }]
        : undefined,
      name: pickString(product.name, product.productName, product.description),
      description: pickString(product.description, product.comment),
      billingIndicator,
      quantity: roundAmount(quantity),
      unitPrice: roundAmount(unitPrice),
      discountAmount:
        discountAmount > 0 ? roundAmount(discountAmount) : undefined,
      taxRate: isTaxableLine ? roundAmount(taxRate) : undefined,
      taxAmount: taxAmount > 0 ? roundAmount(taxAmount) : undefined,
      lineAmount: roundAmount(lineAmount),
    });
  });
};

const buildTotals = (cart, items) => {
  const taxableAmount1 = sumItemAmounts(
    items,
    BILLING_INDICATOR.ITBIS_18,
    'lineAmount',
  );
  const taxableAmount2 = sumItemAmounts(
    items,
    BILLING_INDICATOR.ITBIS_16,
    'lineAmount',
  );
  const taxableAmount3 = sumItemAmounts(
    items,
    BILLING_INDICATOR.ITBIS_0,
    'lineAmount',
  );
  const exemptAmount = sumItemAmounts(
    items,
    BILLING_INDICATOR.EXEMPT,
    'lineAmount',
  );
  const nonBillableAmount = sumItemAmounts(
    items,
    BILLING_INDICATOR.NOT_BILLABLE,
    'lineAmount',
  );
  const hasTaxableAmount1 = taxableAmount1 > 0;
  const hasTaxableAmount2 = taxableAmount2 > 0;
  const hasTaxableAmount3 = taxableAmount3 > 0;
  const hasAnyTaxableAmount =
    hasTaxableAmount1 || hasTaxableAmount2 || hasTaxableAmount3;
  const taxableAmountTotal = roundAmount(
    taxableAmount1 + taxableAmount2 + taxableAmount3,
  );
  const totalItbis1 = hasTaxableAmount1
    ? roundAmount(taxableAmount1 * 0.18)
    : undefined;
  const totalItbis2 = hasTaxableAmount2
    ? roundAmount(taxableAmount2 * 0.16)
    : undefined;
  const totalItbis3 = hasTaxableAmount3 ? 0 : undefined;
  const taxAmount = hasAnyTaxableAmount
    ? roundAmount((totalItbis1 || 0) + (totalItbis2 || 0) + (totalItbis3 || 0))
    : undefined;
  const netAmount = roundAmount(taxableAmountTotal + exemptAmount);
  const grandTotal = roundAmount(netAmount + (taxAmount || 0));
  const periodAmount = roundAmount(grandTotal + nonBillableAmount);

  return pruneUndefined({
    netAmount,
    taxableAmountTotal: whenPresent(hasAnyTaxableAmount, taxableAmountTotal),
    taxableAmount1: whenPositive(taxableAmount1),
    taxableAmount2: whenPositive(taxableAmount2),
    taxableAmount3: whenPositive(taxableAmount3),
    exemptAmount: whenPositive(exemptAmount),
    itbisRate1: hasTaxableAmount1 ? 18 : undefined,
    itbisRate2: hasTaxableAmount2 ? 16 : undefined,
    itbisRate3: hasTaxableAmount3 ? 0 : undefined,
    taxAmount: whenPresent(hasAnyTaxableAmount, taxAmount),
    totalItbis1,
    totalItbis2,
    totalItbis3,
    grandTotal,
    payableAmount: grandTotal,
    nonBillableAmount: whenPositive(nonBillableAmount),
    periodAmount: whenPresent(nonBillableAmount > 0, periodAmount),
  });
};

const resolvePaymentForm = (method) => {
  const raw = String(method || '')
    .trim()
    .toLowerCase();
  if (!raw) return '1';
  if (raw.includes('tarjeta') || raw.includes('card')) return '3';
  if (raw.includes('cheque') || raw.includes('check')) return '2';
  if (raw.includes('credito') || raw.includes('credit')) return '4';
  if (raw.includes('transfer')) return '7';
  return '1';
};

const buildPayments = (cart, grandTotal) => {
  const paymentMethods = Array.isArray(cart?.paymentMethod)
    ? cart.paymentMethod
    : [];
  const activePayments = paymentMethods
    .filter((method) => method?.status !== false)
    .map((method) => {
      const amount = pickNumber(method?.value, method?.amount);
      if (amount == null || amount <= 0) return null;
      return {
        form: resolvePaymentForm(
          method?.method || method?.type || method?.name,
        ),
        amount: roundAmount(amount),
      };
    })
    .filter(Boolean);

  if (activePayments.length) return activePayments;

  const paid = pickNumber(cart?.payment?.value, cart?.totalPaid);
  const fallbackAmount = paid != null && paid > 0 ? paid : grandTotal;
  return [{ form: '1', amount: roundAmount(fallbackAmount) }];
};

const buildBuyer = ({ client, documentType }) => {
  const buyer = asRecord(client);
  const name =
    pickString(
      buyer.name,
      buyer.displayName,
      buyer.businessName,
      buyer.companyName,
      buyer.commercialName,
    ) || (documentType === 'E32' ? DEFAULT_BUYER_NAME : null);

  return pruneUndefined({
    rncCedula: pickString(
      buyer.rnc,
      buyer.RNC,
      buyer.rncCedula,
      buyer.identification,
      buyer.identificationNumber,
      buyer.documentNumber,
      buyer.cedula,
    ),
    foreignId: pickString(buyer.foreignId),
    name,
    contactName: pickString(buyer.contactName),
    email: pickString(buyer.email),
    address: pickString(buyer.address, buyer.direccion),
    municipality: normalizeLocationCode(buyer.municipality, buyer.municipio),
    province: normalizeProvinceCode(buyer.province, buyer.provincia),
    phone: normalizePhone(buyer.phone, buyer.tel, buyer.mobile),
    internalCode: pickString(buyer.id),
  });
};

const buildIssuer = ({ business }) => {
  const businessNode = asRecord(business?.business);
  const source = Object.keys(businessNode).length
    ? businessNode
    : asRecord(business);
  const phone = normalizePhone(source.phone, source.tel);

  return pruneUndefined({
    legalName: pickString(source.legalName, source.name, source.businessName),
    commercialName: pickString(
      source.commercialName,
      source.tradeName,
      source.name,
    ),
    address: pickString(source.address, source.direccion),
    municipality: normalizeLocationCode(source.municipality, source.municipio),
    province: normalizeProvinceCode(source.province, source.provincia),
    phones: phone ? [phone] : undefined,
    email: pickString(source.email),
    economicActivity: pickString(source.economicActivity),
  });
};

export const buildGisysIssuePayload = ({
  businessId,
  invoiceId,
  invoice,
  taskPayload,
  providerConfig,
  business,
}) => {
  const cart = asRecord(taskPayload?.cart || invoice?.snapshot?.cart);
  const ncf = asRecord(invoice?.snapshot?.ncf);
  const ncfType =
    taskPayload?.ncfType || ncf.type || taskPayload?.taxReceiptName;
  const documentType = resolveGisysDocumentType({ ncfType, ncf, cart });
  if (!documentType) {
    throw new Error(
      `gisys_document_type_unresolved(ncfType=${ncfType || 'empty'})`,
    );
  }

  const items = buildItems(cart);
  if (!items.length) {
    throw new Error('gisys_payload_requires_items');
  }

  const totals = buildTotals(cart, items);
  const client =
    taskPayload?.client || invoice?.snapshot?.client || cart.client;
  const issuedAt =
    normalizeDate(cart?.date) ||
    normalizeDate(invoice?.createdAt) ||
    new Date().toISOString();
  const invoiceInternalId = resolveGisysInvoiceInternalId({
    businessId,
    invoiceId,
  });

  return {
    payload: pruneUndefined({
      integrationInstanceCode: providerConfig.integrationInstanceCode,
      taxpayerCode: providerConfig.taxpayerCode,
      documentType,
      invoiceInternalId,
      issuedAt,
      currency: resolveCurrency(cart),
      incomeType: taskPayload?.incomeType || '01',
      paymentType: taskPayload?.paymentType,
      paymentDueDate: normalizeDate(taskPayload?.dueDate)?.slice(0, 10),
      issuer: buildIssuer({ business }),
      buyer: buildBuyer({ client, documentType }),
      payments: buildPayments(cart, totals.grandTotal),
      items,
      totals,
      meta: {
        source: 'issue_api',
        sourceTraceId: `${businessId}:${invoiceId}`,
        requestedENcf: ncf.code || null,
        posId: pickString(cart?.cashCountId),
        notes: taskPayload?.invoiceComment || invoice?.snapshot?.invoiceComment,
      },
    }),
    documentType,
    requestHash: stableHash({ businessId, invoiceId, documentType, cart }),
  };
};
