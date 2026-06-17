import { describe, expect, it } from 'vitest';

import { getSalesForCurrentDay } from './sales';

describe('HomeScreenContent sales utils', () => {
  it('sums nested and root transaction totals', () => {
    expect(
      getSalesForCurrentDay([
        { data: { totalPurchase: { value: 125 } } },
        { totalPurchase: { value: 75 } },
        { data: { totalPurchase: 50 } },
      ]).salesForCurrentDay,
    ).toBe(250);
  });

  it('supports numeric strings and ignores empty values', () => {
    expect(
      getSalesForCurrentDay([
        { data: { totalPurchase: { value: '12.5' } } },
        { totalPurchase: '' },
        { data: { totalPurchase: null } },
        {},
      ]).salesForCurrentDay,
    ).toBe(12.5);
  });

  it('returns zero totals for an empty list', () => {
    expect(getSalesForCurrentDay()).toEqual({
      salesForCurrentDay: 0,
      growthPercentage: 0,
    });
  });
});
