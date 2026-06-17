import { describe, expect, it } from 'vitest';

import { asRecord, isRecord } from './record';

describe('record utilities', () => {
  it('accepts non-array objects as records', () => {
    const value = { id: 'business-1' };

    expect(isRecord(value)).toBe(true);
    expect(asRecord(value)).toBe(value);
  });

  it('rejects null, primitives, and arrays', () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord('value')).toBe(false);
    expect(isRecord([])).toBe(false);

    expect(asRecord(null)).toEqual({});
    expect(asRecord('value')).toEqual({});
    expect(asRecord([])).toEqual({});
  });
});
