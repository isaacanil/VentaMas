import type {
  HrCommissionEntryStatus,
  HrCommissionCutRuleFrequency,
  HrCommissionPeriodStatus,
  HrCommissionType,
  HrEmployeeDocumentType,
  HrEmployeeGender,
  HrEmployeePayType,
  HrEmployeeStatus,
  HrPaymentMethod,
  HrPayrollRunStatus,
} from '@/types/hrPayroll';

export const HR_EMPLOYEE_STATUS_LABELS: Record<HrEmployeeStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  terminated: 'Terminado',
};

export const HR_EMPLOYEE_PAY_TYPE_LABELS: Record<HrEmployeePayType, string> = {
  salary: 'Salario',
  hourly: 'Por hora',
  commission_only: 'Solo comision',
  mixed: 'Mixto',
};

export const HR_EMPLOYEE_DOCUMENT_TYPE_LABELS: Record<
  HrEmployeeDocumentType,
  string
> = {
  cedula: 'Cedula',
  passport: 'Pasaporte',
  rnc: 'RNC',
  other: 'Otro',
};

export const HR_EMPLOYEE_GENDER_LABELS: Record<HrEmployeeGender, string> = {
  male: 'Masculino',
  female: 'Femenino',
  other: 'Otro',
};

export const HR_PAYMENT_METHOD_LABELS: Record<HrPaymentMethod, string> = {
  cash: 'Efectivo',
  bank_transfer: 'Transferencia',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  check: 'Cheque',
  other: 'Otro',
};

export const HR_COMMISSION_TYPE_LABELS: Record<HrCommissionType, string> = {
  percentage: 'Porcentaje',
  fixed: 'Monto fijo',
};

export const HR_COMMISSION_CUT_RULE_FREQUENCY_LABELS: Record<
  HrCommissionCutRuleFrequency,
  string
> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
};

export const HR_COMMISSION_ENTRY_STATUS_LABELS: Record<
  HrCommissionEntryStatus,
  string
> = {
  calculated: 'Calculada',
  eligible: 'Elegible',
  included_in_cut: 'En corte',
  approved: 'Aprobada',
  paid: 'Pagada',
  reversed: 'Reversada',
  cancelled: 'Cancelada',
  requires_adjustment: 'Revisar',
};

export const HR_COMMISSION_ENTRY_STATUS_COLORS: Record<
  HrCommissionEntryStatus,
  string
> = {
  calculated: 'blue',
  eligible: 'cyan',
  included_in_cut: 'purple',
  approved: 'green',
  paid: 'success',
  reversed: 'red',
  cancelled: 'default',
  requires_adjustment: 'orange',
};

export const HR_COMMISSION_PERIOD_STATUS_LABELS: Record<
  HrCommissionPeriodStatus,
  string
> = {
  draft: 'Borrador',
  closed: 'Cerrado',
  approved: 'Aprobado',
  partially_paid: 'Pago parcial',
  paid: 'Pagado',
  cancelled: 'Cancelado',
};

export const HR_COMMISSION_PERIOD_STATUS_COLORS: Record<
  HrCommissionPeriodStatus,
  string
> = {
  draft: 'blue',
  closed: 'gold',
  approved: 'green',
  partially_paid: 'purple',
  paid: 'cyan',
  cancelled: 'default',
};

export const HR_PAYROLL_RUN_STATUS_LABELS: Record<HrPayrollRunStatus, string> =
  HR_COMMISSION_PERIOD_STATUS_LABELS;

export const HR_PAYROLL_RUN_STATUS_COLORS: Record<HrPayrollRunStatus, string> =
  HR_COMMISSION_PERIOD_STATUS_COLORS;

export const cleanString = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const toHrDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value) {
    const date = (value as { toDate: () => unknown }).toDate();
    return date instanceof Date ? date : null;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

export const formatHrDate = (value: unknown): string => {
  const date = toHrDate(value);
  return date
    ? new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(date)
    : '-';
};

export const formatHrMoney = (amount: number, currency = 'DOP'): string =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
