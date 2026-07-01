import type { PricingTax, ProductPricing, ProductRecord } from '@/types/products';

type PriceDisplayProduct =
  | (Partial<Pick<ProductRecord, 'pricing' | 'selectedSaleUnit'>> & {
      promotion?: { discount?: unknown } | null;
      [key: string]: unknown;
    })
  | null
  | undefined;

const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readTaxPercentage = (tax: PricingTax): number => {
  if (tax && typeof tax === 'object') {
    return toFiniteNumber(tax.tax);
  }
  return toFiniteNumber(tax);
};

const resolveDisplayPricing = (
  product: PriceDisplayProduct,
): ProductPricing => product?.selectedSaleUnit?.pricing || product?.pricing || {};

export const resolveOperationalUnitPrice = (
  pricing: ProductPricing | null | undefined,
): number => {
  const price = Number(pricing?.price);
  if (Number.isFinite(price) && price > 0) return price;

  const listPrice = Number(pricing?.listPrice);
  if (Number.isFinite(listPrice) && listPrice > 0) return listPrice;

  return Number.isFinite(price) ? price : 0;
};

export const getWeightedUnitPriceForDisplay = (
  product: PriceDisplayProduct,
  taxReceiptEnabled = true,
): number => {
  const pricing = resolveDisplayPricing(product);
  const basePrice = resolveOperationalUnitPrice(pricing);
  const taxAmount = taxReceiptEnabled
    ? basePrice * (readTaxPercentage(pricing.tax) / 100)
    : 0;
  const discountPercentage = toFiniteNumber(product?.promotion?.discount);
  const discountAmount = basePrice * (discountPercentage / 100);

  return roundMoney(basePrice + taxAmount - discountAmount);
};
