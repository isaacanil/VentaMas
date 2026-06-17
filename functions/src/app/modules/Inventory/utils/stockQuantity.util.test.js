import { describe, expect, it } from 'vitest';

import { normalizePositiveStockQuantity } from './stockQuantity.util.js';

describe('stockQuantity.util', () => {
  it('normalizes stock quantities to positive finite numbers', () => {
    expect(normalizePositiveStockQuantity(5)).toBe(5);
    expect(normalizePositiveStockQuantity('7.5')).toBe(7.5);
    expect(normalizePositiveStockQuantity(0)).toBe(0);
    expect(normalizePositiveStockQuantity(-3)).toBe(0);
    expect(normalizePositiveStockQuantity(Number.NaN)).toBe(0);
    expect(normalizePositiveStockQuantity(Infinity)).toBe(0);
    expect(normalizePositiveStockQuantity(null)).toBe(0);
    expect(normalizePositiveStockQuantity(undefined)).toBe(0);
    expect(normalizePositiveStockQuantity('')).toBe(0);
  });
});
