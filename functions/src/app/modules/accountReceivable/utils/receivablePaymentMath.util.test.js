import { describe, expect, it } from 'vitest';

import {
  countRemainingReceivableInstallments,
  resolveNextReceivablePaymentAt,
  resolveReceivableAccountBalance,
  resolveReceivableAccountTotal,
  resolveReceivableInstallmentAmount,
  resolveReceivableInstallmentBalance,
  roundReceivableAmount,
  safeReceivableNumber,
} from './receivablePaymentMath.util.js';

describe('receivablePaymentMath.util', () => {
  it('normalizes unsafe values and rounds receivable amounts to cents', () => {
    expect(safeReceivableNumber('bad-value')).toBe(0);
    expect(roundReceivableAmount('10.235')).toBe(10.24);
  });

  it('resolves account totals and balances from payment state before legacy fields', () => {
    const account = {
      totalReceivable: 100,
      arBalance: 75,
      paymentState: {
        total: 120.456,
        balance: 80.234,
      },
    };

    expect(resolveReceivableAccountTotal(account)).toBe(120.46);
    expect(resolveReceivableAccountBalance(account)).toBe(80.23);
  });

  it('resolves installment amount, balance and next active payment date', () => {
    const nextDate = { toMillis: () => 200 };
    const laterDate = { toMillis: () => 300 };
    const installments = [
      { id: 'paid', installmentBalance: 0.01, installmentDate: 100 },
      { id: 'next', installmentBalance: 10.234, installmentDate: nextDate },
      { id: 'later', balance: 5, installmentDate: laterDate },
    ];

    expect(resolveReceivableInstallmentAmount({ amount: 50.235 })).toBe(50.24);
    expect(resolveReceivableInstallmentBalance({ balance: 10.234 })).toBe(10.23);
    expect(countRemainingReceivableInstallments(installments)).toBe(2);
    expect(resolveNextReceivablePaymentAt(installments)).toBe(nextDate);
  });
});
