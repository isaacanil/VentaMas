import { describe, expect, it } from 'vitest';

import {
  buildWarehouseLocationPath,
  collectWarehouseLocationPaths,
  findWarehouseNodePath,
  toWarehouseFormPath,
  type WarehouseTreePathNode,
} from './warehouseTreePaths';

type TestWarehouseNode = WarehouseTreePathNode<TestWarehouseNode> & {
  label?: string;
};

const warehouseTree: TestWarehouseNode[] = [
  {
    id: 'warehouse-a',
    name: 'Almacen A',
    children: [
      {
        id: 'shelf-a',
        name: 'Estante A',
        children: [
          {
            id: 'row-a',
            name: 'Fila A',
            children: [{ id: 'segment-a', name: 'Segmento A' }],
          },
        ],
      },
    ],
  },
  {
    id: 'warehouse-b',
    name: 'Almacen B',
  },
];

describe('warehouseTreePaths', () => {
  it('finds the complete node path for nested warehouse nodes', () => {
    const path = findWarehouseNodePath(warehouseTree, 'segment-a');

    expect(path?.map((node) => node.id)).toEqual([
      'warehouse-a',
      'shelf-a',
      'row-a',
      'segment-a',
    ]);
  });

  it('returns null when the node cannot be found', () => {
    expect(findWarehouseNodePath(warehouseTree, 'missing-node')).toBeNull();
    expect(findWarehouseNodePath(undefined, 'warehouse-a')).toBeNull();
  });

  it('collects slash-separated paths for every location in the tree', () => {
    expect(collectWarehouseLocationPaths(warehouseTree)).toEqual([
      'warehouse-a',
      'warehouse-a/shelf-a',
      'warehouse-a/shelf-a/row-a',
      'warehouse-a/shelf-a/row-a/segment-a',
      'warehouse-b',
    ]);
  });

  it('converts node paths to form paths with ids and names', () => {
    const path = findWarehouseNodePath(warehouseTree, 'row-a');

    expect(toWarehouseFormPath(path)).toEqual([
      { id: 'warehouse-a', name: 'Almacen A' },
      { id: 'shelf-a', name: 'Estante A' },
      { id: 'row-a', name: 'Fila A' },
    ]);
  });

  it('builds the persisted slash-separated location path', () => {
    const path = findWarehouseNodePath(warehouseTree, 'segment-a');

    expect(buildWarehouseLocationPath(path)).toBe(
      'warehouse-a/shelf-a/row-a/segment-a',
    );
    expect(buildWarehouseLocationPath(null)).toBe('');
  });
});
