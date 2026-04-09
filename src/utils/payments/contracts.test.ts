import { describe, expect, it } from 'vitest';

import {
  isCanonicalPaymentMethodCode,
  normalizePaymentMethodCode,
} from '@/utils/payments/contracts';

describe('payment contracts', () => {
  it('normaliza aliases legacy al metodo canonico', () => {
    expect(normalizePaymentMethodCode('credit_card')).toBe('card');
    expect(normalizePaymentMethodCode('bank_transfer')).toBe('transfer');
    expect(normalizePaymentMethodCode('credit_note')).toBe('creditNote');
    expect(normalizePaymentMethodCode('open_cash')).toBe('cash');
  });

  it('mantiene el canonico cuando ya viene limpio', () => {
    expect(normalizePaymentMethodCode('card')).toBe('card');
    expect(isCanonicalPaymentMethodCode('card')).toBe(true);
    expect(isCanonicalPaymentMethodCode('credit_card')).toBe(false);
  });
});
