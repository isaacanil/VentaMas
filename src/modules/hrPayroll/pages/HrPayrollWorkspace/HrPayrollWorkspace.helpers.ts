import { cleanString as toCleanString } from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type { HrEmployeeRecord } from '@/types/hrPayroll';
import type {
  HrEmployeeFormValues,
  HrLinkedUserOption,
} from './components/HrEmployeeEditorModal.types';

export type BusinessUser = Record<string, unknown> & {
  id?: string;
  uid?: string;
  number?: number | string;
  name?: string;
  displayName?: string;
  realName?: string;
  email?: string;
  phone?: string;
  tel?: string;
};

export const DEFAULT_FORM_VALUES: HrEmployeeFormValues = {
  status: 'active',
  documentType: 'cedula',
  gender: null,
  payType: 'salary',
  baseSalaryAmount: 0,
  hourlyRateAmount: 0,
  currency: 'DOP',
  paymentMethod: 'bank_transfer',
  salaryDeductions: [],
  commissionEnabled: false,
  defaultCommissionType: 'percentage',
  defaultCommissionRate: null,
  serviceCommissionRules: [],
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

export const getUserEmail = (user: BusinessUser): string | null =>
  toCleanString(user.email);

export const getUserPhone = (user: BusinessUser): string | null =>
  toCleanString(user.phone) ?? toCleanString(user.tel);

export const getUserCode = (user: BusinessUser): string | null =>
  toCleanString(user.number);

export const buildLinkedUserOptions = (
  users: BusinessUser[],
): HrLinkedUserOption[] =>
  users
    .map((businessUser): HrLinkedUserOption | null => {
      const value = getUserId(businessUser);
      if (!value) return null;
      return {
        value,
        label: getUserLabel(businessUser),
        code: getUserCode(businessUser),
        email: getUserEmail(businessUser),
        phone: getUserPhone(businessUser),
      };
    })
    .filter((option): option is HrLinkedUserOption => option !== null);

export const buildUserLabelMap = (
  options: HrLinkedUserOption[],
): Map<string, string> =>
  new Map(options.map((option) => [option.value, option.label]));

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
    documentType: employee.documentType ?? 'cedula',
    documentId: employee.documentId,
    gender: employee.gender ?? null,
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
    salaryDeductions: employee.salaryDeductions,
    commissionEnabled: employee.commissionEnabled,
    defaultCommissionType: employee.defaultCommissionType,
    defaultCommissionRate: employee.defaultCommissionRate,
    serviceCommissionRules: employee.serviceCommissionRules,
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
