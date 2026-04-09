import { describe, expect, it } from 'vitest';

import {
  getChange,
  getProductsIndividualDiscounts,
  getProductsTax,
  getProductsTotalPrice,
  getTotal,
  getTotalItems,
  getTotalPrice,
  resetAmountToBuyForProduct,
} from './pricing';

describe('pricing', () => {
  it('calculates totals for products with fixed and percentage discounts', () => {
    expect(
      getTotal({
        amountToBuy: 2,
        pricing: { price: 100, tax: 18 },
        discount: { type: 'percentage', value: 10 },
      }),
    ).toBe(180);

    expect(
      getTotal({
        amountToBuy: 1,
        pricing: { price: 100, tax: 18 },
        discount: { type: 'amount', value: 120 },
      }),
    ).toBe(0);
  });

  it('includes tax and promotion discount in total price', () => {
    const product = {
      amountToBuy: 2,
      promotion: { discount: 5 },
      pricing: {
        price: 100,
        tax: 18,
      },
    };

    expect(getTotalPrice(product)).toBe(226);
    expect(getProductsTax([product])).toBe(36);
  });

  it('supports weighted products and aggregates item counts separately', () => {
    const weightedProduct = {
      amountToBuy: 4,
      weightDetail: {
        isSoldByWeight: true,
        weight: 1.5,
      },
      pricing: {
        price: 200,
        tax: 18,
      },
    };

    expect(getTotalPrice(weightedProduct)).toBe(354);
    expect(getTotalItems([weightedProduct, { amountToBuy: 3 }])).toBe(7);
  });

  it('does not apply general discount when products already have individual discounts', () => {
    const products = [
      {
        amountToBuy: 2,
        pricing: { price: 100, tax: 18 },
        discount: { type: 'percentage', value: 10 },
      },
    ];

    expect(getProductsIndividualDiscounts(products)).toBe(20);
    expect(getProductsTotalPrice(products, 15, 10)).toBe(222.4);
  });

  it('resets the purchase amount without losing other product data', () => {
    expect(
      resetAmountToBuyForProduct({
        id: 'product-1',
        amountToBuy: 5,
        weightDetail: {
          isSoldByWeight: true,
          weight: 3,
        },
      }),
    ).toEqual({
      id: 'product-1',
      amountToBuy: 1,
      weightDetail: {
        isSoldByWeight: true,
        weight: 1,
      },
    });
  });

  it('calculates change using the paid amount and total', () => {
    expect(getChange(236, 250)).toBe(14);
  });
});
