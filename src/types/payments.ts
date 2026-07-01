import type {
  AccountingOperationType,
  ExchangeRateSnapshot,
  LiquidityEntrySourceType,
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

export type PaymentWithholdingApplicationType = 'itbis' | 'isr' | 'other';

export interface PaymentWithholdingApplication {
  type?: PaymentWithholdingApplicationType | string | null;
  amount: number;
  reference?: string | null;
  taxPeriod?: string | null;
  sourceDocumentId?: string | null;
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
export type CashMovementReconciliationStatus = 'reconciled' | 'unreconciled';

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
  withholdingAmount?: number | null;
  withholdingApplications?: PaymentWithholdingApplication[] | null;
  settlementAmount?: number | null;
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
  evidenceNote?: string | null;
  evidenceUrls?: string[] | null;
  status?: PaymentEventStatus;
  voidedAt?: TimestampLike | null;
  voidedBy?: string | null;
  voidEvidenceNote?: string | null;
  voidEvidenceUrls?: string[] | null;
  voidReason?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AccountsPayablePayment extends PaymentEvent {
  operationType: 'payable-payment';
  sourceDocumentType?: 'vendorBill' | 'purchase' | string | null;
  counterpartyType: 'supplier';
  purchaseId?: string | null;
  vendorBillId?: string | null;
  paymentRunId?: string | null;
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

export type CashMovementSourceType = LiquidityEntrySourceType;

export const CASH_MOVEMENT_SOURCE_OPENING_BALANCE = 'opening_balance' as const;
export const CASH_MOVEMENT_SOURCE_INTERNAL_TRANSFER =
  'internal_transfer' as const;
export const CASH_MOVEMENT_SOURCE_MANUAL_ADJUSTMENT =
  'manual_adjustment' as const;
export const CASH_MOVEMENT_SOURCE_BANK_RECONCILIATION =
  'bank_reconciliation' as const;
export const CASH_MOVEMENT_SOURCE_BANK_STATEMENT_ADJUSTMENT =
  'bank_statement_adjustment' as const;
export const CASH_MOVEMENT_SOURCE_INVOICE_POS = 'invoice_pos' as const;
export const CASH_MOVEMENT_SOURCE_RECEIVABLE_PAYMENT =
  'receivable_payment' as const;
export const CASH_MOVEMENT_SOURCE_RECEIVABLE_PAYMENT_VOID =
  'receivable_payment_void' as const;
export const CASH_MOVEMENT_SOURCE_SUPPLIER_PAYMENT =
  'supplier_payment' as const;
export const CASH_MOVEMENT_SOURCE_SUPPLIER_PAYMENT_VOID =
  'supplier_payment_void' as const;
export const CASH_MOVEMENT_SOURCE_EXPENSE = 'expense' as const;
export const CASH_MOVEMENT_SOURCE_CREDIT_NOTE_APPLICATION =
  'credit_note_application' as const;
export const CASH_MOVEMENT_SOURCE_CASH_ADJUSTMENT = 'cash_adjustment' as const;

export const CASH_MOVEMENT_SOURCE_TYPES = [
  CASH_MOVEMENT_SOURCE_OPENING_BALANCE,
  CASH_MOVEMENT_SOURCE_INTERNAL_TRANSFER,
  CASH_MOVEMENT_SOURCE_MANUAL_ADJUSTMENT,
  CASH_MOVEMENT_SOURCE_BANK_RECONCILIATION,
  CASH_MOVEMENT_SOURCE_BANK_STATEMENT_ADJUSTMENT,
  CASH_MOVEMENT_SOURCE_INVOICE_POS,
  CASH_MOVEMENT_SOURCE_RECEIVABLE_PAYMENT,
  CASH_MOVEMENT_SOURCE_RECEIVABLE_PAYMENT_VOID,
  CASH_MOVEMENT_SOURCE_SUPPLIER_PAYMENT,
  CASH_MOVEMENT_SOURCE_SUPPLIER_PAYMENT_VOID,
  CASH_MOVEMENT_SOURCE_EXPENSE,
  CASH_MOVEMENT_SOURCE_CREDIT_NOTE_APPLICATION,
  CASH_MOVEMENT_SOURCE_CASH_ADJUSTMENT,
] as const satisfies readonly CashMovementSourceType[];

export const RECEIVABLE_CASH_MOVEMENT_SOURCE_TYPES = [
  CASH_MOVEMENT_SOURCE_RECEIVABLE_PAYMENT,
  CASH_MOVEMENT_SOURCE_RECEIVABLE_PAYMENT_VOID,
] as const satisfies readonly CashMovementSourceType[];

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
  reconciliationStatus?: CashMovementReconciliationStatus | null;
  reconciliationId?: string | null;
  reconciledAt?: TimestampLike | null;
  bankStatementLineId?: string | null;
  metadata?: Record<string, unknown>;
}
