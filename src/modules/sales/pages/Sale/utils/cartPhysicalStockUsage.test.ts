import { describe, expect, it } from 'vitest';

import {
  hasSamePhysicalStockIdentity,
  resolveAvailableBaseStockForLine,
  sumCartBaseQuantityForPhysicalStock,
} from './cartPhysicalStockUsage';

describe('cartPhysicalStockUsage', () => {
  it('sums base quantity across weighted lines for the same physical stock', () => {
    const cartProducts = [
      {
        id: 'beef',
        cid: 'line-1',
        productStockId: 'stock-1',
        batchId: 'batch-1',
        baseQuantity: 0.907185,
        weightDetail: {
          isSoldByWeight: true,
          weight: 2,
          weightUnit: 'lb',
        },
      },
      {
        id: 'beef',
        cid: 'line-2',
        productStockId: 'stock-1',
        batchId: 'batch-1',
        baseQuantity: 1.5,
        weightDetail: {
          isSoldByWeight: true,
          weight: 1.5,
          weightUnit: 'kg',
        },
      },
      {
        id: 'beef',
        cid: 'line-3',
        productStockId: 'stock-2',
        batchId: 'batch-2',
        baseQuantity: 10,
      },
    ];

    expect(
      sumCartBaseQuantityForPhysicalStock(cartProducts, {
        id: 'beef',
        productStockId: 'stock-1',
        batchId: 'batch-1',
      }),
    ).toBe(2.407185);
  });

  it('excludes the current line when resolving editable stock for weight input', () => {
    const currentLine = {
      id: 'beef',
      cid: 'line-2',
      productStockId: 'stock-1',
      batchId: 'batch-1',
      stock: 5,
      baseQuantity: 1.5,
      weightDetail: {
        isSoldByWeight: true,
        weight: 1.5,
        weightUnit: 'kg',
      },
    };

    expect(
      resolveAvailableBaseStockForLine({
        cartProducts: [
          {
            id: 'beef',
            cid: 'line-1',
            productStockId: 'stock-1',
            batchId: 'batch-1',
            baseQuantity: 3,
          },
          currentLine,
        ],
        line: currentLine,
      }),
    ).toBe(2);
  });

  it('does not group different batches or products', () => {
    expect(
      hasSamePhysicalStockIdentity(
        {
          id: 'beef',
          productStockId: 'stock-1',
          batchId: 'batch-1',
        },
        {
          id: 'beef',
          productStockId: 'stock-1',
          batchId: 'batch-2',
        },
      ),
    ).toBe(false);
    expect(
      hasSamePhysicalStockIdentity(
        {
          id: 'beef',
          productStockId: 'stock-1',
          batchId: 'batch-1',
        },
        {
          id: 'pork',
          productStockId: 'stock-1',
          batchId: 'batch-1',
        },
      ),
    ).toBe(false);
  });
});
