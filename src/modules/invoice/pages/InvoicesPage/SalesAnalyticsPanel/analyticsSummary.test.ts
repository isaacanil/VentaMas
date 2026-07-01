import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';

import type { InvoiceData } from '@/types/invoice';

import { buildSalesAnalyticsSummary } from './analyticsSummary';
import type { SalesRecord } from './utils';

const createSale = (
  isoDate: string,
  total: number,
  numberID: number,
): SalesRecord => ({
  data: {
    numberID,
    date: {
      seconds: DateTime.fromISO(isoDate).toSeconds(),
    },
    totalPurchase: { value: total },
    totalShoppingItems: { value: 1 },
    totalTaxes: { value: 0 },
    discount: { value: 0 },
    paymentMethod: [],
    products: [],
  } satisfies InvoiceData,
});

describe('buildSalesAnalyticsSummary', () => {
  it('groups the trend by hour when all sales belong to a single day', () => {
    const sales = [
      createSale('2026-03-26T09:15:00', 20, 1),
      createSale('2026-03-26T09:45:00', 30, 2),
      createSale('2026-03-26T14:10:00', 80, 3),
    ];

    const summary = buildSalesAnalyticsSummary(sales);

    expect(summary.trend.groupBy).toBe('hour');
    expect(summary.trend.points).toEqual([
      expect.objectContaining({
        key: '2026-03-26-09',
        label: '09:00',
        total: 50,
        invoices: 2,
      }),
      expect.objectContaining({
        key: '2026-03-26-14',
        label: '14:00',
        total: 80,
        invoices: 1,
      }),
    ]);
    expect(summary.trend.strongest).toEqual(
      expect.objectContaining({
        label: '14:00',
        total: 80,
      }),
    );
    expect(summary.trend.latest).toEqual(
      expect.objectContaining({
        label: '14:00',
        total: 80,
      }),
    );
    expect(summary.trend.averageSales).toBe(65);
  });

  it('uses selected sale unit pricing in customer and category rollups', () => {
    const sale = createSale('2026-03-26T09:15:00', 236, 1);
    sale.data.client = {
      id: 'customer-1',
      name: 'Maria',
    } as InvoiceData['client'];
    sale.data.products = [
      {
        id: 'product-1',
        name: 'Refresco',
        category: 'Bebidas',
        amountToBuy: 2,
        pricing: {
          price: 10,
          tax: 18,
        },
        selectedSaleUnit: {
          id: 'box',
          conversionFactorToBase: 12,
          pricing: {
            price: 100,
            tax: 18,
          },
        },
      },
    ] as InvoiceData['products'];

    const summary = buildSalesAnalyticsSummary([sale]);

    expect(summary.categories[0]).toEqual(
      expect.objectContaining({
        label: 'Bebidas',
        items: 2,
        baseQuantity: 24,
        saleUnitQuantity: 2,
        weightQuantity: 0,
        total: 236,
      }),
    );
    expect(summary.customers[0]?.facturas[0]?.productos[0]).toEqual(
      expect.objectContaining({
        precio: 118,
        cantidad: 2,
        baseQuantity: 24,
        saleUnitQuantity: 2,
        weightQuantity: 0,
        subtotal: 236,
      }),
    );
  });

  it('uses product weight for weighted customer and category rollups', () => {
    const sale = createSale('2026-03-26T09:15:00', 250, 1);
    sale.data.client = {
      id: 'customer-1',
      name: 'Maria',
    } as InvoiceData['client'];
    sale.data.products = [
      {
        id: 'product-weight',
        name: 'Queso pesado',
        category: 'Charcuteria',
        amountToBuy: 1,
        pricing: {
          price: 100,
          tax: 0,
        },
        weightDetail: {
          isSoldByWeight: true,
          weight: 2.5,
          weightUnit: 'lb',
        },
      },
    ] as InvoiceData['products'];

    const summary = buildSalesAnalyticsSummary([sale]);

    expect(summary.categories[0]).toEqual(
      expect.objectContaining({
        label: 'Charcuteria',
        items: 2.5,
        baseQuantity: 2.5,
        saleUnitQuantity: 0,
        weightQuantity: 2.5,
        total: 250,
      }),
    );
    expect(summary.customers[0]?.facturas[0]?.productos[0]).toEqual(
      expect.objectContaining({
        precio: 100,
        cantidad: 2.5,
        baseQuantity: 2.5,
        saleUnitQuantity: 0,
        weightQuantity: 2.5,
        subtotal: 250,
      }),
    );
  });
});
