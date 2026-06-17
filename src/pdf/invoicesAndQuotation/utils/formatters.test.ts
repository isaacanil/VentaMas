import { describe, expect, it } from 'vitest';

import {
  getDiscount,
  getProductIndividualDiscount,
  getProductsIndividualDiscounts,
  hasIndividualDiscounts,
} from './formatters';

describe('invoices and quotations PDF formatters', () => {
  it('calculates a general percentage discount from product subtotals', () => {
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

  it('returns zero for general discounts without products or values', () => {
    const products = [{ pricing: { price: 100 }, amountToBuy: 2 }];

    expect(getDiscount(null)).toBe(0);
    expect(getDiscount(undefined)).toBe(0);
    expect(getDiscount({ discount: { value: 10 }, products: [] })).toBe(0);
    expect(getDiscount({ discount: { value: null }, products })).toBe(0);
    expect(getDiscount({ discount: { value: undefined }, products })).toBe(0);
  });

  it('calculates percentage and fixed individual product discounts', () => {
    expect(
      getProductIndividualDiscount({
        pricing: { price: 100 },
        amountToBuy: 3,
        discount: { type: 'percentage', value: 10 },
      }),
    ).toBe(30);

    expect(
      getProductIndividualDiscount({
        pricing: { price: 100 },
        amountToBuy: 3,
        discount: { type: 'fixed', value: 500 },
      }),
    ).toBe(300);
  });

  it('aggregates individual discounts and detects whether they exist', () => {
    const products = [
      {
        pricing: { price: 100 },
        amountToBuy: 2,
        discount: { type: 'percentage', value: 10 },
      },
      {
        pricing: { price: 50 },
        amountToBuy: 1,
        discount: { type: 'fixed', value: 15 },
      },
      { pricing: { price: 25 }, amountToBuy: 2 },
    ];

    expect(getProductsIndividualDiscounts(products)).toBe(35);
    expect(hasIndividualDiscounts(products)).toBe(true);
  });

  it('treats empty products and nullish individual discount values as no discount', () => {
    expect(getProductsIndividualDiscounts([])).toBe(0);
    expect(getProductsIndividualDiscounts(null)).toBe(0);
    expect(getProductsIndividualDiscounts(undefined)).toBe(0);
    expect(hasIndividualDiscounts([])).toBe(false);
    expect(hasIndividualDiscounts(null)).toBe(false);
    expect(hasIndividualDiscounts(undefined)).toBe(false);
    expect(getProductIndividualDiscount(null)).toBe(0);
    expect(getProductIndividualDiscount(undefined)).toBe(0);
    expect(
      getProductIndividualDiscount({
        pricing: { price: 100 },
        amountToBuy: 2,
        discount: { type: 'percentage', value: undefined },
      }),
    ).toBe(0);
    expect(
      getProductIndividualDiscount({
        pricing: { price: 100 },
        amountToBuy: 2,
        discount: { type: 'fixed', value: null },
      }),
    ).toBe(0);
  });
});
