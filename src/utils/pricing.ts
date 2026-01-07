// @ts-nocheck
// src/utils/pricing.js
export function limit(value) {
  const asInt = Math.round(value * 100);
  return asInt / 100;
}

export const roundDecimals = (n, dec = 2) => {
  const factor = Math.pow(10, dec);
  return Math.round((Number(n) + Number.EPSILON) * factor) / factor;
};

function isValidNumber(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

export function getTax(product, taxReceiptEnabled = true) {
  if (!taxReceiptEnabled) return 0;

  const { isSoldByWeight, taxPercentage } = getPricingDetails(product);
  const result = isSoldByWeight ? getWeight(product) : getTotal(product);

  let tax = result * (taxPercentage / 100);
  return limit(tax);
}
function getPricingDetails(product, useAmountToBuy = true) {
  const pricing = product?.selectedSaleUnit?.pricing || product?.pricing || {};
  const isSoldByWeight = product?.weightDetail?.isSoldByWeight || false;
  const weight = product?.weightDetail?.weight || 1;
  const amountToBuy = useAmountToBuy ? product?.amountToBuy || 1 : 1;
  const price = pricing.price || 0;
  const taxPercentage = Number(pricing.tax) || 0;
  const discountPercentage = product?.promotion?.discount || 0;

  return {
    pricing,
    isSoldByWeight,
    weight,
    amountToBuy,
    price,
    taxPercentage,
    discountPercentage,
  };
}

export function getPriceWithoutTax(
  priceWithTax,
  taxPercentage,
  taxReceiptEnabled = true,
) {
  if (!taxReceiptEnabled) {
    taxPercentage = 0;
  }
  return priceWithTax / (1 + taxPercentage / 100);
}

export function getDiscount(product) {
  if (!product) return 0;
  const { discountPercentage, isSoldByWeight } = getPricingDetails(product);
  const result = isSoldByWeight ? getWeight(product) : getTotal(product);
  return limit(result * (discountPercentage / 100));
}

export function getTotalPrice(
  product,
  taxReceiptEnabled = true,
  useAmountToBuy = true,
) {
  if (!product) return 0;
  const { price, isSoldByWeight } = getPricingDetails(product, useAmountToBuy);
  if (!isValidNumber(price)) return 0;

  const result = isSoldByWeight
    ? getWeight(product, useAmountToBuy)
    : getTotal(product, useAmountToBuy);
  const tax = getTax(product, taxReceiptEnabled);
  const discount = getDiscount(product);

  const total = result + tax - discount;
  return limit(total);
}

function getWeight(product, useAmountToBuy = true) {
  const { price, weight } = getPricingDetails(product, useAmountToBuy);
  return price * weight;
}

export function resetAmountToBuyForProduct(product) {
  return {
    ...product, // Conservar todas las propiedades del producto
    amountToBuy: 1,
    weightDetail: {
      ...product.weightDetail,
      weight: 1,
    },
  };
}

function getPriceTotalByType(
  product,
  priceType = 'price',
  taxReceiptEnabled = true,
) {
  const { isSoldByWeight, weight, pricing } = getPricingDetails(product);
  let price = pricing[priceType] || 0;
  if (isSoldByWeight) {
    price *= weight;
  }
  let tax = taxReceiptEnabled ? pricing.tax / 100 || 0 : 0;
  let taxAmount = price * tax;
  return limit(price + taxAmount);
}

export function getTotal(product, useAmountToBuy = true) {
  const { price, amountToBuy } = getPricingDetails(product, useAmountToBuy);
  const quantity = useAmountToBuy ? amountToBuy : 1;

  // Aplicar descuento individual si existe
  let finalPrice = price * quantity;
  if (product.discount && product.discount.value > 0) {
    if (product.discount.type === 'percentage') {
      finalPrice = finalPrice * (1 - product.discount.value / 100);
    } else {
      // Para monto fijo, se aplica al total sin impuestos
      finalPrice = Math.max(0, finalPrice - product.discount.value);
    }
  }

  return finalPrice;
}

export function getListPriceTotal(product, taxReceiptEnabled = true) {
  return getPriceTotalByType(product, 'listPrice', taxReceiptEnabled);
}

export function getPriceTotal(product, taxReceiptEnabled = true) {
  return getPriceTotalByType(product, 'price', taxReceiptEnabled);
}

export function getAvgPriceTotal(product, taxReceiptEnabled = true) {
  return getPriceTotalByType(product, 'avgPrice', taxReceiptEnabled);
}

export function getMinPriceTotal(product, taxReceiptEnabled = true) {
  return getPriceTotalByType(product, 'minPrice', taxReceiptEnabled);
}

export function getCardPriceTotal(product, taxReceiptEnabled = true) {
  return getPriceTotalByType(product, 'cardPrice', taxReceiptEnabled);
}

export function getOfferPriceTotal(product, taxReceiptEnabled = true) {
  return getPriceTotalByType(product, 'offerPrice', taxReceiptEnabled);
}

export function getProductsPrice(products = []) {
  return products.reduce((acc, product) => {
    const { isSoldByWeight, weight, amountToBuy, price } =
      getPricingDetails(product);
    const quantity = isSoldByWeight ? weight : amountToBuy;

    // Aplicar descuento individual si existe
    let finalPrice = price * quantity;
    if (product.discount && product.discount.value > 0) {
      if (product.discount.type === 'percentage') {
        finalPrice = finalPrice * (1 - product.discount.value / 100);
      } else {
        // Para monto fijo, se aplica al total sin impuestos
        finalPrice = Math.max(0, finalPrice - product.discount.value);
      }
    }

    return acc + finalPrice;
  }, 0);
}

export function getProductsTax(products = [], taxReceiptEnabled = true) {
  return products.reduce(
    (acc, product) => acc + getTax(product, taxReceiptEnabled),
    0,
  );
}

export function getProductsDiscount(products = []) {
  return products.reduce((acc, product) => acc + getDiscount(product), 0);
}

export function getProductsIndividualDiscounts(products = []) {
  return products.reduce((acc, product) => {
    if (!product.discount || product.discount.value <= 0) return acc;

    const { price, isSoldByWeight, weight, amountToBuy } =
      getPricingDetails(product);
    const quantity = isSoldByWeight ? weight : amountToBuy;
    const subtotalBeforeDiscount = price * quantity;

    let discountAmount = 0;
    if (product.discount.type === 'percentage') {
      discountAmount = subtotalBeforeDiscount * (product.discount.value / 100);
    } else {
      // Para monto fijo
      discountAmount = Math.min(product.discount.value, subtotalBeforeDiscount);
    }

    return acc + discountAmount;
  }, 0);
}

export function getProductIndividualDiscount(product) {
  if (!product.discount || product.discount.value <= 0) return 0;

  const { price, isSoldByWeight, weight, amountToBuy } =
    getPricingDetails(product);
  const quantity = isSoldByWeight ? weight : amountToBuy;
  const subtotalBeforeDiscount = price * quantity;

  if (product.discount.type === 'percentage') {
    return subtotalBeforeDiscount * (product.discount.value / 100);
  } else {
    // Para monto fijo
    return Math.min(product.discount.value, subtotalBeforeDiscount);
  }
}

export function getTotalItems(products = []) {
  // Sum amountToBuy, defaulting each product to 1; avoid precedence pitfalls
  return products.reduce(
    (acc, product) => acc + (product?.amountToBuy ?? 1),
    0,
  );
}

export function getProductsTotalPrice(
  products = [],
  totalDiscountPercentage = 0,
  totalDelivery = 0,
  taxReceiptEnabled = true,
) {
  if (!isValidNumber(totalDelivery)) {
    totalDelivery = 0;
  }

  // Verificar si hay productos con descuentos individuales
  const hasIndividualDiscounts = products.some(
    (product) => product.discount && product.discount.value > 0,
  );

  let subtotal = getProductsPrice(products);
  let itbis = getProductsTax(products, taxReceiptEnabled);
  let productsDiscount = getProductsDiscount(products);
  let totalBeforeDiscount = subtotal - productsDiscount;

  // Solo aplicar descuento general si no hay descuentos individuales
  let totalDiscount = hasIndividualDiscounts
    ? 0
    : getTotalDiscount(totalBeforeDiscount, totalDiscountPercentage);

  let total = totalBeforeDiscount - totalDiscount + totalDelivery + itbis;

  return limit(total);
}

export function convertDecimalToPercentage(valorDecimal) {
  const num = Number(valorDecimal);
  if (isNaN(num)) {
    return 0;
  }
  return num * 100;
}

export function getTotalInvoice(invoice) {
  return {
    ...invoice,
    totals: {
      subtotal: getProductsPrice(invoice.products),
      tax: getProductsTax(invoice.products),
      discount: getProductsDiscount(invoice.products),
      total: getProductsTotalPrice(
        invoice.products,
        0,
        invoice?.delivery?.value,
      ),
    },
  };
}

export const getTotalDiscount = (
  totalBeforeDiscount = 0,
  totalDiscountPercentage = 0,
) => {
  if (
    !isValidNumber(totalBeforeDiscount) ||
    !isValidNumber(totalDiscountPercentage)
  ) {
    return 0;
  }
  return totalBeforeDiscount * (totalDiscountPercentage / 100);
};

export const getProducts = (products = [], taxReceiptEnabled) => {
  return products.map((product) => {
    return {
      ...product,
      pricing: {
        ...product.pricing,
        avgPrice: getAvgPriceTotal(product, taxReceiptEnabled),
        listPrice: getListPriceTotal(product, taxReceiptEnabled),
        minPrice: getMinPriceTotal(product, taxReceiptEnabled),
        price: getTotalPrice(product, taxReceiptEnabled),
      },
    };
  });
};

//crear uan funcion que se encargue de cambiar la presiciond e un desimal por defercto podria ser 2

export const setNumPrecision = (value, precision = 2) => {
  const num = Number(value);
  if (isNaN(num)) {
    return 0;
  }
  return Number(num.toFixed(precision));
};

export function getInsuranceExtra(product) {
  const ins = product.insurance || { mode: null, value: 0 };
  if (!ins.value) return 0;
  // Use getPricingDetails to obtain price and quantity.
  const { price, isSoldByWeight, weight, amountToBuy } =
    getPricingDetails(product);
  const quantity = isSoldByWeight ? weight : amountToBuy;
  return ins.mode === 'porcentaje'
    ? price * quantity * (ins.value / 100)
    : ins.value * quantity;
}

export function getProductsInsuranceExtra(products = []) {
  return products.reduce((acc, product) => acc + getInsuranceExtra(product), 0);
}

export function getChange(total, payment) {
  return payment - total;
}
