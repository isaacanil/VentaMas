interface ShelfProduct {
    id: string;  // Document ID
    batchId: string;  // Reference to the Batch
    shelfId: string;  // Reference to the Shelf
    productId: string;  // Reference to the Product
    stock: number;  // Stock of the product on the shelf
  }
  