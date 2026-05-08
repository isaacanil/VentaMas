import { describe, expect, it } from 'vitest';

import type { InvoiceData } from '@/types/invoice';

import {
  filterSalesByPeriod,
  formatSalesPeriodDisplay,
  formatSalesChartDate,
  getAvailableSalesPeriods,
  getSalesDateSpan,
  getSalesPeriodKey,
  shouldGroupSalesByMonth,
  type SalesRecord,
} from './utils';

const secondsAtUtcNoon = (year: number, month: number, day: number) =>
  Math.floor(Date.UTC(year, month - 1, day, 12, 0, 0) / 1000);

const createSale = (seconds: number): SalesRecord => ({
  data: {
    date: { seconds },
  } as InvoiceData,
});

describe('SalesAnalyticsPanel utils', () => {
  it('formats chart dates with the same supported display modes', () => {
    const seconds = secondsAtUtcNoon(2026, 3, 26);

    expect(formatSalesChartDate(seconds, 'shortDate')).toMatch(/2026/);
    expect(formatSalesChartDate(seconds, 'longDate')).toMatch(/2026/);
    expect(formatSalesChartDate(seconds, 'monthYear')).toMatch(/2026/);
    expect(formatSalesChartDate(seconds, 'longDate')).not.toBe(
      formatSalesChartDate(seconds, 'monthYear'),
    );
  });

  it('gets sales date span from valid invoice dates only', () => {
    const oldest = secondsAtUtcNoon(2026, 1, 10);
    const newest = secondsAtUtcNoon(2026, 4, 15);
    const span = getSalesDateSpan([
      createSale(newest),
      { data: {} as InvoiceData },
      createSale(oldest),
    ]);

    expect(span).toEqual({
      min: oldest * 1000,
      max: newest * 1000,
    });
  });

  it('groups by month only when the sales span passes two months', () => {
    expect(
      shouldGroupSalesByMonth([
        createSale(secondsAtUtcNoon(2026, 1, 1)),
        createSale(secondsAtUtcNoon(2026, 4, 5)),
      ]),
    ).toBe(true);

    expect(
      shouldGroupSalesByMonth([
        createSale(secondsAtUtcNoon(2026, 1, 1)),
        createSale(secondsAtUtcNoon(2026, 2, 1)),
      ]),
    ).toBe(false);
  });

  it('builds and filters sales period keys without changing chart semantics', () => {
    const marchSale = createSale(secondsAtUtcNoon(2026, 3, 26));
    const aprilSale = createSale(secondsAtUtcNoon(2026, 4, 2));
    const sales = [aprilSale, marchSale, { data: {} as InvoiceData }];

    expect(
      getSalesPeriodKey(
        new Date(marchSale.data.date.seconds * 1000),
        'monthly',
      ),
    ).toBe('2026-02');
    expect(
      getSalesPeriodKey(
        new Date(aprilSale.data.date.seconds * 1000),
        'quarterly',
      ),
    ).toBe('2026-Q2');
    expect(getAvailableSalesPeriods(sales, 'monthly')).toEqual([
      '2026-02',
      '2026-03',
    ]);
    expect(filterSalesByPeriod(sales, '2026-02', 'monthly')).toEqual([
      marchSale,
    ]);
    expect(formatSalesPeriodDisplay('2026-Q2', 'quarterly')).toBe('Q2 2026');
  });
});
