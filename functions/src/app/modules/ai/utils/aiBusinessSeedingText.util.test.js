import { describe, expect, it } from 'vitest';

import {
  normalizeAiBusinessSeedingText,
  readAiBusinessSeedingString,
} from './aiBusinessSeedingText.util.js';

describe('aiBusinessSeedingText utils', () => {
  it('returns trimmed strings for non-empty string input', () => {
    expect(readAiBusinessSeedingString('  Colmado La Fe  ')).toBe(
      'Colmado La Fe',
    );
  });

  it('preserves the existing empty-string fallback for blank and non-string input', () => {
    expect(readAiBusinessSeedingString('   ')).toBe('');
    expect(readAiBusinessSeedingString(null)).toBe('');
    expect(readAiBusinessSeedingString(undefined)).toBe('');
    expect(readAiBusinessSeedingString(42)).toBe('');
    expect(readAiBusinessSeedingString({ text: 'ignored' })).toBe('');
  });

  it('normalizes accents, casing and repeated spaces for prompt matching', () => {
    expect(normalizeAiBusinessSeedingText('  Dueño   de Farmacía  ')).toBe(
      'dueno de farmacia',
    );
  });
});
