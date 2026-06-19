import { describe, expect, it } from 'vitest';

import {
  RncValidationError,
  normalizeRncNumber,
  resolveRncLookupInput,
} from './rncValidation.util.js';

describe('rncValidation.util', () => {
  it('normalizes RNC input with common separators', () => {
    expect(normalizeRncNumber('101-02604-2')).toBe('101026042');
    expect(normalizeRncNumber(' 001 1234567 8 ')).toBe('00112345678');
  });

  it('accepts exactly 9 or 11 digits', () => {
    expect(normalizeRncNumber('101026042')).toBe('101026042');
    expect(normalizeRncNumber('00112345678')).toBe('00112345678');
  });

  it('rejects missing, 10-digit, short, long, and non-digit values', () => {
    expect(() => normalizeRncNumber('')).toThrow(RncValidationError);
    expect(() => normalizeRncNumber('12345678')).toThrow(
      'rnc debe tener exactamente 9 u 11 digitos.',
    );
    expect(() => normalizeRncNumber('1234567890')).toThrow(
      'rnc debe tener exactamente 9 u 11 digitos.',
    );
    expect(() => normalizeRncNumber('123456789012')).toThrow(
      'rnc debe tener exactamente 9 u 11 digitos.',
    );
    expect(() => normalizeRncNumber('101-02604-X')).toThrow(
      'rnc debe contener solo digitos, espacios o guiones.',
    );
    expect(() => resolveRncLookupInput(101026042)).toThrow(
      'rnc es requerido.',
    );
  });

  it('resolves supported callable payload field names', () => {
    expect(resolveRncLookupInput({ rncNumber: '101026042' })).toEqual({
      rnc: '101026042',
    });
    expect(resolveRncLookupInput({ rnc_number: '00112345678' })).toEqual({
      rnc: '00112345678',
    });
    expect(resolveRncLookupInput('101026042')).toEqual({
      rnc: '101026042',
    });
  });
});
