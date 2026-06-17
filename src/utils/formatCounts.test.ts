import { describe, expect, it } from 'vitest';

import {
  DEFAULT_COUNT_LOCALE,
  formatCount,
  formatCountValue,
  formatNullableCountValue,
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

describe('formatNullableCountValue', () => {
  it('keeps the legacy empty fallback for blank and invalid string values', () => {
    expect(formatNullableCountValue(null)).toBe('');
    expect(formatNullableCountValue(undefined)).toBe('');
    expect(formatNullableCountValue('')).toBe('');
    expect(formatNullableCountValue('not-a-number')).toBe('');
  });

  it('formats parsed numbers with the shared count formatter output', () => {
    expect(formatNullableCountValue('1,234.567')).toBe('1,234.57');
    expect(formatNullableCountValue(1234)).toBe('1,234');
    expect(formatNullableCountValue(-10.5)).toBe('-10.5');
  });

  it('preserves non-finite number display from Intl formatting', () => {
    expect(formatNullableCountValue(Number.NaN)).toBe('NaN');
    expect(formatNullableCountValue(Number.POSITIVE_INFINITY)).toBe('∞');
  });
});
