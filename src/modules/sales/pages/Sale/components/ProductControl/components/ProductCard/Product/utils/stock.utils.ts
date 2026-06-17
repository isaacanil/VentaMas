import type { ProductRecord } from '@/types/products';

type StockCandidate = ProductRecord & {
  scopedStock?: number;
  originalStock?: number;
};

// stock.utils.js
export const resolveStock = (p: StockCandidate | null | undefined) => {
  if (!p) return 0;
  const candidateKeys = ['scopedStock', 'stock', 'originalStock'];
  for (const key of candidateKeys) {
    const value = p?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  const fallback = Number(p?.stock);
  return Number.isFinite(fallback) ? fallback : 0;
};

export const isStockRestricted = (p: StockCandidate | null | undefined) =>
  p?.restrictSaleWithoutStock;
export const isStockExceeded = (
  inCart: boolean,
  p: StockCandidate | null | undefined,
) => {
  if (!inCart || !p) return false;
  const total = p?.amountToBuy ?? 0;
  const max = resolveStock(p);
  if (max <= 0) return false;
  return total >= max;
};

export const isStockZero = (p: StockCandidate | null | undefined) =>
  resolveStock(p) <= 0;

// Dynamic low-stock check using provided threshold (defaults to 20)
export const isStockLow = (
  p: StockCandidate | null | undefined,
  lowThreshold = 20,
) => {
  if (!p) return false;
  const remaining = resolveStock(p) - (p.amountToBuy ?? 0);
  return (
    remaining > 0 &&
    remaining <= (Number.isFinite(lowThreshold) ? lowThreshold : 20)
  );
};
