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
