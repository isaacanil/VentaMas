import { describe, expect, it } from 'vitest';

import { buildPurchaseReceiptHistory } from './receiptHistory';

describe('purchase receipt history helpers', () => {
  it('appends a receipt event with actor, warehouse and pending totals', () => {
    const history = buildPurchaseReceiptHistory({
      currentHistory: [
        {
          id: 'existing',
          receivedAt: 1700000000000,
        },
      ],
      nextReplenishments: [
        {
          id: 'product-1',
          orderedQuantity: 10,
          receivedQuantity: 6,
          pendingQuantity: 4,
        },
        {
          id: 'product-2',
          orderedQuantity: 5,
          receivedQuantity: 5,
          pendingQuantity: 0,
        },
      ],
      receiptReplenishments: [
        {
          id: 'product-1',
          name: 'Producto 1',
          quantity: 2,
          purchaseQuantity: 2,
          receivedQuantity: 2,
          pendingQuantity: 4,
        },
      ],
      user: {
        uid: 'user-1',
        displayName: 'Compras',
        role: 'buyer',
      },
      warehouse: {
        id: 'wh-1',
        name: 'Principal',
      },
      workflowStatusAfter: 'partial_receipt',
      receivedAt: 1710000000000,
    });

    expect(history).toHaveLength(2);
    expect(history[1]).toMatchObject({
      warehouseId: 'wh-1',
      warehouseName: 'Principal',
      receivedBy: {
        uid: 'user-1',
        name: 'Compras',
        role: 'buyer',
      },
      workflowStatusAfter: 'partial_receipt',
      summary: {
        lineCount: 1,
        receivedQuantity: 2,
        remainingPurchasePendingQuantity: 4,
      },
    });
    expect(history[1]?.items?.[0]).toMatchObject({
      id: 'product-1',
      receivedQuantity: 2,
      pendingQuantity: 4,
    });
  });
});
