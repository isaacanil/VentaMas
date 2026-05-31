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

export const CASH_PAYMENT_METHOD_CODES = [
  'cash',
] as const satisfies readonly CanonicalPaymentMethodCode[];

export const BANK_PAYMENT_METHOD_CODES = [
  'card',
  'transfer',
] as const satisfies readonly CanonicalPaymentMethodCode[];

export const CREDIT_PAYMENT_METHOD_CODES = [
  'creditNote',
  'supplierCreditNote',
] as const satisfies readonly CanonicalPaymentMethodCode[];

export const CANONICAL_PAYMENT_METHOD_CODES = [
  ...CASH_PAYMENT_METHOD_CODES,
  ...BANK_PAYMENT_METHOD_CODES,
  ...CREDIT_PAYMENT_METHOD_CODES,
] as const satisfies readonly CanonicalPaymentMethodCode[];

export const CANONICAL_PAYMENT_METHOD_CODE_SET =
  new Set<CanonicalPaymentMethodCode>(CANONICAL_PAYMENT_METHOD_CODES);

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
  CANONICAL_PAYMENT_METHOD_CODE_SET.has(value as CanonicalPaymentMethodCode);
