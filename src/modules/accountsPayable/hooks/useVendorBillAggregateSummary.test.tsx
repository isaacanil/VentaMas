import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type MockUser = {
  activeBusinessId?: string | null;
  businessID?: string | null;
  businessId?: string | null;
};

const { fetchVendorBillAgingAggregateSummaryMock, mockUser } = vi.hoisted(
  () => ({
    fetchVendorBillAgingAggregateSummaryMock: vi.fn(),
    mockUser: {
      current: { businessID: 'business-1' } as MockUser | null,
    },
  }),
);

vi.mock('react-redux', () => ({
  useSelector: () => mockUser.current,
}));

vi.mock('@/features/auth/userSlice', () => ({
  selectUser: vi.fn(),
}));

vi.mock(
  '@/modules/accountsPayable/repositories/vendorBills.repository',
  () => ({
    fetchVendorBillAgingAggregateSummary: (...args: unknown[]) =>
      fetchVendorBillAgingAggregateSummaryMock(...args),
  }),
);

import { useVendorBillAggregateSummary } from './useVendorBillAggregateSummary';

const aggregateSummary = {
  buckets: [
    {
      balanceAmount: 500,
      count: 2,
      key: 'current',
    },
  ],
  totalBalanceAmount: 500,
  totalCount: 2,
};

describe('useVendorBillAggregateSummary', () => {
  beforeEach(() => {
    fetchVendorBillAgingAggregateSummaryMock.mockReset();
    mockUser.current = { businessID: 'business-1' };
  });

  it('no consulta agregados cuando falta negocio', () => {
    mockUser.current = null;

    const { result } = renderHook(() => useVendorBillAggregateSummary());

    expect(result.current).toEqual({
      errorMessage: null,
      isLoading: false,
      summary: null,
    });
    expect(fetchVendorBillAgingAggregateSummaryMock).not.toHaveBeenCalled();
  });

  it('usa activeBusinessId para agregados cuando falta businessID', async () => {
    mockUser.current = { activeBusinessId: 'business-active' };
    fetchVendorBillAgingAggregateSummaryMock.mockResolvedValue(
      aggregateSummary,
    );

    const { result } = renderHook(() => useVendorBillAggregateSummary());

    await waitFor(() =>
      expect(result.current.summary).toEqual(aggregateSummary),
    );
    expect(fetchVendorBillAgingAggregateSummaryMock).toHaveBeenCalledWith(
      'business-active',
      null,
    );
  });

  it('consulta agregados con filtros server-side y omite orden y limite', async () => {
    fetchVendorBillAgingAggregateSummaryMock.mockResolvedValue(
      aggregateSummary,
    );

    const { result } = renderHook(() =>
      useVendorBillAggregateSummary({
        filters: {
          condition: 'thirty_days',
          dueAtDirection: 'desc',
          limit: 1000,
          providerId: 'supplier-1',
        },
      }),
    );

    await waitFor(() =>
      expect(result.current.summary).toEqual(aggregateSummary),
    );
    expect(fetchVendorBillAgingAggregateSummaryMock).toHaveBeenCalledWith(
      'business-1',
      {
        condition: 'thirty_days',
        providerId: 'supplier-1',
      },
    );
    expect(result.current).toEqual({
      errorMessage: null,
      isLoading: false,
      summary: aggregateSummary,
    });
  });

  it('respeta enabled=false para filtros locales del workbench', () => {
    const { result } = renderHook(() =>
      useVendorBillAggregateSummary(
        {
          filters: {
            providerId: 'supplier-1',
          },
        },
        { enabled: false },
      ),
    );

    expect(result.current).toEqual({
      errorMessage: null,
      isLoading: false,
      summary: null,
    });
    expect(fetchVendorBillAgingAggregateSummaryMock).not.toHaveBeenCalled();
  });

  it('expone un error seguro cuando Firestore rechaza el agregado', async () => {
    fetchVendorBillAgingAggregateSummaryMock.mockRejectedValue({
      code: 'permission-denied',
    });

    const { result } = renderHook(() => useVendorBillAggregateSummary());

    await waitFor(() =>
      expect(result.current.errorMessage).toBe(
        'Tu usuario no tiene permisos para calcular agregados de CxP.',
      ),
    );
    expect(result.current).toMatchObject({
      isLoading: false,
      summary: null,
    });
  });
});
