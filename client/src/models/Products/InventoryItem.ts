export interface InventoryItem {
  id: string;  // Document ID
  productId: string;  // Reference to the Product
  batchId: string;  // Reference to the Batch
  warehouseId: string;  // Reference to the Warehouse
  shelfId: string;  // Reference to the Shelf
  rowShelfId: string;  // Reference to the RowShelf
  segmentId: string;  // Reference to the Segment
  stock: number;
  productName: string;  // Useful desnormalized data
  batchShortName: string;  // Useful desnormalized data
  expirationDate?: Date;  // Optional
  fullShortCode: string;  // Simplified identifier for the item
  }
  