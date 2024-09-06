export interface Sale {
  id: string;  // Document ID
  productId: string;  // Reference to the Product
  batchId: string;  // Reference to the Batch
  inventoryItemId: string;  // Reference to the InventoryItem
  count: number;
  comment: string;  // Optional comments about the sale
  isDelivered: boolean;
  saleDate: Date;
  fullShortCode: string;  // [BusinessShortname-WarehouseShortname-ShelfShortname-RowShelfShortName-SegmentShortname-BatchShortname]
  }
  