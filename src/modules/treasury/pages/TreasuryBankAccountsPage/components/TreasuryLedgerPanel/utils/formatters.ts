export { formatDate, formatMoney } from '@/modules/treasury/utils/formatters';

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
    case 'supplier_payment_void':
      return 'Reverso pago suplidor';
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
