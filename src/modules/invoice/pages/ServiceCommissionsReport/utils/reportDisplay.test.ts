import { describe, expect, it } from 'vitest';

import { formatReportDate } from './reportDisplay';

describe('formatReportDate', () => {
  it('formats supported report date inputs', () => {
    const reportDate = new Date(2026, 5, 2, 10, 0, 0);

    expect(formatReportDate(reportDate)).toBe('02/06/2026');
    expect(formatReportDate(reportDate.toISOString())).toBe('02/06/2026');
    expect(
      formatReportDate({ seconds: Math.floor(reportDate.getTime() / 1000) }),
    ).toBe('02/06/2026');
  });

  it('keeps report toMillis precedence over toDate fallback', () => {
    const reportDate = new Date(2026, 5, 2, 10, 0, 0);
    const fallbackDate = new Date(2026, 4, 1, 10, 0, 0);

    expect(
      formatReportDate({
        toDate: () => fallbackDate,
        toMillis: () => reportDate.getTime(),
      }),
    ).toBe('02/06/2026');
  });

  it('returns N/A for missing or invalid report dates', () => {
    expect(formatReportDate(null)).toBe('N/A');
    expect(formatReportDate(undefined)).toBe('N/A');
    expect(formatReportDate('not-a-date')).toBe('N/A');
  });
});
