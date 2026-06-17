import { describe, expect, it } from 'vitest';

import {
  buildLocationPath,
  resolveInventoryItemLocationPath,
  resolveInventoryLocationPath,
} from './locations';

describe('inventory location path helpers', () => {
  it('resolves raw location paths from supported inventory shapes', () => {
    expect(resolveInventoryLocationPath(' warehouse-1/shelf-1 ')).toBe(
      'warehouse-1/shelf-1',
    );
    expect(
      resolveInventoryLocationPath({
        path: ' businesses/business-1/warehouses/warehouse-1/shelves/shelf-1 ',
      }),
    ).toBe('businesses/business-1/warehouses/warehouse-1/shelves/shelf-1');
    expect(
      resolveInventoryLocationPath({
        pathSegments: ['warehouses', 'warehouse-1', 'shelves', 'shelf-1'],
      }),
    ).toBe('warehouses/warehouse-1/shelves/shelf-1');
    expect(
      resolveInventoryLocationPath({
        warehouse: { id: 'warehouse-1' },
        shelfId: 2,
        rowShelf: { id: 'row-1' },
        segmentId: 'segment-1',
      }),
    ).toBe('warehouse-1/2/row-1/segment-1');
  });

  it('normalizes collection paths when requested', () => {
    expect(
      resolveInventoryLocationPath(
        {
          path: [
            'businesses',
            'business-1',
            'warehouses',
            'warehouse-1',
            'shelves',
            'shelf-1',
            'rowShelves',
            'row-1',
            'segments',
            'segment-1',
          ].join('/'),
        },
        { normalize: true },
      ),
    ).toBe('warehouse-1/shelf-1/row-1/segment-1');
    expect(
      resolveInventoryLocationPath(
        {
          pathSegments: [
            'businesses',
            'business-1',
            'warehouses',
            'warehouse-1',
            'shelves',
            'shelf-1',
          ],
        },
        { normalize: true },
      ),
    ).toBe('warehouse-1/shelf-1');
  });

  it('keeps buildLocationPath string and object behavior compatible', () => {
    expect(
      buildLocationPath('businesses/business-1/warehouses/warehouse-1'),
    ).toBe('warehouse-1');
    expect(
      buildLocationPath({
        path: 'businesses/business-1/warehouses/warehouse-1',
      }),
    ).toBe('businesses/business-1/warehouses/warehouse-1');
  });

  it('extracts normalized location paths from inventory stock items', () => {
    expect(
      resolveInventoryItemLocationPath(
        {
          location: {
            path: 'businesses/business-1/warehouses/warehouse-1/shelves/shelf-1',
          },
        },
        { normalize: true },
      ),
    ).toBe('warehouse-1/shelf-1');
    expect(
      resolveInventoryItemLocationPath(
        { location: 'warehouses/warehouse-2/shelves/shelf-2' },
        { normalize: true },
      ),
    ).toBe('warehouse-2/shelf-2');
    expect(
      resolveInventoryItemLocationPath(
        { location: 'warehouse-3', shelfId: 'shelf-3', rowShelfId: 'row-3' },
        { normalize: true },
      ),
    ).toBe('warehouse-3/shelf-3/row-3');
    expect(
      resolveInventoryItemLocationPath(
        { location: 'warehouse-4' },
        { normalize: true },
      ),
    ).toBe('warehouse-4');
    expect(
      resolveInventoryItemLocationPath(
        { warehouseId: 'warehouse-5' },
        { normalize: true },
      ),
    ).toBe('warehouse-5');
  });
});
