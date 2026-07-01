import { convertInventoryBaseQuantityToWeightUnit } from '@/domain/products/weightUnits';

const roundWeight = (value: number): number =>
  Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;

export const parseWeightInputValue = (value: string): number | null => {
  if (!value.trim()) return null;
  const parsedValue = Number.parseFloat(value.replace(',', '.'));
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

export const formatWeightInputValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '';
  return String(value);
};

export const resolveMaxWeightForStock = ({
  restrictSaleWithoutStock,
  stock,
  weightUnit,
}: {
  restrictSaleWithoutStock?: boolean;
  stock?: number;
  weightUnit?: string;
}): number | null => {
  if (!restrictSaleWithoutStock) return null;
  if (typeof stock !== 'number' || !Number.isFinite(stock) || stock <= 0) {
    return null;
  }
  return convertInventoryBaseQuantityToWeightUnit({
    baseQuantity: stock,
    unit: weightUnit,
  });
};

export const exceedsRestrictedWeightStock = ({
  restrictSaleWithoutStock,
  stock,
  weight,
  weightUnit,
}: {
  restrictSaleWithoutStock?: boolean;
  stock?: number;
  weight: number;
  weightUnit?: string;
}): boolean => {
  const maxWeight = resolveMaxWeightForStock({
    restrictSaleWithoutStock,
    stock,
    weightUnit,
  });
  return maxWeight !== null && weight > maxWeight;
};

export const resolveCommittedWeightValue = ({
  fallback = 1,
  restrictSaleWithoutStock,
  stock,
  value,
  weightUnit,
}: {
  fallback?: number;
  restrictSaleWithoutStock?: boolean;
  stock?: number;
  value: string;
  weightUnit?: string;
}): number => {
  const parsedValue = parseWeightInputValue(value);
  const positiveValue =
    parsedValue !== null && parsedValue > 0 ? parsedValue : fallback;
  const maxWeight = resolveMaxWeightForStock({
    restrictSaleWithoutStock,
    stock,
    weightUnit,
  });

  if (maxWeight !== null && positiveValue > maxWeight) {
    return maxWeight;
  }

  return roundWeight(positiveValue);
};
