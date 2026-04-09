import { describe, expect, it } from 'vitest';

import type { Purchase } from '@/utils/purchase/types';

import {
  hasOpenAccountsPayableBalance,
  isAccountsPayablePurchase,
} from './accountsPayable';

describe('accountsPayable', () => {
  it('includes completed purchases with open balance', () => {
    const purchase = {
      status: 'completed',
      paymentState: {
        status: 'partial',
        total: 1000,
        paid: 250,
        balance: 750,
      },
    } as Purchase;

    expect(hasOpenAccountsPayableBalance(purchase)).toBe(true);
    expect(isAccountsPayablePurchase(purchase)).toBe(true);
  });

  it('excludes settled purchases', () => {
    const purchase = {
      status: 'completed',
      paymentState: {
        status: 'paid',
        total: 1000,
        paid: 1000,
        balance: 0,
      },
    } as Purchase;

    expect(hasOpenAccountsPayableBalance(purchase)).toBe(false);
    expect(isAccountsPayablePurchase(purchase)).toBe(false);
  });

  it('excludes purchases that are not completed', () => {
    const purchase = {
      status: 'pending',
      paymentState: {
        status: 'unpaid',
        total: 1000,
        paid: 0,
        balance: 1000,
      },
    } as Purchase;

    expect(isAccountsPayablePurchase(purchase)).toBe(false);
  });
});
