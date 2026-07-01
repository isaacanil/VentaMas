import { describe, expect, it } from 'vitest';

import { mapPreorderToRow } from './preSaleTableRows';
import type { PreorderFirestoreDoc } from '../../types';

describe('mapPreorderToRow', () => {
  it('uses visible invoice quantity for weighted preorder products', () => {
    const row = mapPreorderToRow({
      data: {
        products: [
          {
            amountToBuy: 1,
            pricing: { price: 100, tax: 0 },
            weightDetail: {
              isSoldByWeight: true,
              weight: 2.5,
              weightUnit: 'kg',
            },
          },
          {
            amountToBuy: 2,
            pricing: { price: 50, tax: 0 },
            selectedSaleUnit: {
              id: 'box-12',
              unitName: 'Caja',
              conversionFactorToBase: 12,
              pricing: { price: 500, tax: 0 },
            },
          },
        ],
        preorderDetails: { date: 1_788_000_000, numberID: 'PRE-1' },
        status: 'pending',
      },
    } as PreorderFirestoreDoc);

    expect(row.products).toBe(4.5);
    expect(row.total).toBe(1250);
  });
});
