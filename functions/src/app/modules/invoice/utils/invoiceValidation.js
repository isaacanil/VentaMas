// functions/src/modules/invoice/utils/invoiceValidation.js

const getCartProducts = (cart) =>
  Array.isArray(cart?.products) ? cart.products : [];

const MONETARY_TOLERANCE = 0.05;

const safeNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const roundCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const readAmountToBuy = (product) => {
  const amount = product?.amountToBuy;
  if (amount && typeof amount === 'object' && !Array.isArray(amount)) {
    return (
      safeNumber(amount.total) ??
      safeNumber(amount.unit) ??
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
  product?.selectedSaleUnit?.pricing ?? product?.pricing ?? null;

const readUnitPrice = (product) =>
  safeNumber(resolveActivePricing(product)?.price);

const readTaxRate = (product) => {
  const rawTax = resolveActivePricing(product)?.tax;
  if (rawTax == null || rawTax === '') return 0;
  if (rawTax && typeof rawTax === 'object' && !Array.isArray(rawTax)) {
    return safeNumber(rawTax.tax);
  }
  return safeNumber(rawTax);
};

const hasComplexCartAdjustments = (cart) =>
  (safeNumber(cart?.discount?.value) ?? 0) > 0 ||
  (safeNumber(cart?.delivery?.value) ?? 0) > 0 ||
  (safeNumber(cart?.totalInsurance?.value) ?? 0) > 0 ||
  cart?.mixedCurrencySale === true;

const hasLineLevelAdjustments = (product) =>
  (safeNumber(product?.discount?.value) ?? 0) > 0 ||
  (safeNumber(product?.promotion?.discount) ?? 0) > 0 ||
  (safeNumber(product?.insurance?.value) ?? 0) > 0 ||
  ((safeNumber(product?.monetary?.exchangeRate) ?? 1) !== 1);

const readMonetaryValue = (source) => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return null;
  }
  return safeNumber(source.value);
};

const differs = (actual, expected) =>
  actual != null &&
  Math.abs(roundCurrency(actual) - roundCurrency(expected)) >
    MONETARY_TOLERANCE;

const sumActivePaymentMethods = (cart) => {
  const methods = Array.isArray(cart?.paymentMethod) ? cart.paymentMethod : [];
  const activeMethods = methods.filter(
    (method) => method && method.status === true && safeNumber(method.value) != null,
  );
  if (!activeMethods.length) return null;
  return roundCurrency(
    activeMethods.reduce((sum, method) => sum + safeNumber(method.value), 0),
  );
};

export function validateInvoiceMonetaryConsistency(cart) {
  if (!cart || hasComplexCartAdjustments(cart)) {
    return { isValid: true, skipped: true };
  }

  const products = getCartProducts(cart);
  const totals = products.reduce(
    (acc, product) => {
      if (!product || typeof product !== 'object') {
        acc.calculable = false;
        return acc;
      }
      if (hasLineLevelAdjustments(product)) {
        acc.calculable = false;
        return acc;
      }
      const amount = readLineQuantity(product);
      const unitPrice = readUnitPrice(product);
      const taxRate = readTaxRate(product);
      if (
        amount == null ||
        unitPrice == null ||
        taxRate == null ||
        amount <= 0 ||
        unitPrice < 0 ||
        taxRate < 0
      ) {
        acc.calculable = false;
        return acc;
      }
      const subtotal = unitPrice * amount;
      const taxes = subtotal * (taxRate / 100);
      acc.subtotal += subtotal;
      acc.taxes += taxes;
      return acc;
    },
    { subtotal: 0, taxes: 0, calculable: true },
  );

  if (!totals.calculable || !products.length) {
    return { isValid: true, skipped: true };
  }

  const expectedSubtotal = roundCurrency(totals.subtotal);
  const expectedTaxes = roundCurrency(totals.taxes);
  const expectedTotal = roundCurrency(expectedSubtotal + expectedTaxes);
  const actualSubtotal = readMonetaryValue(cart?.totalPurchaseWithoutTaxes);
  const actualTaxes = readMonetaryValue(cart?.totalTaxes);
  const actualTotal = readMonetaryValue(cart?.totalPurchase);

  if (actualSubtotal == null || actualTaxes == null || actualTotal == null) {
    return { isValid: true, skipped: true };
  }

  if (differs(actualSubtotal, expectedSubtotal)) {
    return {
      isValid: false,
      message: `Subtotal inconsistente: esperado ${expectedSubtotal}, recibido ${actualSubtotal}.`,
    };
  }
  if (differs(actualTaxes, expectedTaxes)) {
    return {
      isValid: false,
      message: `Impuestos inconsistentes: esperado ${expectedTaxes}, recibido ${actualTaxes}.`,
    };
  }
  if (differs(actualTotal, expectedTotal)) {
    return {
      isValid: false,
      message: `Total inconsistente: esperado ${expectedTotal}, recibido ${actualTotal}.`,
    };
  }

  const expectedPayment = sumActivePaymentMethods(cart);
  const actualPayment = readMonetaryValue(cart?.payment);
  if (expectedPayment != null && actualPayment == null) {
    return { isValid: true, skipped: true };
  }
  if (expectedPayment != null && differs(actualPayment, expectedPayment)) {
    return {
      isValid: false,
      message: `Pago inconsistente: esperado ${expectedPayment}, recibido ${actualPayment}.`,
    };
  }

  return { isValid: true, skipped: false };
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

export function validateInvoiceCart(cart) {
  if (!cart) {
    return { isValid: false, message: 'Cart data is missing.' };
  }
  if (!Object.prototype.hasOwnProperty.call(cart, 'products')) {
    return { isValid: false, message: 'Cart products array is missing.' };
  }
  if (!Array.isArray(cart.products)) {
    return {
      isValid: false,
      message: 'Cart products must be an array.',
    };
  }
  if (!hasProductsInInvoice(cart)) {
    return {
      isValid: false,
      message: 'The invoice cart is empty. Please add products.',
    };
  }
  if (!allProductsHaveValidQuantityInInvoice(cart)) {
    return {
      isValid: false,
      message: 'One or more products have an invalid quantity (must be > 0).',
    };
  }
  const monetaryValidation = validateInvoiceMonetaryConsistency(cart);
  if (!monetaryValidation.isValid) {
    return monetaryValidation;
  }
  return { isValid: true, message: 'Cart validation passed.' };
}
