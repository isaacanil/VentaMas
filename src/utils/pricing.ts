// src/utils/pricing.js
import type { ProductPricing } from '@/types/products';

type NumericInput = number | string | null | undefined;
type AmountInput =
  | NumericInput
  | {
      total?: NumericInput;
      unit?: NumericInput;
      value?: NumericInput;
    }
  | null;
type PriceKey =
  | 'price'
  | 'listPrice'
  | 'avgPrice'
  | 'minPrice'
  | 'cardPrice'
  | 'offerPrice';
type ProductDiscount = {
  type?: string | null;
  value?: NumericInput;
};
type PricingProduct = {
  selectedSaleUnit?: { pricing?: ProductPricing | null } | null;
  pricing?: ProductPricing | null;
  weightDetail?: {
    isSoldByWeight?: boolean;
    weight?: NumericInput;
  } | null;
  promotion?: { discount?: NumericInput } | null;
  discount?: ProductDiscount | null;
  amountToBuy?: AmountInput;
  insurance?: {
    mode?: string | null;
    value?: NumericInput;
  } | null;
  [key: string]: unknown;
};
type PricingInvoice = {
  products?: PricingProduct[] | null;
  delivery?: { value?: NumericInput } | null;
  [key: string]: unknown;
};

function toFiniteNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function resolveAmount(value: AmountInput, fallback = 1): number {
  if (value && typeof value === 'object') {
    return toFiniteNumber(value.total ?? value.unit ?? value.value, fallback);
  }
  return toFiniteNumber(value, fallback);
}

function resolveTaxPercentage(tax: ProductPricing['tax']): number {
  if (tax && typeof tax === 'object') {
    return toFiniteNumber(tax.tax);
  }
  return toFiniteNumber(tax);
}

export function limit(value: number): number {
  const asInt = Math.round(value * 100);
  return asInt / 100;
}

export const roundDecimals = (n: unknown, dec = 2): number => {
  const factor = Math.pow(10, dec);
  return Math.round((Number(n) + Number.EPSILON) * factor) / factor;
};

function isValidNumber(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  const numeric = Number(value);
  return Number.isFinite(numeric);
}

export function getTax(
  product: PricingProduct | null | undefined,
  taxReceiptEnabled = true,
): number {
  if (!taxReceiptEnabled) return 0;

  const { isSoldByWeight, taxPercentage } = getPricingDetails(product);
  const result = isSoldByWeight ? getWeight(product) : getTotal(product);

  const tax = result * (taxPercentage / 100);
  return limit(tax);
}
function getPricingDetails(
  product: PricingProduct | null | undefined,
  useAmountToBuy = true,
) {
  const pricing = product?.selectedSaleUnit?.pricing || product?.pricing || {};
  const isSoldByWeight = product?.weightDetail?.isSoldByWeight || false;
  const weight = toFiniteNumber(product?.weightDetail?.weight, 1);
  const amountToBuy = useAmountToBuy ? resolveAmount(product?.amountToBuy) : 1;
  const price = toFiniteNumber(pricing.price);
  const taxPercentage = resolveTaxPercentage(pricing.tax);
  const discountPercentage = toFiniteNumber(product?.promotion?.discount);

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
  priceWithTax: NumericInput,
  taxPercentage: NumericInput,
  taxReceiptEnabled = true,
): number {
  const effectiveTaxPercentage = taxReceiptEnabled
    ? toFiniteNumber(taxPercentage)
    : 0;
  return toFiniteNumber(priceWithTax) / (1 + effectiveTaxPercentage / 100);
}

export function getDiscount(product: PricingProduct | null | undefined): number {
  if (!product) return 0;
  const { discountPercentage, isSoldByWeight } = getPricingDetails(product);
  const result = isSoldByWeight ? getWeight(product) : getTotal(product);
  return limit(result * (discountPercentage / 100));
}

export function getTotalPrice(
  product: PricingProduct | null | undefined,
  taxReceiptEnabled = true,
  useAmountToBuy = true,
): number {
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

function getWeight(
  product: PricingProduct | null | undefined,
  useAmountToBuy = true,
): number {
  const { price, weight } = getPricingDetails(product, useAmountToBuy);
  return price * weight;
}

export function resetAmountToBuyForProduct<T extends PricingProduct>(product: T) {
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
  product: PricingProduct | null | undefined,
  priceType: PriceKey = 'price',
  taxReceiptEnabled = true,
): number {
  const { isSoldByWeight, weight, pricing } = getPricingDetails(product);
  let price = toFiniteNumber(pricing[priceType]);
  if (isSoldByWeight) {
    price *= weight;
  }
  const tax = taxReceiptEnabled ? resolveTaxPercentage(pricing.tax) / 100 : 0;
  const taxAmount = price * tax;
  return limit(price + taxAmount);
}

export function getTotal(
  product: PricingProduct | null | undefined,
  useAmountToBuy = true,
): number {
  if (!product) return 0;
  const { price, amountToBuy } = getPricingDetails(product, useAmountToBuy);
  const quantity = useAmountToBuy ? amountToBuy : 1;

  // Aplicar descuento individual si existe
  let finalPrice = price * quantity;
  const discountValue = toFiniteNumber(product.discount?.value);
  if (product.discount && discountValue > 0) {
    if (product.discount.type === 'percentage') {
      finalPrice = finalPrice * (1 - discountValue / 100);
    } else {
      // Para monto fijo, se aplica al total sin impuestos
      finalPrice = Math.max(0, finalPrice - discountValue);
    }
  }

  return finalPrice;
}

export function getListPriceTotal(
  product: PricingProduct | null | undefined,
  taxReceiptEnabled = true,
): number {
  return getPriceTotalByType(product, 'listPrice', taxReceiptEnabled);
}

export function getPriceTotal(
  product: PricingProduct | null | undefined,
  taxReceiptEnabled = true,
): number {
  return getPriceTotalByType(product, 'price', taxReceiptEnabled);
}

export function getAvgPriceTotal(
  product: PricingProduct | null | undefined,
  taxReceiptEnabled = true,
): number {
  return getPriceTotalByType(product, 'avgPrice', taxReceiptEnabled);
}

export function getMinPriceTotal(
  product: PricingProduct | null | undefined,
  taxReceiptEnabled = true,
): number {
  return getPriceTotalByType(product, 'minPrice', taxReceiptEnabled);
}

export function getCardPriceTotal(
  product: PricingProduct | null | undefined,
  taxReceiptEnabled = true,
): number {
  return getPriceTotalByType(product, 'cardPrice', taxReceiptEnabled);
}

export function getOfferPriceTotal(
  product: PricingProduct | null | undefined,
  taxReceiptEnabled = true,
): number {
  return getPriceTotalByType(product, 'offerPrice', taxReceiptEnabled);
}

export function getProductsPrice(
  products: ReadonlyArray<PricingProduct> = [],
): number {
  return products.reduce((acc, product) => {
    const { isSoldByWeight, weight, amountToBuy, price } =
      getPricingDetails(product);
    const quantity = isSoldByWeight ? weight : amountToBuy;

    // Aplicar descuento individual si existe
    let finalPrice = price * quantity;
    const discountValue = toFiniteNumber(product.discount?.value);
    if (product.discount && discountValue > 0) {
      if (product.discount.type === 'percentage') {
        finalPrice = finalPrice * (1 - discountValue / 100);
      } else {
        // Para monto fijo, se aplica al total sin impuestos
        finalPrice = Math.max(0, finalPrice - discountValue);
      }
    }

    return acc + finalPrice;
  }, 0);
}

export function getProductsTax(
  products: ReadonlyArray<PricingProduct> = [],
  taxReceiptEnabled = true,
): number {
  return products.reduce(
    (acc, product) => acc + getTax(product, taxReceiptEnabled),
    0,
  );
}

export function getProductsDiscount(
  products: ReadonlyArray<PricingProduct> = [],
): number {
  return products.reduce((acc, product) => acc + getDiscount(product), 0);
}

export function getProductsIndividualDiscounts(
  products: ReadonlyArray<PricingProduct> = [],
): number {
  return products.reduce((acc, product) => {
    const discountValue = toFiniteNumber(product.discount?.value);
    if (!product.discount || discountValue <= 0) return acc;

    const { price, isSoldByWeight, weight, amountToBuy } =
      getPricingDetails(product);
    const quantity = isSoldByWeight ? weight : amountToBuy;
    const subtotalBeforeDiscount = price * quantity;

    let discountAmount = 0;
    if (product.discount.type === 'percentage') {
      discountAmount = subtotalBeforeDiscount * (discountValue / 100);
    } else {
      // Para monto fijo
      discountAmount = Math.min(discountValue, subtotalBeforeDiscount);
    }

    return acc + discountAmount;
  }, 0);
}

export function getProductIndividualDiscount(
  product: PricingProduct | null | undefined,
): number {
  const discountValue = toFiniteNumber(product?.discount?.value);
  if (!product?.discount || discountValue <= 0) return 0;

  const { price, isSoldByWeight, weight, amountToBuy } =
    getPricingDetails(product);
  const quantity = isSoldByWeight ? weight : amountToBuy;
  const subtotalBeforeDiscount = price * quantity;

  if (product.discount.type === 'percentage') {
    return subtotalBeforeDiscount * (discountValue / 100);
  } else {
    // Para monto fijo
    return Math.min(discountValue, subtotalBeforeDiscount);
  }
}

export function getTotalItems(
  products: ReadonlyArray<PricingProduct> = [],
): number {
  // Sum amountToBuy, defaulting each product to 1; avoid precedence pitfalls
  return products.reduce(
    (acc, product) => acc + resolveAmount(product?.amountToBuy),
    0,
  );
}

export function getProductsTotalPrice(
  products: ReadonlyArray<PricingProduct> = [],
  totalDiscountPercentage = 0,
  totalDelivery: NumericInput = 0,
  taxReceiptEnabled = true,
): number {
  if (!isValidNumber(totalDelivery)) {
    totalDelivery = 0;
  }

  // Verificar si hay productos con descuentos individuales
  const hasIndividualDiscounts = products.some(
    (product) => toFiniteNumber(product.discount?.value) > 0,
  );

  const subtotal = getProductsPrice(products);
  const itbis = getProductsTax(products, taxReceiptEnabled);
  const productsDiscount = getProductsDiscount(products);
  const totalBeforeDiscount = subtotal - productsDiscount;

  // Solo aplicar descuento general si no hay descuentos individuales
  const totalDiscount = hasIndividualDiscounts
    ? 0
    : getTotalDiscount(totalBeforeDiscount, totalDiscountPercentage);

  const total =
    totalBeforeDiscount + toFiniteNumber(totalDelivery) - totalDiscount + itbis;

  return limit(total);
}

export function convertDecimalToPercentage(valorDecimal: unknown): number {
  const num = Number(valorDecimal);
  if (isNaN(num)) {
    return 0;
  }
  return num * 100;
}

export function getTotalInvoice<T extends PricingInvoice>(invoice: T) {
  return {
    ...invoice,
    totals: {
      subtotal: getProductsPrice(invoice.products ?? []),
      tax: getProductsTax(invoice.products ?? []),
      discount: getProductsDiscount(invoice.products ?? []),
      total: getProductsTotalPrice(
        invoice.products ?? [],
        0,
        invoice?.delivery?.value,
      ),
    },
  };
}

export const getTotalDiscount = (
  totalBeforeDiscount = 0,
  totalDiscountPercentage = 0,
): number => {
  if (
    !isValidNumber(totalBeforeDiscount) ||
    !isValidNumber(totalDiscountPercentage)
  ) {
    return 0;
  }
  return totalBeforeDiscount * (totalDiscountPercentage / 100);
};

export const getProducts = <T extends PricingProduct>(
  products: T[] = [],
  taxReceiptEnabled = true,
) => {
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

export const setNumPrecision = (value: unknown, precision = 2): number => {
  const num = Number(value);
  if (isNaN(num)) {
    return 0;
  }
  return Number(num.toFixed(precision));
};

export function getInsuranceExtra(
  product: PricingProduct | null | undefined,
): number {
  const ins = product?.insurance || { mode: null, value: 0 };
  const insuranceValue = toFiniteNumber(ins.value);
  if (!insuranceValue) return 0;
  // Use getPricingDetails to obtain price and quantity.
  const { price, isSoldByWeight, weight, amountToBuy } =
    getPricingDetails(product);
  const quantity = isSoldByWeight ? weight : amountToBuy;
  return ins.mode === 'porcentaje'
    ? price * quantity * (insuranceValue / 100)
    : insuranceValue * quantity;
}

export function getProductsInsuranceExtra(
  products: ReadonlyArray<PricingProduct> = [],
): number {
  return products.reduce((acc, product) => acc + getInsuranceExtra(product), 0);
}

export function getChange(total: number, payment: number): number {
  return payment - total;
}
