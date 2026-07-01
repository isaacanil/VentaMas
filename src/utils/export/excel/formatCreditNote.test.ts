import { describe, expect, it } from 'vitest';

import type { CreditNoteRecord } from '@/types/creditNote';

import { formatCreditNote } from './formatCreditNote';

describe('formatCreditNote detailed export quantities', () => {
  it('uses visible weight and sale unit quantities instead of raw base totals', () => {
    const creditNote: CreditNoteRecord = {
      createdAt: '2026-07-01',
      ncf: 'B0400000001',
      invoiceNcf: 'B0100000001',
      client: { name: 'Cliente Demo' },
      totalAmount: 1_000,
      items: [
        {
          id: 'weight-1',
          name: 'Producto pesado',
          amountToBuy: 1,
          pricing: { price: 100, tax: 0 },
          weightDetail: {
            isSoldByWeight: true,
            weight: 2.5,
            weightUnit: 'lb',
          },
        },
        {
          id: 'box-1',
          name: 'Caja x12',
          amountToBuy: { unit: 2, total: 24 },
          pricing: { price: 100, tax: 18 },
          selectedSaleUnit: {
            id: 'box-12',
            unitName: 'Caja',
            conversionFactorToBase: 12,
            pricing: { price: 150, tax: 18 },
          },
        },
      ],
    };

    const rows = formatCreditNote({
      type: 'Detailed',
      data: creditNote,
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      Producto: 'Producto pesado',
      Cantidad: 2.5,
      'Precio Unitario': 100,
    });
    expect(rows[1]).toMatchObject({
      Producto: 'Caja x12',
      Cantidad: 2,
      'Precio Unitario': 150,
    });
  });
});
