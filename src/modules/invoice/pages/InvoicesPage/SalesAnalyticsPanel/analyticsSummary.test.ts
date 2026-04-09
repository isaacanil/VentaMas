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
});
