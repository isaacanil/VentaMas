import { describe, expect, it } from 'vitest';

import {
  formatPrice,
  formatPriceByCurrency,
  getPriceSymbolByCurrency,
} from './formatPrice';

describe('formatPrice legacy display contract', () => {
  it('formats the default dollar display with two decimals', () => {
    expect(formatPrice(1234.5)).toBe('$1,234.50');
    expect(formatPrice('001234.5')).toBe('$1,234.50');
  });

  it('formats legacy symbol aliases', () => {
    expect(formatPrice(1234.5, 'rd')).toBe('RD$1,234.50');
    expect(formatPrice(1234.5, 'euro')).toBe('€1,234.50');
    expect(formatPrice(1234.5, 'pound')).toBe('£1,234.50');
    expect(formatPrice(1234.5, '')).toBe('1,234.50');
  });

  it('preserves invalid and missing value fallbacks', () => {
    expect(formatPrice(null)).toBe('$0.00');
    expect(formatPrice(undefined)).toBe('$0');
    expect(formatPrice('not-a-number')).toBe('$0');
  });

  it('formats negatives and rounds through the shared separator helper', () => {
    expect(formatPrice(-10.5)).toBe('$-10.50');
    expect(formatPrice(1.005)).toBe('$1.00');
  });

  it('resolves symbols and formats supported document currencies', () => {
    expect(getPriceSymbolByCurrency('DOP')).toBe('RD$');
    expect(getPriceSymbolByCurrency('USD')).toBe('$');
    expect(getPriceSymbolByCurrency('EUR')).toBe('€');

    expect(formatPriceByCurrency(1234.5, 'DOP')).toBe('RD$1,234.50');
    expect(formatPriceByCurrency(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatPriceByCurrency(1234.5, 'EUR')).toBe('€1,234.50');
  });
});
