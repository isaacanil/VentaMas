import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../core/config/firebase.js', () => {
  class MockTimestamp {
    constructor(seconds, nanoseconds = 0) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }

    static now() {
      return new MockTimestamp(
        Math.floor(Date.parse('2026-03-03T00:00:00.000Z') / 1000),
        0,
      );
    }

    static fromMillis(value) {
      return new MockTimestamp(Math.floor(value / 1000), 0);
    }

    toMillis() {
      return this.seconds * 1000 + Math.floor(this.nanoseconds / 1000000);
    }

    toDate() {
      return new Date(this.toMillis());
    }
  }

  return {
    Timestamp: MockTimestamp,
  };
});

import { Timestamp } from '../../../../core/config/firebase.js';
import { resolveAccountingTimestamp } from './accountingTimestamp.util.js';

describe('accountingTimestamp.util', () => {
  it('preserves Timestamp instances', () => {
    const timestamp = new Timestamp(1772543000, 123000000);

    expect(resolveAccountingTimestamp(timestamp)).toBe(timestamp);
  });

  it('uses the first valid timestamp-like value from varargs', () => {
    const result = resolveAccountingTimestamp(
      null,
      'not-a-date',
      { toMillis: () => Number.NaN },
      '2026-03-03T10:30:00.000Z',
      '2026-04-01T00:00:00.000Z',
    );

    expect(result.toMillis()).toBe(Date.parse('2026-03-03T10:30:00.000Z'));
  });

  it('normalizes toMillis, toDate, Date, non-zero finite number, and string values', () => {
    expect(
      resolveAccountingTimestamp({
        toMillis: () => Date.parse('2026-03-03T10:30:00.000Z'),
      }).toMillis(),
    ).toBe(Date.parse('2026-03-03T10:30:00.000Z'));

    expect(
      resolveAccountingTimestamp({
        toDate: () => new Date('2026-03-04T10:30:00.000Z'),
      }).toMillis(),
    ).toBe(Date.parse('2026-03-04T10:30:00.000Z'));

    expect(
      resolveAccountingTimestamp(new Date('2026-03-05T10:30:00.000Z')).toMillis(),
    ).toBe(Date.parse('2026-03-05T10:30:00.000Z'));
    expect(resolveAccountingTimestamp(1772543000000).toMillis()).toBe(
      1772543000000,
    );
    expect(resolveAccountingTimestamp('2026-03-06T10:30:00.000Z').toMillis()).toBe(
      Date.parse('2026-03-06T10:30:00.000Z'),
    );
  });

  it('normalizes Firestore-like timestamp records', () => {
    expect(
      resolveAccountingTimestamp({
        seconds: 1772543000,
        nanoseconds: 456000000,
      }).toMillis(),
    ).toBe(1772543000456);

    expect(
      resolveAccountingTimestamp({
        _seconds: 1772543000,
        _nanoseconds: 789000000,
      }).toMillis(),
    ).toBe(1772543000789);
  });

  it('skips bare zero and falls back to Timestamp.now when no value is valid', () => {
    expect(
      resolveAccountingTimestamp(
        undefined,
        null,
        0,
        Number.NaN,
        'not-a-date',
        { seconds: Number.NaN },
      ).toMillis(),
    ).toBe(Date.parse('2026-03-03T00:00:00.000Z'));
  });
});
