export interface Batch {
  id: string;  // Document ID
  productId: string;  // Reference to the Product
  shortName: string;
  expirationDate?: Date;  // Optional
  initialCount: number;
  }
  