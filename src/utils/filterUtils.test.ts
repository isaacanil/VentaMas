import { describe, expect, it } from 'vitest';

import { sortOrders, sortPurchases } from './filterUtils';

type Row = {
  id: string;
  createdAt?: string | number | Date | null;
};

describe('filterUtils createdAt sorting', () => {
  it('keeps purchase and order sorting aliases aligned without mutating input', () => {
    const rows: Row[] = [
      { id: 'new', createdAt: '2026-06-03T00:00:00.000Z' },
      { id: 'missing', createdAt: null },
      { id: 'old', createdAt: '2026-06-01T00:00:00.000Z' },
    ];

    const purchasesAsc = sortPurchases(rows, true);
    const ordersDesc = sortOrders(rows, false);

    expect(purchasesAsc?.map((row) => row.id)).toEqual([
      'missing',
      'old',
      'new',
    ]);
    expect(ordersDesc?.map((row) => row.id)).toEqual([
      'new',
      'old',
      'missing',
    ]);
    expect(purchasesAsc).not.toBe(rows);
    expect(ordersDesc).not.toBe(rows);
    expect(rows.map((row) => row.id)).toEqual(['new', 'missing', 'old']);
  });
});
