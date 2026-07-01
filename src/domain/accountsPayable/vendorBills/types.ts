import type { PaymentState } from '@/types/payments';
import type { TimestampLike } from '@/utils/date/types';
import type { Purchase, PurchasePaymentTerms } from '@/utils/purchase/types';

export type VendorBillSourceDocumentType = 'purchase';

export type VendorBillStatus =
  | 'draft'
  | 'approved'
  | 'on_hold'
  | 'disputed'
  | 'partially_paid'
  | 'paid'
  | 'voided';

export type VendorBillApprovalStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'voided';
export type VendorBillDocumentNature =
  | 'inventory'
  | 'expense'
  | 'asset'
  | 'service';
export type VendorBillSettlementTiming = 'immediate' | 'deferred';
export type VendorBillPaymentControlStatus =
  | 'payable'
  | 'on_hold'
  | 'disputed'
  | 'pending_approval'
  | 'closed';

export interface VendorBillPaymentControlSnapshot {
  canRegisterPayment: boolean;
  label?: string | null;
  reason?: string | null;
  status: VendorBillPaymentControlStatus;
  tone?: 'danger' | 'warning' | 'neutral' | 'success' | null;
}

export interface VendorBillControlState {
  active?: boolean | null;
  status?: string | null;
  reason?: string | null;
  createdAt?: TimestampLike | null;
  createdBy?: string | null;
  evidenceNote?: string | null;
  evidenceUrls?: string[] | null;
  openedAt?: TimestampLike | null;
  openedBy?: string | null;
  placedAt?: TimestampLike | null;
  placedBy?: string | null;
  releasedAt?: TimestampLike | null;
  releasedBy?: string | null;
  resolvedAt?: TimestampLike | null;
  resolvedBy?: string | null;
  [key: string]: unknown;
}

export interface VendorBillControlSnapshot {
  approvalStatus?: VendorBillApprovalStatus | string | null;
  dispute?: VendorBillControlState | null;
  paymentHold?: VendorBillControlState | null;
  status?: VendorBillStatus | string | null;
}

export type VendorBillControlAction =
  | 'approve'
  | 'request_approval'
  | 'reject'
  | 'place_hold'
  | 'release_hold'
  | 'open_dispute'
  | 'resolve_dispute'
  | 'void';

export interface VendorBillControlEvent {
  id: string;
  action: VendorBillControlAction;
  businessId?: string | null;
  createdAt?: TimestampLike | null;
  createdBy?: string | null;
  evidenceNote?: string | null;
  evidenceUrls?: string[] | null;
  nextControl?: VendorBillControlSnapshot | null;
  previousControl?: VendorBillControlSnapshot | null;
  purchaseId?: string | null;
  reason?: string | null;
  sourceId?: string | null;
  sourceType?: string | null;
  vendorBillId?: string | null;
}

export interface VendorBill {
  id: string;
  reference: string;
  vendorReference?: string | null;
  status: VendorBillStatus;
  approvalStatus?: VendorBillApprovalStatus | null;
  sourceDocumentType: VendorBillSourceDocumentType;
  sourceDocumentId: string | null;
  approvedAt?: TimestampLike | null;
  approvedBy?: string | null;
  approvalReason?: string | null;
  approvalEvidenceNote?: string | null;
  approvalEvidenceUrls?: string[] | null;
  rejectedAt?: TimestampLike | null;
  rejectedBy?: string | null;
  rejectionReason?: string | null;
  rejectionEvidenceNote?: string | null;
  rejectionEvidenceUrls?: string[] | null;
  voidedAt?: TimestampLike | null;
  voidedBy?: string | null;
  voidReason?: string | null;
  voidEvidenceNote?: string | null;
  voidEvidenceUrls?: string[] | null;
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
  paymentControl?: VendorBillPaymentControlSnapshot | null;
  paymentHold?: VendorBillControlState | null;
  dispute?: VendorBillControlState | null;
  totals?: {
    total?: number | null;
    paid?: number | null;
    balance?: number | null;
  } | null;
  documentNature?: VendorBillDocumentNature | null;
  settlementTiming?: VendorBillSettlementTiming | null;
  purchase: Purchase;
}
