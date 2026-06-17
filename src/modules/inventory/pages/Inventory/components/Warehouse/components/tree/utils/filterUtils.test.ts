import { describe, expect, it } from 'vitest';

import type { TreeConfig, TreeNodeData } from '../types';
import { defaultFilterNodes, getMatchingProductStock } from './filterUtils';

const config: TreeConfig<TreeNodeData> = {
  showMatchedStockCount: true,
};

describe('tree filterUtils', () => {
  it('matches product stock names without requiring accents', () => {
    const node: TreeNodeData = {
      id: 'warehouse',
      productStock: [{ productName: 'Café Molido' }, { productName: 'Té' }],
    };

    expect(getMatchingProductStock(node, ' cafe ')).toEqual([
      { productName: 'Café Molido' },
    ]);
  });

  it('filters nodes by normalized node names, stock names, and children', () => {
    const nodes: TreeNodeData[] = [
      {
        id: 'north',
        name: 'Almacén Norte',
        productStock: [{ productName: 'Café Molido' }],
      },
      {
        id: 'south',
        name: 'Sur',
        children: [{ id: 'child', name: 'Mostrador Ñame' }],
      },
    ];

    expect(defaultFilterNodes(nodes, ' almacen ', config)).toEqual([
      {
        ...nodes[0],
        matchedStockCount: 0,
        children: [],
      },
    ]);
    expect(defaultFilterNodes(nodes, 'name', config)).toEqual([
      {
        ...nodes[1],
        children: [
          {
            id: 'child',
            name: 'Mostrador Ñame',
            matchedStockCount: 0,
            children: [],
          },
        ],
      },
    ]);
  });

  it('returns the original nodes for blank search terms', () => {
    const nodes: TreeNodeData[] = [{ id: 'north', name: 'Almacén Norte' }];

    expect(defaultFilterNodes(nodes, '   ', config)).toBe(nodes);
  });
});
