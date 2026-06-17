import { DateTime } from 'luxon';

import { toMillis } from '@/utils/firebase/toTimestamp';
import { formatLocaleCurrency } from '@/utils/format/currency';

export const formatMoney = (amount: number, currency: string) =>
  formatLocaleCurrency(amount, currency, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const formatDate = (value: unknown) => {
  const millis = toMillis(value as never);
  if (!millis) return 'Sin fecha';
  return DateTime.fromMillis(millis).setLocale('es').toFormat('dd/MM/yyyy');
};

export const formatDateOnly = (value: unknown) => {
  const millis = toMillis(value as never);
  return millis ? DateTime.fromMillis(millis).toFormat('yyyy-MM-dd') : '—';
};

export const formatDateTimeIso = (value: unknown) => {
  const millis = toMillis(value as never);
  if (millis == null) return '';
  return new Date(millis).toISOString();
};
