import { describe, expect, it } from 'vitest';

import {
  cleanString,
  dedupeStrings,
  normalizeText,
  stripDiacritics,
  toCleanString,
  toCleanStringArray,
} from './text';

describe('text utilities', () => {
  it('strips diacritics without lowercasing or trimming', () => {
    expect(stripDiacritics(' ÁÉÍÓÚ Ñandú ')).toBe(' AEIOU Nandu ');
  });

  it('keeps normalizeText accent-insensitive and lowercase', () => {
    expect(normalizeText('Configuración Tesorería ÁÉÍÓÚ')).toBe(
      'configuracion tesoreria aeiou',
    );
  });

  it('cleans optional strings into trimmed values or null', () => {
    expect(toCleanString('  negocio-1  ')).toBe('negocio-1');
    expect(toCleanString('')).toBeNull();
    expect(toCleanString('   ')).toBeNull();
    expect(toCleanString(null)).toBeNull();
    expect(toCleanString(undefined)).toBeNull();
  });

  it('keeps cleanString as an alias for toCleanString', () => {
    expect(cleanString('  e32  ')).toBe('e32');
    expect(cleanString('  ')).toBeNull();
  });

  it('normalizes arrays into clean string values', () => {
    expect(toCleanStringArray([' owner-1 ', '', null, 'owner-2'])).toEqual([
      'owner-1',
      'owner-2',
    ]);
    expect(toCleanStringArray('owner-1')).toEqual([]);
  });

  it('dedupes optional strings while preserving first-seen order', () => {
    expect(dedupeStrings(['owner-1', null, 'owner-2', 'owner-1'])).toEqual([
      'owner-1',
      'owner-2',
    ]);
  });
});
