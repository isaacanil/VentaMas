import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type PaymentDocData = Record<string, unknown>;

type PaymentDocSnapshot = {
  id: string;
  data: () => PaymentDocData;
};

type PaymentsSnapshot = {
  docs: PaymentDocSnapshot[];
};

type SnapshotHandler = (snapshot: PaymentsSnapshot) => void;
type SnapshotErrorHandler = (error: unknown) => void;

const { collectionMock, dbMock, onSnapshotMock, queryMock, whereMock } =
  vi.hoisted(() => ({
    collectionMock: vi.fn(),
    dbMock: { name: 'db-mock' },
    onSnapshotMock: vi.fn(),
    queryMock: vi.fn(),
    whereMock: vi.fn(),
  }));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  where: (...args: unknown[]) => whereMock(...args),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: dbMock,
}));

import { useAccountsPayablePayments } from './useAccountsPayablePayments';

const createSnapshot = (
  payments: Array<{ id: string; data: PaymentDocData }>,
): PaymentsSnapshot => ({
  docs: payments.map((payment) => ({
    id: payment.id,
    data: () => payment.data,
  })),
});

const sortablePayments = [
  {
    id: 'draft-payment',
    data: {
      status: 'draft',
      occurredAt: '2030-01-01T00:00:00.000Z',
    },
  },
  {
    id: 'voided-payment',
    data: {
      status: 'void',
      occurredAt: '2026-06-15T00:00:00.000Z',
    },
  },
  {
    id: 'created-at-fallback',
    data: {
      status: 'posted',
      createdAt: '2026-06-14T00:00:00.000Z',
    },
  },
  {
    id: 'occurred-at-wins',
    data: {
      status: 'posted',
      occurredAt: '2026-06-13T00:00:00.000Z',
      createdAt: '2035-01-01T00:00:00.000Z',
    },
  },
  {
    id: 'timestamp-like-old-payment',
    data: {
      status: 'posted',
      occurredAt: {
        toMillis: () => Date.parse('2026-06-10T00:00:00.000Z'),
      },
    },
  },
];

describe('useAccountsPayablePayments', () => {
  beforeEach(() => {
    collectionMock.mockReset();
    onSnapshotMock.mockReset();
    queryMock.mockReset();
    whereMock.mockReset();

    collectionMock.mockReturnValue({
      path: 'businesses/business-1/accountsPayablePayments',
    });
    queryMock.mockReturnValue({
      path: 'businesses/business-1/accountsPayablePayments?purchaseId=purchase-1',
    });
    whereMock.mockReturnValue({
      field: 'purchaseId',
      operator: '==',
      value: 'purchase-1',
    });
  });

  it('no abre suscripcion cuando faltan parametros o el panel esta cerrado', () => {
    const { result: missingBusinessResult } = renderHook(() =>
      useAccountsPayablePayments(null, 'purchase-1', true),
    );
    const { result: missingPurchaseResult } = renderHook(() =>
      useAccountsPayablePayments('business-1', '', true),
    );
    const { result: closedResult } = renderHook(() =>
      useAccountsPayablePayments('business-1', 'purchase-1', false),
    );

    expect(missingBusinessResult.current).toEqual({
      payments: [],
      loading: false,
    });
    expect(missingPurchaseResult.current).toEqual({
      payments: [],
      loading: false,
    });
    expect(closedResult.current).toEqual({
      payments: [],
      loading: false,
    });
    expect(collectionMock).not.toHaveBeenCalled();
    expect(queryMock).not.toHaveBeenCalled();
    expect(whereMock).not.toHaveBeenCalled();
    expect(onSnapshotMock).not.toHaveBeenCalled();
  });

  it('mantiene loading inicial hasta el snapshot, filtra y ordena pagos por fecha descendente', async () => {
    const unsubscribe = vi.fn();
    let handleSnapshot: SnapshotHandler | null = null;

    onSnapshotMock.mockImplementation((_query, onNext: SnapshotHandler) => {
      handleSnapshot = onNext;
      return unsubscribe;
    });

    const { result, unmount } = renderHook(() =>
      useAccountsPayablePayments('business-1', 'purchase-1', true),
    );

    expect(result.current).toEqual({
      payments: [],
      loading: true,
    });
    expect(collectionMock).toHaveBeenCalledWith(
      dbMock,
      'businesses',
      'business-1',
      'accountsPayablePayments',
    );
    expect(whereMock).toHaveBeenCalledWith('purchaseId', '==', 'purchase-1');
    expect(queryMock).toHaveBeenCalledWith(
      { path: 'businesses/business-1/accountsPayablePayments' },
      { field: 'purchaseId', operator: '==', value: 'purchase-1' },
    );

    act(() => {
      handleSnapshot?.(createSnapshot(sortablePayments));
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.payments.map((payment) => payment.id)).toEqual([
      'created-at-fallback',
      'occurred-at-wins',
      'timestamp-like-old-payment',
    ]);

    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('incluye pagos anulados cuando includeVoided esta activo', async () => {
    let handleSnapshot: SnapshotHandler | null = null;

    onSnapshotMock.mockImplementation((_query, onNext: SnapshotHandler) => {
      handleSnapshot = onNext;
      return vi.fn();
    });

    const { result } = renderHook(() =>
      useAccountsPayablePayments('business-1', 'purchase-1', true, {
        includeVoided: true,
      }),
    );

    act(() => {
      handleSnapshot?.(createSnapshot(sortablePayments));
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.payments.map((payment) => payment.id)).toEqual([
      'voided-payment',
      'created-at-fallback',
      'occurred-at-wins',
      'timestamp-like-old-payment',
    ]);
  });

  it('limpia los pagos y resuelve loading cuando Firestore reporta error', async () => {
    const snapshotError = new Error('permission denied');
    let handleSnapshot: SnapshotHandler | null = null;
    let handleSnapshotError: SnapshotErrorHandler | null = null;
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    onSnapshotMock.mockImplementation(
      (
        _query,
        onNext: SnapshotHandler,
        onError: SnapshotErrorHandler,
      ) => {
        handleSnapshot = onNext;
        handleSnapshotError = onError;
        return vi.fn();
      },
    );

    const { result } = renderHook(() =>
      useAccountsPayablePayments('business-1', 'purchase-1', true),
    );

    act(() => {
      handleSnapshot?.(
        createSnapshot([
          {
            id: 'posted-payment',
            data: {
              status: 'posted',
              occurredAt: '2026-06-15T00:00:00.000Z',
            },
          },
        ]),
      );
    });

    await waitFor(() =>
      expect(result.current.payments.map((payment) => payment.id)).toEqual([
        'posted-payment',
      ]),
    );

    act(() => {
      handleSnapshotError?.(snapshotError);
    });

    await waitFor(() =>
      expect(result.current).toEqual({
        payments: [],
        loading: false,
      }),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching accounts payable payments:',
      snapshotError,
    );

    consoleErrorSpy.mockRestore();
  });
});
