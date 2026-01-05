export type BackOrderStatus = 'pending' | 'reserved' | 'completed' | string;

export interface BackOrder {
  id: string;
  productId?: string | null;
  productName?: string | null;
  productStockId?: string | null;
  saleId?: string | null;
  initialQuantity?: number;
  pendingQuantity?: number;
  status?: BackOrderStatus;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}