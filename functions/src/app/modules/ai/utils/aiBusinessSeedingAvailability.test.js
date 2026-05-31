import { describe, expect, it } from 'vitest';

import {
  chunkAvailabilityValues,
  findFirstMatchingAvailabilityValue,
  normalizeAvailabilityValues,
} from './aiBusinessSeedingAvailability.js';

describe('aiBusinessSeedingAvailability helpers', () => {
  it('normalizes unique values for availability queries', () => {
    expect(
      normalizeAvailabilityValues([' Maria ', 'maria', '', null, 'JOSE']),
    ).toEqual(['maria', 'jose']);
  });

  it('chunks values for Firestore in queries', () => {
    expect(chunkAvailabilityValues(['a', 'b', 'c', 'd', 'e'], 2)).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e'],
    ]);
  });

  it('finds the first proposed value that already exists', () => {
    expect(
      findFirstMatchingAvailabilityValue(
        ['nuevo', 'Duplicado', 'otro'],
        new Set(['duplicado']),
      ),
    ).toEqual({ index: 1, value: 'duplicado' });
  });
});
