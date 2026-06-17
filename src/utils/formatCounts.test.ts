import { describe, expect, it } from 'vitest';

import {
  DEFAULT_COUNT_LOCALE,
  formatCount,
  formatCountValue,
} from './formatCounts';

describe('formatCount', () => {
  it('keeps Dominican Spanish count formatting', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(1234)).toBe(
      new Intl.NumberFormat(DEFAULT_COUNT_LOCALE).format(1234),
    );
  });

  it('formats numeric display values with the shared Dominican locale', () => {
    const options = {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    };

    expect(formatCountValue('1234.5', options)).toBe(
      new Intl.NumberFormat(DEFAULT_COUNT_LOCALE, options).format(1234.5),
    );
  });

  it('falls back to zero for invalid display values', () => {
    expect(formatCountValue('not-a-number')).toBe('0');
    expect(formatCountValue(Number.NaN)).toBe('0');
  });
});
