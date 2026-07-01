import { describe, expect, it } from 'vitest';

import { buildSellableStockAvailabilityIndex } from './sellableStockAvailability';
import type { InventoryStockItem } from '@/utils/inventory/types';

describe('sellableStockAvailability', () => {
  it('indexes total and max physical stock by product', () => {
    const index = buildSellableStockAvailabilityIndex([
      {
        id: 'stock-a',
        productId: 'granola',
        quantity: 6,
        location: 'warehouse-a',
        status: 'active',
      },
      {
        id: 'stock-b',
        productId: 'granola',
        quantity: 6,
        location: 'warehouse-b',
        status: 'active',
      },
      {
        id: 'stock-c',
        productId: 'coffee',
        quantity: 24,
        location: 'warehouse-a',
        status: 'active',
      },
    ] as InventoryStockItem[]);

    expect(index.granola).toEqual({
      maxPhysicalStockQuantity: 6,
      stockCount: 2,
      totalPhysicalStockQuantity: 12,
    });
    expect(index.coffee).toMatchObject({
      maxPhysicalStockQuantity: 24,
      totalPhysicalStockQuantity: 24,
    });
  });

  it('can scope availability to selected warehouse locations', () => {
    const index = buildSellableStockAvailabilityIndex(
      [
        {
          id: 'stock-a',
          productId: 'granola',
          quantity: 12,
          location: 'warehouse-a/shelf-1',
          status: 'active',
        },
        {
          id: 'stock-b',
          productId: 'granola',
          quantity: 24,
          location: 'warehouse-b/shelf-1',
          status: 'active',
        },
      ] as InventoryStockItem[],
      { locationScopes: ['warehouse-a'] },
    );

    expect(index.granola).toEqual({
      maxPhysicalStockQuantity: 12,
      stockCount: 1,
      totalPhysicalStockQuantity: 12,
    });
  });

  it('ignores deleted, inactive and empty stock records', () => {
    const index = buildSellableStockAvailabilityIndex([
      {
        id: 'deleted',
        productId: 'granola',
        quantity: 12,
        isDeleted: true,
        status: 'active',
      },
      {
        id: 'inactive',
        productId: 'granola',
        quantity: 12,
        status: 'inactive',
      },
      {
        id: 'empty',
        productId: 'granola',
        quantity: 0,
        status: 'active',
      },
    ] as InventoryStockItem[]);

    expect(index).toEqual({});
  });
});
