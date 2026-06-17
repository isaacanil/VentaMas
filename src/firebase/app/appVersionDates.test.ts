import { describe, expect, it } from 'vitest';

import { formatClientAppVersionDate } from './appVersionDates';

describe('appVersionDates', () => {
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
