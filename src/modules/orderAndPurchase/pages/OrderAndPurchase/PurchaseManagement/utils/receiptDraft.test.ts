import { describe, expect, it } from 'vitest';

import type { PurchaseReplenishment } from '@/utils/purchase/types';

import {
  resolveReceivingNowValue,
  sanitizePurchaseReceiptDraftFields,
} from './receiptDraft';

describe('receiptDraft', () => {
  it('derives receivingNow from the received delta instead of a stale persisted field', () => {
    const replenishment = {
      id: 'product-1',
      name: 'Producto A',
      orderedQuantity: 10,
      receivedQuantity: 10,
      pendingQuantity: 0,
      receivingNow: 9,
    } as PurchaseReplenishment & { receivingNow: number };

    const initialReceivedMap = new Map<string | number, number>([
      ['product-1', 9],
    ]);

    expect(
      resolveReceivingNowValue(replenishment, initialReceivedMap, 'product-1'),
    ).toBe(1);
  });

  it('removes transient receivingNow fields before persisting replenishments', () => {
    const replenishments = [
      {
        id: 'product-1',
        name: 'Producto A',
        orderedQuantity: 10,
        receivedQuantity: 9,
        pendingQuantity: 1,
        receivingNow: 9,
      },
    ] as Array<PurchaseReplenishment & { receivingNow: number }>;

    expect(sanitizePurchaseReceiptDraftFields(replenishments)).toEqual([
      {
        id: 'product-1',
        name: 'Producto A',
        orderedQuantity: 10,
        receivedQuantity: 9,
        pendingQuantity: 1,
      },
    ]);
  });
});
