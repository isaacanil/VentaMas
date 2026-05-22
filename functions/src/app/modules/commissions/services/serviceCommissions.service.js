import { db, FieldValue } from '../../../core/config/firebase.js';

const DEFAULT_SETTINGS = {
  enabled: false,
  appliesTo: 'services',
  calculationBase: 'netSubtotalWithoutTax',
  defaultType: 'percentage',
  defaultRate: 0,
  requireCollaboratorOnService: false,
  showOnPrintedInvoice: false,
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundMoney = (value) => Number(safeNumber(value).toFixed(2));

const sanitizeDocId = (value) =>
  toCleanString(value)?.replace(/[^a-zA-Z0-9_-]/g, '_') || null;

const withoutUndefined = (value) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  );

export const normalizeServiceCommissionSettings = (settings = {}) => {
  const serviceCommissions = asRecord(settings.serviceCommissions);
  const type =
    serviceCommissions.defaultType === 'fixed' ||
    serviceCommissions.defaultType === 'percentage'
      ? serviceCommissions.defaultType
      : DEFAULT_SETTINGS.defaultType;

  return {
    ...DEFAULT_SETTINGS,
    ...serviceCommissions,
    enabled: serviceCommissions.enabled === true,
    appliesTo: 'services',
    calculationBase: 'netSubtotalWithoutTax',
    defaultType: type,
    defaultRate: Math.max(0, safeNumber(serviceCommissions.defaultRate)),
    requireCollaboratorOnService:
      serviceCommissions.requireCollaboratorOnService === true,
    showOnPrintedInvoice: serviceCommissions.showOnPrintedInvoice === true,
  };
};

const isServiceLine = (product) => {
  const itemType = toCleanString(product?.itemType)?.toLowerCase();
  const type = toCleanString(product?.type)?.toLowerCase();
  return itemType === 'service' || type === 'service';
};

const getLineId = (product, index) =>
  toCleanString(product?.cid) ||
  toCleanString(product?.lineId) ||
  toCleanString(product?.id) ||
  `line_${index + 1}`;

const getQuantity = (product) => {
  const amountToBuy = product?.amountToBuy;
  if (typeof amountToBuy === 'number' || typeof amountToBuy === 'string') {
    return safeNumber(amountToBuy, 1);
  }
  const amount = asRecord(amountToBuy);
  const quantity = safeNumber(amount.total ?? amount.unit ?? product?.quantity, 1);
  return quantity > 0 ? quantity : 1;
};

const getUnitPrice = (product) => {
  const monetary = asRecord(product?.monetary);
  const selectedSaleUnit = asRecord(product?.selectedSaleUnit);
  const selectedSaleUnitPricing = asRecord(selectedSaleUnit.pricing);
  const pricing = asRecord(product?.pricing);
  const priceObject = asRecord(product?.price);

  return safeNumber(
    monetary.functionalUnitPrice ??
      selectedSaleUnitPricing.price ??
      pricing.price ??
      pricing.listPrice ??
      priceObject.unit ??
      priceObject.total ??
      product?.price,
  );
};

const getDiscountAmount = (product, subtotal) => {
  const discount = asRecord(product?.discount);
  const value = safeNumber(discount.value);
  if (value <= 0) return 0;

  const type = toCleanString(discount.type)?.toLowerCase();
  if (type === 'percentage') {
    return subtotal * (value / 100);
  }

  const exchangeRate = safeNumber(asRecord(product?.monetary).exchangeRate, 1) || 1;
  return value * exchangeRate;
};

export const resolveServiceCommissionBaseAmount = (product) => {
  const subtotal = getUnitPrice(product) * getQuantity(product);
  const discount = getDiscountAmount(product, subtotal);
  return roundMoney(Math.max(0, subtotal - discount));
};

export const calculateServiceCommissionAmount = ({
  baseAmount,
  rateValue,
  type,
}) => {
  if (type === 'fixed') {
    return roundMoney(Math.max(0, rateValue));
  }
  return roundMoney(Math.max(0, baseAmount * (rateValue / 100)));
};

const getCommissionSnapshot = (product) => {
  const directSnapshot = asRecord(product?.serviceCommission);
  if (Object.keys(directSnapshot).length > 0) return directSnapshot;
  return asRecord(product?.commission);
};

const getCollaboratorSnapshot = (commission) => {
  const collaborator = asRecord(commission.collaborator);
  const id =
    toCleanString(commission.collaboratorId) ||
    toCleanString(collaborator.id) ||
    toCleanString(collaborator.uid) ||
    toCleanString(collaborator.userId);
  const code =
    toCleanString(commission.collaboratorCode) ||
    toCleanString(collaborator.code) ||
    toCleanString(collaborator.number) ||
    toCleanString(collaborator.employeeCode) ||
    id;
  const name =
    toCleanString(commission.collaboratorName) ||
    toCleanString(collaborator.name) ||
    toCleanString(collaborator.displayName) ||
    toCleanString(collaborator.fullName) ||
    toCleanString(collaborator.email) ||
    code;

  if (!code && !id && !name) return null;

  return {
    id: id || null,
    code: code || null,
    name: name || null,
    linkedUserId:
      toCleanString(collaborator.linkedUserId) ||
      toCleanString(commission.linkedUserId) ||
      id ||
      null,
  };
};

export const buildServiceCommissionRecords = ({
  businessId,
  invoice,
  invoiceId,
  products = [],
  settings = {},
  userId = null,
}) => {
  const normalizedSettings = normalizeServiceCommissionSettings(settings);
  if (!normalizedSettings.enabled) return [];

  return products.flatMap((product, index) => {
    if (!product || typeof product !== 'object' || !isServiceLine(product)) {
      return [];
    }

    const commission = getCommissionSnapshot(product);
    const collaborator = getCollaboratorSnapshot(commission);
    if (!collaborator?.code && !collaborator?.id) return [];

    const type =
      commission.type === 'fixed' || commission.type === 'percentage'
        ? commission.type
        : normalizedSettings.defaultType;
    const rateValue = Math.max(
      0,
      safeNumber(commission.rateValue, normalizedSettings.defaultRate),
    );
    if (rateValue <= 0 && type !== 'fixed') return [];

    const baseAmount = resolveServiceCommissionBaseAmount(product);
    const commissionAmount = calculateServiceCommissionAmount({
      baseAmount,
      rateValue,
      type,
    });
    const lineId = getLineId(product, index);
    const docId = sanitizeDocId(`${invoiceId}_${lineId}`);
    if (!docId) return [];

    const serviceId =
      toCleanString(product.productId) || toCleanString(product.id) || null;
    const serviceName =
      toCleanString(product.name) || toCleanString(product.productName) || null;

    return [
      withoutUndefined({
        id: docId,
        businessId,
        invoiceId,
        invoiceNumber:
          toCleanString(invoice?.numberID) ||
          toCleanString(invoice?.number) ||
          toCleanString(invoice?.invoiceNumber) ||
          null,
        date: invoice?.date ?? FieldValue.serverTimestamp(),
        lineId,
        serviceId,
        serviceName,
        collaboratorId: collaborator.id,
        collaboratorCode: collaborator.code,
        collaboratorName: collaborator.name,
        billedAmount: baseAmount,
        amountFactured: baseAmount,
        commissionAmount,
        status: 'active',
        service: {
          id: serviceId,
          name: serviceName,
          sku: toCleanString(product.sku) || toCleanString(product.barcode),
        },
        collaborator,
        commission: {
          type,
          rateValue,
          source: toCleanString(commission.source) || 'manual',
          calculationBase: 'netSubtotalWithoutTax',
        },
        createdAt: FieldValue.serverTimestamp(),
        createdBy: userId,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: userId,
      }),
    ];
  });
};

export const syncServiceCommissionsTx = (
  transaction,
  { businessId, invoice, invoiceId, products, settings, userId },
) => {
  const records = buildServiceCommissionRecords({
    businessId,
    invoice,
    invoiceId,
    products,
    settings,
    userId,
  });

  records.forEach((record) => {
    const ref = db.doc(
      `businesses/${businessId}/serviceCommissions/${record.id}`,
    );
    transaction.set(ref, record, { merge: true });
  });

  return records;
};

export const voidServiceCommissionsTx = (
  transaction,
  { authUid, commissionSnap, reasonLabel, voidedAt },
) => {
  const docs = commissionSnap?.docs || [];
  docs.forEach((docSnapshot) => {
    transaction.set(
      docSnapshot.ref,
      {
        status: 'voided',
        voidedAt,
        voidedBy: authUid,
        voidReason: reasonLabel,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: authUid,
      },
      { merge: true },
    );
  });
  return docs.length;
};
