import type { PricingTax, ProductPricing } from '@/types/products';

export type ProductPricingFormValues = {
  cost?: number | string | null;
  tax?: PricingTax;
  listPrice?: number | string | null;
  midPrice?: number | string | null;
  minPrice?: number | string | null;
  cardPrice?: number | string | null;
  offerPrice?: number | string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const toProductPricingNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const normalizeProductPricingTax = (
  tax: PricingTax | null | undefined,
): number => {
  if (tax == null) return 0;
  if (isRecord(tax)) {
    return toProductPricingNumber(tax.tax);
  }
  return toProductPricingNumber(tax);
};

export const normalizeChangedProductPricingPatch = (
  value: unknown,
): Partial<ProductPricing> & Record<string, unknown> => {
  const patch = isRecord(value) ? { ...value } : {};

  if (Object.prototype.hasOwnProperty.call(patch, 'tax')) {
    patch.tax = normalizeProductPricingTax(patch.tax as PricingTax);
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'cost')) {
    patch.cost = toProductPricingNumber(patch.cost);
  }

  return patch;
};
