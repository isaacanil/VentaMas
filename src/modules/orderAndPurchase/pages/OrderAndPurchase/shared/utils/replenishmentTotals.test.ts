import { describe, expect, it } from 'vitest';

import { calculateReplenishmentTotals } from './replenishmentTotals';

describe('calculateReplenishmentTotals', () => {
  it('aggregates replenishment costs with percent taxes', () => {
    expect(
      calculateReplenishmentTotals([
        {
          purchaseQuantity: 2,
          baseCost: 100,
          taxPercentage: 18,
          freight: 10,
          otherCosts: 5,
        },
        {
          quantity: 3,
          baseCost: 50,
          taxPercentage: 0.1,
        },
      ]),
    ).toEqual({
      totalProducts: 5,
      totalBaseCost: 350,
      totalItbis: 51,
      totalShipping: 10,
      totalOtherCosts: 5,
      grandTotal: 416,
    });
  });

  it('returns zero totals for empty input', () => {
    expect(calculateReplenishmentTotals()).toEqual({
      totalProducts: 0,
      totalBaseCost: 0,
      totalItbis: 0,
      totalShipping: 0,
      totalOtherCosts: 0,
      grandTotal: 0,
    });
  });
});
