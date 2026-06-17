import type { TimestampLike } from '@/utils/inventory/types';
import {
  formatBatchLabel,
  formatInventoryQuantity,
  NO_BATCH_LABEL,
  type InventoryBatchDisplayValue,
  type InventoryQuantityDisplayValue,
} from '@/modules/inventory/utils/format';

export { formatBatchLabel, NO_BATCH_LABEL };

export type StockBatchDisplayValue = InventoryBatchDisplayValue;
export type StockQuantityDisplayValue = InventoryQuantityDisplayValue;

export const toStockDateMs = (value: TimestampLike): number | null => {
  if (!value) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  if (typeof value === 'number' || typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }
  if (typeof (value as { seconds?: number }).seconds === 'number') {
    return (value as { seconds: number }).seconds * 1000;
  }
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const parsed = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }
  return null;
};

export const formatStockQuantity = (
  value: StockQuantityDisplayValue,
): string => formatInventoryQuantity(value);
