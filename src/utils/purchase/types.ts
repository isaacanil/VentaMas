import type { TimestampLike } from '@/utils/date/types';

export type PurchaseAttachmentLocation = 'local' | 'remote' | (string & {});

export interface PurchaseAttachment {
  id?: string;
  name?: string;
  type?: string;
  url?: string;
  location?: PurchaseAttachmentLocation;
  size?: number;
  mimeType?: string;
  file?: File;
  [key: string]: unknown;
}

export interface PurchaseBackOrderRef {
  id: string;
  [key: string]: unknown;
}

export interface PurchaseBackOrderSelection {
  id: string;
  quantity: number;
  [key: string]: unknown;
}

export interface PurchaseReplenishment {
  id?: string;
  productId?: string;
  name?: string;
  purchaseQuantity?: number | string;
  quantity?: number | string;
  baseCost?: number | string;
  expirationDate?: TimestampLike | null;
  selectedBackOrders?: PurchaseBackOrderRef[];
  newStock?: number | string;
  unitMeasurement?: string;
  taxPercentage?: number | string;
  freight?: number | string;
  otherCosts?: number | string;
  unitCost?: number | string;
  subTotal?: number | string;
  subtotal?: number | string;
  calculatedITBIS?: number | string;
  [key: string]: unknown;
}

export interface PurchaseDates {
  deliveryDate?: TimestampLike | null;
  paymentDate?: TimestampLike | null;
  [key: string]: unknown;
}

export interface Purchase {
  id?: string;
  orderId?: string;
  numberId?: number | string;
  provider?: unknown;
  providerId?: string;
  status?: string;
  condition?: string;
  name?: string;
  deliveryAt?: TimestampLike | null;
  paymentAt?: TimestampLike | null;
  completedAt?: TimestampLike | null;
  destinationWarehouseId?: string | null;
  attachmentUrls?: PurchaseAttachment[];
  replenishments?: PurchaseReplenishment[];
  dates?: PurchaseDates;
  note?: string;
  [key: string]: unknown;
}
