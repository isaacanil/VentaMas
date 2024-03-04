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

export function getTax(product) {
  const isSoldByWeight = product?.weightDetail?.isSoldByWeight || false;
  const result = (isSoldByWeight) ? getWeight(product) : getTotal(product)
  const taxPercentage = Number(product?.pricing?.tax) || 0;
  let tax = result * (taxPercentage / 100) ;
  return limit(tax);
}

export function getPriceWithoutTax(priceWithTax, taxPercentage) {

  return priceWithTax / (1 + taxPercentage / 100);
}

export function getDiscount(product) {
  if (!product) return 0;
  const discountPercentage = product?.promotion?.discount || 0;
  const price = product?.pricing?.price;

  return limit(price * (discountPercentage / 100));
}

export function getTotalPrice(product) {
  if (!product || !isValidNumber(product?.pricing?.price) || !isValidNumber(product?.amountToBuy)) return 0;
  const isSoldByWeight = product?.weightDetail?.isSoldByWeight || false;
  const result = (isSoldByWeight) ? getWeight(product) : getTotal(product)
  const tax = getTax(product) ;
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
  // Crear una copia del producto con amountToBuy ajustado a 1
  return {
    ...product, // Conservar todas las propiedades del producto
    amountToBuy: 1 // Establecer amountToBuy a 1
  };
}

function getTotal(product) {
  const sellingPrice = product?.pricing?.price;
  const amountToBuy = product?.amountToBuy || 1;
  const baseSellingPrice = sellingPrice * amountToBuy;
  let finalPrice = baseSellingPrice;
  return finalPrice;
}

export function getListPriceTotal(product) {
  const price = product?.pricing.listPrice || 0;
  const tax = (product?.pricing?.tax / 100) || 0;
  let taxAmount = price * tax;
  let totalPrice = price + taxAmount;
  return limit(totalPrice);
}

export function getAvgPriceTotal(product) {
  const price = product?.pricing?.avgPrice || 0;
  const tax = (product?.pricing?.tax / 100) || 0;
  let taxAmount = price * tax;
  let totalPrice = price + taxAmount;
  return limit(totalPrice);
}

export function getMinPriceTotal(product) {
  const price = product?.pricing?.minPrice || 0;
  let tax = (product?.pricing?.tax / 100) || 0;
  let taxAmount = price * tax;
  let totalPrice = price + taxAmount;
  return limit(totalPrice);
}

export function getProductsPrice(products) {
  return products.reduce((acc, product) => {
    // Verificar si el producto se vende por peso.
    const isSoldByWeight = product?.weightDetail?.isSoldByWeight || false;

    if (isSoldByWeight) {
      // Si el producto se vende por peso, calcular el precio basado en el peso.
      const weight = product?.weightDetail?.weight || 0; // Asegúrate de que el peso esté definido.
      const pricePerWeight = product?.pricing?.price || 0; // Precio por unidad de peso.
      return acc + (pricePerWeight * weight); // Suma el precio calculado por peso al acumulador.
    } else {
      // Si el producto se vende por unidad, calcular el precio estándar.
      const pricePerUnit = product?.pricing?.price || 0;
      const amountToBuy = product?.amountToBuy || 0;
      return acc + (pricePerUnit * amountToBuy); // Suma el precio calculado por unidad al acumulador.
    }
  }, 0);
}


export function getProductsTax(products) {
  return products.reduce((acc, product) => acc + getTax(product), 0);
}


export function getProductsDiscount(products) {
  return products.reduce((acc, product) => acc + getDiscount(product), 0);
}

export function getTotalItems(products) {
  return products.reduce((acc, product) => acc + product?.amountToBuy, 0);
}

export function getProductsTotalPrice(products, totalDiscountPercentage = 0, totalDelivery = 0) {
  if (!isValidNumber(totalDelivery)) {
    totalDelivery = 0;
  }
  let totalBeforeDiscount = getProductsPrice(products) + getProductsTax(products) - getProductsDiscount(products);

  let totalDiscount = getTotalDiscount(totalBeforeDiscount, totalDiscountPercentage);

  let total = (totalBeforeDiscount - totalDiscount + totalDelivery)
  console.log(`Total antes de descuento: ${totalBeforeDiscount}`)

  console.log(`Total de descuento: ${totalDiscount}`)
  console.log(`Total de la entrega: ${totalDelivery}`)

  console.log(`Total de la factura: ${total}`)
  return limit(total);
}

export function convertDecimalToPercentage(valorDecimal) {
  if (typeof valorDecimal === 'number' && valorDecimal >= 0 && valorDecimal <= 1) {
    console.log(`Convirtiendo valor decimal a porcentaje: ${valorDecimal}`);
    return valorDecimal * 100;
  } else {
    console.log("Valor decimal inesperado. Retornando 0 como valor por defecto.");
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

