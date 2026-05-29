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
