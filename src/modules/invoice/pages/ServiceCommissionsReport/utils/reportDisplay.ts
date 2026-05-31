import dayjs from 'dayjs';

import type { ServiceCommissionRecord } from '@/types/commissions';
import type { UserIdentity } from '@/types/users';
import { cleanCommissionString } from '@/utils/commissions/serviceCommissions';
import { formatPriceByCurrency } from '@/utils/format';

export type BusinessUser = Record<string, unknown> & {
  id?: string;
  uid?: string;
  number?: number;
};

export type CollaboratorOption = {
  label: string;
  value: string;
};

export const cleanString = cleanCommissionString;

const toMillis = (value: unknown): number | null => {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    const record = value as {
      seconds?: number;
      toDate?: () => Date;
      toMillis?: () => number;
    };
    if (typeof record.toMillis === 'function') return record.toMillis();
    if (typeof record.toDate === 'function') return record.toDate().getTime();
    if (typeof record.seconds === 'number') return record.seconds * 1000;
  }
  return null;
};

export const formatReportDate = (value: unknown): string => {
  const millis = toMillis(value);
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

export const getUserOption = (
  user: BusinessUser,
): CollaboratorOption | null => {
  const id =
    cleanString(user.id) ?? cleanString(user.uid) ?? cleanString(user.number);
  const code =
    cleanString(user.number) ??
    cleanString(user.code) ??
    cleanString(user.employeeCode) ??
    id;
  const name =
    cleanString(user.name) ??
    cleanString(user.displayName) ??
    cleanString(user.fullName) ??
    cleanString(user.email) ??
    code;
  if (!id && !code) return null;
  return {
    value: id ?? code,
    label: name && code && name !== code ? `${code} - ${name}` : (code ?? name),
  };
};

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
