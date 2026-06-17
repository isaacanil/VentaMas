import { describe, expect, it } from 'vitest';

import { formatNumber } from './formatNumber';

describe('formatNumber legacy utility', () => {
  it('keeps the legacy empty fallback for blank and invalid string values', () => {
    expect(formatNumber(null)).toBe('');
    expect(formatNumber(undefined)).toBe('');
    expect(formatNumber('')).toBe('');
    expect(formatNumber('not-a-number')).toBe('');
  });

  it('formats parsed numbers with the shared count formatter output', () => {
    expect(formatNumber('1,234.567')).toBe('1,234.57');
    expect(formatNumber(1234)).toBe('1,234');
    expect(formatNumber(-10.5)).toBe('-10.5');
  });

  it('preserves non-finite number display from Intl formatting', () => {
    expect(formatNumber(Number.NaN)).toBe('NaN');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('∞');
  });
});
