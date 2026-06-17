import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';

import {
  MIN_VALID_TRANSACTION_MILLIS,
  hasValidTransactionDate,
  normalizeTransactionMillis,
  parseTransactionDate,
} from './transactionDates';

describe('transactionDates', () => {
  it('normalizes seconds-like transaction dates to milliseconds', () => {
    expect(normalizeTransactionMillis(946684800)).toBe(
      MIN_VALID_TRANSACTION_MILLIS,
    );
  });

  it('keeps valid millisecond transaction dates', () => {
    expect(normalizeTransactionMillis(MIN_VALID_TRANSACTION_MILLIS)).toBe(
      MIN_VALID_TRANSACTION_MILLIS,
    );
  });

  it('normalizes Firestore-like transaction timestamps', () => {
    expect(
      normalizeTransactionMillis({
        seconds: 946684800,
        nanoseconds: 123000000,
      }),
    ).toBe(MIN_VALID_TRANSACTION_MILLIS + 123);
  });

  it('rejects invalid and pre-2000 transaction dates', () => {
    expect(normalizeTransactionMillis(null)).toBeNull();
    expect(normalizeTransactionMillis(Number.NaN)).toBeNull();
    expect(
      normalizeTransactionMillis(MIN_VALID_TRANSACTION_MILLIS - 1),
    ).toBeNull();
  });

  it('reports whether a value is a valid transaction date', () => {
    expect(hasValidTransactionDate(MIN_VALID_TRANSACTION_MILLIS)).toBe(true);
    expect(hasValidTransactionDate(MIN_VALID_TRANSACTION_MILLIS - 1)).toBe(
      false,
    );
  });

  it('parses normalized values for DatePicker consumers', () => {
    const parsed = parseTransactionDate(MIN_VALID_TRANSACTION_MILLIS);

    expect(parsed?.toMillis()).toBe(MIN_VALID_TRANSACTION_MILLIS);
  });

  it('parses DateTime values for DatePicker consumers', () => {
    const value = DateTime.fromISO('2026-01-15T00:00:00.000Z');

    expect(parseTransactionDate(value)?.toMillis()).toBe(value.toMillis());
  });
});
