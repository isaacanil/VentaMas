import { describe, expect, it } from 'vitest';

import {
  convertInvoiceDateToMillis,
  formatInvoiceDate,
  normalizeInvoiceTimestamp,
  resolveInvoiceDateMillis,
} from './date';

describe('normalizeInvoiceTimestamp', () => {
  it('keeps millisecond timestamps intact', () => {
    expect(normalizeInvoiceTimestamp(1781620000000)).toBe(1781620000000);
  });

  it('normalizes seconds timestamps to milliseconds', () => {
    expect(normalizeInvoiceTimestamp(1781620000)).toBe(1781620000000);
  });

  it('normalizes Firestore timestamp-like values', () => {
    expect(
      normalizeInvoiceTimestamp({ seconds: 1781620000, nanoseconds: 0 }),
    ).toBe(1781620000000);
  });

  it('uses the same semantics for public date adapters', () => {
    expect(resolveInvoiceDateMillis(1781620000)).toBe(1781620000000);
    expect(convertInvoiceDateToMillis(1781620000)).toBe(1781620000000);
  });

  it('formats invoice dates after normalizing unknown inputs', () => {
    expect(formatInvoiceDate({ seconds: 1781620000, nanoseconds: 0 })).toBe(
      '16/06/2026',
    );
    expect(formatInvoiceDate(null)).toBe('');
  });
});
