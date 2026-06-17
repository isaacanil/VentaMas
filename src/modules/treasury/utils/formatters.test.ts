import { describe, expect, it } from 'vitest';

import {
  formatDate,
  formatDateOnly,
  formatDateTimeIso,
  formatMoney,
} from './formatters';

const moneyOptions: Intl.NumberFormatOptions = {
  style: 'currency',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

describe('treasury formatters', () => {
  it('formats money with the treasury currency display', () => {
    expect(formatMoney(1234.5, 'DOP')).toBe(
      new Intl.NumberFormat('es-DO', {
        ...moneyOptions,
        currency: 'DOP',
      }).format(1234.5),
    );
    expect(formatMoney(-10, 'USD')).toBe(
      new Intl.NumberFormat('es-DO', {
        ...moneyOptions,
        currency: 'USD',
      }).format(-10),
    );
  });

  it('formats display dates with the ledger fallback', () => {
    const date = new Date(2026, 3, 18, 12);

    expect(formatDate(date)).toBe('18/04/2026');
    expect(formatDate(null)).toBe('Sin fecha');
    expect(formatDate(0)).toBe('Sin fecha');
  });

  it('formats table dates with the account grid fallback', () => {
    const date = new Date(2026, 3, 18, 12);

    expect(formatDateOnly(date)).toBe('2026-04-18');
    expect(formatDateOnly(null)).toBe('—');
    expect(formatDateOnly(0)).toBe('—');
  });

  it('formats CSV dates as ISO timestamps with an empty fallback', () => {
    expect(formatDateTimeIso(Date.UTC(2026, 3, 18))).toBe(
      '2026-04-18T00:00:00.000Z',
    );
    expect(formatDateTimeIso(null)).toBe('');
    expect(formatDateTimeIso(0)).toBe('1970-01-01T00:00:00.000Z');
  });
});
