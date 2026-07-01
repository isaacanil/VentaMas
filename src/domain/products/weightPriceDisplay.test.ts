import { describe, expect, it } from 'vitest';

import {
  getWeightedUnitPriceForDisplay,
  resolveOperationalUnitPrice,
} from './weightPriceDisplay';

describe('weight price display helpers', () => {
  it('uses list price when the operational price is a stale zero', () => {
    expect(resolveOperationalUnitPrice({ price: 0, listPrice: 15 })).toBe(15);
  });

  it('shows the unit price for weight products without multiplying by average weight', () => {
    expect(
      getWeightedUnitPriceForDisplay({
        pricing: { price: 15, listPrice: 15, tax: 0 },
        weightDetail: {
          isSoldByWeight: true,
          weight: 1.25,
          weightUnit: 'lb',
        },
      }),
    ).toBe(15);
  });

  it('applies unit tax and promotion discount for display parity', () => {
    expect(
      getWeightedUnitPriceForDisplay({
        pricing: { price: 100, tax: 18 },
        promotion: { discount: 10 },
      }),
    ).toBe(108);
  });
});
