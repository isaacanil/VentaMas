import dayjs from 'dayjs';

import type {
  ServiceCommissionRecord,
  ServiceCommissionSource,
  ServiceCommissionType,
} from '@/types/commissions';
import type { UserIdentity } from '@/types/users';
import { cleanCommissionString } from '@/utils/commissions/serviceCommissions';
import { toMillis as toSharedMillis } from '@/utils/date/toMillis';
import type { TimestampLike } from '@/utils/date/types';
import { formatPriceByCurrency } from '@/utils/format';

export type CollaboratorOption = {
  label: string;
  value: string;
};

export const cleanString = cleanCommissionString;

const toReportMillis = (value: unknown): number | null => {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (typeof value !== 'object') return null;

  const record = value as { toMillis?: () => number };
  if (typeof record.toMillis === 'function') return record.toMillis();

  const millis = toSharedMillis(value as TimestampLike);
  return typeof millis === 'number' ? millis : null;
};

export const formatReportDate = (value: unknown): string => {
  const millis = toReportMillis(value);
  return millis ? dayjs(millis).format('DD/MM/YYYY') : 'N/A';
};

export const toDateKey = (date: Date): string =>
  dayjs(date).format('YYYY-MM-DD');

export const fromDateKey = (
  dateKey: string,
  boundary: 'start' | 'end',
): Date => {
  const value = dayjs(dateKey);
  return boundary === 'start'
    ? value.startOf('day').toDate()
    : value.endOf('day').toDate();
};

export const getBusinessId = (user: UserIdentity | null): string | null =>
  cleanString(user?.businessID) ??
  cleanString(user?.businessId) ??
  cleanString(user?.activeBusinessId);

export const getInvoiceLabel = (row: ServiceCommissionRecord): string =>
  cleanString(row.invoiceNumber) ?? cleanString(row.invoiceId) ?? 'Factura';

export const getServiceLabel = (row: ServiceCommissionRecord): string =>
  cleanString(row.serviceName) ?? cleanString(row.service?.name) ?? 'Servicio';

export const getCollaboratorLabel = (row: ServiceCommissionRecord): string => {
  const code =
    cleanString(row.collaboratorCode) ??
    cleanString(row.collaborator?.code) ??
    null;
  const name = cleanString(row.collaboratorName) ?? null;
  if (code && name) return `${code} - ${name}`;
  return code ?? name ?? 'N/A';
};

export const formatReportMoney = (amount: number): string =>
  formatPriceByCurrency(amount, 'DOP');

const COMMISSION_SOURCE_LABELS: Record<ServiceCommissionSource, string> = {
  'business-default': 'Regla general',
  collaborator: 'Regla del colaborador',
  manual: 'Regla manual',
  service: 'Regla del servicio',
};

const formatRateValue = (
  type: ServiceCommissionType | null | undefined,
  value: number | null | undefined,
): string => {
  const safeValue = Number(value ?? 0);
  if (type === 'fixed') return formatReportMoney(safeValue);
  return `${safeValue}%`;
};

export const getCommissionRateLabel = (
  row: ServiceCommissionRecord,
): string => {
  const type = row.commission?.type;
  const value = row.commission?.rateValue;
  return formatRateValue(type, value);
};

export const getCommissionRuleLabel = (
  row: ServiceCommissionRecord,
): string => {
  const source = row.commission?.source;
  return source ? COMMISSION_SOURCE_LABELS[source] : 'Regla no disponible';
};

export const getCommissionBaseLabel = (
  row: ServiceCommissionRecord,
): string => {
  if (row.commission?.calculationBase === 'netSubtotalWithoutTax') {
    return 'Subtotal sin ITBIS';
  }

  return 'Base comisionable';
};

export const getCommissionFormulaLabel = (
  row: ServiceCommissionRecord,
): string => {
  const baseAmount = Number(row.billedAmount ?? row.amountFactured ?? 0);
  const commissionAmount = Number(row.commissionAmount || 0);
  return `${formatReportMoney(baseAmount)} x ${getCommissionRateLabel(
    row,
  )} = ${formatReportMoney(commissionAmount)}`;
};
