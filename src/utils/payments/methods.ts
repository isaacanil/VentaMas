import type { PaymentMethodCode } from '@/types/payments';
import { isBankPaymentMethodCode } from '@/utils/payments/bankPaymentPolicy';
import {
  BANK_PAYMENT_METHOD_CODES,
  CASH_PAYMENT_METHOD_CODES,
  normalizePaymentMethodCode,
} from '@/utils/payments/contracts';

const CASH_PAYMENT_METHOD_CODE_SET = new Set<PaymentMethodCode>(
  CASH_PAYMENT_METHOD_CODES,
);
const BANK_PAYMENT_METHOD_CODE_SET = new Set<PaymentMethodCode>(
  BANK_PAYMENT_METHOD_CODES,
);

const normalizeKnownPaymentMethodCode = (
  value: unknown,
): PaymentMethodCode | null => normalizePaymentMethodCode(value);

export const isCashPaymentMethodCode = (value: unknown): boolean => {
  const methodCode = normalizeKnownPaymentMethodCode(value);
  return methodCode !== null && CASH_PAYMENT_METHOD_CODE_SET.has(methodCode);
};

export { isBankPaymentMethodCode };

export const paymentMethodRequiresCashCount = (value: unknown): boolean =>
  isCashPaymentMethodCode(value);

export const paymentMethodRequiresBankAccount = (value: unknown): boolean => {
  const methodCode = normalizeKnownPaymentMethodCode(value);
  return methodCode !== null && BANK_PAYMENT_METHOD_CODE_SET.has(methodCode);
};
