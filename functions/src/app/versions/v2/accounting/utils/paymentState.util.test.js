import { describe, expect, it } from 'vitest';

import {
  applyOverduePaymentState,
  buildPaymentState,
} from './paymentState.util.js';

describe('paymentState.util', () => {
  it('builds a partial payment state from totals', () => {
    const state = buildPaymentState({
      total: 100,
      paid: 40,
      nextPaymentAt: 1_711_000_000_000,
    });

    expect(state).toEqual({
      status: 'partial',
      total: 100,
      paid: 40,
      balance: 60,
      lastPaymentAt: null,
      nextPaymentAt: 1_711_000_000_000,
      lastPaymentId: null,
    });
    expect(state).not.toHaveProperty('paymentCount');
    expect(state).not.toHaveProperty('requiresReview');
    expect(state).not.toHaveProperty('migratedFromLegacy');
  });

  it('marks unpaid balances as overdue when nextPaymentAt is in the past', () => {
    expect(
      applyOverduePaymentState(
        buildPaymentState({
          total: 100,
          paid: 0,
          nextPaymentAt: 1_700_000_000_000,
        }),
        1_800_000_000_000,
      ),
    ).toMatchObject({
      status: 'overdue',
      balance: 100,
    });
  });
});
