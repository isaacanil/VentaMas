import { formatCount } from '@/utils/formatCounts';

export const formatLots = (value: number | null | undefined): string => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '0 lotes';
  const count = formatCount(numericValue);
  return `${count} ${numericValue === 1 ? 'lote' : 'lotes'}`;
};

export const formatUnits = (
  value: number | null | undefined,
): string | null => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;
  const count = formatCount(numericValue);
  return `${count} ${numericValue === 1 ? 'und.' : 'unds.'}`;
};
