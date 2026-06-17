import { describe, expect, it } from 'vitest';

import { readAiCallableObject } from './aiCallablePayload.util.js';

describe('aiCallablePayload utils', () => {
  it('returns object inputs without cloning them', () => {
    const value = { draftInput: { idea: 'Colmado La Fe' } };

    expect(readAiCallableObject(value)).toBe(value);
  });

  it('keeps the existing empty-object fallback for arrays and non-objects', () => {
    expect(readAiCallableObject([])).toEqual({});
    expect(readAiCallableObject(null)).toEqual({});
    expect(readAiCallableObject(undefined)).toEqual({});
    expect(readAiCallableObject('payload')).toEqual({});
    expect(readAiCallableObject(42)).toEqual({});
    expect(readAiCallableObject(true)).toEqual({});
  });
});
