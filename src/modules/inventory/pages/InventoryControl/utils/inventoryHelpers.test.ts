import { describe, expect, it } from 'vitest';

import { getItemLocationKey, getLocationKey } from './inventoryHelpers';

describe('InventoryControl inventory helpers', () => {
  it('keeps location key helpers normalized for supported stock item shapes', () => {
    expect(
      getLocationKey('businesses/business-1/warehouses/warehouse-1'),
    ).toBe('warehouse-1');
    expect(
      getItemLocationKey({
        location:
          'businesses/business-1/warehouses/warehouse-1/shelves/shelf-1',
      }),
    ).toBe('warehouse-1/shelf-1');
    expect(
      getItemLocationKey({
        location: 'warehouse-2',
        shelfId: 'shelf-2',
        rowShelfId: 'row-2',
        segmentId: 'segment-2',
      }),
    ).toBe('warehouse-2/shelf-2/row-2/segment-2');
    expect(getItemLocationKey({ warehouseId: 'warehouse-3' })).toBe(
      'warehouse-3',
    );
  });
});
