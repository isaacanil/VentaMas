import { describe, expect, it, vi } from 'vitest';

const { MockTimestamp } = vi.hoisted(() => ({
  MockTimestamp: class {
    constructor(millis) {
      this.millis = millis;
    }

    toMillis() {
      return this.millis;
    }
  },
}));

vi.mock('../config/firebase.js', () => ({
  Timestamp: MockTimestamp,
}));

import { sanitizeForResponse } from './responseSerialization.util.js';

describe('responseSerialization.util', () => {
  it('converts Timestamp and timestamp-like values to epoch millis recursively', () => {
    expect(
      sanitizeForResponse({
        createdAt: new MockTimestamp(1776080400000),
        projectedAt: {
          toMillis: () => 1776080430000,
        },
        entries: [
          {
            paidAt: new MockTimestamp(1776080460000),
          },
        ],
      }),
    ).toEqual({
      createdAt: 1776080400000,
      projectedAt: 1776080430000,
      entries: [
        {
          paidAt: 1776080460000,
        },
      ],
    });
  });

  it('converts plain Firestore timestamp objects to epoch millis', () => {
    expect(
      sanitizeForResponse({
        createdAt: {
          seconds: 1776080400,
          nanoseconds: 456000000,
        },
        updatedAt: {
          _seconds: 1776080401,
          _nanoseconds: 123456789,
        },
      }),
    ).toEqual({
      createdAt: 1776080400456,
      updatedAt: 1776080401123,
    });
  });

  it('preserves timestamp-like objects when toMillis returns a non-finite value', () => {
    const timestampLike = {
      id: 'invalid-timestamp',
      toMillis: () => Number.NaN,
    };

    const result = sanitizeForResponse({ timestampLike });

    expect(result.timestampLike).toBe(timestampLike);
  });

  it('omits undefined object properties and preserves array positions', () => {
    expect(
      sanitizeForResponse({
        present: 'value',
        omitted: undefined,
        nested: {
          keep: null,
          omit: undefined,
        },
        list: [undefined, { kept: true, omitted: undefined }],
      }),
    ).toEqual({
      present: 'value',
      nested: {
        keep: null,
      },
      list: [undefined, { kept: true }],
    });
  });

  it('leaves primitives and null unchanged', () => {
    expect(sanitizeForResponse(null)).toBeNull();
    expect(sanitizeForResponse(undefined)).toBeUndefined();
    expect(sanitizeForResponse('receipt-1')).toBe('receipt-1');
    expect(sanitizeForResponse(100)).toBe(100);
    expect(sanitizeForResponse(false)).toBe(false);
  });
});
