import { describe, expect, it } from 'vitest';

import { getDiscount } from './pdfDiscount.util.js';

describe('pdfDiscount.util', () => {
  it('returns zero when there are no products or no discount value', () => {
    expect(getDiscount({ discount: { value: 10 }, products: [] })).toBe(0);
    expect(
      getDiscount({
        discount: { value: 0 },
        products: [{ pricing: { price: 100 }, amountToBuy: 2 }],
      }),
    ).toBe(0);
  });

  it('calculates the general percentage discount over product subtotal', () => {
    expect(
      getDiscount({
        discount: { value: 10 },
        products: [
          { pricing: { price: 100 }, amountToBuy: 2 },
          { pricing: { price: 50 }, amountToBuy: 1 },
        ],
      }),
    ).toBe(25);
  });

  it('coerces missing product prices and quantities to zero', () => {
    expect(
      getDiscount({
        discount: { value: 15 },
        products: [
          { pricing: { price: '100' }, amountToBuy: '2' },
          { pricing: {}, amountToBuy: 3 },
          { amountToBuy: 4 },
        ],
      }),
    ).toBe(30);
  });
});
