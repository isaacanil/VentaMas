import type { TimestampLike } from '@/utils/date/types';
import type { PaymentState } from '@/types/payments';
import type { UserRoleLike } from '@/types/users';

export type PurchaseAttachmentLocation = 'local' | 'remote' | (string & {});
export type PurchasePaymentCondition =
  | 'cash'
  | 'one_week'
  | 'fifteen_days'
  | 'thirty_days'
  | 'other'
  | (string & {});
export type PurchaseWorkflowStatus =
  | 'pending_receipt'
  | 'partial_receipt'
  | 'completed'
  | 'canceled';

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
  orderedQuantity?: number | string;
  receivedQuantity?: number | string;
  pendingQuantity?: number | string;
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

export interface PurchasePaymentTerms {
  condition?: PurchasePaymentCondition | null;
  expectedPaymentAt?: TimestampLike | null;
  nextPaymentAt?: TimestampLike | null;
  isImmediate?: boolean;
  scheduleType?: 'immediate' | 'deferred' | 'custom' | string;
  [key: string]: unknown;
}

export interface PurchaseReceiptActor {
  uid?: string | null;
  name?: string | null;
  role?: UserRoleLike | null;
  [key: string]: unknown;
}

export interface PurchaseReceiptSummary {
  lineCount?: number;
  receivedQuantity?: number;
  remainingPurchasePendingQuantity?: number;
  [key: string]: unknown;
}

export interface PurchaseReceiptEvent {
  id?: string;
  receivedAt?: TimestampLike | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  receivedBy?: PurchaseReceiptActor | null;
  workflowStatusAfter?: PurchaseWorkflowStatus | null;
  items?: PurchaseReplenishment[];
  summary?: PurchaseReceiptSummary | null;
  [key: string]: unknown;
}

export interface Purchase {
  id?: string;
  orderId?: string;
  numberId?: number | string;
  provider?: unknown;
  providerId?: string;
  status?: string;
  workflowStatus?: PurchaseWorkflowStatus | null;
  condition?: PurchasePaymentCondition;
  name?: string;
  deliveryAt?: TimestampLike | null;
  paymentAt?: TimestampLike | null;
  completedAt?: TimestampLike | null;
  destinationWarehouseId?: string | null;
  attachmentUrls?: PurchaseAttachment[];
  receiptHistory?: PurchaseReceiptEvent[];
  replenishments?: PurchaseReplenishment[];
  dates?: PurchaseDates;
  note?: string;
  monetary?: Record<string, unknown> | null;
  paymentTerms?: PurchasePaymentTerms | null;
  paymentState?: PaymentState | null;
  [key: string]: unknown;
}
