import { describe, expect, it } from 'vitest';

import {
  normalizeFilterArrayForExactComparison,
  normalizeFilterArrayForSortedComparison,
} from './filterValues';

describe('filterValues', () => {
  describe('normalizeFilterArrayForExactComparison', () => {
    it('preserves array values for ordered comparisons', () => {
      const value = ['warehouse-b', 'warehouse-a'];

      expect(normalizeFilterArrayForExactComparison(value)).toBe(value);
    });

    it('keeps nullish values empty and wraps scalar values', () => {
      expect(normalizeFilterArrayForExactComparison(null)).toEqual([]);
      expect(normalizeFilterArrayForExactComparison(undefined)).toEqual([]);
      expect(normalizeFilterArrayForExactComparison('warehouse-a')).toEqual([
        'warehouse-a',
      ]);
    });
  });

  describe('normalizeFilterArrayForSortedComparison', () => {
    it('returns a sorted copy for unordered default comparisons', () => {
      const value = ['warehouse-b', 'warehouse-a'];

      expect(normalizeFilterArrayForSortedComparison(value)).toEqual([
        'warehouse-a',
        'warehouse-b',
      ]);
      expect(value).toEqual(['warehouse-b', 'warehouse-a']);
    });

    it('keeps non-array values empty', () => {
      expect(normalizeFilterArrayForSortedComparison()).toEqual([]);
      expect(normalizeFilterArrayForSortedComparison(null)).toEqual([]);
      expect(normalizeFilterArrayForSortedComparison('warehouse-a')).toEqual(
        [],
      );
    });
  });
});
