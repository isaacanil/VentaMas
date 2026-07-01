import {
  resolveProductBaseQuantity,
  resolveSaleUnitConversionFactor,
} from '@/domain/products/saleUnits';
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

export const shouldLabelStockAsBaseUnits = (
  p: StockCandidate | null | undefined,
) =>
  Boolean(p?.selectedSaleUnit) &&
  resolveSaleUnitConversionFactor(p?.selectedSaleUnit) > 1;

export const isStockRestricted = (p: StockCandidate | null | undefined) =>
  p?.restrictSaleWithoutStock;

export const resolveRequestedBaseQuantity = (
  p: StockCandidate | null | undefined,
) => {
  if (!p) return 0;
  const baseQuantity = Number(p.baseQuantity);
  if (Number.isFinite(baseQuantity) && baseQuantity > 0) return baseQuantity;
  return resolveProductBaseQuantity(p);
};

export const isStockExceeded = (
  inCart: boolean,
  p: StockCandidate | null | undefined,
) => {
  if (!inCart || !p) return false;
  const total = resolveRequestedBaseQuantity(p);
  const max = resolveStock(p);
  if (max <= 0) return false;
  return total >= max;
};

export const isStockInsufficientForNextUnit = (
  p: StockCandidate | null | undefined,
) => {
  if (!isStockRestricted(p)) return false;
  const requested = resolveRequestedBaseQuantity(p);
  const stock = resolveStock(p);
  return stock > 0 && requested > stock;
};

export const isStockZero = (p: StockCandidate | null | undefined) =>
  resolveStock(p) <= 0;

export const resolveRequestedQuantityForStockStatus = (
  inCart: boolean,
  p: StockCandidate | null | undefined,
) => {
  if (!p) return 0;
  if (inCart) return resolveRequestedBaseQuantity(p);
  const amountToBuy = Number(p.amountToBuy ?? 0);
  return Number.isFinite(amountToBuy) ? amountToBuy : 0;
};

export const resolveRemainingStockForStatus = (
  inCart: boolean,
  p: StockCandidate | null | undefined,
) => resolveStock(p) - resolveRequestedQuantityForStockStatus(inCart, p);

// Dynamic low-stock check using provided threshold (defaults to 20)
export const isStockLow = (
  p: StockCandidate | null | undefined,
  lowThreshold = 20,
) => {
  if (!p) return false;
  const remaining = resolveStock(p) - resolveRequestedBaseQuantity(p);
  return (
    remaining > 0 &&
    remaining <= (Number.isFinite(lowThreshold) ? lowThreshold : 20)
  );
};
