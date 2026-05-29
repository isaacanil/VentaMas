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

export type HrPaymentMethod = 'cash' | 'bank_transfer' | 'check' | 'other';

export type HrCommissionType = 'percentage' | 'fixed';

export type HrReadyToPayStatus = 'ready' | 'needs_review';

export type HrCommissionEntryStatus =
  | 'calculated'
  | 'eligible'
  | 'included_in_cut'
  | 'approved'
  | 'paid'
  | 'reversed'
  | 'cancelled'
  | 'requires_adjustment';

export interface HrEmployeeInput {
  id?: string | null;
  employeeId?: string | null;
  partyId?: string | null;
  code?: string | null;
  fullName?: string | null;
  legalName?: string | null;
  documentId?: string | null;
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
  commissionEnabled?: boolean | null;
  defaultCommissionType?: HrCommissionType | null;
  defaultCommissionRate?: number | string | null;
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
  documentId?: string | null;
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
  commissionEnabled: boolean;
  defaultCommissionType: HrCommissionType;
  defaultCommissionRate?: number | null;
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
  employeePaymentId?: string | null;
  accountingEventId?: string | null;
  journalEntryId?: string | null;
  dedupeKey?: string | null;
  date?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}
