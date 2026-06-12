import type { ServiceCommissionServiceRule } from './commissions';

export type HrEmployeeStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'terminated';

export type HrEmployeePayType =
  | 'salary'
  | 'hourly'
  | 'commission_only'
  | 'mixed';

export type HrPaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'transfer'
  | 'check'
  | 'card'
  | 'other';

export type HrCommissionType = 'percentage' | 'fixed';

export type HrSalaryDeductionKind = 'afp' | 'tss' | 'salary_itbis' | 'other';

export type HrSalaryDeductionMode = 'percentage' | 'fixed';

export type HrSalaryDeductionBasis = 'base_salary' | 'gross_pay';

export type HrEmployeeDocumentType = 'cedula' | 'passport' | 'rnc' | 'other';

export type HrEmployeeGender = 'male' | 'female' | 'other';

export type HrEmployeeDepositAccountType =
  | 'checking'
  | 'savings'
  | 'payroll'
  | 'other';

export type HrReadyToPayStatus = 'ready' | 'needs_review';

export type HrCommissionCutRuleFrequency = 'weekly' | 'biweekly' | 'monthly';

export type HrCommissionPeriodStatus =
  | 'draft'
  | 'closed'
  | 'approved'
  | 'partially_paid'
  | 'paid'
  | 'cancelled';

export type HrPayrollRunStatus =
  | 'draft'
  | 'closed'
  | 'approved'
  | 'partially_paid'
  | 'paid'
  | 'cancelled';

export type HrEmployeePaymentStatus = 'confirmed' | 'voided';

export type HrCommissionEntryStatus =
  | 'calculated'
  | 'eligible'
  | 'included_in_cut'
  | 'approved'
  | 'paid'
  | 'reversed'
  | 'cancelled'
  | 'requires_adjustment';

export type HrRetroactiveResolutionStatus =
  | 'selected_for_next_cut'
  | 'included_in_cut'
  | 'paid'
  | 'cancelled';

export type HrCommissionRetroactiveEntryAction =
  | 'adjustment_required'
  | 'recalculable'
  | 'selected_for_next_cut'
  | 'selected_for_other_cut'
  | 'included_in_cut'
  | 'paid'
  | 'review_required';

export interface HrEmployeeInput {
  id?: string | null;
  employeeId?: string | null;
  partyId?: string | null;
  code?: string | null;
  fullName?: string | null;
  legalName?: string | null;
  documentType?: HrEmployeeDocumentType | null;
  documentId?: string | null;
  gender?: HrEmployeeGender | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  linkedUserId?: string | null;
  status?: HrEmployeeStatus | null;
  payType?: HrEmployeePayType | null;
  baseSalaryAmount?: number | string | null;
  hourlyRateAmount?: number | string | null;
  currency?: string | null;
  paymentMethod?: HrPaymentMethod | null;
  paymentDestination?: string | null;
  depositAccount?: HrEmployeeDepositAccount | null;
  salaryDeductions?: HrSalaryDeductionLine[] | null;
  commissionEnabled?: boolean | null;
  defaultCommissionType?: HrCommissionType | null;
  defaultCommissionRate?: number | string | null;
  serviceCommissionRules?: ServiceCommissionServiceRule[] | null;
  notes?: string | null;
}

export interface HrEmployeeDepositAccount extends Record<string, unknown> {
  bankName?: string | null;
  accountType?: HrEmployeeDepositAccountType | null;
  accountNumber?: string | null;
  holderName?: string | null;
  holderDocument?: string | null;
  notes?: string | null;
}

export interface HrSalaryDeductionLine extends Record<string, unknown> {
  id: string;
  kind: HrSalaryDeductionKind;
  name: string;
  mode: HrSalaryDeductionMode;
  rate: number;
  amount: number;
  basis: HrSalaryDeductionBasis;
  active: boolean;
  payableObligation: boolean;
  obligationKey?: string | null;
  accountSystemKey?: string | null;
  basisAmount?: number;
  calculatedAmount?: number;
  notes?: string | null;
}

export interface HrEmployeeRecord extends Record<string, unknown> {
  id: string;
  employeeId: string;
  businessId: string;
  partyId: string;
  code: string;
  fullName: string;
  legalName?: string | null;
  displayName?: string | null;
  documentType?: HrEmployeeDocumentType | null;
  documentId?: string | null;
  gender?: HrEmployeeGender | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  linkedUserId?: string | null;
  status: HrEmployeeStatus;
  payType: HrEmployeePayType;
  baseSalaryAmount: number;
  hourlyRateAmount: number;
  currency: string;
  paymentMethod: HrPaymentMethod;
  paymentDestination?: string | null;
  depositAccount?: HrEmployeeDepositAccount | null;
  salaryDeductions: HrSalaryDeductionLine[];
  commissionEnabled: boolean;
  defaultCommissionType: HrCommissionType;
  defaultCommissionRate?: number | null;
  serviceCommissionRules: ServiceCommissionServiceRule[];
  readyToPayStatus: HrReadyToPayStatus;
  readyToPayIssues: string[];
  notes?: string | null;
}

export interface HrCommissionEntryRecord extends Record<string, unknown> {
  id: string;
  businessId: string;
  employeeId?: string | null;
  employeeCode?: string | null;
  employeeNameSnapshot?: string | null;
  partyId?: string | null;
  linkedUserId?: string | null;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  invoiceItemId?: string | null;
  sourceType: 'invoice_line' | 'invoice_payment' | 'manual_adjustment';
  sourceCommissionId?: string | null;
  customerId?: string | null;
  customerNameSnapshot?: string | null;
  serviceId?: string | null;
  serviceName?: string | null;
  commissionRuleId?: string | null;
  commissionRuleNameSnapshot?: string | null;
  calculationBase?: string | null;
  baseAmount: number;
  rateType: HrCommissionType;
  rateValue: number;
  commissionAmount: number;
  currency: string;
  status: HrCommissionEntryStatus;
  sourceStatus?: string | null;
  periodId?: string | null;
  payrollRunId?: string | null;
  payrollEmployeeLineId?: string | null;
  employeePaymentId?: string | null;
  isRetroactive?: boolean;
  originalPeriodId?: string | null;
  originalPeriodLabel?: string | null;
  originalStartDateKey?: string | null;
  originalEndDateKey?: string | null;
  originalPeriodStatus?: HrCommissionPeriodStatus | null;
  retroactiveResolutionStatus?: HrRetroactiveResolutionStatus | null;
  retroactiveTargetPeriodId?: string | null;
  retroactiveTargetStartDateKey?: string | null;
  retroactiveTargetEndDateKey?: string | null;
  retroactiveTargetRuleId?: string | null;
  retroactiveTargetPayrollRunId?: string | null;
  retroactiveTargetLineId?: string | null;
  accountingEventId?: string | null;
  paymentAccountingEventId?: string | null;
  journalEntryId?: string | null;
  dedupeKey?: string | null;
  date?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface HrCommissionCutRuleInput {
  id?: string | null;
  ruleId?: string | null;
  label?: string | null;
  frequency?: HrCommissionCutRuleFrequency | null;
  startDay?: number | string | null;
  endDay?: number | string | null;
  businessTimeZone?: string | null;
  active?: boolean | null;
  sortOrder?: number | string | null;
}

export interface HrCommissionCutRuleRecord extends Record<string, unknown> {
  id: string;
  businessId: string;
  label: string;
  frequency: HrCommissionCutRuleFrequency;
  startDay: number;
  endDay: number;
  businessTimeZone?: string | null;
  active: boolean;
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface HrCommissionPeriodRecord extends Record<string, unknown> {
  id: string;
  businessId: string;
  type: 'commission';
  periodKey?: string | null;
  label?: string | null;
  status: HrCommissionPeriodStatus;
  startDateKey?: string | null;
  endDateKey?: string | null;
  businessTimeZone?: string | null;
  startDate?: unknown;
  endDate?: unknown;
  cutRuleId?: string | null;
  cutRuleLabel?: string | null;
  cutRuleSnapshot?: Record<string, unknown> | null;
  currency: string;
  entriesCount: number;
  employeesCount: number;
  totalCommissionAmount: number;
  normalEntriesCount?: number;
  retroactiveAdjustmentAmount?: number;
  retroactiveAdjustmentsCount?: number;
  retroactiveSourcePeriods?: Array<Record<string, unknown>>;
  hasRetroactiveAdjustments?: boolean;
  grossAmount?: number;
  deductionsAmount?: number;
  netAmount?: number;
  totalPayableAmount?: number;
  manualAdjustmentAmount?: number;
  adjustmentsCount?: number;
  lastAdjustmentComment?: string | null;
  payrollRunId?: string | null;
  accountingEventId?: string | null;
  paidAmount?: number;
  paidLinesCount?: number;
  lastPaymentId?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface HrCommissionNextCutPreview extends Record<string, unknown> {
  ok: boolean;
  preview: boolean;
  blocked: boolean;
  blockedReason?: string | null;
  businessId?: string | null;
  ruleId?: string | null;
  ruleLabel?: string | null;
  frequency: HrCommissionCutRuleFrequency;
  startDateKey?: string | null;
  endDateKey?: string | null;
  businessTimeZone?: string | null;
  employeesCount: number;
  entriesCount: number;
  normalEntriesCount?: number;
  totalEstimatedAmount: number;
  currency: string;
  exceedsMaxCutEntries: boolean;
  maxCutEntries: number;
  retroactiveEntriesCount: number;
  selectedRetroactiveEntriesCount?: number;
  pendingRetroactiveEntriesCount?: number;
  recalculableRetroactiveEntriesCount?: number;
  incompatibleRetroactiveEntriesCount?: number;
  reviewRequiredRetroactiveEntriesCount?: number;
  retroactiveAdjustmentAmount?: number;
  hasRetroactiveEntries: boolean;
  hasRetroactiveAdjustments?: boolean;
  canCreate: boolean;
}

export interface HrCommissionRetroactiveEntryRecord extends Record<
  string,
  unknown
> {
  id: string;
  entryId: string;
  dateKey?: string | null;
  employeeId?: string | null;
  employeeCode?: string | null;
  employeeNameSnapshot?: string | null;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  serviceId?: string | null;
  serviceName?: string | null;
  commissionAmount: number;
  currency: string;
  originalPeriodId?: string | null;
  originalPeriodLabel?: string | null;
  originalStartDateKey?: string | null;
  originalEndDateKey?: string | null;
  originalPeriodStatus: HrCommissionPeriodStatus;
  retroactiveResolutionStatus?: HrRetroactiveResolutionStatus | null;
  retroactiveTargetPeriodId?: string | null;
  selectedForCurrentCut: boolean;
  action: HrCommissionRetroactiveEntryAction;
}

export interface HrCommissionRetroactiveEntriesResponse extends Record<
  string,
  unknown
> {
  ok: boolean;
  businessId?: string | null;
  ruleId?: string | null;
  ruleLabel?: string | null;
  targetPeriodId?: string | null;
  startDateKey?: string | null;
  endDateKey?: string | null;
  businessTimeZone?: string | null;
  totalCount: number;
  selectedForTargetCount: number;
  adjustmentRequiredCount: number;
  recalculableCount: number;
  selectedForOtherTargetCount: number;
  reviewRequiredCount: number;
  retroactiveAdjustmentAmount: number;
  entries: HrCommissionRetroactiveEntryRecord[];
}

export interface HrPayrollRunRecord extends Record<string, unknown> {
  id: string;
  businessId: string;
  type: 'commission' | 'salary' | 'mixed';
  sourcePeriodId?: string | null;
  status: HrPayrollRunStatus;
  periodKey?: string | null;
  startDateKey?: string | null;
  endDateKey?: string | null;
  businessTimeZone?: string | null;
  startDate?: unknown;
  endDate?: unknown;
  currency: string;
  employeeCount: number;
  lineCount: number;
  grossAmount: number;
  deductionsAmount: number;
  netAmount: number;
  totalPayableAmount?: number;
  entriesCount?: number;
  normalEntriesCount?: number;
  totalCommissionAmount?: number;
  retroactiveAdjustmentAmount?: number;
  retroactiveAdjustmentsCount?: number;
  retroactiveSourcePeriods?: Array<Record<string, unknown>>;
  hasRetroactiveAdjustments?: boolean;
  accountingEventId?: string | null;
  paidAmount?: number;
  paidLinesCount?: number;
  lastPaymentId?: string | null;
}

export interface HrPayrollEmployeeLineRecord extends Record<string, unknown> {
  id: string;
  businessId: string;
  periodId: string;
  payrollRunId: string;
  employeeId: string;
  employeeCode?: string | null;
  employeeNameSnapshot?: string | null;
  partyId?: string | null;
  type: 'commission' | 'salary' | 'mixed';
  status: HrPayrollRunStatus;
  currency: string;
  baseSalaryAmount?: number;
  grossAmount: number;
  deductionsAmount: number;
  netAmount: number;
  totalPayableAmount?: number;
  commissionAmount: number;
  retroactiveAdjustmentAmount?: number;
  retroactiveAdjustmentsCount?: number;
  retroactiveEntryIds?: string[];
  retroactiveSourcePeriods?: Array<Record<string, unknown>>;
  hasRetroactiveAdjustments?: boolean;
  deductionLines: HrSalaryDeductionLine[];
  commissionEntryIds: string[];
  entriesCount: number;
  manualAdjustmentAmount?: number;
  manualAdjustmentComment?: string | null;
  manualAdjustmentHistory?: Array<Record<string, unknown>>;
  accountingEventId?: string | null;
  employeePaymentId?: string | null;
  paymentMethod?: HrPaymentMethod | null;
  paymentDestination?: string | null;
  depositAccount?: HrEmployeeDepositAccount | null;
  paymentAccountingEventId?: string | null;
  cashMovementIds?: string[];
  paidAt?: unknown;
}

export interface HrEmployeePaymentRecord extends Record<string, unknown> {
  id: string;
  businessId: string;
  periodId?: string | null;
  payrollRunId?: string | null;
  payrollLineId?: string | null;
  employeeId?: string | null;
  employeeCode?: string | null;
  employeeNameSnapshot?: string | null;
  partyId?: string | null;
  amount: number;
  currency: string;
  status: HrEmployeePaymentStatus;
  paymentMethod: HrPaymentMethod;
  paymentChannel?: 'cash' | 'bank' | 'other' | null;
  reference?: string | null;
  transferReference?: string | null;
  checkNumber?: string | null;
  cashAccountId?: string | null;
  cashCountId?: string | null;
  bankAccountId?: string | null;
  paymentDestination?: string | null;
  depositAccount?: HrEmployeeDepositAccount | null;
  accountingEventId?: string | null;
  cashMovementIds: string[];
  paymentDate?: unknown;
  createdAt?: unknown;
  createdBy?: string | null;
}
