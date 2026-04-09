import type { PaymentMethodCode } from '@/types/payments';
import {
  BANK_PAYMENT_METHOD_CODES,
  isBankPaymentMethodCode,
} from '@/utils/payments/bankPaymentPolicy';

const CASH_PAYMENT_METHOD_CODES = new Set<PaymentMethodCode>(['cash']);
const BANK_PAYMENT_METHOD_CODE_SET = new Set<PaymentMethodCode>(
  BANK_PAYMENT_METHOD_CODES,
);

export const isCashPaymentMethodCode = (value: unknown): boolean =>
  typeof value === 'string' &&
  CASH_PAYMENT_METHOD_CODES.has(value as PaymentMethodCode);

export { isBankPaymentMethodCode };

export const paymentMethodRequiresCashCount = (value: unknown): boolean =>
  isCashPaymentMethodCode(value);

export const paymentMethodRequiresBankAccount = (value: unknown): boolean =>
  typeof value === 'string' &&
  BANK_PAYMENT_METHOD_CODE_SET.has(value as PaymentMethodCode);
