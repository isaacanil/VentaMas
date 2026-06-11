import type { TimestampLike } from '@/utils/date/types';
import type { SupportedDocumentCurrency } from '@/utils/accounting/currencies';

export type AccountingRateType = 'buy' | 'sell';
export type AccountingRateTypeAlias = 'purchase' | 'sale';
export type BankAccountStatus = 'active' | 'inactive';
export type BankAccountType = 'checking' | 'savings' | 'credit_card' | 'other';
export type CashAccountStatus = 'active' | 'inactive';
export type CashAccountType = 'register' | 'petty_cash' | 'vault' | 'other';
export type LiquidityAccountType = 'bank' | 'cash';
export type LiquidityEntryDirection = 'in' | 'out';
export type LiquidityEntryStatus = 'posted' | 'void';
export type LiquidityEntrySourceType =
  | 'opening_balance'
  | 'internal_transfer'
  | 'manual_adjustment'
  | 'bank_reconciliation'
  | 'bank_statement_adjustment'
  | 'invoice_pos'
  | 'receivable_payment'
  | 'receivable_payment_void'
  | 'supplier_payment'
  | 'supplier_payment_void'
  | 'expense'
  | 'credit_note_application'
  | 'hr_payroll_payment'
  | 'cash_adjustment';
export type InternalTransferStatus = 'posted' | 'void';
export type BankReconciliationStatus = 'balanced' | 'variance';
export type BankStatementLineStatus = 'pending' | 'reconciled' | 'written_off';
export type BankStatementLineType = 'transaction' | 'closing_balance';
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
  | 'payroll'
  | 'tax';
export type AccountingEventType =
  | 'invoice.committed'
  | 'invoice.voided'
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
  | 'bank_statement_adjustment.recorded'
  | 'internal_transfer.posted'
  | 'inventory.cogs.recorded'
  | 'inventory.cogs.voided'
  | 'manual.entry.recorded'
  | 'fx_settlement.recorded'
  | 'fx_settlement.voided'
  | 'hr_commission.accrued'
  | 'hr_payroll.payment.recorded';
export type AccountingEventStatus = 'recorded' | 'projected' | 'voided';
export type AccountingProjectionStatus =
  | 'pending'
  | 'projected'
  | 'failed'
  | 'pending_account_mapping'
  | 'voided'
  | 'skipped_zero_amount';
export type AccountingPostingProfileStatus = 'active' | 'inactive';
export type AccountingPostingAmountSource =
  | 'document_total'
  | 'net_sales'
  | 'sale_settled_amount'
  | 'sale_receivable_balance'
  | 'sale_cash_received'
  | 'sale_bank_received'
  | 'sale_other_received'
  | 'credit_note_net_total'
  | 'purchase_subtotal'
  | 'purchase_tax'
  | 'purchase_total'
  | 'purchase_net_payable'
  | 'purchase_withholding_itbis'
  | 'purchase_withholding_isr'
  | 'expense_subtotal'
  | 'expense_tax'
  | 'expense_total'
  | 'expense_net_payable'
  | 'expense_withholding_itbis'
  | 'expense_withholding_isr'
  | 'tax_total'
  | 'cash_over_short_gain'
  | 'cash_over_short_loss'
  | 'bank_statement_adjustment_gain'
  | 'bank_statement_adjustment_loss'
  | 'accounts_receivable_payment_amount'
  | 'accounts_receivable_applied_amount'
  | 'accounts_receivable_collected_amount'
  | 'accounts_receivable_withholding_amount'
  | 'accounts_payable_payment_amount'
  | 'accounts_payable_cash_paid'
  | 'accounts_payable_bank_paid'
  | 'accounts_payable_credit_note_applied'
  | 'payroll_accrual_amount'
  | 'payroll_net_payable_amount'
  | 'payroll_tax_deductions_amount'
  | 'payroll_other_deductions_amount'
  | 'transfer_amount'
  | 'fx_gain'
  | 'fx_loss';
export type AccountingPostingPaymentTerm = 'any' | 'cash' | 'credit';
export type AccountingPostingSettlementKind =
  | 'any'
  | 'cash'
  | 'bank'
  | 'mixed'
  | 'other';
export type AccountingPostingTaxTreatment = 'any' | 'taxed' | 'untaxed';
export type AccountingPostingDocumentNature =
  | 'any'
  | 'inventory'
  | 'expense'
  | 'asset'
  | 'service';
export type AccountingPostingSettlementTiming =
  | 'any'
  | 'immediate'
  | 'deferred';
export type AccountingPostingTransferDirection =
  | 'any'
  | 'cash_to_bank'
  | 'bank_to_cash'
  | 'bank_to_bank'
  | 'cash_to_cash';
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
  bankCode?: string | null;
  countryCode?: string | null;
  isCustomBank?: boolean | null;
  accountNumberLast4?: string | null;
  chartOfAccountId?: string | null;
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

export interface CashAccount {
  id: string;
  businessId: string;
  name: string;
  currency: SupportedDocumentCurrency;
  status: CashAccountStatus;
  type?: CashAccountType | null;
  chartOfAccountId?: string | null;
  location?: string | null;
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

export interface LiquidityLedgerEntry {
  id: string;
  businessId: string;
  accountId: string;
  accountType: LiquidityAccountType;
  currency: SupportedDocumentCurrency;
  direction: LiquidityEntryDirection;
  amount: number;
  occurredAt: TimestampLike;
  createdAt?: TimestampLike | null;
  createdBy?: string | null;
  status?: LiquidityEntryStatus;
  sourceType: LiquidityEntrySourceType;
  sourceId?: string | null;
  reference?: string | null;
  description?: string | null;
  reconciliationStatus?: 'reconciled' | 'unreconciled' | null;
  reconciliationId?: string | null;
  reconciledAt?: TimestampLike | null;
  counterpartyAccountId?: string | null;
  counterpartyAccountType?: LiquidityAccountType | null;
  metadata?: Record<string, unknown>;
}

export interface InternalTransfer {
  id: string;
  businessId: string;
  fromAccountId: string;
  fromAccountType: LiquidityAccountType;
  toAccountId: string;
  toAccountType: LiquidityAccountType;
  currency: SupportedDocumentCurrency;
  amount: number;
  occurredAt: TimestampLike;
  status: InternalTransferStatus;
  reference?: string | null;
  notes?: string | null;
  createdAt?: TimestampLike | null;
  createdBy?: string | null;
  ledgerEntryIds?: string[] | null;
  metadata?: Record<string, unknown>;
}

export interface BankReconciliationRecord {
  id: string;
  businessId: string;
  bankAccountId: string;
  periodStart?: TimestampLike | null;
  periodEnd?: TimestampLike | null;
  statementDate: TimestampLike;
  openingStatementBalance?: number | null;
  statementBalance: number;
  ledgerOpeningBalance?: number | null;
  ledgerPeriodMovementTotal?: number | null;
  ledgerBalance: number;
  statementMovementTotal?: number | null;
  openingVariance?: number | null;
  periodVariance?: number | null;
  variance: number;
  status: BankReconciliationStatus;
  carriedMovementCount?: number;
  periodMovementCount?: number;
  reconciledMovementCount?: number;
  unreconciledMovementCount?: number;
  statementLineCount?: number;
  notes?: string | null;
  reference?: string | null;
  createdAt?: TimestampLike | null;
  createdBy?: string | null;
  metadata?: Record<string, unknown>;
}

export interface BankStatementLine {
  id: string;
  businessId: string;
  bankAccountId: string;
  reconciliationId?: string | null;
  lineType: BankStatementLineType;
  status: BankStatementLineStatus;
  statementDate: TimestampLike;
  amount?: number | null;
  runningBalance?: number | null;
  direction?: LiquidityEntryDirection | null;
  description?: string | null;
  reference?: string | null;
  createdAt?: TimestampLike | null;
  createdBy?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AccountingEventTreasurySnapshot {
  cashAccountId?: string | null;
  cashCountId?: string | null;
  bankAccountId?: string | null;
  paymentChannel?: 'cash' | 'bank' | 'mixed' | 'other' | null;
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
  subtotalAmount?: number | null;
  taxAmount?: number | null;
  withholdingITBISAmount?: number | null;
  withholdingISRAmount?: number | null;
  netPayableAmount?: number | null;
  functionalAmount?: number | null;
  functionalSubtotalAmount?: number | null;
  functionalTaxAmount?: number | null;
  functionalWithholdingITBISAmount?: number | null;
  functionalWithholdingISRAmount?: number | null;
  functionalNetPayableAmount?: number | null;
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
  attemptCount?: number | null;
  replayCount?: number | null;
  lastAttemptAt?: TimestampLike | null;
  lastReplayRequestedAt?: TimestampLike | null;
  lastReplayRequestedBy?: string | null;
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
  documentNature?: AccountingPostingDocumentNature;
  settlementTiming?: AccountingPostingSettlementTiming;
  transferDirection?: AccountingPostingTransferDirection;
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
