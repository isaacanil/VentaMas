import type { HrPaymentMethod } from '@/types/hrPayroll';

export const PAYMENT_METHOD_OPTIONS: Array<{
  label: string;
  value: HrPaymentMethod;
}> = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'bank_transfer', label: 'Transferencia' },
  { value: 'check', label: 'Cheque' },
  { value: 'other', label: 'Otro' },
];

export const normalizePaymentMethod = (
  value?: HrPaymentMethod | null,
): HrPaymentMethod => {
  if (value === 'cash' || value === 'bank_transfer' || value === 'check') {
    return value;
  }
  if (value === 'transfer') return 'bank_transfer';
  return 'bank_transfer';
};
