import { describe, expect, it } from 'vitest';

import { parseLocalizedNumber } from './parseLocalizedNumber';

describe('parseLocalizedNumber', () => {
  it('parses mixed decimal and thousands separators', () => {
    expect(parseLocalizedNumber('1,234.56')).toBe(1234.56);
    expect(parseLocalizedNumber('1.234,56')).toBe(1234.56);
  });

  it('strips percent signs when requested', () => {
    expect(parseLocalizedNumber('18%', { stripPercent: true })).toBe(18);
    expect(parseLocalizedNumber('%18', { stripPercent: true })).toBe(18);
  });

  it('strips common currency decorators when requested', () => {
    const options = { stripCurrencySymbols: true };

    expect(parseLocalizedNumber('RD$ 1,234.56', options)).toBe(1234.56);
    expect(parseLocalizedNumber('DOP 1,234.56', options)).toBe(1234.56);
    expect(parseLocalizedNumber('USD 1,234.56', options)).toBe(1234.56);
    expect(parseLocalizedNumber('EUR 1.234,56', options)).toBe(1234.56);
    expect(parseLocalizedNumber('$RD 1,234.56', options)).toBe(1234.56);
  });

  it('parses accounting parentheses as negative values', () => {
    expect(parseLocalizedNumber('(1,234.56)')).toBe(-1234.56);
    expect(parseLocalizedNumber('(1.234,56)')).toBe(-1234.56);
  });

  it('returns null for empty strings and missing values', () => {
    expect(parseLocalizedNumber('')).toBeNull();
    expect(parseLocalizedNumber('   ')).toBeNull();
    expect(parseLocalizedNumber(null)).toBeNull();
    expect(parseLocalizedNumber(undefined)).toBeNull();
  });
});
