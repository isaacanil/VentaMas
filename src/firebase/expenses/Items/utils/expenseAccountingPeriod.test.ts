import { describe, expect, it } from 'vitest';

import {
  EXPENSE_CLOSED_PERIOD_MESSAGE,
  resolveExpenseEffectiveDate,
} from './expenseAccountingPeriod';

describe('expenseAccountingPeriod', () => {
  it('uses the expense date as the source period date when available', () => {
    expect(
      resolveExpenseEffectiveDate({
        dates: {
          expenseDate: 1710028800000,
          createdAt: 1709251200000,
        },
        createdAt: 1709164800000,
      }),
    ).toBe(1710028800000);
  });

  it('keeps the user-facing blocked message explicit and non-technical', () => {
    expect(EXPENSE_CLOSED_PERIOD_MESSAGE).toBe(
      'El período seleccionado está cerrado. Usa otra fecha o reabre el período.',
    );
  });
});
