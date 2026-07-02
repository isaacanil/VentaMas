// functions/src/modules/invoice/utils/invoiceValidation.js

import {
  convertWeightToInventoryBaseQuantity,
  isSupportedWeightUnit,
  resolveWeightUnitToKgFactor,
} from '../../Inventory/utils/weightUnit.util.js';
import {
  sumActiveCreditNotePaymentMethods,
  sumActivePaymentMethods,
  sumCreditNoteApplications,
} from './invoicePayment.util.js';

export const MONETARY_TOLERANCE = 0.05;

const DEFAULT_FUNCTIONAL_CURRENCY = 'DOP';
const PERCENTAGE_DISCOUNT_TYPES = new Set(['percentage', 'porcentaje', '%']);
const INACTIVE_CATALOG_STATUSES = new Set([
  'inactive',
  'inactivo',
  'disabled',
  'archived',
  'deleted',
  'eliminado',
]);

export const INVOICE_VALIDATION_CODES = Object.freeze({
  INVALID_CART: 'INVALID_CART',
  INVALID_LINE_QUANTITY: 'INVALID_LINE_QUANTITY',
  INVALID_WEIGHT: 'INVALID_WEIGHT',
  INVALID_WEIGHT_UNIT: 'INVALID_WEIGHT_UNIT',
  INVALID_SALE_UNIT_CONVERSION: 'INVALID_SALE_UNIT_CONVERSION',
  UNSUPPORTED_MIXED_CURRENCY: 'UNSUPPORTED_MIXED_CURRENCY',
  MONETARY_SNAPSHOT_INCONSISTENT: 'MONETARY_SNAPSHOT_INCONSISTENT',
  PAYMENT_INSUFFICIENT: 'PAYMENT_INSUFFICIENT',
  CREDIT_NOTE_PAYMENT_INCONSISTENT: 'CREDIT_NOTE_PAYMENT_INCONSISTENT',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_INACTIVE: 'PRODUCT_INACTIVE',
  PRODUCT_NOT_SELLABLE: 'PRODUCT_NOT_SELLABLE',
  PRODUCT_PRICE_INCONSISTENT: 'PRODUCT_PRICE_INCONSISTENT',
  PRODUCT_TAX_INCONSISTENT: 'PRODUCT_TAX_INCONSISTENT',
  BASE_QUANTITY_INCONSISTENT: 'BASE_QUANTITY_INCONSISTENT',
  SALE_UNIT_ID_REQUIRED: 'SALE_UNIT_ID_REQUIRED',
  SALE_UNIT_NOT_FOUND: 'SALE_UNIT_NOT_FOUND',
  SALE_UNIT_INACTIVE: 'SALE_UNIT_INACTIVE',
  SALE_UNIT_INCONSISTENT: 'SALE_UNIT_INCONSISTENT',
  PRODUCT_WEIGHT_INCONSISTENT: 'PRODUCT_WEIGHT_INCONSISTENT',
});

const getCartProducts = (cart) =>
  Array.isArray(cart?.products) ? cart.products : [];

const isRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value);

const safeNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeId = (value) => toCleanString(value);

const roundQuantity = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 1_000_000) / 1_000_000;

const normalizeCatalogItemType = (value, rawType) => {
  for (const source of [value, rawType]) {
    const normalized = toCleanString(source)?.toLowerCase();
    if (!normalized) continue;
    if (['servicio', 'servicios', 'service', 'services'].includes(normalized)) {
      return 'service';
    }
    if (
      ['combo', 'combos', 'combinado', 'combinados', 'kit', 'bundle'].includes(
        normalized,
      ) ||
      normalized.includes('combo') ||
      normalized.includes('kit')
    ) {
      return 'combo';
    }
    if (['producto', 'productos', 'product', 'products'].includes(normalized)) {
      return 'product';
    }
  }

  return 'product';
};

const normalizeCatalogInventoryRole = (value, itemType) => {
  if (itemType !== 'product') return null;
  const normalized = toCleanString(value)?.toLowerCase().replace(/[\s-]+/g, '_');
  if (
    ['raw_material', 'materia_prima', 'insumo', 'ingredient'].includes(
      normalized,
    )
  ) {
    return 'raw_material';
  }
  return null;
};

const normalizeComboInventoryPolicy = (value) => {
  const normalized = toCleanString(value)?.toLowerCase();
  return normalized === 'self' ? 'self' : 'components';
};

const normalizeComboComponents = (components) => {
  if (!Array.isArray(components)) return [];

  const normalizedComponents = components
    .map((component) => {
      if (!isRecord(component)) return null;
      const productId = normalizeId(component.productId ?? component.idProduct);
      const quantity = safeNumber(component.quantity);
      if (!productId || quantity == null || quantity <= 0) return null;

      const normalized = {
        productId,
        quantity,
      };
      const id = normalizeId(component.id);
      const productName = toCleanString(
        component.productName ?? component.name ?? component.label,
      );
      const unitName = toCleanString(component.unitName);
      if (id) normalized.id = id;
      if (productName) normalized.productName = productName;
      if (unitName) normalized.unitName = unitName;
      if (component.sku !== undefined && component.sku !== null) {
        normalized.sku = component.sku;
      }
      return normalized;
    })
    .filter(Boolean);

  const componentsByProductId = new Map();
  for (const component of normalizedComponents) {
    const existing = componentsByProductId.get(component.productId);
    if (!existing) {
      componentsByProductId.set(component.productId, { ...component });
      continue;
    }

    existing.quantity = roundQuantity(existing.quantity + component.quantity);
    if (!existing.id && component.id) existing.id = component.id;
    if (!existing.productName && component.productName) {
      existing.productName = component.productName;
    }
    if (!existing.unitName && component.unitName) {
      existing.unitName = component.unitName;
    }
    if (existing.sku === undefined && component.sku !== undefined) {
      existing.sku = component.sku;
    }
  }

  return [...componentsByProductId.values()];
};

const buildTrustedComboSnapshot = (catalogProduct) => {
  const itemType = normalizeCatalogItemType(
    catalogProduct?.itemType,
    catalogProduct?.type,
  );
  if (itemType !== 'combo') return { itemType, combo: null };

  const combo = isRecord(catalogProduct?.combo) ? catalogProduct.combo : {};
  return {
    itemType,
    combo: {
      enabled: true,
      inventoryPolicy: normalizeComboInventoryPolicy(combo.inventoryPolicy),
      components: normalizeComboComponents(combo.components),
    },
  };
};

const hasSupportedOrMissingWeightUnit = (unit) => {
  const cleanUnit = toCleanString(unit);
  return cleanUnit == null || isSupportedWeightUnit(cleanUnit);
};

const weightUnitsAreCompatible = (left, right) => {
  const cleanLeft = toCleanString(left);
  const cleanRight = toCleanString(right);
  if (cleanLeft == null || cleanRight == null) return true;
  if (!isSupportedWeightUnit(cleanLeft) || !isSupportedWeightUnit(cleanRight)) {
    return false;
  }
  return (
    Math.abs(
      resolveWeightUnitToKgFactor(cleanLeft) -
        resolveWeightUnitToKgFactor(cleanRight),
    ) <= 0.000000001
  );
};

const normalizeCurrency = (value) =>
  (toCleanString(value) ?? DEFAULT_FUNCTIONAL_CURRENCY).toUpperCase();

const resolveValidationFunctionalCurrency = (options = {}) =>
  normalizeCurrency(options?.functionalCurrency ?? DEFAULT_FUNCTIONAL_CURRENCY);

const isInactiveCatalogRecord = (record) => {
  if (!isRecord(record)) return false;
  if (record.active === false || record.status === false) return true;
  if (record.isDeleted === true || record.deleted === true) return true;
  const status = toCleanString(record.status)?.toLowerCase();
  return status ? INACTIVE_CATALOG_STATUSES.has(status) : false;
};

const isNonSellableCatalogRecord = (record) => {
  if (!isRecord(record)) return false;
  const itemType = normalizeCatalogItemType(record.itemType, record.type);
  if (normalizeCatalogInventoryRole(record.inventoryRole, itemType)) {
    return true;
  }
  return record.isSellable === false || record.isVisible === false;
};

const roundCurrency = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const normalizeInvoiceChange = (value) => {
  const rounded = roundCurrency(Number(value) || 0);
  return Math.abs(rounded) < 0.005 ? 0 : rounded;
};

const validationError = (code, message, details = {}) => ({
  isValid: false,
  code,
  message,
  details,
});

const getSelectedSaleUnit = (product) =>
  product?.selectedSaleUnit ?? product?.saleUnit ?? null;

const readAmountToBuy = (product) => {
  const amount = product?.amountToBuy;
  if (amount && typeof amount === 'object' && !Array.isArray(amount)) {
    if (getSelectedSaleUnit(product)) {
      return (
        safeNumber(amount.unit) ??
        safeNumber(amount.value) ??
        safeNumber(amount.quantity) ??
        safeNumber(amount.total) ??
        null
      );
    }

    return (
      safeNumber(amount.total) ??
      safeNumber(amount.unit) ??
      safeNumber(amount.value) ??
      safeNumber(amount.quantity) ??
      null
    );
  }
  return safeNumber(amount);
};

const readLineQuantity = (product) => {
  if (product?.weightDetail?.isSoldByWeight === true) {
    return safeNumber(product?.weightDetail?.weight);
  }
  return readAmountToBuy(product);
};

const resolveActivePricing = (product) =>
  getSelectedSaleUnit(product)?.pricing ?? product?.pricing ?? null;

const readUnitPrice = (product) =>
  safeNumber(resolveActivePricing(product)?.price);

const readPricingTaxRate = (pricing) => {
  const rawTax = pricing?.tax;
  if (rawTax == null || rawTax === '') return 0;
  if (rawTax && typeof rawTax === 'object' && !Array.isArray(rawTax)) {
    return safeNumber(rawTax.tax);
  }
  return safeNumber(rawTax);
};

const readTaxRate = (product) => readPricingTaxRate(resolveActivePricing(product));

const readSaleUnitFactor = (unit) =>
  safeNumber(unit?.conversionFactorToBase) ?? safeNumber(unit?.quantity);

const readSaleUnitConversionFactor = (product) => {
  const unit = getSelectedSaleUnit(product);
  if (!unit) return 1;
  const factor = readSaleUnitFactor(unit);
  if (factor != null) return factor;

  const hasUnitIdentity = Boolean(
    unit.id || unit.unitName || unit.barcode || unit.qrcode || unit.qrCode,
  );
  return hasUnitIdentity ? null : 1;
};

const roundInventoryQuantity = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 1_000_000) / 1_000_000;

const readExpectedBaseQuantity = (product) => {
  const lineQuantity = readLineQuantity(product);
  if (!Number.isFinite(lineQuantity) || lineQuantity <= 0) return null;
  if (product?.weightDetail?.isSoldByWeight === true) {
    return convertWeightToInventoryBaseQuantity({
      weight: lineQuantity,
      unit: product?.weightDetail?.weightUnit,
    });
  }

  const factor = readSaleUnitConversionFactor(product);
  if (!Number.isFinite(factor) || factor <= 0) return null;
  return roundInventoryQuantity(lineQuantity * factor);
};

const assertLineBaseQuantityMatches = (product) => {
  const providedBaseQuantity = safeNumber(product?.baseQuantity);
  if (providedBaseQuantity == null) return null;

  const expectedBaseQuantity = readExpectedBaseQuantity(product);
  if (expectedBaseQuantity == null) {
    return validationError(
      INVOICE_VALIDATION_CODES.BASE_QUANTITY_INCONSISTENT,
      'No se pudo validar baseQuantity contra la cantidad real de inventario.',
    );
  }

  if (
    Math.abs(
      roundInventoryQuantity(providedBaseQuantity) - expectedBaseQuantity,
    ) > 0.000001
  ) {
    return validationError(
      INVOICE_VALIDATION_CODES.BASE_QUANTITY_INCONSISTENT,
      `baseQuantity inconsistente: esperado ${expectedBaseQuantity}, recibido ${providedBaseQuantity}.`,
      { expected: expectedBaseQuantity, actual: providedBaseQuantity },
    );
  }

  return null;
};

const withTrustedBaseQuantity = (line) => {
  const expectedBaseQuantity = readExpectedBaseQuantity(line);
  if (expectedBaseQuantity == null) return line;
  return {
    ...line,
    baseQuantity: expectedBaseQuantity,
  };
};

const readMonetaryValue = (source) => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return null;
  }
  return safeNumber(source.value);
};

const differs = (actual, expected) =>
  actual == null ||
  Math.abs(roundCurrency(actual) - roundCurrency(expected)) >
    MONETARY_TOLERANCE;

const getLineExchangeRate = (product) =>
  safeNumber(product?.monetary?.exchangeRate) ?? 1;

const getProductLineCurrency = (product, fallbackCurrency) =>
  normalizeCurrency(
    resolveActivePricing(product)?.currency ??
      product?.monetary?.documentCurrency ??
      fallbackCurrency,
  );

const assertSupportedCurrency = (cart, products, options = {}) => {
  // TODO(phase-2): validate mixed-currency sales against server-owned rate
  // configuration. Phase 1 rejects them instead of trusting the frontend.
  if (cart?.mixedCurrencySale === true) {
    return validationError(
      INVOICE_VALIDATION_CODES.UNSUPPORTED_MIXED_CURRENCY,
      'Ventas con moneda mixta no estan soportadas por la validacion backend de Fase 1.',
    );
  }

  const functionalCurrency = resolveValidationFunctionalCurrency(options);
  const payloadFunctionalCurrency = toCleanString(cart?.functionalCurrency)
    ? normalizeCurrency(cart.functionalCurrency)
    : null;
  if (
    payloadFunctionalCurrency &&
    payloadFunctionalCurrency !== functionalCurrency
  ) {
    return validationError(
      INVOICE_VALIDATION_CODES.UNSUPPORTED_MIXED_CURRENCY,
      'La moneda funcional del carrito no coincide con la moneda funcional permitida por backend.',
    );
  }

  const documentCurrency = normalizeCurrency(
    cart?.documentCurrency ?? functionalCurrency,
  );
  if (documentCurrency !== functionalCurrency) {
    return validationError(
      INVOICE_VALIDATION_CODES.UNSUPPORTED_MIXED_CURRENCY,
      'La moneda del documento no coincide con la moneda funcional permitida por backend.',
    );
  }

  const currencies = new Set();

  for (const product of products) {
    const exchangeRate = getLineExchangeRate(product);
    if (exchangeRate !== 1) {
      return validationError(
        INVOICE_VALIDATION_CODES.UNSUPPORTED_MIXED_CURRENCY,
        'La factura contiene una tasa de cambio de linea no verificable por backend.',
      );
    }
    currencies.add(getProductLineCurrency(product, functionalCurrency));
  }

  if (currencies.size > 1) {
    return validationError(
      INVOICE_VALIDATION_CODES.UNSUPPORTED_MIXED_CURRENCY,
      'La factura contiene productos en mas de una moneda.',
    );
  }

  const [lineCurrency] = Array.from(currencies);
  if (lineCurrency && lineCurrency !== functionalCurrency) {
    return validationError(
      INVOICE_VALIDATION_CODES.UNSUPPORTED_MIXED_CURRENCY,
      'La moneda de las lineas no coincide con la moneda funcional del carrito.',
    );
  }

  return null;
};

const calculateLineDiscount = (product, grossSubtotal) => {
  const discountValue = safeNumber(product?.discount?.value) ?? 0;
  if (discountValue <= 0) return 0;

  if (discountValue < 0) return null;
  if (PERCENTAGE_DISCOUNT_TYPES.has(String(product?.discount?.type || ''))) {
    if (discountValue > 100) return null;
    return grossSubtotal * (discountValue / 100);
  }

  return Math.min(discountValue, grossSubtotal);
};

const calculateInsurance = (product, grossSubtotal, quantity) => {
  const insuranceValue = safeNumber(product?.insurance?.value) ?? 0;
  if (insuranceValue <= 0) return 0;
  if (insuranceValue < 0) return null;
  return product?.insurance?.mode === 'porcentaje'
    ? grossSubtotal * (insuranceValue / 100)
    : insuranceValue * quantity;
};

const calculateLineTotals = (product) => {
  if (!product || typeof product !== 'object') {
    return { calculable: false, reason: 'linea invalida' };
  }

  const quantity = readLineQuantity(product);
  const unitPrice = readUnitPrice(product);
  const taxRate = readTaxRate(product);
  if (
    quantity == null ||
    unitPrice == null ||
    taxRate == null ||
    quantity <= 0 ||
    unitPrice < 0 ||
    taxRate < 0
  ) {
    return { calculable: false, reason: 'cantidad, precio o ITBIS invalido' };
  }

  const grossSubtotal = unitPrice * quantity;
  const lineDiscount = calculateLineDiscount(product, grossSubtotal);
  if (lineDiscount == null) {
    return { calculable: false, reason: 'descuento de linea invalido' };
  }

  const subtotal = Math.max(0, grossSubtotal - lineDiscount);
  const taxes = subtotal * (taxRate / 100);
  const promotionRate = safeNumber(product?.promotion?.discount) ?? 0;
  if (promotionRate < 0 || promotionRate > 100) {
    return { calculable: false, reason: 'promocion de linea invalida' };
  }
  const promotionDiscount = subtotal * (promotionRate / 100);
  const insurance = calculateInsurance(product, grossSubtotal, quantity);
  if (insurance == null) {
    return { calculable: false, reason: 'seguro de linea invalido' };
  }
  const exchangeRate = getLineExchangeRate(product);

  return {
    calculable: true,
    subtotal: subtotal * exchangeRate,
    taxes: roundCurrency(taxes) * exchangeRate,
    promotionDiscount: roundCurrency(promotionDiscount) * exchangeRate,
    insurance: insurance * exchangeRate,
    productsTotal:
      roundCurrency(subtotal + roundCurrency(taxes) - promotionDiscount) *
      exchangeRate,
    quantity,
  };
};

const calculateCartTotals = (cart, options = {}) => {
  const products = getCartProducts(cart);
  if (!products.length) {
    return { calculable: false, reason: 'carrito sin productos' };
  }

  const currencyError = assertSupportedCurrency(cart, products, options);
  if (currencyError) return currencyError;

  const totals = products.reduce(
    (acc, product) => {
      if (!acc.calculable) return acc;
      const line = calculateLineTotals(product);
      if (!line.calculable) {
        return { ...acc, calculable: false, reason: line.reason };
      }
      acc.subtotal += line.subtotal;
      acc.taxes += line.taxes;
      acc.promotionDiscount += line.promotionDiscount;
      acc.insurance += line.insurance;
      acc.productsTotal += line.productsTotal;
      acc.totalShoppingItems += readAmountToBuy(product) ?? 0;
      return acc;
    },
    {
      subtotal: 0,
      taxes: 0,
      promotionDiscount: 0,
      insurance: 0,
      productsTotal: 0,
      totalShoppingItems: 0,
      calculable: true,
      reason: null,
    },
  );

  if (!totals.calculable) return totals;

  const discountValue = safeNumber(cart?.discount?.value) ?? 0;
  const deliveryValue = safeNumber(cart?.delivery?.value) ?? 0;
  if (discountValue < 0 || discountValue > 100 || deliveryValue < 0) {
    return {
      calculable: false,
      reason: 'descuento global o delivery invalido',
    };
  }

  const totalBeforeGeneralDiscount = totals.subtotal - totals.promotionDiscount;
  const generalDiscount = totalBeforeGeneralDiscount * (discountValue / 100);
  const purchaseValue =
    totals.productsTotal - generalDiscount + deliveryValue - totals.insurance;

  return {
    calculable: true,
    subtotal: roundCurrency(totals.subtotal),
    taxes: roundCurrency(totals.taxes),
    totalInsurance: roundCurrency(totals.insurance),
    generalDiscount: roundCurrency(generalDiscount),
    delivery: roundCurrency(deliveryValue),
    totalShoppingItems: roundCurrency(totals.totalShoppingItems),
    totalPurchase: roundCurrency(purchaseValue),
  };
};

const assertMonetarySnapshot = (label, actual, expected) => {
  if (differs(actual, expected)) {
    return validationError(
      INVOICE_VALIDATION_CODES.MONETARY_SNAPSHOT_INCONSISTENT,
      `${label} inconsistente: esperado ${expected}, recibido ${actual}.`,
      { label, expected, actual },
    );
  }
  return null;
};

export function validateInvoiceMonetaryConsistency(cart, options = {}) {
  if (!cart) {
    return validationError(
      INVOICE_VALIDATION_CODES.INVALID_CART,
      'Cart data is missing.',
    );
  }

  const calculated = calculateCartTotals(cart, options);
  if (calculated?.isValid === false) return calculated;
  if (!calculated.calculable) {
    return validationError(
      INVOICE_VALIDATION_CODES.MONETARY_SNAPSHOT_INCONSISTENT,
      `No se pudo recalcular el carrito: ${calculated.reason}.`,
      { reason: calculated.reason },
    );
  }

  const checks = [
    assertMonetarySnapshot(
      'Subtotal',
      readMonetaryValue(cart?.totalPurchaseWithoutTaxes),
      calculated.subtotal,
    ),
    assertMonetarySnapshot(
      'ITBIS',
      readMonetaryValue(cart?.totalTaxes),
      calculated.taxes,
    ),
    assertMonetarySnapshot(
      'Seguro',
      readMonetaryValue(cart?.totalInsurance),
      calculated.totalInsurance,
    ),
    assertMonetarySnapshot(
      'Total',
      readMonetaryValue(cart?.totalPurchase),
      calculated.totalPurchase,
    ),
  ];

  const shoppingItems = readMonetaryValue(cart?.totalShoppingItems);
  if (shoppingItems != null) {
    checks.push(
      assertMonetarySnapshot(
        'Cantidad total',
        shoppingItems,
        calculated.totalShoppingItems,
      ),
    );
  }

  const failedCheck = checks.find(Boolean);
  if (failedCheck) return failedCheck;

  const expectedPayment = sumActivePaymentMethods(cart);
  const actualPayment = readMonetaryValue(cart?.payment);
  const isAddedToReceivables = cart?.isAddedToReceivables === true;
  const effectivePayment = expectedPayment ?? actualPayment ?? 0;
  const expectedCreditNotePayment = sumActiveCreditNotePaymentMethods(cart);
  const actualCreditNotePayment = sumCreditNoteApplications(cart);

  if (expectedPayment != null) {
    const paymentCheck = assertMonetarySnapshot(
      'Pago',
      actualPayment,
      expectedPayment,
    );
    if (paymentCheck) return paymentCheck;
  }

  if (
    expectedCreditNotePayment > MONETARY_TOLERANCE ||
    actualCreditNotePayment > MONETARY_TOLERANCE
  ) {
    const creditNotePaymentCheck = assertMonetarySnapshot(
      'Pago con nota de credito',
      actualCreditNotePayment,
      expectedCreditNotePayment,
    );
    if (creditNotePaymentCheck) {
      return validationError(
        INVOICE_VALIDATION_CODES.CREDIT_NOTE_PAYMENT_INCONSISTENT,
        creditNotePaymentCheck.message,
        creditNotePaymentCheck.details,
      );
    }
  }

  if (!isAddedToReceivables && effectivePayment + MONETARY_TOLERANCE < calculated.totalPurchase) {
    return validationError(
      INVOICE_VALIDATION_CODES.PAYMENT_INSUFFICIENT,
      `Pago insuficiente: total ${calculated.totalPurchase}, pago ${effectivePayment}.`,
      { total: calculated.totalPurchase, payment: effectivePayment },
    );
  }

  const expectedChange = normalizeInvoiceChange(
    effectivePayment - calculated.totalPurchase,
  );
  const actualChange = readMonetaryValue(cart?.change);
  if (actualChange != null) {
    const changeCheck = assertMonetarySnapshot(
      'Devuelta',
      actualChange,
      expectedChange,
    );
    if (changeCheck) return changeCheck;
  }

  return { isValid: true, skipped: false, totals: calculated };
}

export function hasProductsInInvoice(cart) {
  return getCartProducts(cart).length > 0;
}

export function allProductsHaveValidQuantityInInvoice(cart) {
  const products = getCartProducts(cart);
  if (!products.length) return false;

  return products.every((product) => {
    if (!product || typeof product !== 'object') return false;
    const amount = readAmountToBuy(product);
    return Number.isFinite(amount) && amount > 0;
  });
}

export function allWeightedProductsHaveValidWeightInInvoice(cart) {
  const products = getCartProducts(cart);
  if (!products.length) return false;

  return products.every((product) => {
    if (!product || typeof product !== 'object') return false;
    if (product?.weightDetail?.isSoldByWeight !== true) return true;
    const weight = safeNumber(product?.weightDetail?.weight);
    return Number.isFinite(weight) && weight > 0;
  });
}

export function allWeightedProductsHaveSupportedWeightUnitInInvoice(cart) {
  const products = getCartProducts(cart);
  if (!products.length) return false;

  return products.every((product) => {
    if (!product || typeof product !== 'object') return false;
    if (product?.weightDetail?.isSoldByWeight !== true) return true;
    return hasSupportedOrMissingWeightUnit(product?.weightDetail?.weightUnit);
  });
}

export function allSaleUnitsHaveValidConversionInInvoice(cart) {
  const products = getCartProducts(cart);
  if (!products.length) return false;

  return products.every((product) => {
    if (!product || typeof product !== 'object') return false;
    const factor = readSaleUnitConversionFactor(product);
    return factor == null ? false : factor > 0;
  });
}

export function meetsMinimumInvoiceRequirement(
  cart,
  minimumRequiredAmount = 0,
) {
  const products = getCartProducts(cart);
  const totalAmount = products.reduce((acc, product) => {
    const price = readUnitPrice(product);
    const amount = readLineQuantity(product);
    if (price == null || amount == null) return acc;
    return acc + price * amount;
  }, 0);

  return totalAmount >= minimumRequiredAmount;
}

export function validateInvoiceCart(cart, options = {}) {
  if (!cart) {
    return validationError(
      INVOICE_VALIDATION_CODES.INVALID_CART,
      'Cart data is missing.',
    );
  }
  if (!Object.prototype.hasOwnProperty.call(cart, 'products')) {
    return validationError(
      INVOICE_VALIDATION_CODES.INVALID_CART,
      'Cart products array is missing.',
    );
  }
  if (!Array.isArray(cart.products)) {
    return validationError(
      INVOICE_VALIDATION_CODES.INVALID_CART,
      'Cart products must be an array.',
    );
  }
  if (!hasProductsInInvoice(cart)) {
    return validationError(
      INVOICE_VALIDATION_CODES.INVALID_CART,
      'The invoice cart is empty. Please add products.',
    );
  }
  if (!allProductsHaveValidQuantityInInvoice(cart)) {
    return validationError(
      INVOICE_VALIDATION_CODES.INVALID_LINE_QUANTITY,
      'One or more products have an invalid quantity (must be > 0).',
    );
  }
  if (!allWeightedProductsHaveValidWeightInInvoice(cart)) {
    return validationError(
      INVOICE_VALIDATION_CODES.INVALID_WEIGHT,
      'One or more products sold by weight have an invalid weight (must be > 0).',
    );
  }
  if (!allWeightedProductsHaveSupportedWeightUnitInInvoice(cart)) {
    return validationError(
      INVOICE_VALIDATION_CODES.INVALID_WEIGHT_UNIT,
      'One or more products sold by weight have an unsupported weight unit.',
    );
  }
  if (!allSaleUnitsHaveValidConversionInInvoice(cart)) {
    return validationError(
      INVOICE_VALIDATION_CODES.INVALID_SALE_UNIT_CONVERSION,
      'One or more selected sale units have an invalid conversion factor.',
    );
  }
  const monetaryValidation = validateInvoiceMonetaryConsistency(cart, options);
  if (!monetaryValidation.isValid) {
    return monetaryValidation;
  }
  return { isValid: true, message: 'Cart validation passed.' };
}

const readSaleUnitId = (unit) =>
  normalizeId(unit?.id ?? unit?.unitId ?? unit?.saleUnitId);

const getCatalogSaleUnits = (catalogProduct, catalogSaleUnits) => ({
  embeddedUnits: Array.isArray(catalogProduct?.saleUnits)
    ? catalogProduct.saleUnits
    : [],
  subcollectionUnits: Array.isArray(catalogSaleUnits) ? catalogSaleUnits : [],
});

const findSaleUnitById = (saleUnits, id) =>
  saleUnits.find((unit) => readSaleUnitId(unit) === id) ?? null;

const resolveTrustedCatalogSaleUnit = ({
  embeddedUnit,
  embeddedUnits,
  subcollectionUnit,
}) => {
  if (embeddedUnits.length > 0) {
    return embeddedUnit;
  }
  return subcollectionUnit;
};

const normalizePricing = (source, fallback = null) => {
  const pricing = isRecord(source?.pricing) ? source.pricing : {};
  return {
    price:
      safeNumber(pricing.price) ??
      safeNumber(source?.price) ??
      safeNumber(fallback?.price),
    tax:
      readPricingTaxRate(pricing) ??
      safeNumber(source?.tax) ??
      readPricingTaxRate(fallback),
    currency: normalizeCurrency(
      pricing.currency ?? source?.currency ?? fallback?.currency,
    ),
  };
};

const saleUnitFactorsMatch = (left, right) => {
  const leftFactor =
    safeNumber(left?.conversionFactorToBase) ?? safeNumber(left?.quantity);
  const rightFactor =
    safeNumber(right?.conversionFactorToBase) ?? safeNumber(right?.quantity);
  return (
    leftFactor != null &&
    rightFactor != null &&
    Math.abs(leftFactor - rightFactor) <= MONETARY_TOLERANCE
  );
};

const assertTrustedPricingMatchesPayload = ({
  payloadPricing,
  trustedPricing,
  priceCode,
  taxCode,
}) => {
  if (trustedPricing.price == null) {
    return validationError(
      priceCode,
      'No hay precio confiable de catalogo para validar la linea.',
    );
  }
  if (payloadPricing.price == null || differs(payloadPricing.price, trustedPricing.price)) {
    return validationError(
      priceCode,
      `Precio inconsistente: esperado ${trustedPricing.price}, recibido ${payloadPricing.price}.`,
      { expected: trustedPricing.price, actual: payloadPricing.price },
    );
  }
  if (trustedPricing.tax == null) {
    return validationError(
      taxCode,
      'No hay ITBIS confiable de catalogo para validar la linea.',
    );
  }
  if (payloadPricing.tax == null || differs(payloadPricing.tax, trustedPricing.tax)) {
    return validationError(
      taxCode,
      `ITBIS inconsistente: esperado ${trustedPricing.tax}, recibido ${payloadPricing.tax}.`,
      { expected: trustedPricing.tax, actual: payloadPricing.tax },
    );
  }
  if (
    normalizeCurrency(payloadPricing.currency) !==
    normalizeCurrency(trustedPricing.currency)
  ) {
    return validationError(
      INVOICE_VALIDATION_CODES.UNSUPPORTED_MIXED_CURRENCY,
      'La moneda de la linea no coincide con el catalogo.',
    );
  }
  return null;
};

const buildTrustedWeightDetail = ({ payloadProduct, catalogProduct }) => {
  const payloadWeightDetail = isRecord(payloadProduct?.weightDetail)
    ? payloadProduct.weightDetail
    : null;
  const catalogWeightDetail = isRecord(catalogProduct?.weightDetail)
    ? catalogProduct.weightDetail
    : null;
  const payloadIsWeighted = payloadWeightDetail?.isSoldByWeight === true;
  const catalogIsWeighted = catalogWeightDetail?.isSoldByWeight === true;

  if (!payloadIsWeighted && !catalogIsWeighted) {
    return {
      weightDetail: payloadProduct?.weightDetail,
      error: null,
    };
  }

  if (!payloadIsWeighted || !catalogIsWeighted) {
    return {
      error: validationError(
        INVOICE_VALIDATION_CODES.PRODUCT_WEIGHT_INCONSISTENT,
        'La configuracion de venta por peso no coincide con el catalogo.',
      ),
    };
  }

  const weight = safeNumber(payloadWeightDetail?.weight);
  if (!Number.isFinite(weight) || weight <= 0) {
    return {
      error: validationError(
        INVOICE_VALIDATION_CODES.INVALID_WEIGHT,
        'El peso de la linea debe ser mayor que cero.',
      ),
    };
  }

  const payloadUnit = toCleanString(payloadWeightDetail?.weightUnit);
  const catalogUnit = toCleanString(catalogWeightDetail?.weightUnit);
  if (!catalogUnit || !isSupportedWeightUnit(catalogUnit)) {
    return {
      error: validationError(
        INVOICE_VALIDATION_CODES.INVALID_WEIGHT_UNIT,
        'El producto por peso no tiene una unidad de peso soportada en catalogo.',
      ),
    };
  }

  if (!weightUnitsAreCompatible(payloadUnit, catalogUnit)) {
    return {
      error: validationError(
        INVOICE_VALIDATION_CODES.PRODUCT_WEIGHT_INCONSISTENT,
        'La unidad de peso de la linea no coincide con el catalogo.',
      ),
    };
  }

  return {
    weightDetail: {
      ...payloadWeightDetail,
      ...catalogWeightDetail,
      isSoldByWeight: true,
      weight,
      weightUnit: catalogUnit,
    },
    error: null,
  };
};

const buildTrustedSaleUnitLine = ({ payloadProduct, catalogProduct, saleUnits }) => {
  const payloadUnit = getSelectedSaleUnit(payloadProduct);
  if (!payloadUnit) return { line: payloadProduct, error: null };

  const saleUnitId = readSaleUnitId(payloadUnit);
  if (!saleUnitId) {
    return {
      error: validationError(
        INVOICE_VALIDATION_CODES.SALE_UNIT_ID_REQUIRED,
        'selectedSaleUnit.id es requerido para facturar una presentacion.',
      ),
    };
  }

  const { embeddedUnits, subcollectionUnits } = getCatalogSaleUnits(
    catalogProduct,
    saleUnits,
  );
  const embeddedUnit = findSaleUnitById(embeddedUnits, saleUnitId);
  const subcollectionUnit = findSaleUnitById(subcollectionUnits, saleUnitId);
  const trustedUnit = resolveTrustedCatalogSaleUnit({
    embeddedUnit,
    embeddedUnits,
    subcollectionUnit,
  });

  if (!trustedUnit) {
    return {
      error: validationError(
        INVOICE_VALIDATION_CODES.SALE_UNIT_NOT_FOUND,
        `La presentacion ${saleUnitId} no existe en el catalogo actual.`,
      ),
    };
  }

  if (isInactiveCatalogRecord(trustedUnit)) {
    return {
      error: validationError(
        INVOICE_VALIDATION_CODES.SALE_UNIT_INACTIVE,
        `La presentacion ${saleUnitId} esta inactiva.`,
      ),
    };
  }

  if (!saleUnitFactorsMatch(payloadUnit, trustedUnit)) {
    return {
      error: validationError(
        INVOICE_VALIDATION_CODES.SALE_UNIT_INCONSISTENT,
        'SALE_UNIT_INCONSISTENT: conversionFactorToBase no coincide con el catalogo.',
        { saleUnitId },
      ),
    };
  }

  const productPricing = normalizePricing(catalogProduct);
  const trustedPricing = normalizePricing(trustedUnit, productPricing);
  const payloadPricing = normalizePricing(payloadUnit, productPricing);
  const pricingError = assertTrustedPricingMatchesPayload({
    payloadPricing,
    trustedPricing,
    priceCode: INVOICE_VALIDATION_CODES.SALE_UNIT_INCONSISTENT,
    taxCode: INVOICE_VALIDATION_CODES.SALE_UNIT_INCONSISTENT,
  });
  if (pricingError) return { error: pricingError };

  const {
    weightDetail,
    error: weightError,
  } = buildTrustedWeightDetail({ payloadProduct, catalogProduct });
  if (weightError) return { error: weightError };

  const trustedFactor = readSaleUnitFactor(trustedUnit);
  const trustedComboSnapshot = buildTrustedComboSnapshot(catalogProduct);
  const trustedLine = {
    ...payloadProduct,
    ...trustedComboSnapshot,
    weightDetail,
    pricing: {
      ...payloadProduct.pricing,
      ...productPricing,
    },
    selectedSaleUnit: {
      ...payloadUnit,
      ...trustedUnit,
      quantity: safeNumber(trustedUnit.quantity) ?? trustedFactor,
      conversionFactorToBase: trustedFactor,
      pricing: {
        ...payloadUnit.pricing,
        ...trustedPricing,
      },
    },
  };
  const baseQuantityError = assertLineBaseQuantityMatches(trustedLine);
  if (baseQuantityError) return { error: baseQuantityError };

  return {
    line: withTrustedBaseQuantity(trustedLine),
    error: null,
  };
};

const buildTrustedProductLine = ({ payloadProduct, catalogProduct, saleUnits }) => {
  if (getSelectedSaleUnit(payloadProduct)) {
    return buildTrustedSaleUnitLine({
      payloadProduct,
      catalogProduct,
      saleUnits,
    });
  }

  const payloadPricing = normalizePricing(payloadProduct);
  const trustedPricing = normalizePricing(catalogProduct);
  const pricingError = assertTrustedPricingMatchesPayload({
    payloadPricing,
    trustedPricing,
    priceCode: INVOICE_VALIDATION_CODES.PRODUCT_PRICE_INCONSISTENT,
    taxCode: INVOICE_VALIDATION_CODES.PRODUCT_TAX_INCONSISTENT,
  });
  if (pricingError) return { error: pricingError };

  const {
    weightDetail,
    error: weightError,
  } = buildTrustedWeightDetail({ payloadProduct, catalogProduct });
  if (weightError) return { error: weightError };

  const trustedComboSnapshot = buildTrustedComboSnapshot(catalogProduct);
  const trustedLine = {
    ...payloadProduct,
    ...trustedComboSnapshot,
    weightDetail,
    pricing: {
      ...payloadProduct.pricing,
      ...trustedPricing,
    },
  };
  const baseQuantityError = assertLineBaseQuantityMatches(trustedLine);
  if (baseQuantityError) return { error: baseQuantityError };

  return {
    line: withTrustedBaseQuantity(trustedLine),
    error: null,
  };
};

export async function validateInvoiceCartAgainstCatalog(
  cart,
  { businessId, loadProductCatalog, functionalCurrency } = {},
) {
  const validationOptions = { functionalCurrency };
  const baseValidation = validateInvoiceCart(cart, validationOptions);
  if (!baseValidation.isValid) return baseValidation;

  if (typeof loadProductCatalog !== 'function') {
    return validationError(
      INVOICE_VALIDATION_CODES.PRODUCT_NOT_FOUND,
      'No hay cargador de catalogo disponible para validar la factura.',
    );
  }

  const trustedProducts = [];
  for (const payloadProduct of getCartProducts(cart)) {
    const productId = normalizeId(payloadProduct?.id ?? payloadProduct?.productId);
    if (!productId) {
      return validationError(
        INVOICE_VALIDATION_CODES.PRODUCT_NOT_FOUND,
        'Cada linea debe incluir productId para validar contra catalogo.',
      );
    }

    const catalog = await loadProductCatalog({
      businessId,
      productId,
      payloadProduct,
    });
    const catalogProduct = catalog?.product;
    if (!catalog?.exists || !isRecord(catalogProduct)) {
      return validationError(
        INVOICE_VALIDATION_CODES.PRODUCT_NOT_FOUND,
        `El producto ${productId} no existe en el catalogo actual.`,
        { productId },
      );
    }
    if (isInactiveCatalogRecord(catalogProduct)) {
      return validationError(
        INVOICE_VALIDATION_CODES.PRODUCT_INACTIVE,
        `El producto ${productId} esta inactivo en el catalogo actual.`,
        { productId },
      );
    }
    if (isNonSellableCatalogRecord(catalogProduct)) {
      return validationError(
        INVOICE_VALIDATION_CODES.PRODUCT_NOT_SELLABLE,
        `El producto ${productId} no esta disponible para facturacion.`,
        { productId },
      );
    }

    const { line, error } = buildTrustedProductLine({
      payloadProduct,
      catalogProduct,
      saleUnits: catalog.saleUnits,
    });
    if (error) return error;
    trustedProducts.push(line);
  }

  const trustedCart = {
    ...cart,
    products: trustedProducts,
  };
  const trustedMonetaryValidation =
    validateInvoiceMonetaryConsistency(trustedCart, validationOptions);
  if (!trustedMonetaryValidation.isValid) return trustedMonetaryValidation;

  return {
    isValid: true,
    message: 'Cart validation passed.',
    trustedCart,
  };
}
