// src/utils/pricing.js
export function limit(value) {
  // Convertir a centavos para evitar problemas de punto flotante
  const asInt = Math.round(value * 100);

  // Convertir de nuevo a formato decimal
  return asInt / 100;
}

export function getTax(price, taxPercentage, amountToBuy = 1) {
  let tax = price * (taxPercentage / 100);
  if(amountToBuy > 1) {
    
    return tax * amountToBuy;
  }
  return tax;
}
export function getPriceWithoutTax(priceWithTax, taxPercentage) {
  return priceWithTax / (1 + taxPercentage / 100);
}


export function getDiscount(price, discountPercentage) {
  return limit(price * (discountPercentage / 100));
}

export function getTotalPrice(price, taxPercentage = 0, discountPercentage = 0, amountToBuy = 1) {
  let tax = getTax(price, taxPercentage);
  let discount = getDiscount(price, discountPercentage);
  if (amountToBuy > 1) {
    price = price;
    tax = tax ;
    discount = discount;
    return limit(price + tax - discount) * amountToBuy;
  }
  return limit(price + tax - discount);
}

export function getProductsPrice(products) {
  return products.reduce((acc, product) => acc + product.pricing.price * product.amountToBuy, 0);
}

export function getProductsTax(products) {
  return products.reduce((acc, product) => acc + getTax(product.pricing.price * product.amountToBuy, product.pricing.tax), 0);
}

export function getProductsDiscount(products) {
  return products.reduce((acc, product) => {
    // Considerar el descuento solo si la promoción está activa.
    const discountPercentage = product.promotions?.isActive ? product.promotions.discount : 0;
    return acc + getDiscount(product.pricing.price * product.amountToBuy, discountPercentage);
  }, 0);
}

export function getTotalItems(products) {
  return products.reduce((acc, product) => acc + product.amountToBuy, 0);
}

export function getProductsTotalPrice(products, totalDiscountPercentage = 0, totalDelivery = 0) {
  let totalBeforeDiscount = getProductsPrice(products) + getProductsTax(products) - getProductsDiscount(products);
  let totalDiscount = getDiscount(totalBeforeDiscount, totalDiscountPercentage);
  let total = (totalBeforeDiscount - totalDiscount + totalDelivery)
  return limit(total);
}
