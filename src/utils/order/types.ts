import type {
  Purchase,
  PurchaseAttachment,
  PurchaseDates,
  PurchaseReplenishment,
} from '@/utils/purchase/types';

export interface Order extends Purchase {
  state?: string;
  status?: string;
  provider?: unknown;
  providerId?: string;
  dates?: PurchaseDates;
  attachmentUrls?: PurchaseAttachment[];
  replenishments?: PurchaseReplenishment[];
  receiptUrl?: string;
}
