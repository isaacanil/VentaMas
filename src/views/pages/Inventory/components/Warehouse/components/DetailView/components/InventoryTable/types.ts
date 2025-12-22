import type { MenuProps } from 'antd';
import type { DateTime } from 'luxon';

export type DateRangeValue = [DateTime | null, DateTime | null] | null;

export interface InventoryTableProps {
  currentNode: unknown;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  setDateRange: (dates: DateRangeValue) => void;
  location: string | null | undefined;
  warehouseData?: unknown;
}

export interface ProductStockLike {
  id?: string;
  productName?: string;
  product?: string;
  productCode?: string;
  productId?: string;
  sku?: string;
  quantity?: number;
  batchNumberId?: string;
  batchId?: string | null;
  batch?: string | number | BatchInfo | null;
  expirationDate?: unknown;
  createdAt?: unknown;
  [key: string]: unknown;
}

export interface BatchInfo {
  batchNumberId: string;
  batchId: string | null;
}

export interface ExpiryDateInfo {
  label: string;
  isExpired: boolean;
}

export interface InventoryRow extends ProductStockLike {
  key: string;
  productName: string;
  productId: string;
  quantity: number;
  batch: BatchInfo;
  batchId: string | null;
  actions: ProductStockLike;
  expirationDateMillis: number | null;
  expiryDate: ExpiryDateInfo;
}

export interface FilterDraft {
  showOnlyWithExpiration: boolean;
  batches: string[];
  product: string | null;
}

export interface DraftBatchOption {
  value: string;
  label: string;
  displayLabel: string;
  expirationText: string;
  expirationDateMillis?: number | null;
}

export interface ProductOption {
  value: string;
  label: string;
}

export type ProductBatchMap = Map<
  string,
  Map<
    string,
    { value: string; label: string; expirationDateMillis: number | null }
  >
>;

export interface SortConfig {
  field:
    | 'productName'
    | 'batchNumberId'
    | 'expirationDate'
    | 'createdAt'
    | null;
  order: 'asc' | 'desc' | null;
}

export type SortMenuItems = MenuProps['items'];

export type GetActionMenu = (record: ProductStockLike) => MenuProps;
