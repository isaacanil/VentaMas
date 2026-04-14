import type {
  AccountingOperationType,
  ExchangeRateSnapshot,
} from '@/types/accounting';
import type { TimestampLike } from '@/utils/date/types';

export type CanonicalPaymentMethodCode =
  | 'cash'
  | 'card'
  | 'transfer'
  | 'creditNote'
  | 'supplierCreditNote';

export type PaymentMethodAliasCode =
  | 'check'
  | 'bank_transfer'
  | 'open_cash'
  | 'credit_card'
  | 'debit_card'
  | 'credit_note'
  | 'creditnote'
  | 'supplier_credit_note'
  | 'supplier_creditnote'
  | 'suppliercreditnote'
  | 'supplier_credit'
  | 'suppliercredit';

export type PaymentMethodCode =
  | CanonicalPaymentMethodCode
  | PaymentMethodAliasCode
  | (string & {});

export interface PaymentMethodEntry {
  method?: PaymentMethodCode;
  name?: string;
  status?: boolean;
  value?: number;
  amount?: number;
  reference?: string | null;
  bankAccountId?: string | null;
  cashAccountId?: string | null;
  cashCountId?: string | null;
  supplierCreditNoteId?: string | null;
}

export type PaymentStateStatus =
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'overpaid'
  | 'unknown_legacy'
  | string;

export interface PaymentState {
  status: PaymentStateStatus;
  total: number;
  paid: number;
  balance: number;
  paymentCount?: number;
  lastPaymentAt?: TimestampLike | null;
  nextPaymentAt?: TimestampLike | null;
  lastPaymentId?: string | null;
  requiresReview?: boolean;
  migratedFromLegacy?: boolean;
}

export type CashMovementDirection = 'in' | 'out';
export type PaymentCounterpartyType = 'client' | 'supplier' | 'insurance';

export type PaymentEventStatus = 'posted' | 'void' | 'draft';

export interface PaymentEvent {
  id: string;
  businessId: string;
  operationType: AccountingOperationType | 'invoice_pos';
  sourceId: string;
  sourceDocumentId?: string | null;
  sourceDocumentType?: 'invoice' | 'purchase' | string | null;
  counterpartyType?: PaymentCounterpartyType | null;
  counterpartyId?: string | null;
  paymentMethods: PaymentMethodEntry[];
  totalAmount: number;
  appliedAmount?: number | null;
  unappliedAmount?: number | null;
  cashAccountId?: string | null;
  cashCountId?: string | null;
  bankAccountId?: string | null;
  reference?: string | null;
  occurredAt: TimestampLike;
  createdAt: TimestampLike;
  updatedAt?: TimestampLike;
  createdBy?: string | null;
  updatedBy?: string | null;
  exchangeRateSnapshot?: ExchangeRateSnapshot | null;
  evidenceUrls?: string[] | null;
  status?: PaymentEventStatus;
  voidedAt?: TimestampLike | null;
  voidedBy?: string | null;
  voidReason?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AccountsPayablePayment extends PaymentEvent {
  operationType: 'payable-payment';
  sourceDocumentType?: 'vendorBill' | 'purchase' | string | null;
  counterpartyType: 'supplier';
  purchaseId?: string | null;
  vendorBillId?: string | null;
  supplierId?: string | null;
  receiptNumber?: string | null;
  nextPaymentAt?: TimestampLike | null;
}

export interface SupplierCreditNote {
  id: string;
  businessId: string;
  supplierId?: string | null;
  counterpartyId?: string | null;
  sourceDocumentId?: string | null;
  sourceDocumentType?: 'purchase' | string | null;
  originType?: 'purchase_overpayment' | string | null;
  totalAmount: number;
  appliedAmount?: number | null;
  remainingAmount: number;
  status?: 'open' | 'applied' | 'void' | string;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  createdBy?: string | null;
  updatedBy?: string | null;
  metadata?: Record<string, unknown>;
}

export type CashMovementSourceType =
  | 'invoice_pos'
  | 'receivable_payment'
  | 'supplier_payment'
  | 'expense'
  | 'credit_note_application'
  | 'cash_adjustment';

export interface CashMovement {
  id: string;
  businessId: string;
  direction: CashMovementDirection;
  sourceType: CashMovementSourceType;
  sourceId: string;
  sourceDocumentId?: string | null;
  sourceDocumentType?: 'invoice' | 'purchase' | string | null;
  currency?: string | null;
  cashAccountId?: string | null;
  cashCountId?: string | null;
  bankAccountId?: string | null;
  method: PaymentMethodCode;
  amount: number;
  counterpartyType?: PaymentCounterpartyType | null;
  counterpartyId?: string | null;
  reference?: string | null;
  occurredAt: TimestampLike;
  createdAt: TimestampLike;
  createdBy?: string | null;
  impactsCashDrawer: boolean;
  impactsBankLedger: boolean;
  status?: Extract<PaymentEventStatus, 'posted' | 'void'>;
  metadata?: Record<string, unknown>;
}
