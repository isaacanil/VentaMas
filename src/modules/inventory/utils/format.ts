import {
  createCountFormatter,
  formatCountValue,
} from '@/utils/formatCounts';

export type InventoryQuantityDisplayValue =
  | number
  | string
  | null
  | undefined;

export type InventoryBatchDisplayValue = string | number | null | undefined;

interface FormatBatchLabelOptions {
  noBatchLabel?: string;
  prefix?: string;
}

export const NO_BATCH_LABEL = 'Sin lote';

const inventoryQuantityFormatter = createCountFormatter({
  maximumFractionDigits: 2,
});

export function formatNumber(n: number | string | null | undefined): string {
  const num = Number(n ?? 0);
  return inventoryQuantityFormatter.format(num);
}

export function formatInventoryQuantity(
  value: InventoryQuantityDisplayValue,
): string {
  return formatCountValue(value);
}

export function formatBatchLabel(
  value: InventoryBatchDisplayValue,
  { noBatchLabel = NO_BATCH_LABEL, prefix = '' }: FormatBatchLabelOptions = {},
): string {
  if (value == null) return noBatchLabel;

  const normalizedValue = String(value).trim();
  if (!normalizedValue) return noBatchLabel;

  return `${prefix}${normalizedValue}`;
}
