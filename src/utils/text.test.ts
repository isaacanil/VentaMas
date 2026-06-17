import { describe, expect, it } from 'vitest';

import {
  cleanString,
  normalizeText,
  stripDiacritics,
  toCleanString,
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
});
