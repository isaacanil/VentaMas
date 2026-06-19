import { describe, expect, it, vi } from 'vitest';

const { MockHttpsError } = vi.hoisted(() => {
  class HoistedHttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }

  return {
    MockHttpsError: HoistedHttpsError,
  };
});

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
}));

import {
  assertValidRncNumber,
  normalizeRncNumber,
} from './rncInput.util.js';

describe('rncInput.util', () => {
  it('normalizes separators and spaces', () => {
    expect(normalizeRncNumber(' 401-00755-1 ')).toBe('401007551');
  });

  it('accepts exactly 9 or 11 digit values', () => {
    expect(assertValidRncNumber('401007551')).toBe('401007551');
    expect(assertValidRncNumber('00112345678')).toBe('00112345678');
  });

  it('rejects invalid lengths', () => {
    expect(() => assertValidRncNumber('123')).toThrow(
      'El RNC o cedula debe tener exactamente 9 u 11 digitos.',
    );
    expect(() => assertValidRncNumber('1234567890')).toThrow(
      'El RNC o cedula debe tener exactamente 9 u 11 digitos.',
    );
  });
});
