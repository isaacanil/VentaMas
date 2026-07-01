import { describe, expect, it } from 'vitest';

import type { InvoiceData } from '@/types/invoice';

import { formatBill } from './formatBill';

describe('formatBill detailed export quantities', () => {
  it('separates commercial, base, weight and sale unit quantities', () => {
    const invoice: InvoiceData = {
      date: '2026-06-30',
      NCF: 'B010000000001',
      client: { name: 'Cliente Demo' },
      totalPurchase: { value: 1_000 },
      products: [
        {
          id: 'normal-1',
          name: 'Producto normal',
          amountToBuy: 3,
          pricing: { price: 25, tax: 18 },
        },
        {
          id: 'box-1',
          name: 'Caja x12',
          amountToBuy: 2,
          baseQuantity: 24,
          pricing: { price: 100, tax: 18 },
          selectedSaleUnit: {
            id: 'box-12',
            unitName: 'Caja',
            conversionFactorToBase: 12,
            pricing: { price: 150, tax: 18 },
          },
        },
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
      ],
    };

    const rows = formatBill({
      type: 'Detailed',
      data: [invoice],
    });

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      Producto: 'Producto normal',
      Precio: 25,
      'Cantidad Facturada': 3,
      'Cantidad Comercial': 3,
      'Cantidad Base Inventario': 3,
      'Peso Vendido': '',
      'Unidad Peso': '',
      'Cantidad Presentación': '',
      Presentación: '',
    });
    expect(rows[1]).toMatchObject({
      Producto: 'Caja x12',
      Precio: 150,
      'Cantidad Facturada': 2,
      'Cantidad Comercial': 2,
      'Cantidad Base Inventario': 24,
      'Peso Vendido': '',
      'Unidad Peso': '',
      'Cantidad Presentación': 2,
      Presentación: 'Caja x 12',
    });
    expect(rows[2]).toMatchObject({
      Producto: 'Producto pesado',
      Precio: 100,
      'Cantidad Facturada': 2.5,
      'Cantidad Comercial': 2.5,
      'Cantidad Base Inventario': 2.5,
      'Peso Vendido': 2.5,
      'Unidad Peso': 'lb',
      'Cantidad Presentación': '',
      Presentación: '',
    });
  });
});
