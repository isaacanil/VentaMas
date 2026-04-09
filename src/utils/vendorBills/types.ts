import type { PaymentState } from '@/types/payments';
import type { TimestampLike } from '@/utils/date/types';
import type { Purchase, PurchasePaymentTerms } from '@/utils/purchase/types';

export type VendorBillSourceDocumentType = 'purchase';

export type VendorBillStatus =
  | 'draft'
  | 'posted'
  | 'partial'
  | 'paid'
  | 'canceled';

export interface VendorBill {
  id: string;
  reference: string;
  status: VendorBillStatus;
  sourceDocumentType: VendorBillSourceDocumentType;
  sourceDocumentId: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  issueAt?: TimestampLike | null;
  dueAt?: TimestampLike | null;
  postedAt?: TimestampLike | null;
  attachmentUrls?: Purchase['attachmentUrls'];
  monetary?: Purchase['monetary'];
  paymentTerms?: PurchasePaymentTerms | null;
  paymentState?: PaymentState | null;
  purchase: Purchase;
}
