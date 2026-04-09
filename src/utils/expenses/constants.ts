import type { ExpensePaymentMethod } from '@/utils/expenses/types';

export interface PaymentMethodOption {
  value: ExpensePaymentMethod;
  label: string;
}

export const EXPENSE_PAYMENT_METHODS: PaymentMethodOption[] = [
  { value: 'open_cash', label: 'Efectivo de Caja Abierta' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'credit_card', label: 'Tarjeta de Crédito' },
  { value: 'check', label: 'Cheque' },
  { value: 'bank_transfer', label: 'Transferencia' },
];
