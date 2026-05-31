import { cleanString as toCleanString } from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type { HrEmployeeRecord } from '@/types/hrPayroll';
import type { HrEmployeeFormValues } from './components/HrEmployeeEditorModal';

export type BusinessUser = Record<string, unknown> & {
  id?: string;
  uid?: string;
  name?: string;
  displayName?: string;
  realName?: string;
  email?: string;
};

export const DEFAULT_FORM_VALUES: HrEmployeeFormValues = {
  status: 'active',
  payType: 'salary',
  baseSalaryAmount: 0,
  hourlyRateAmount: 0,
  currency: 'DOP',
  paymentMethod: 'bank_transfer',
  commissionEnabled: false,
  defaultCommissionType: 'percentage',
  defaultCommissionRate: null,
};

export const getUserId = (user: BusinessUser): string | null =>
  toCleanString(user.uid) ?? toCleanString(user.id);

export const getUserLabel = (user: BusinessUser): string => {
  const id = getUserId(user);
  return (
    toCleanString(user.displayName) ??
    toCleanString(user.realName) ??
    toCleanString(user.name) ??
    toCleanString(user.email) ??
    id ??
    'Usuario'
  );
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'No se pudo completar la operacion.';
};

export const buildInitialValues = (
  employee: HrEmployeeRecord | null,
): HrEmployeeFormValues => {
  if (!employee) return DEFAULT_FORM_VALUES;
  return {
    ...DEFAULT_FORM_VALUES,
    id: employee.id,
    employeeId: employee.employeeId,
    partyId: employee.partyId,
    code: employee.code,
    fullName: employee.fullName,
    legalName: employee.legalName,
    documentId: employee.documentId,
    email: employee.email,
    phone: employee.phone,
    address: employee.address,
    linkedUserId: employee.linkedUserId,
    status: employee.status,
    payType: employee.payType,
    baseSalaryAmount: employee.baseSalaryAmount,
    hourlyRateAmount: employee.hourlyRateAmount,
    currency: employee.currency,
    paymentMethod: employee.paymentMethod,
    paymentDestination: employee.paymentDestination,
    commissionEnabled: employee.commissionEnabled,
    defaultCommissionType: employee.defaultCommissionType,
    defaultCommissionRate: employee.defaultCommissionRate,
    notes: employee.notes,
  };
};

export const matchesSearch = (
  employee: HrEmployeeRecord,
  searchTerm: string,
) => {
  if (!searchTerm) return true;
  const haystack = [
    employee.code,
    employee.fullName,
    employee.documentId,
    employee.email,
    employee.phone,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(searchTerm.toLowerCase());
};
