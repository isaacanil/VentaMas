import type {
  CanonicalPaymentMethodCode,
  PaymentMethodCode,
} from '@/types/payments';

export const PAYMENT_METHOD_ALIASES: Record<
  string,
  CanonicalPaymentMethodCode
> = {
  cash: 'cash',
  open_cash: 'cash',
  card: 'card',
  credit_card: 'card',
  debit_card: 'card',
  transfer: 'transfer',
  bank_transfer: 'transfer',
  check: 'transfer',
  creditnote: 'creditNote',
  credit_note: 'creditNote',
  creditNote: 'creditNote',
  suppliercreditnote: 'supplierCreditNote',
  supplier_credit_note: 'supplierCreditNote',
  supplier_creditnote: 'supplierCreditNote',
  suppliercredit: 'supplierCreditNote',
  supplier_credit: 'supplierCreditNote',
  supplierCreditNote: 'supplierCreditNote',
};

export const CANONICAL_PAYMENT_METHOD_CODES: CanonicalPaymentMethodCode[] = [
  'cash',
  'card',
  'transfer',
  'creditNote',
  'supplierCreditNote',
];

export const normalizePaymentMethodCode = (
  value: unknown,
): PaymentMethodCode | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.length) return null;
  const normalized = trimmed.toLowerCase();
  return PAYMENT_METHOD_ALIASES[normalized] ?? trimmed;
};

export const isCanonicalPaymentMethodCode = (
  value: unknown,
): value is CanonicalPaymentMethodCode =>
  typeof value === 'string' &&
  CANONICAL_PAYMENT_METHOD_CODES.includes(value as CanonicalPaymentMethodCode);
