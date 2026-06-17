import { describe, expect, it } from 'vitest';

import {
  formatDateTime,
  formatInputDate,
  normalizeToDateTime,
  toMillis,
} from './dates';

const buildLocalMillis = () =>
  new Date(2026, 5, 15, 10, 30, 45, 557).getTime();

describe('inventory date helpers', () => {
  it('keeps inventory numeric epochs compatible for seconds and milliseconds', () => {
    const millis = buildLocalMillis() - 557;
    const seconds = millis / 1000;

    expect(toMillis(seconds)).toBe(millis);
    expect(toMillis(millis)).toBe(millis);
    expect(toMillis(String(seconds))).toBe(millis);
    expect(toMillis(String(millis))).toBe(millis);
  });

  it('normalizes Timestamp-like values with public, underscored, and callable shapes', () => {
    const expectedMillis = buildLocalMillis();
    const seconds = Math.floor(expectedMillis / 1000);

    expect(
      toMillis({
        seconds,
        nanoseconds: 557000000,
      }),
    ).toBe(expectedMillis);
    expect(
      toMillis({
        _seconds: seconds,
        _nanoseconds: 557000000,
      }),
    ).toBe(expectedMillis);
    expect(toMillis({ toMillis: () => expectedMillis })).toBe(expectedMillis);
    expect(toMillis({ toDate: () => new Date(expectedMillis) })).toBe(
      expectedMillis,
    );
    expect(formatInputDate({ toMillis: () => expectedMillis })).toBe(
      '2026-06-15',
    );
    expect(formatDateTime({ toMillis: () => expectedMillis })).toBe(
      '15/06/2026 10:30',
    );
  });

  it('returns null or empty labels for invalid date values', () => {
    expect(toMillis(null)).toBeNull();
    expect(toMillis(undefined)).toBeNull();
    expect(toMillis(Number.NaN)).toBeNull();
    expect(toMillis(Number.POSITIVE_INFINITY)).toBeNull();
    expect(toMillis('fecha invalida')).toBeNull();
    expect(toMillis({ toMillis: () => Number.NaN })).toBeNull();
    expect(normalizeToDateTime('fecha invalida')).toBeNull();
    expect(formatInputDate('fecha invalida')).toBe('');
    expect(formatDateTime({ toDate: () => new Date(Number.NaN) })).toBe('');
  });
});
