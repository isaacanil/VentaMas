import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import type {
  ProductStockRecord,
  TimestampLike,
} from '@/utils/inventory/types';

export type ProductStockItem = ProductStockRecord;

export type BatchGroupData = {
  batchId?: string | null;
  batchNumberId?: string | null;
  expirationDate?: TimestampLike;
  productName?: string | null;
  items: ProductStockItem[];
  total: number;
};

export type BatchGroupMap = Record<string, BatchGroupData>;

export type StockStatus = {
  icon: IconDefinition;
  color: string;
  background: string;
  label: string;
};
