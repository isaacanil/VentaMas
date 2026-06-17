import { describe, expect, it } from 'vitest';

import { formatLocaleCurrency } from './currency';

describe('formatLocaleCurrency', () => {
  it('formats locale currency using caller-provided Intl options', () => {
    expect(
      formatLocaleCurrency(1234.5, 'DOP', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    ).toBe('RD$1,234.50');

    expect(
      formatLocaleCurrency(-10, 'USD', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    ).toBe('-US$10.00');
  });

  it('leaves invalid amount normalization to callers', () => {
    expect(
      formatLocaleCurrency(Number.NaN, 'DOP', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    ).toBe('RD$NaN');
  });
});
