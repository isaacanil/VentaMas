import { describe, expect, it } from 'vitest';

import { accumulatePurchaseData } from './accumulatePurchaseData';

describe('accumulatePurchaseData', () => {
  it('accumulates purchases when the date lives at the top level of data', () => {
    const result = accumulatePurchaseData([
      {
        data: {
          createdAt: Date.UTC(2026, 2, 1),
          total: 100,
        },
      },
      {
        data: {
          createdAt: Date.UTC(2026, 2, 15),
          total: 25,
        },
      },
    ]);

    expect(result.totalAccumulated).toBe(125);
    expect(Object.keys(result.monthlyData)).toHaveLength(1);
    expect(Object.values(result.monthlyData)).toEqual([125]);
  });

  it('skips malformed purchases without throwing', () => {
    expect(() =>
      accumulatePurchaseData([
        undefined,
        null,
        {
          data: {
            total: 80,
          },
        },
      ]),
    ).not.toThrow();

    expect(
      accumulatePurchaseData([
        undefined,
        null,
        {
          data: {
            total: 80,
          },
        },
      ]),
    ).toEqual({
      monthlyData: {},
      totalAccumulated: 0,
    });
  });
});
