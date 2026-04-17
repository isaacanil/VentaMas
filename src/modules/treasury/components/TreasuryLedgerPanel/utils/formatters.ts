import { DateTime } from 'luxon';

import { toMillis } from '@/utils/firebase/toTimestamp';

export const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export const formatDate = (value: unknown) => {
  const millis = toMillis(value as never);
  if (!millis) return 'Sin fecha';
  return DateTime.fromMillis(millis).setLocale('es').toFormat('dd/MM/yyyy');
};

export const humanizeSourceType = (value: string) => {
  switch (value) {
    case 'internal_transfer':
      return 'Transferencia interna';
    case 'bank_reconciliation':
      return 'Conciliación bancaria';
    case 'opening_balance':
      return 'Balance inicial';
    case 'manual_adjustment':
      return 'Ajuste manual';
    default:
      return value.replaceAll('_', ' ');
  }
};
