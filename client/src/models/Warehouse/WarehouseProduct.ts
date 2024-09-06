export interface WarehouseProduct {
    id: string; // auto-generated
    batchId: string; // Reference to the Batch
    warehouseId: string; // Reference to the Warehouse
    productId: string; // Reference to the Product
    stock: number;
  }
  