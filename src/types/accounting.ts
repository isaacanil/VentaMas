import type { TimestampLike } from '@/utils/date/types';
import type { SupportedDocumentCurrency } from '@/utils/accounting/currencies';

export type AccountingRateType = 'buy' | 'sell';
export type AccountingRateTypeAlias = 'purchase' | 'sale';
export type BankAccountStatus = 'active' | 'inactive';
export type BankAccountType = 'checking' | 'savings' | 'credit_card' | 'other';
export type ChartOfAccountStatus = 'active' | 'inactive';
export type ChartOfAccountType =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'income'
  | 'expense';
export type ChartOfAccountNormalSide = 'debit' | 'credit';
export type ChartOfAccountCurrencyMode =
  | 'functional_only'
  | 'multi_currency_reference';
export type AccountingModuleKey =
  | 'sales'
  | 'accounts_receivable'
  | 'purchases'
  | 'accounts_payable'
  | 'expenses'
  | 'cash'
  | 'banking'
  | 'fx'
  | 'general_ledger'
  | 'tax';
export type AccountingEventType =
  | 'invoice.committed'
  | 'accounts_receivable.payment.recorded'
  | 'accounts_receivable.payment.voided'
  | 'customer_credit_note.issued'
  | 'customer_credit_note.applied'
  | 'purchase.committed'
  | 'accounts_payable.payment.recorded'
  | 'accounts_payable.payment.voided'
  | 'supplier_credit_note.issued'
  | 'supplier_credit_note.applied'
  | 'expense.recorded'
  | 'cash_over_short.recorded'
  | 'internal_transfer.posted'
  | 'manual.entry.recorded'
  | 'fx_settlement.recorded';
export type AccountingEventStatus = 'recorded' | 'projected' | 'voided';
export type AccountingProjectionStatus =
  | 'pending'
  | 'projected'
  | 'failed'
  | 'pending_account_mapping';
export type AccountingPostingProfileStatus = 'active' | 'inactive';
export type AccountingPostingAmountSource =
  | 'document_total'
  | 'net_sales'
  | 'sale_settled_amount'
  | 'sale_receivable_balance'
  | 'sale_cash_received'
  | 'sale_bank_received'
  | 'sale_other_received'
  | 'purchase_total'
  | 'expense_total'
  | 'tax_total'
  | 'cash_over_short_gain'
  | 'cash_over_short_loss'
  | 'accounts_receivable_payment_amount'
  | 'accounts_payable_payment_amount'
  | 'transfer_amount'
  | 'fx_gain'
  | 'fx_loss';
export type AccountingPostingPaymentTerm = 'any' | 'cash' | 'credit';
export type AccountingPostingSettlementKind = 'any' | 'cash' | 'bank' | 'other';
export type AccountingPostingTaxTreatment = 'any' | 'taxed' | 'untaxed';
export type JournalEntryStatus = 'posted' | 'reversed';

export type AccountingOperationType =
  | 'sale'
  | 'purchase'
  | 'expense'
  | 'receivable-payment'
  | 'payable-payment';

export interface AccountingCurrencyRateConfig {
  buyRate: number | null;
  sellRate: number | null;
}

export type AccountingManualRatesByCurrency = Partial<
  Record<SupportedDocumentCurrency, AccountingCurrencyRateConfig>
>;

export type CurrentExchangeRateIdsByCurrency = Partial<
  Record<SupportedDocumentCurrency, string | null>
>;

export interface ExchangeRateReferenceRates {
  buyRate?: number | null;
  sellRate?: number | null;
}

export interface ExchangeRateSnapshot {
  rateId?: string | null;
  rateType?: AccountingRateType | null;
  effectiveRate?: number | null;
  rate?: number | null;
  source?: string | null;
  provider?: string | null;
  quoteCurrency?: string | null;
  baseCurrency?: string | null;
  effectiveAt?: TimestampLike | null;
  referenceRates?: ExchangeRateReferenceRates | null;
}

export interface BusinessExchangeRate {
  id: string;
  businessId: string;
  quoteCurrency: SupportedDocumentCurrency;
  baseCurrency: SupportedDocumentCurrency;
  buyRate: number | null;
  sellRate: number | null;
  effectiveAt: TimestampLike;
  source: string;
  status: 'active' | 'superseded';
  createdAt: TimestampLike;
  createdBy?: string | null;
  historyId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface BankAccount {
  id: string;
  businessId: string;
  name: string;
  currency: SupportedDocumentCurrency;
  status: BankAccountStatus;
  type?: BankAccountType | null;
  institutionName?: string | null;
  accountNumberLast4?: string | null;
  openingBalance?: number | null;
  openingBalanceDate?: TimestampLike | null;
  createdAt?: TimestampLike | null;
  updatedAt?: TimestampLike | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  lastChangeId?: string | null;
  lastChangedAt?: TimestampLike | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ChartOfAccount {
  id: string;
  businessId: string;
  code: string;
  name: string;
  type: ChartOfAccountType;
  subtype?: string | null;
  parentId?: string | null;
  postingAllowed: boolean;
  status: ChartOfAccountStatus;
  normalSide: ChartOfAccountNormalSide;
  currencyMode: ChartOfAccountCurrencyMode;
  systemKey?: string | null;
  createdAt?: TimestampLike | null;
  updatedAt?: TimestampLike | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  lastChangeId?: string | null;
  lastChangedAt?: TimestampLike | null;
  metadata?: Record<string, unknown>;
}

export interface AccountingEventMonetarySnapshot {
  amount?: number | null;
  taxAmount?: number | null;
  functionalAmount?: number | null;
  functionalTaxAmount?: number | null;
}

export interface AccountingEventTreasurySnapshot {
  cashCountId?: string | null;
  bankAccountId?: string | null;
  paymentChannel?: 'cash' | 'bank' | 'mixed' | 'other' | null;
}

export interface AccountingEventError {
  code: string;
  message: string;
  at?: TimestampLike | null;
  details?: Record<string, unknown>;
}

export interface AccountingEventProjection {
  status: AccountingProjectionStatus;
  projectorVersion?: number | null;
  journalEntryId?: string | null;
  lastAttemptAt?: TimestampLike | null;
  projectedAt?: TimestampLike | null;
  lastError?: AccountingEventError | null;
}

export interface AccountingEvent {
  id: string;
  businessId: string;
  eventType: AccountingEventType;
  eventVersion: number;
  status: AccountingEventStatus;
  occurredAt?: TimestampLike | null;
  recordedAt?: TimestampLike | null;
  sourceType?: string | null;
  sourceId?: string | null;
  sourceDocumentType?: string | null;
  sourceDocumentId?: string | null;
  counterpartyType?: string | null;
  counterpartyId?: string | null;
  currency?: SupportedDocumentCurrency | null;
  functionalCurrency?: SupportedDocumentCurrency | null;
  monetary?: AccountingEventMonetarySnapshot | null;
  treasury?: AccountingEventTreasurySnapshot | null;
  payload?: Record<string, unknown>;
  dedupeKey?: string | null;
  idempotencyKey?: string | null;
  projection?: AccountingEventProjection | null;
  reversalOfEventId?: string | null;
  createdAt?: TimestampLike | null;
  createdBy?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AccountingPostingCondition {
  paymentTerm?: AccountingPostingPaymentTerm;
  settlementKind?: AccountingPostingSettlementKind;
  taxTreatment?: AccountingPostingTaxTreatment;
}

export interface AccountingPostingLineTemplate {
  id: string;
  side: ChartOfAccountNormalSide;
  accountId?: string | null;
  accountCode?: string | null;
  accountName?: string | null;
  accountSystemKey?: string | null;
  amountSource: AccountingPostingAmountSource;
  description?: string | null;
  omitIfZero: boolean;
  metadata?: Record<string, unknown>;
}

export interface AccountingPostingProfile {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  eventType: AccountingEventType;
  moduleKey: AccountingModuleKey;
  status: AccountingPostingProfileStatus;
  priority: number;
  conditions?: AccountingPostingCondition | null;
  linesTemplate: AccountingPostingLineTemplate[];
  createdAt?: TimestampLike | null;
  updatedAt?: TimestampLike | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  lastChangeId?: string | null;
  lastChangedAt?: TimestampLike | null;
  metadata?: Record<string, unknown>;
}

export interface JournalEntryTotals {
  debit: number;
  credit: number;
}

export interface JournalEntryLine {
  lineNumber: number;
  accountId: string;
  accountCode?: string | null;
  accountName?: string | null;
  accountSystemKey?: string | null;
  description?: string | null;
  debit: number;
  credit: number;
  amountSource?: AccountingPostingAmountSource | null;
  reference?: string | null;
  costCenterId?: string | null;
  departmentId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface JournalEntry {
  id: string;
  businessId: string;
  eventId: string;
  eventType: AccountingEventType;
  eventVersion: number;
  status: JournalEntryStatus;
  entryDate?: TimestampLike | null;
  periodKey?: string | null;
  description?: string | null;
  currency?: SupportedDocumentCurrency | null;
  functionalCurrency?: SupportedDocumentCurrency | null;
  sourceType?: string | null;
  sourceId?: string | null;
  reversalOfEntryId?: string | null;
  reversalOfEventId?: string | null;
  totals: JournalEntryTotals;
  lines: JournalEntryLine[];
  projectorVersion?: number | null;
  createdAt?: TimestampLike | null;
  createdBy?: string | null;
  metadata?: Record<string, unknown>;
}
