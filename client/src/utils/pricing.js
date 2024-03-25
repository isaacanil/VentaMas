// src/utils/pricing.js
export function limit(value) {
  // Convertir a centavos para evitar problemas de punto flotante
  const asInt = Math.round(value * 100);

  // Convertir de nuevo a formato decimal
  return asInt / 100;
}

function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value) && value !== null;
}

export function getTax(product, taxReceiptEnabled = true) {
  if (!taxReceiptEnabled) return 0
  const isSoldByWeight = product?.weightDetail?.isSoldByWeight || false;
  const result = (isSoldByWeight) ? getWeight(product) : getTotal(product)
  let taxPercentage = Number(product?.pricing?.tax) || 0;
  let tax = result * (taxPercentage / 100);
  return limit(tax);
}

export function getPriceWithoutTax(priceWithTax, taxPercentage, taxReceiptEnabled = true) {
  if (!taxReceiptEnabled) {
    taxPercentage = 0
  }
  return priceWithTax / (1 + taxPercentage / 100);
}

export function getDiscount(product) {
  if (!product) return 0;
  const discountPercentage = product?.promotion?.discount || 0;
  const price = product?.pricing?.price;

  return limit(price * (discountPercentage / 100));
}

export function getTotalPrice(product, taxReceiptEnabled = true) {
  if (!product || !isValidNumber(product?.pricing?.price) || !isValidNumber(product?.amountToBuy)) return 0;
  const isSoldByWeight = product?.weightDetail?.isSoldByWeight || false;
  const result = (isSoldByWeight) ? getWeight(product) : getTotal(product)
  let tax =  getTax(product, taxReceiptEnabled) ;
  if(!taxReceiptEnabled){
    tax = 0
  }
  const discount = getDiscount(product);

  const total = result + tax - discount;
  return limit(total);
}

function getWeight(product) {
  const sellingPrice = product?.pricing?.price;
  const weight = product?.weightDetail?.weight || 0;
  let baseSellingPrice;
  if (weight) {
    baseSellingPrice = sellingPrice * weight;
  } else {
    baseSellingPrice = sellingPrice;
  }
  let finalPrice = baseSellingPrice;
  return finalPrice;
}
export function resetAmountToBuyForProduct(product) {
  return {
    ...product, // Conservar todas las propiedades del producto
    amountToBuy: 1 // Establecer amountToBuy a 1
  };
}

function getTotal(product) {
  const sellingPrice = product?.pricing?.price;
  const amountToBuy = product?.amountToBuy || 1;
  const baseSellingPrice = sellingPrice * amountToBuy;
  return baseSellingPrice;
}

export function getListPriceTotal(product, taxReceiptEnabled = true) {
  let price = product?.pricing.listPrice || 0;
  const isSoldByWeight = product?.weightDetail?.isSoldByWeight || false;
  if (isSoldByWeight) {
    const weight = product?.weightDetail?.weight || 0;
    price = price * weight;
  }
  let tax = (product?.pricing?.tax / 100) || 0;
  if (!taxReceiptEnabled) {
    tax = 0
  }
  let taxAmount = price * tax;
  let totalPrice = price + taxAmount;
  return limit(totalPrice);
}

export function getAvgPriceTotal(product, taxReceiptEnabled = true) {
  let price = product?.pricing?.avgPrice || 0;
  const isSoldByWeight = product?.weightDetail?.isSoldByWeight || false;
  if (isSoldByWeight) {
    const weight = product?.weightDetail?.weight || 0;
    price = price * weight;
  }
  let tax = (product?.pricing?.tax / 100) || 0;
  if (!taxReceiptEnabled) {
    tax = 0;
  }
  let taxAmount = price * tax;
  let totalPrice = price + taxAmount;
  return limit(totalPrice);
}

export function getMinPriceTotal(product, taxReceiptEnabled = true) {
  let price = product?.pricing?.minPrice || 0;
  const isSoldByWeight = product?.weightDetail?.isSoldByWeight || false;

  if (isSoldByWeight) {
    const weight = product?.weightDetail?.weight || 0;
    price = price * weight;
  }
  let tax = (product?.pricing?.tax / 100) || 0;
  if (!taxReceiptEnabled) {
    tax = 0
  }
  let taxAmount = price * tax;
  let totalPrice = price + taxAmount;
  return limit(totalPrice);
}

export function getProductsPrice(products) {
  return products.reduce((acc, product) => {
    // Verificar si el producto se vende por peso.
    const isSoldByWeight = product?.weightDetail?.isSoldByWeight || false;

    if (isSoldByWeight) {
      const weight = product?.weightDetail?.weight || 0; // Asegúrate de que el peso esté definido.
      const pricePerWeight = product?.pricing?.price || 0; // Precio por unidad de peso.
      return acc + (pricePerWeight * weight); // Suma el precio calculado por peso al acumulador.
    } else {
      const pricePerUnit = product?.pricing?.price || 0;
      const amountToBuy = product?.amountToBuy || 0;
      return acc + (pricePerUnit * amountToBuy); // Suma el precio calculado por unidad al acumulador.
    }
  }, 0);
}

export function getProductsTax(products, taxReceiptEnabled = true) {
  return products.reduce((acc, product) => acc + getTax(product, taxReceiptEnabled), 0);
}

export function getProductsDiscount(products) {
  return products.reduce((acc, product) => acc + getDiscount(product), 0);
}

export function getTotalItems(products) {
  return products.reduce((acc, product) => acc + product?.amountToBuy, 0);
}

export function getProductsTotalPrice(products, totalDiscountPercentage = 0, totalDelivery = 0, taxReceiptEnabled = true) {
  if (!isValidNumber(totalDelivery)) {
    totalDelivery = 0;
  }

  let totalBeforeDiscount = getProductsPrice(products) + getProductsTax(products, taxReceiptEnabled) - getProductsDiscount(products);

  let totalDiscount = getTotalDiscount(totalBeforeDiscount, totalDiscountPercentage);

  let total = (totalBeforeDiscount - totalDiscount + totalDelivery)

  return limit(total);
}

export function convertDecimalToPercentage(valorDecimal) {
  if (typeof valorDecimal === 'number' && valorDecimal >= 0 && valorDecimal <= 1) {
    return valorDecimal * 100;
  } else {
    return 0;
  }
}

export function getTotalInvoice(invoice) {
  return {
    ...invoice,
    totals: {
      subtotal: getProductsPrice(invoice.products),
      tax: getProductsTax(invoice.products),
      discount: getProductsDiscount(invoice.products),
      total: getProductsTotalPrice(invoice.products, 0, invoice?.delivery?.value)
    }
  };
}

const getTotalDiscount = (totalBeforeDiscount = 0, totalDiscountPercentage = 0) => {
  return totalBeforeDiscount * (totalDiscountPercentage / 100);
}

export const getProducts = (products, taxReceiptEnabled) => {
  return products.map(product => {
    return {
      ...product,
      pricing: {
        ...product.pricing,
        avgPrice: getAvgPriceTotal(product, taxReceiptEnabled),
        listPrice: getListPriceTotal(product, taxReceiptEnabled),
        minPrice: getMinPriceTotal(product, taxReceiptEnabled),
        price: getTotalPrice(product, taxReceiptEnabled)
      }
    };
  });
}