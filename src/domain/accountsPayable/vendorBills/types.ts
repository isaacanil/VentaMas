import type { PaymentState } from '@/types/payments';
import type { TimestampLike } from '@/utils/date/types';
import type { Purchase, PurchasePaymentTerms } from '@/utils/purchase/types';

export type VendorBillSourceDocumentType = 'purchase';

export type VendorBillStatus =
  | 'draft'
  | 'approved'
  | 'partially_paid'
  | 'paid'
  | 'voided';

export type VendorBillApprovalStatus = 'draft' | 'approved' | 'voided';
export type VendorBillDocumentNature =
  | 'inventory'
  | 'expense'
  | 'asset'
  | 'service';
export type VendorBillSettlementTiming = 'immediate' | 'deferred';

export interface VendorBill {
  id: string;
  reference: string;
  vendorReference?: string | null;
  status: VendorBillStatus;
  approvalStatus?: VendorBillApprovalStatus | null;
  sourceDocumentType: VendorBillSourceDocumentType;
  sourceDocumentId: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  issueAt?: TimestampLike | null;
  billDate?: TimestampLike | null;
  accountingDate?: TimestampLike | null;
  dueAt?: TimestampLike | null;
  postedAt?: TimestampLike | null;
  attachmentUrls?: Purchase['attachmentUrls'];
  monetary?: Purchase['monetary'];
  paymentTerms?: PurchasePaymentTerms | null;
  paymentState?: PaymentState | null;
  totals?: {
    total?: number | null;
    paid?: number | null;
    balance?: number | null;
  } | null;
  documentNature?: VendorBillDocumentNature | null;
  settlementTiming?: VendorBillSettlementTiming | null;
  purchase: Purchase;
}
