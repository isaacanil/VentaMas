import { useMemo } from 'react';

export interface ProductPricingSnapshot {
  currency?: string;
  cost?: number | string;
  price?: number | string;
  listPrice?: number | string;
  tax?: number | string;
}

export interface ProductSnapshot {
  itemType?: string;
  inventoryRole?: string | null;
  isSellable?: boolean;
  combo?: {
    inventoryPolicy?: string;
  } | null;
  pricing?: ProductPricingSnapshot;
  stock?: number | string;
  trackInventory?: boolean;
  image?: string;
  name?: string;
  brand?: string;
  category?: string;
  type?: string;
  isVisible?: boolean;
}

export interface ProductPreviewMetrics {
  currencyMarker: string;
  cost: number;
  price: number;
  tax: number;
  margin: number;
  stock: number;
  trackInventory: boolean;
}

const formatNumber = (value: unknown): number => Number(value || 0);
const getCurrencyMarker = (value: unknown): string =>
  value === 'USD' ? 'USD' : 'RD$';

export const useProductPreviewMetrics = (
  product: ProductSnapshot | null | undefined,
): ProductPreviewMetrics => {
  return useMemo(() => {
    const pricing = product?.pricing || {};
    const currencyMarker = getCurrencyMarker(pricing.currency);
    const cost = formatNumber(pricing.cost);
    const price = formatNumber(pricing.price || pricing.listPrice);
    const tax = formatNumber(pricing.tax);
    const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
    const stock = formatNumber(product?.stock);
    const trackInventory = product?.trackInventory !== false;

    return {
      currencyMarker,
      cost,
      price,
      tax,
      margin: Math.round(margin * 10) / 10,
      stock,
      trackInventory,
    };
  }, [product]);
};
