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
import { formatLocaleCurrency } from '@/utils/format/currency';

export const HR_EMPLOYEE_STATUS_LABELS: Record<HrEmployeeStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  terminated: 'Terminado',
};

export const HR_EMPLOYEE_PAY_TYPE_LABELS: Record<HrEmployeePayType, string> = {
  salary: 'Salario',
  hourly: 'Por hora',
  commission_only: 'Solo comisión',
  mixed: 'Mixto',
};

export const HR_EMPLOYEE_DOCUMENT_TYPE_LABELS: Record<
  HrEmployeeDocumentType,
  string
> = {
  cedula: 'Cédula',
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

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const cleanHrDateKey = (value: unknown): string | null => {
  const text = cleanString(value);
  return text && DATE_KEY_PATTERN.test(text) ? text : null;
};

const getUtcDateKey = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const extractDateKeysFromText = (value: unknown): string[] =>
  cleanString(value)?.match(/\d{4}-\d{2}-\d{2}/g) ?? [];

export const resolveHrPeriodDateKey = (
  periodLike: Record<string, unknown> | null | undefined,
  boundary: 'start' | 'end',
): string | null => {
  if (!periodLike) return null;

  const explicitKey =
    boundary === 'start'
      ? cleanHrDateKey(periodLike.startDateKey)
      : cleanHrDateKey(periodLike.endDateKey);
  if (explicitKey) return explicitKey;

  const extractedKeys = [
    ...extractDateKeysFromText(periodLike.periodKey),
    ...extractDateKeysFromText(periodLike.label),
    ...extractDateKeysFromText(periodLike.id),
  ];
  const extractedKey =
    boundary === 'start' ? extractedKeys[0] : extractedKeys[1];
  if (cleanHrDateKey(extractedKey)) return extractedKey;

  const fallbackDate = toHrDate(
    boundary === 'start' ? periodLike.startDate : periodLike.endDate,
  );
  return fallbackDate ? getUtcDateKey(fallbackDate) : null;
};

export const formatHrDateKey = (value: unknown): string => {
  const dateKey = cleanHrDateKey(value);
  if (!dateKey) return '-';

  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  return new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(date);
};

export const formatHrPeriodDate = (
  periodLike: Record<string, unknown> | null | undefined,
  boundary: 'start' | 'end',
): string => formatHrDateKey(resolveHrPeriodDateKey(periodLike, boundary));

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
  formatLocaleCurrency(Number.isFinite(amount) ? amount : 0, currency, {
    maximumFractionDigits: 2,
  });
