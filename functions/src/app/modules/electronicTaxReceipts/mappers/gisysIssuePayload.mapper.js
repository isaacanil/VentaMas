import { stableHash } from '../../../versions/v2/invoice/utils/hash.util.js';
import { resolveGisysDocumentType } from '../utils/gisysDocumentType.util.js';

const DEFAULT_CURRENCY = 'DOP';
const DEFAULT_BUYER_NAME = 'Consumidor Final';

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
  pickNumber(
    product?.pricing?.tax?.tax,
    product?.selectedSaleUnit?.pricing?.tax?.tax,
    product?.taxRate,
    product?.taxPercentage,
    product?.itbisRate,
  ) ?? 18;

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

const buildItems = (cart) => {
  const products = Array.isArray(cart?.products) ? cart.products : [];
  return products.map((rawProduct, index) => {
    const product = asRecord(rawProduct);
    const quantity = resolveQuantity(product);
    const unitPrice = resolveUnitPrice(product);
    const grossAmount = unitPrice * quantity;
    const discountAmount = resolveLineDiscount(product, grossAmount);
    const lineAmount = Math.max(grossAmount - discountAmount, 0);
    const taxRate = resolveTaxRate(product);
    const taxAmount =
      pickNumber(
        product?.monetary?.functionalTax,
        product?.taxAmount,
        product?.itbis,
      ) ?? lineAmount * (taxRate / 100);

    return pruneUndefined({
      lineNumber: index + 1,
      codes: product.id ? [{ type: 'internal', value: String(product.id) }] : undefined,
      name: pickString(product.name, product.productName, product.description),
      description: pickString(product.description, product.comment),
      billingIndicator: taxRate > 0 ? '1' : '4',
      quantity: roundAmount(quantity),
      unitPrice: roundAmount(unitPrice),
      discountAmount: discountAmount > 0 ? roundAmount(discountAmount) : undefined,
      taxRate: taxRate > 0 ? roundAmount(taxRate) : undefined,
      taxAmount: taxAmount > 0 ? roundAmount(taxAmount) : undefined,
      lineAmount: roundAmount(lineAmount),
    });
  });
};

const buildTotals = (cart, items) => {
  const itemNetAmount = roundAmount(
    items.reduce((total, item) => total + (Number(item.lineAmount) || 0), 0),
  );
  const itemTaxAmount = roundAmount(
    items.reduce((total, item) => total + (Number(item.taxAmount) || 0), 0),
  );
  const netAmount =
    pickNumber(
      cart?.totalPurchaseWithoutTaxes?.value,
      cart?.subtotal,
      cart?.taxableAmountTotal,
    ) ?? itemNetAmount;
  const taxAmount =
    pickNumber(cart?.totalTaxes?.value, cart?.taxAmount, cart?.itbis) ??
    itemTaxAmount;
  const grandTotal =
    pickNumber(
      cart?.totalPurchase?.value,
      cart?.totalAmount,
      cart?.grandTotal,
    ) ?? netAmount + taxAmount;

  return pruneUndefined({
    netAmount: roundAmount(netAmount),
    taxableAmountTotal: roundAmount(netAmount),
    taxableAmount1: roundAmount(netAmount),
    itbisRate1: taxAmount > 0 ? 18 : undefined,
    taxAmount: roundAmount(taxAmount),
    totalItbis1: roundAmount(taxAmount),
    grandTotal: roundAmount(grandTotal),
    payableAmount: roundAmount(grandTotal),
  });
};

const resolvePaymentForm = (method) => {
  const raw = String(method || '').trim().toLowerCase();
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
        form: resolvePaymentForm(method?.method || method?.type || method?.name),
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
    municipality: pickString(buyer.municipality, buyer.municipio),
    province: pickString(buyer.province, buyer.provincia),
    phone: pickString(buyer.phone, buyer.tel, buyer.mobile),
    internalCode: pickString(buyer.id),
  });
};

const buildIssuer = ({ business }) => {
  const businessNode = asRecord(business?.business);
  const source = Object.keys(businessNode).length ? businessNode : asRecord(business);

  return pruneUndefined({
    legalName: pickString(source.legalName, source.name, source.businessName),
    commercialName: pickString(
      source.commercialName,
      source.tradeName,
      source.name,
    ),
    address: pickString(source.address, source.direccion),
    municipality: pickString(source.municipality, source.municipio),
    province: pickString(source.province, source.provincia),
    phones: [pickString(source.phone, source.tel)].filter(Boolean),
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
  const ncfType = taskPayload?.ncfType || ncf.type || taskPayload?.taxReceiptName;
  const documentType = resolveGisysDocumentType({ ncfType, ncf, cart });
  if (!documentType) {
    throw new Error(`gisys_document_type_unresolved(ncfType=${ncfType || 'empty'})`);
  }

  const items = buildItems(cart);
  if (!items.length) {
    throw new Error('gisys_payload_requires_items');
  }

  const totals = buildTotals(cart, items);
  const client = taskPayload?.client || invoice?.snapshot?.client || cart.client;
  const issuedAt =
    normalizeDate(cart?.date) ||
    normalizeDate(invoice?.createdAt) ||
    new Date().toISOString();

  return {
    payload: pruneUndefined({
      integrationInstanceCode: providerConfig.integrationInstanceCode,
      taxpayerCode: providerConfig.taxpayerCode,
      documentType,
      dgiiEnvironment: providerConfig.dgiiEnvironment || undefined,
      invoiceInternalId: invoiceId,
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
