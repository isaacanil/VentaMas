import { describe, expect, it } from 'vitest';

import {
  aggregateActiveProductStocksByProduct,
  extractInventoriedProductIds,
  isTrackInventoryEnabled,
} from './stockLogic';

describe('stockLogic', () => {
  it('uses the shared product display fallback for aggregated stock names', () => {
    expect(
      aggregateActiveProductStocksByProduct([
        { productId: 'product-1', productName: '  Acetaminofen  ', quantity: 2 },
        { productId: 'product-2', productName: '', quantity: 1 },
      ] as never),
    ).toEqual([
      expect.objectContaining({
        id: 'product-1',
        name: 'Acetaminofen',
        productName: 'Acetaminofen',
      }),
      expect.objectContaining({
        id: 'product-2',
        name: 'Producto sin nombre',
        productName: 'Producto sin nombre',
      }),
    ]);
  });

  it('uses the shared boolean parser for track inventory values', () => {
    expect(isTrackInventoryEnabled(true)).toBe(true);
    expect(isTrackInventoryEnabled('SI')).toBe(true);
    expect(isTrackInventoryEnabled('s\u00ed')).toBe(true);
    expect(isTrackInventoryEnabled('s\uFFFD')).toBe(true);
    expect(isTrackInventoryEnabled(false)).toBe(false);
    expect(isTrackInventoryEnabled('no')).toBe(false);
    expect(isTrackInventoryEnabled(undefined)).toBe(false);
  });

  it('extracts explicit inventory product ids and skips deleted products', () => {
    expect(
      Array.from(
        extractInventoriedProductIds([
          { id: 'product-1', trackInventory: true },
          { id: 'product-2', trackInventory: 'si' },
          { id: 'service-1', trackInventory: false },
          { id: 'deleted-1', trackInventory: true, isDeleted: true },
          { id: 'missing-flag' },
        ]),
      ),
    ).toEqual(['product-1', 'product-2']);
  });
});
