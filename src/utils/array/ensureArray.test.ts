import { describe, expect, it } from 'vitest';

import { ensureArray, findByName, isArrayEmpty } from './ensureArray';

describe('ensureArray', () => {
  it('returns arrays as-is and normalizes non-array values to an empty array', () => {
    const items = [{ id: 'item-1' }];

    expect(ensureArray(items)).toBe(items);
    expect(ensureArray('item-1')).toEqual([]);
    expect(ensureArray({ id: 'item-1' })).toEqual([]);
    expect(ensureArray(null)).toEqual([]);
    expect(ensureArray(undefined)).toEqual([]);
  });

  it('checks empty array-like inputs through the shared normalization helper', () => {
    expect(isArrayEmpty([])).toBe(true);
    expect(isArrayEmpty(['item-1'])).toBe(false);
    expect(isArrayEmpty({ length: 1 })).toBe(true);
  });

  it('finds named entries without callers duplicating array search logic', () => {
    expect(
      findByName(
        [
          { name: 'ventas', value: 10 },
          { name: 'inventario', value: 20 },
        ],
        'inventario',
      ),
    ).toEqual({ name: 'inventario', value: 20 });
  });
});
