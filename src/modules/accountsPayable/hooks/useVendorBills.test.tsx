import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type VendorBillDocData = Record<string, unknown>;

type VendorBillSnapshot = {
  docs: Array<{
    data: () => VendorBillDocData;
    id: string;
  }>;
};

type VendorBillSnapshotMetadata = {
  hasMore?: boolean;
  isClientFiltered: boolean;
  rawDocCount: number;
  visibleDocCount?: number;
};

type MockUser = {
  activeBusinessId?: string | null;
  businessID?: string | null;
  businessId?: string | null;
};

type SnapshotHandler = (
  snapshot: VendorBillSnapshot,
  metadata?: VendorBillSnapshotMetadata,
) => void;

const { mockUser, subscribeToVendorBillsMock } = vi.hoisted(() => ({
  mockUser: {
    current: { businessID: 'business-1' } as MockUser | null,
  },
  subscribeToVendorBillsMock: vi.fn(),
}));

vi.mock('react-redux', () => ({
  useSelector: () => mockUser.current,
}));

vi.mock('@/features/auth/userSlice', () => ({
  selectUser: vi.fn(),
}));

vi.mock(
  '@/modules/accountsPayable/repositories/vendorBills.repository',
  () => ({
    DEFAULT_VENDOR_BILL_QUERY_LIMIT: 500,
    MAX_VENDOR_BILL_QUERY_LIMIT: 2000,
    subscribeToVendorBills: (...args: unknown[]) =>
      subscribeToVendorBillsMock(...args),
  }),
);

import { useListenVendorBills } from './useVendorBills';

const DEFAULT_VENDOR_BILL_QUERY_LIMIT = 500;
const EXTENDED_VENDOR_BILL_QUERY_LIMIT = 1000;

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
      errorMessage: null,
      isClientFilteredQuery: false,
      isQueryLimitReached: false,
      isLoading: false,
      queryLimit: DEFAULT_VENDOR_BILL_QUERY_LIMIT,
      rawDocCount: 0,
      vendorBills: [],
    });
    expect(subscribeToVendorBillsMock).not.toHaveBeenCalled();
  });

  it('usa activeBusinessId cuando el alias legacy businessID no existe', () => {
    mockUser.current = { activeBusinessId: 'business-active' };
    subscribeToVendorBillsMock.mockReturnValue(vi.fn());

    renderHook(() => useListenVendorBills());

    expect(subscribeToVendorBillsMock).toHaveBeenCalledWith(
      'business-active',
      null,
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('mantiene loading hasta el snapshot, pasa filtros, convierte timestamps y ordena por vencimiento ascendente', async () => {
    const unsubscribe = vi.fn();
    const filters = {
      condition: 'thirty_days',
      paymentControlStatus: 'payable' as const,
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
      errorMessage: null,
      isClientFilteredQuery: false,
      isQueryLimitReached: false,
      isLoading: true,
      queryLimit: DEFAULT_VENDOR_BILL_QUERY_LIMIT,
      rawDocCount: 0,
      vendorBills: [],
    });
    expect(subscribeToVendorBillsMock).toHaveBeenCalledWith(
      'business-1',
      {
        ...filters,
        dueAtDirection: 'asc',
      },
      expect.any(Function),
      expect.any(Function),
    );

    act(() => {
      handleSnapshot?.(
        createSnapshot([
          {
            data: {
              dueAt: timestampLike(100),
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
              dueAt: timestampLike(200),
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
    ).toEqual(['bill-20', 'bill-3']);
    expect(result.current.vendorBills[0]).toMatchObject({
      dueAt: 100,
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

  it('cierra loading y expone error seguro cuando falla la suscripcion', async () => {
    let handleError: ((error: unknown) => void) | null = null;

    subscribeToVendorBillsMock.mockImplementation(
      (
        _businessId: string,
        _filters: null,
        _onNext: SnapshotHandler,
        onError: (error: unknown) => void,
      ) => {
        handleError = onError;
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useListenVendorBills());

    expect(result.current.isLoading).toBe(true);

    act(() => {
      handleError?.({ code: 'failed-precondition' });
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({
      errorMessage: 'Falta el índice de Firestore.',
      isClientFilteredQuery: false,
      isQueryLimitReached: false,
      queryLimit: DEFAULT_VENDOR_BILL_QUERY_LIMIT,
      rawDocCount: 0,
      vendorBills: [],
    });
  });

  it('no marca la consulta como acotada cuando el snapshot llega exactamente al limite del workbench', async () => {
    let handleSnapshot: SnapshotHandler | null = null;

    subscribeToVendorBillsMock.mockImplementation(
      (_businessId: string, _filters: null, onNext: SnapshotHandler) => {
        handleSnapshot = onNext;
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useListenVendorBills());

    act(() => {
      handleSnapshot?.(
        createSnapshot(
          Array.from(
            { length: DEFAULT_VENDOR_BILL_QUERY_LIMIT },
            (_, index) => ({
              data: {
                reference: String(index + 1),
                status: 'approved',
              },
              id: `bill-${index + 1}`,
            }),
          ),
        ),
        {
          hasMore: false,
          isClientFiltered: false,
          rawDocCount: DEFAULT_VENDOR_BILL_QUERY_LIMIT,
          visibleDocCount: DEFAULT_VENDOR_BILL_QUERY_LIMIT,
        },
      );
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isQueryLimitReached).toBe(false);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.isClientFilteredQuery).toBe(false);
    expect(result.current.queryLimit).toBe(DEFAULT_VENDOR_BILL_QUERY_LIMIT);
    expect(result.current.rawDocCount).toBe(DEFAULT_VENDOR_BILL_QUERY_LIMIT);
    expect(result.current.vendorBills).toHaveLength(
      DEFAULT_VENDOR_BILL_QUERY_LIMIT,
    );
  });

  it('marca la consulta como acotada cuando metadata indica que hay mas resultados', async () => {
    let handleSnapshot: SnapshotHandler | null = null;

    subscribeToVendorBillsMock.mockImplementation(
      (_businessId: string, _filters: null, onNext: SnapshotHandler) => {
        handleSnapshot = onNext;
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useListenVendorBills());

    act(() => {
      handleSnapshot?.(
        createSnapshot(
          Array.from(
            { length: DEFAULT_VENDOR_BILL_QUERY_LIMIT },
            (_, index) => ({
              data: {
                reference: String(index + 1),
                status: 'approved',
              },
              id: `bill-${index + 1}`,
            }),
          ),
        ),
        {
          hasMore: true,
          isClientFiltered: false,
          rawDocCount: DEFAULT_VENDOR_BILL_QUERY_LIMIT + 1,
          visibleDocCount: DEFAULT_VENDOR_BILL_QUERY_LIMIT,
        },
      );
    });

    await waitFor(() => expect(result.current.isQueryLimitReached).toBe(true));
    expect(result.current.rawDocCount).toBe(
      DEFAULT_VENDOR_BILL_QUERY_LIMIT + 1,
    );
    expect(result.current.vendorBills).toHaveLength(
      DEFAULT_VENDOR_BILL_QUERY_LIMIT,
    );
  });

  it('respeta limites ampliados para cargar lotes adicionales', async () => {
    let handleSnapshot: SnapshotHandler | null = null;

    subscribeToVendorBillsMock.mockImplementation(
      (_businessId: string, _filters: null, onNext: SnapshotHandler) => {
        handleSnapshot = onNext;
        return vi.fn();
      },
    );

    const { result } = renderHook(() =>
      useListenVendorBills({
        filters: {
          limit: EXTENDED_VENDOR_BILL_QUERY_LIMIT,
        },
      }),
    );

    expect(subscribeToVendorBillsMock).toHaveBeenCalledWith(
      'business-1',
      {
        limit: EXTENDED_VENDOR_BILL_QUERY_LIMIT,
      },
      expect.any(Function),
      expect.any(Function),
    );

    act(() => {
      handleSnapshot?.(
        createSnapshot(
          Array.from(
            { length: EXTENDED_VENDOR_BILL_QUERY_LIMIT },
            (_, index) => ({
              data: {
                reference: String(index + 1),
                status: 'approved',
              },
              id: `bill-${index + 1}`,
            }),
          ),
        ),
        {
          hasMore: false,
          isClientFiltered: false,
          rawDocCount: EXTENDED_VENDOR_BILL_QUERY_LIMIT,
          visibleDocCount: EXTENDED_VENDOR_BILL_QUERY_LIMIT,
        },
      );
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isQueryLimitReached).toBe(false);
    expect(result.current.queryLimit).toBe(EXTENDED_VENDOR_BILL_QUERY_LIMIT);
    expect(result.current.rawDocCount).toBe(EXTENDED_VENDOR_BILL_QUERY_LIMIT);
    expect(result.current.vendorBills).toHaveLength(
      EXTENDED_VENDOR_BILL_QUERY_LIMIT,
    );
  });

  it('mantiene la señal de lote acotado cuando el fallback filtra menos docs que los leídos', async () => {
    let handleSnapshot: SnapshotHandler | null = null;

    subscribeToVendorBillsMock.mockImplementation(
      (_businessId: string, _filters: null, onNext: SnapshotHandler) => {
        handleSnapshot = onNext;
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useListenVendorBills());

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
        {
          hasMore: true,
          isClientFiltered: true,
          rawDocCount: DEFAULT_VENDOR_BILL_QUERY_LIMIT + 1,
          visibleDocCount: 1,
        },
      );
    });

    await waitFor(() => expect(result.current.isQueryLimitReached).toBe(true));
    expect(result.current.isClientFilteredQuery).toBe(true);
    expect(result.current.rawDocCount).toBe(
      DEFAULT_VENDOR_BILL_QUERY_LIMIT + 1,
    );
    expect(result.current.vendorBills).toHaveLength(1);
    expect(result.current.queryLimit).toBe(DEFAULT_VENDOR_BILL_QUERY_LIMIT);
  });

  it('ordena por vencimiento descendente y deja documentos sin fecha al final', async () => {
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

    expect(subscribeToVendorBillsMock).toHaveBeenCalledWith(
      'business-1',
      {
        dueAtDirection: 'desc',
      },
      expect.any(Function),
      expect.any(Function),
    );

    act(() => {
      handleSnapshot?.(
        createSnapshot([
          {
            data: {
              dueAt: timestampLike(300),
              reference: '10',
              status: 'approved',
            },
            id: 'bill-10',
          },
          {
            data: {
              dueAt: timestampLike(100),
              reference: '2',
              status: 'paid',
            },
            id: 'bill-2',
          },
          {
            data: {
              reference: '99',
              status: 'approved',
            },
            id: 'bill-no-date',
          },
        ]),
      );
    });

    await waitFor(() =>
      expect(
        result.current.vendorBills.map((vendorBill) => vendorBill.id),
      ).toEqual(['bill-10', 'bill-2', 'bill-no-date']),
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.errorMessage).toBeNull();
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
        errorMessage: null,
        isClientFilteredQuery: false,
        isQueryLimitReached: false,
        isLoading: false,
        queryLimit: DEFAULT_VENDOR_BILL_QUERY_LIMIT,
        rawDocCount: 0,
        vendorBills: [],
      }),
    );
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
