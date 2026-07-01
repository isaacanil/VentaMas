import { resolveProductBaseQuantity } from '@/domain/products/saleUnits';

type PhysicalStockCartLine = {
  amountToBuy?: unknown;
  baseQuantity?: unknown;
  batchId?: string | number | null;
  cid?: string | number | null;
  id?: string | number | null;
  productStockId?: string | number | null;
  selectedSaleUnit?: unknown;
  stock?: unknown;
  weightDetail?: {
    isSoldByWeight?: boolean;
    weight?: unknown;
    weightUnit?: unknown;
  } | null;
};

type SumPhysicalStockOptions = {
  excludeLineId?: string | number | null;
};

const normalizeKey = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeQuantity = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const resolveLineIdentifier = (
  line: PhysicalStockCartLine | null | undefined,
): string | null => normalizeKey(line?.cid) ?? normalizeKey(line?.id);

const hasPhysicalStockIdentity = (
  line: PhysicalStockCartLine | null | undefined,
): boolean => Boolean(normalizeKey(line?.productStockId) || normalizeKey(line?.batchId));

export const hasSamePhysicalStockIdentity = (
  left: PhysicalStockCartLine | null | undefined,
  right: PhysicalStockCartLine | null | undefined,
): boolean => {
  if (!left || !right) return false;
  if (!hasPhysicalStockIdentity(left) || !hasPhysicalStockIdentity(right)) {
    return false;
  }

  return (
    normalizeKey(left.id) === normalizeKey(right.id) &&
    normalizeKey(left.productStockId) === normalizeKey(right.productStockId) &&
    normalizeKey(left.batchId) === normalizeKey(right.batchId)
  );
};

export const resolveCartLineBaseQuantity = (
  line: PhysicalStockCartLine | null | undefined,
): number => {
  if (!line) return 0;
  return normalizeQuantity(line.baseQuantity) ?? resolveProductBaseQuantity(line);
};

export const sumCartBaseQuantityForPhysicalStock = (
  cartProducts: PhysicalStockCartLine[] | null | undefined,
  targetLine: PhysicalStockCartLine | null | undefined,
  options: SumPhysicalStockOptions = {},
): number => {
  if (!Array.isArray(cartProducts) || !targetLine) return 0;
  const excludedLineId = normalizeKey(options.excludeLineId);

  return cartProducts.reduce((total, line) => {
    if (!hasSamePhysicalStockIdentity(line, targetLine)) return total;
    if (excludedLineId && resolveLineIdentifier(line) === excludedLineId) {
      return total;
    }
    return total + resolveCartLineBaseQuantity(line);
  }, 0);
};

export const resolveAvailableBaseStockForLine = ({
  cartProducts,
  line,
}: {
  cartProducts?: PhysicalStockCartLine[] | null;
  line: PhysicalStockCartLine | null | undefined;
}): number | null => {
  const stock = normalizeQuantity(line?.stock);
  if (stock == null) return null;
  if (!hasPhysicalStockIdentity(line)) return stock;

  const consumedByOtherLines = sumCartBaseQuantityForPhysicalStock(
    cartProducts,
    line,
    { excludeLineId: resolveLineIdentifier(line) },
  );

  return Math.max(stock - consumedByOtherLines, 0);
};
