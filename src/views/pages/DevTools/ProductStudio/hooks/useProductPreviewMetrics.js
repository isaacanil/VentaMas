import { useMemo } from 'react';

const formatNumber = (value) => Number(value || 0);

export const useProductPreviewMetrics = (product) => {
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
