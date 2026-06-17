import { describe, expect, it } from 'vitest';

import {
  normalizeChangedProductPricingPatch,
  normalizeProductPricingTax,
  toProductPricingNumber,
} from './pricingForm';

describe('product pricing form helpers', () => {
  it('normalizes numeric form values without throwing on empty or invalid input', () => {
    expect(toProductPricingNumber(42)).toBe(42);
    expect(toProductPricingNumber('12.5')).toBe(12.5);
    expect(toProductPricingNumber('')).toBe(0);
    expect(toProductPricingNumber('abc')).toBe(0);
  });

  it('normalizes pricing tax values from primitive or nested form shapes', () => {
    expect(normalizeProductPricingTax(18)).toBe(18);
    expect(normalizeProductPricingTax('16')).toBe(16);
    expect(normalizeProductPricingTax({ tax: '0' })).toBe(0);
    expect(normalizeProductPricingTax(null)).toBe(0);
  });

  it('normalizes only present keys in partial pricing patches', () => {
    expect(
      normalizeChangedProductPricingPatch({
        tax: '18',
        cost: '25.75',
        listPrice: '40',
      }),
    ).toEqual({
      tax: 18,
      cost: 25.75,
      listPrice: '40',
    });

    expect(normalizeChangedProductPricingPatch({ listPrice: '40' })).toEqual({
      listPrice: '40',
    });
  });
});
