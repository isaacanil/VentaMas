import { describe, expect, it } from 'vitest';

import { compareByCreatedAt, sortByCreatedAt } from './sortByCreatedAt';

describe('sortByCreatedAt', () => {
  it('sorts Date, Timestamp-like, and serialized Timestamp values without changing the API', () => {
    const date = new Date('2026-06-15T10:00:00.000Z');
    const timestampMillis = Date.UTC(2026, 5, 15, 12, 0, 0, 250);
    const serializedMillis = Date.UTC(2026, 5, 15, 13, 0, 0, 557);
    const items = [
      { id: 'iso', createdAt: '2026-06-15T11:00:00.000Z' },
      { id: 'date', createdAt: date },
      { id: 'timestamp', createdAt: { toMillis: () => timestampMillis } },
      {
        id: 'serialized',
        createdAt: {
          _seconds: Math.floor(serializedMillis / 1000),
          _nanoseconds: (serializedMillis % 1000) * 1e6,
        },
      },
    ];

    expect(sortByCreatedAt(items, true)?.map((item) => item.id)).toEqual([
      'date',
      'iso',
      'timestamp',
      'serialized',
    ]);

    expect(sortByCreatedAt(items, false)?.map((item) => item.id)).toEqual([
      'serialized',
      'timestamp',
      'iso',
      'date',
    ]);
  });

  it('keeps nullish or empty inputs unchanged', () => {
    expect(sortByCreatedAt(null, true)).toBeNull();
    expect(sortByCreatedAt(undefined, true)).toBeUndefined();

    const empty: readonly { createdAt?: string }[] = [];
    expect(sortByCreatedAt(empty, true)).toBe(empty);
  });

  it('compares missing or invalid createdAt values as zero', () => {
    expect(
      compareByCreatedAt(
        { createdAt: null },
        { createdAt: '2026-06-15T00:00:00.000Z' },
        true,
      ),
    ).toBeLessThan(0);

    expect(
      compareByCreatedAt(
        { createdAt: 'invalid-date' },
        { createdAt: { seconds: 1, nanoseconds: 500000000 } },
        true,
      ),
    ).toBeLessThan(0);
  });
});
