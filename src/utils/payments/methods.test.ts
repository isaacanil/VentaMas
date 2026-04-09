import { describe, expect, it } from 'vitest';

import {
  isCashPaymentMethodCode,
  isBankPaymentMethodCode,
  paymentMethodRequiresBankAccount,
  paymentMethodRequiresCashCount,
} from '@/utils/payments/methods';

describe('payment methods helpers', () => {
  it('detects canonical cash-backed methods', () => {
    expect(isCashPaymentMethodCode('cash')).toBe(true);
    expect(isCashPaymentMethodCode('card')).toBe(false);
    expect(isCashPaymentMethodCode('transfer')).toBe(false);
  });

  it('detects canonical bank-backed methods', () => {
    expect(isBankPaymentMethodCode('card')).toBe(true);
    expect(isBankPaymentMethodCode('transfer')).toBe(true);
    expect(isBankPaymentMethodCode('cash')).toBe(false);
    expect(isBankPaymentMethodCode('creditNote')).toBe(false);
  });

  it('requires cash count only for cash-backed methods', () => {
    expect(paymentMethodRequiresCashCount('cash')).toBe(true);
    expect(paymentMethodRequiresCashCount('transfer')).toBe(false);
    expect(paymentMethodRequiresCashCount('card')).toBe(false);
  });

  it('requires bank account only for bank-backed methods', () => {
    expect(paymentMethodRequiresBankAccount('card')).toBe(true);
    expect(paymentMethodRequiresBankAccount('transfer')).toBe(true);
    expect(paymentMethodRequiresBankAccount('cash')).toBe(false);
  });
});
