import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../core/config/firebase.js', () => ({
  Timestamp: class MockTimestamp {
    constructor(millis) {
      this.millis = millis;
    }

    static fromMillis(millis) {
      return new MockTimestamp(millis);
    }

    toMillis() {
      return this.millis;
    }
  },
}));

import {
  sanitizeForResponse,
  timestampFromMillis,
  toMillis,
} from './treasuryTimestamp.util.js';

describe('treasuryTimestamp.util', () => {
  it('normalizes timestamp-like values to milliseconds', () => {
    expect(toMillis(1000)).toBe(1000);
    expect(toMillis(Number.NaN)).toBeNull();
    expect(toMillis({ toMillis: () => 2000 })).toBe(2000);
    expect(toMillis({ toMillis: () => Number.NaN })).toBeNull();
    expect(toMillis('2026-04-12T00:00:00.000Z')).toBe(
      Date.parse('2026-04-12T00:00:00.000Z'),
    );
    expect(toMillis('not-a-date')).toBeNull();
    expect(toMillis(null)).toBeNull();
  });

  it('builds timestamps from milliseconds', () => {
    expect(timestampFromMillis(1234).toMillis()).toBe(1234);
  });

  it('serializes timestamps recursively and drops undefined fields', () => {
    expect(
      sanitizeForResponse({
        occurredAt: timestampFromMillis(1000),
        importedAt: {
          seconds: 2,
          nanoseconds: 345000000,
        },
        nested: {
          omitted: undefined,
          values: [timestampFromMillis(2000), null, 'ok'],
        },
      }),
    ).toEqual({
      occurredAt: 1000,
      importedAt: 2345,
      nested: {
        values: [2000, null, 'ok'],
      },
    });
  });
});
