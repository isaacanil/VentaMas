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
    case 'bank_statement_adjustment':
      return 'Ajuste diferencia banco';
    case 'opening_balance':
      return 'Balance inicial';
    case 'manual_adjustment':
      return 'Ajuste manual';
    case 'invoice_pos':
      return 'Venta POS';
    case 'receivable_payment':
      return 'Cobro CxC';
    case 'receivable_payment_void':
      return 'Reverso cobro CxC';
    case 'supplier_payment':
      return 'Pago suplidor';
    case 'expense':
      return 'Gasto';
    case 'credit_note_application':
      return 'Nota de crédito';
    case 'cash_adjustment':
      return 'Ajuste de caja';
    default:
      return value.replaceAll('_', ' ');
  }
};
