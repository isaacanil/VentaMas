import { describe, expect, it } from 'vitest';

import { toCleanString } from './string.util.js';

describe('string.util', () => {
  describe('toCleanString', () => {
    it('trims non-empty strings', () => {
      expect(toCleanString(' user-1 ')).toBe('user-1');
    });

    it('returns null for blank strings', () => {
      expect(toCleanString('')).toBeNull();
      expect(toCleanString('   ')).toBeNull();
    });

    it('returns null for non-string values', () => {
      expect(toCleanString(123)).toBeNull();
      expect(toCleanString(false)).toBeNull();
      expect(toCleanString(null)).toBeNull();
      expect(toCleanString(undefined)).toBeNull();
      expect(toCleanString({ value: 'user-1' })).toBeNull();
    });
  });
});
