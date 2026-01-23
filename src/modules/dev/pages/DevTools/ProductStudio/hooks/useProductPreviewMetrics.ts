import { useMemo } from 'react';

export interface ProductPricingSnapshot {
  cost?: number | string;
  price?: number | string;
  listPrice?: number | string;
  tax?: number | string;
}

export interface ProductSnapshot {
  pricing?: ProductPricingSnapshot;
  stock?: number | string;
  trackInventory?: boolean;
  image?: string;
  name?: string;
  brand?: string;
  category?: string;
  isVisible?: boolean;
}

export interface ProductPreviewMetrics {
  cost: number;
  price: number;
  tax: number;
  margin: number;
  stock: number;
  trackInventory: boolean;
}

const formatNumber = (value: unknown): number => Number(value || 0);

export const useProductPreviewMetrics = (
  product: ProductSnapshot | null | undefined,
): ProductPreviewMetrics => {
  return useMemo(() => {
    const pricing = product?.pricing || {};
    const cost = formatNumber(pricing.cost);
    const price = formatNumber(pricing.price || pricing.listPrice);
    const tax = formatNumber(pricing.tax);
    const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
    const stock = formatNumber(product?.stock);
    const trackInventory = product?.trackInventory !== false;

    return {
      cost,
      price,
      tax,
      margin: Math.round(margin * 10) / 10,
      stock,
      trackInventory,
    };
  }, [product]);
};
