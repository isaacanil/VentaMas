import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/firebase/products/fbGetProducts', () => ({
  useGetProducts: () => ({
    loading: false,
    products: [],
  }),
}));

import { useInventorySummaryData } from './useInventorySummaryData';

describe('useInventorySummaryData', () => {
  it('uses the shared currency formatter', () => {
    const { result } = renderHook(() => useInventorySummaryData());

    expect(result.current.formatCurrency(1234.5)).toBe(
      new Intl.NumberFormat('es-DO', {
        currency: 'DOP',
        maximumFractionDigits: 2,
        style: 'currency',
      }).format(1234.5),
    );
    expect(result.current.formatCurrency(Number.NaN)).toBe(
      new Intl.NumberFormat('es-DO', {
        currency: 'DOP',
        maximumFractionDigits: 2,
        style: 'currency',
      }).format(0),
    );
  });
});
