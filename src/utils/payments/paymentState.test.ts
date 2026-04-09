import { describe, expect, it } from 'vitest';

import {
  buildPaymentState,
  isSettledPaymentStateStatus,
  resolvePaymentStateStatus,
} from '@/utils/payments/paymentState';

describe('resolvePaymentStateStatus', () => {
  it('marks fully covered balances as paid', () => {
    expect(
      resolvePaymentStateStatus({
        total: 100,
        paid: 100,
        balance: 0,
      }),
    ).toBe('paid');
  });

  it('marks partial balances correctly', () => {
    expect(
      resolvePaymentStateStatus({
        total: 100,
        paid: 25,
        balance: 75,
      }),
    ).toBe('partial');
  });

  it('detects overpayments when paid exceeds total materially', () => {
    expect(
      resolvePaymentStateStatus({
        total: 100,
        paid: 110,
        balance: 0,
      }),
    ).toBe('overpaid');
  });
});


describe('isSettledPaymentStateStatus', () => {
  it('treats paid and overpaid statuses as settled', () => {
    expect(isSettledPaymentStateStatus('paid')).toBe(true);
    expect(isSettledPaymentStateStatus('overpaid')).toBe(true);
    expect(isSettledPaymentStateStatus('partial')).toBe(false);
    expect(isSettledPaymentStateStatus('unpaid')).toBe(false);
  });
});
describe('buildPaymentState', () => {
  it('derives the balance when it is omitted', () => {
    const state = buildPaymentState({
      total: 200,
      paid: 50,
    });

    expect(state).toEqual({
      status: 'partial',
      total: 200,
      paid: 50,
      balance: 150,
      lastPaymentAt: null,
      nextPaymentAt: null,
      lastPaymentId: null,
    });
    expect(state).not.toHaveProperty('paymentCount');
    expect(state).not.toHaveProperty('requiresReview');
    expect(state).not.toHaveProperty('migratedFromLegacy');
  });
});
