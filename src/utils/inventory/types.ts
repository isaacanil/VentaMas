import type { Firestore } from 'firebase/firestore';
import type { RowShelf } from '@/models/Warehouse/RowShelf';
import type { Segment } from '@/models/Warehouse/Segment';
import type { Shelf } from '@/models/Warehouse/Shelf';
import type { Warehouse } from '@/models/Warehouse/Warehouse';

import type { ClearSentinel } from './constants';

export type TimestampLikeObject = {
  toDate?: () => Date;
  toMillis?: () => number;
  seconds?: number;
  nanoseconds?: number;
  _seconds?: number;
  _nanoseconds?: number;
};

export type TimestampLike =
  | TimestampLikeObject
  | Date
  | string
  | number
  | null
  | undefined;

export type InventoryStatus = 'open' | 'processing' | 'closed' | string;
export type InventoryRowType = 'noexp' | 'batch';
export type StockFilter = 'all' | 'with' | 'without';
export type SortDir = 'asc' | 'desc';
export type ExpirationEditValue = string | null | undefined | ClearSentinel;

export type WarehouseStructureType =
  | 'warehouses'
  | 'shelves'
  | 'rows'
  | 'segments';

export interface WarehouseStructureElement {
  id: string;
  name?: string;
  location: string;
  updatedAt: string;
  updatedBy?: string;
  isDeleted?: boolean;
}

export interface WarehouseStructurePayload {
  name?: string;
  warehouseId?: string;
  shelfId?: string;
  rowShelfId?: string;
}

export interface WarehouseStructureData {
  warehouses: Array<{ id: string; name?: string }>;
  shelves: Array<{ id: string; name?: string; warehouseId?: string }>;
  rows: Array<{
    id: string;
    name?: string;
    warehouseId?: string;
    shelfId?: string;
  }>;
  segments: Array<{
    id: string;
    name?: string;
    warehouseId?: string;
    shelfId?: string;
    rowShelfId?: string;
  }>;
}

export type LocationPathParts = {
  warehouseId?: string | number | null;
  shelfId?: string | number | null;
  rowId?: string | number | null;
  rowShelfId?: string | number | null;
  segmentId?: string | number | null;
};

export type WarehouseRecord = Partial<Warehouse> & {
  id?: string;
} & Record<string, unknown>;

export type ShelfRecord = Partial<Shelf> & {
  id?: string;
  warehouseId?: string;
  createdAt?: TimestampLike;
} & Record<string, unknown>;

export type RowShelfRecord = Partial<RowShelf> & {
  id?: string;
  warehouseId?: string;
  shelfId?: string;
  createdAt?: TimestampLike;
} & Record<string, unknown>;

export type SegmentRecord = Partial<Segment> & {
  id?: string;
  warehouseId?: string;
  shelfId?: string;
  rowShelfId?: string;
  createdAt?: TimestampLike;
} & Record<string, unknown>;

export interface InventoryCountMeta {
  updatedBy?: string | null;
  updatedByName?: string | null;
  updatedAt?: TimestampLike;
  manualExpirationDate?: ExpirationEditValue | null;
}

export type CountsMap = Record<string, number>;
export type CountsMetaMap = Record<string, InventoryCountMeta>;
export type ExpirationEditsMap = Record<string, ExpirationEditValue>;
export type LocationNamesMap = Record<string, string>;
export type ResolvingMap = Record<string, boolean>;

export interface InventoryLocation {
  location?: string;
  locationKey?: string;
  locationLabel?: string;
  quantity: number;
}

export interface InventorySource {
  id?: string;
  key?: string;
  batchId?: string | number | null;
  batchNumberId?: string | number | null;
  expirationDate?: TimestampLike;
  quantity?: number;
  stock?: number;
  real?: number;
  location?: string;
  locationKey?: string;
  locationLabel?: string;
}

export interface InventoryChild {
  key: string;
  type: InventoryRowType;
  rowType?: string;
  productId?: string | null;
  productName?: string;
  batchId?: string | number | null;
  batchNumberId?: string | number | null;
  expirationDate?: TimestampLike;
  stock?: number;
  real?: number;
  diff?: number;
  locations?: InventoryLocation[];
  sources?: InventorySource[];
  sourceIds?: (string | number)[];
}

export interface InventoryGroup {
  key?: string;
  productId?: string | null;
  productKey?: string;
  productName?: string;
  totalStock?: number;
  totalReal?: number;
  totalDiff?: number;
  expirationSortValue?: string;
  _children?: InventoryChild[];
  canEditAtTop?: boolean;
  topKey?: string;
}

export interface LocationRefLike {
  path?: string;
  pathSegments?: string[];
  warehouse?: unknown;
  warehouseId?: string | number;
  shelf?: unknown;
  shelfId?: string | number;
  row?: unknown;
  rowId?: string | number;
  rowShelf?: unknown;
  rowShelfId?: string | number;
  segment?: unknown;
  segmentId?: string | number;
}

export interface InventoryStockItem {
  id: string;
  name?: string;
  productId?: string | null;
  productID?: string | null;
  product?: { id?: string | null } | null;
  idProduct?: string | null;
  productName?: string;
  quantity?: number;
  stock?: number;
  batchNumberId?: string | number | null;
  batchId?: string | number | null;
  expirationDate?: TimestampLike;
  location?: string | LocationRefLike;
  locationKey?: string;
  locationLabel?: string;
  shelfId?: string | null;
  rowId?: string | null;
  rowShelfId?: string | null;
  segmentId?: string | null;
  warehouseId?: string | null;
  isDeleted?: boolean;
  isSynthetic?: boolean;
  status?: string | null;
  real?: number;
}

export type ProductStockRecord = Partial<InventoryStockItem> &
  Record<string, unknown>;

export interface StockSummary {
  totalLots: number;
  totalUnits: number;
  directLots: number;
  directUnits: number;
}

export interface AggregatedProductStock {
  id?: string;
  name?: string;
  productName?: string;
  barcode?: string;
  totalStock?: number;
  uniqueBatches?: number;
  uniqueLocations?: number;
  stockRecords?: number;
  hasExpiration?: boolean;
  hasExpired?: boolean;
  locations?: Array<string | null>;
  stockItems?: ProductStockRecord[];
  stockSummary?: StockSummary | null;
}

export interface InventorySession {
  id?: string;
  name?: string;
  status?: InventoryStatus;
  frozenChildrenStock?: Record<string, number>;
  frozenProductTotals?: Record<string, number>;
  user?: { uid?: string | null };
  closedBy?: string | null;
  createdBy?: string | null;
  createdByName?: string | null;
}

export interface InventoryUser {
  uid?: string;
  id?: string;
  businessID?: string;
  displayName?: string;
  name?: string;
  email?: string;
  photoURL?: string | null;
}

export interface SaveCountsResult {
  saved: number;
}

export interface UseInventoryCountsParams {
  db?: Firestore | null;
  user?: InventoryUser | null;
  sessionId?: string | null;
}

export interface BuildInventoryGroupsParams {
  items: InventoryStockItem[];
  counts: CountsMap;
  serverCounts: CountsMap;
  locationNames: LocationNamesMap;
  stockFilter: StockFilter;
  sortDir: SortDir;
  searchTerm?: string;
  session?: InventorySession | null;
  expirationEdits?: ExpirationEditsMap;
  countsMeta?: CountsMetaMap;
}

export interface ExportInventoryOptions {
  filename?: string;
  onlyDifferences?: boolean;
  addSummarySheet?: boolean;
  includeBatchKey?: boolean;
}

export interface ExportSessionInfo {
  id?: string;
  name?: string;
}

export interface InventoryEditorInfo {
  uid: string;
  name: string;
  updatedAt?: TimestampLike;
}

export interface BaselineSnapshot {
  counts: CountsMap;
  expirations: Record<string, string>;
}
