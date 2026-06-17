import { describe, expect, it } from 'vitest';

import {
  formatAppVersionBadgeLabel,
  formatClientAppVersionDate,
} from './appVersionDates';

describe('appVersionDates', () => {
  it('formats the home badge label from a Firestore timestamp', () => {
    const localDate = new Date(2026, 0, 5, 9, 30, 0);
    const timestamp = { seconds: localDate.getTime() / 1000 };

    expect(formatAppVersionBadgeLabel(timestamp)).toBe(
      'Versión 05 de Enero 2026',
    );
  });

  it('keeps the home badge empty fallback for missing or invalid values', () => {
    expect(formatAppVersionBadgeLabel(null)).toBe('');
    expect(formatAppVersionBadgeLabel(undefined)).toBe('');
    expect(formatAppVersionBadgeLabel({})).toBe('');
  });

  it('formats the client build date as an ISO string', () => {
    const isoDate = '2026-06-15T10:30:45.123Z';
    const timestamp = { toMillis: () => Date.parse(isoDate) };

    expect(formatClientAppVersionDate(timestamp)).toBe(isoDate);
  });

  it('keeps the client build info undefined fallback for missing or invalid values', () => {
    expect(formatClientAppVersionDate(null)).toBeUndefined();
    expect(formatClientAppVersionDate(undefined)).toBeUndefined();
    expect(formatClientAppVersionDate({})).toBeUndefined();
  });
});
