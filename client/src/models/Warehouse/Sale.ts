import { AuditInfo } from './AuditInfo';

export interface Sale {
  id: string; // auto-generated
  isDelivered: boolean;
  location: {
    warehouseId: string; // Reference to the Warehouse
    shelfId: string; // Reference to the Shelf
    rowShelfId: string; // Reference to the Row
    segmentId: string; // Reference to the Segment
    locationCode: string;
  }
  status: 'pending' | 'paid' | 'delivered' | 'cancelled';
  isPaid: boolean;
  customerId: string;
  products: SaleProduct[];
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  audit: AuditInfo;
  comment?: string;
}

interface SaleProduct {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  batchId?: string;
}