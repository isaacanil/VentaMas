import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type VendorBillDocData = Record<string, unknown>;

type VendorBillSnapshot = {
  docs: Array<{
    data: () => VendorBillDocData;
    id: string;
  }>;
};

type SnapshotHandler = (snapshot: VendorBillSnapshot) => void;

const { mockUser, subscribeToVendorBillsMock } = vi.hoisted(() => ({
  mockUser: {
    current: { businessID: 'business-1' } as { businessID: string } | null,
  },
  subscribeToVendorBillsMock: vi.fn(),
}));

vi.mock('react-redux', () => ({
  useSelector: () => mockUser.current,
}));

vi.mock('@/features/auth/userSlice', () => ({
  selectUser: vi.fn(),
}));

vi.mock('@/modules/accountsPayable/repositories/vendorBills.repository', () => ({
  subscribeToVendorBills: (...args: unknown[]) =>
    subscribeToVendorBillsMock(...args),
}));

import { useListenVendorBills } from './useVendorBills';

const createSnapshot = (
  vendorBills: Array<{ data: VendorBillDocData; id: string }>,
): VendorBillSnapshot => ({
  docs: vendorBills.map((vendorBill) => ({
    data: () => vendorBill.data,
    id: vendorBill.id,
  })),
});

const timestampLike = (millis: number) => ({
  toMillis: () => millis,
});

describe('useListenVendorBills', () => {
  beforeEach(() => {
    subscribeToVendorBillsMock.mockReset();
    mockUser.current = { businessID: 'business-1' };
  });

  it('no abre suscripcion cuando falta negocio', () => {
    mockUser.current = null;

    const { result } = renderHook(() => useListenVendorBills());

    expect(result.current).toEqual({
      isLoading: false,
      vendorBills: [],
    });
    expect(subscribeToVendorBillsMock).not.toHaveBeenCalled();
  });

  it('mantiene loading hasta el snapshot, pasa filtros, convierte timestamps y ordena ascendente', async () => {
    const unsubscribe = vi.fn();
    const filters = {
      condition: 'thirty_days',
      providerId: 'supplier-1',
    };
    let handleSnapshot: SnapshotHandler | null = null;

    subscribeToVendorBillsMock.mockImplementation(
      (
        _businessId: string,
        _filters: typeof filters,
        onNext: SnapshotHandler,
      ) => {
        handleSnapshot = onNext;
        return unsubscribe;
      },
    );

    const { result, unmount } = renderHook(() =>
      useListenVendorBills({
        filters,
        isAscending: true,
      }),
    );

    expect(result.current).toEqual({
      isLoading: true,
      vendorBills: [],
    });
    expect(subscribeToVendorBillsMock).toHaveBeenCalledWith(
      'business-1',
      filters,
      expect.any(Function),
    );

    act(() => {
      handleSnapshot?.(
        createSnapshot([
          {
            data: {
              issueAt: timestampLike(200),
              paymentTerms: {
                nextPaymentAt: timestampLike(300),
              },
              purchase: {
                receiptHistory: [
                  {
                    items: [
                      {
                        expirationDate: timestampLike(500),
                      },
                    ],
                    occurredAt: timestampLike(400),
                  },
                ],
              },
              reference: '20',
              status: 'approved',
            },
            id: 'bill-20',
          },
          {
            data: {
              issueAt: timestampLike(100),
              reference: '3',
              status: 'paid',
            },
            id: 'bill-3',
          },
        ]),
      );
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(
      result.current.vendorBills.map((vendorBill) => vendorBill.id),
    ).toEqual(['bill-3', 'bill-20']);
    expect(result.current.vendorBills[1]).toMatchObject({
      id: 'bill-20',
      issueAt: 200,
      paymentTerms: {
        nextPaymentAt: 300,
      },
      purchase: {
        receiptHistory: [
          {
            items: [
              {
                expirationDate: 500,
              },
            ],
            occurredAt: 400,
          },
        ],
      },
    });

    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('ordena descendente por referencia cuando isAscending es false', async () => {
    let handleSnapshot: SnapshotHandler | null = null;

    subscribeToVendorBillsMock.mockImplementation(
      (_businessId: string, _filters: null, onNext: SnapshotHandler) => {
        handleSnapshot = onNext;
        return vi.fn();
      },
    );

    const { result } = renderHook(() =>
      useListenVendorBills({
        isAscending: false,
      }),
    );

    act(() => {
      handleSnapshot?.(
        createSnapshot([
          {
            data: {
              reference: '10',
              status: 'approved',
            },
            id: 'bill-10',
          },
          {
            data: {
              reference: '2',
              status: 'paid',
            },
            id: 'bill-2',
          },
        ]),
      );
    });

    await waitFor(() =>
      expect(
        result.current.vendorBills.map((vendorBill) => vendorBill.id),
      ).toEqual(['bill-10', 'bill-2']),
    );
    expect(result.current.isLoading).toBe(false);
  });

  it('resetea datos y cierra la suscripcion cuando se pierde el negocio', async () => {
    const unsubscribe = vi.fn();
    let handleSnapshot: SnapshotHandler | null = null;

    subscribeToVendorBillsMock.mockImplementation(
      (_businessId: string, _filters: null, onNext: SnapshotHandler) => {
        handleSnapshot = onNext;
        return unsubscribe;
      },
    );

    const { result, rerender } = renderHook(() => useListenVendorBills());

    act(() => {
      handleSnapshot?.(
        createSnapshot([
          {
            data: {
              reference: '1',
              status: 'approved',
            },
            id: 'bill-1',
          },
        ]),
      );
    });

    await waitFor(() =>
      expect(
        result.current.vendorBills.map((vendorBill) => vendorBill.id),
      ).toEqual(['bill-1']),
    );

    mockUser.current = null;
    rerender();

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        vendorBills: [],
      }),
    );
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
