import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type AccountsReceivableDocData = Record<string, unknown>;

type AccountsReceivableSnapshot = {
  docs: Array<{
    data: () => AccountsReceivableDocData;
    id: string;
  }>;
};

type SnapshotHandler = (snapshot: AccountsReceivableSnapshot) => void;
type SnapshotErrorHandler = (error: unknown) => void;

const {
  collectionMock,
  dbMock,
  mockUser,
  onSnapshotMock,
  queryMock,
  whereMock,
} = vi.hoisted(() => ({
  collectionMock: vi.fn(),
  dbMock: { name: 'db-mock' },
  mockUser: {
    current: { businessID: 'business-1' } as { businessID: string } | null,
  },
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

vi.mock('react-redux', () => ({
  useSelector: () => mockUser.current,
}));

vi.mock('@/features/auth/userSlice', () => ({
  selectUser: vi.fn(),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: dbMock,
}));

import { useFbGetAccountReceivableByInvoice } from './useFbGetAccountReceivableByInvoice';

const createSnapshot = (
  accountsReceivable: Array<{ data: AccountsReceivableDocData; id: string }>,
): AccountsReceivableSnapshot => ({
  docs: accountsReceivable.map((accountReceivable) => ({
    data: () => accountReceivable.data,
    id: accountReceivable.id,
  })),
});

describe('useFbGetAccountReceivableByInvoice', () => {
  beforeEach(() => {
    collectionMock.mockReset();
    onSnapshotMock.mockReset();
    queryMock.mockReset();
    whereMock.mockReset();
    mockUser.current = { businessID: 'business-1' };

    collectionMock.mockReturnValue({
      path: 'businesses/business-1/accountsReceivable',
    });
    queryMock.mockReturnValue({
      path: 'businesses/business-1/accountsReceivable?invoiceId=invoice-1',
    });
    whereMock.mockReturnValue({
      field: 'invoiceId',
      operator: '==',
      value: 'invoice-1',
    });
  });

  it('no abre listener cuando falta negocio o factura', () => {
    mockUser.current = null;
    const { result: missingBusinessResult } = renderHook(() =>
      useFbGetAccountReceivableByInvoice('invoice-1'),
    );

    mockUser.current = { businessID: 'business-1' };
    const { result: missingInvoiceResult } = renderHook(() =>
      useFbGetAccountReceivableByInvoice(''),
    );

    expect(missingBusinessResult.current).toEqual({
      accountsReceivable: [],
      loading: false,
    });
    expect(missingInvoiceResult.current).toEqual({
      accountsReceivable: [],
      loading: false,
    });
    expect(collectionMock).not.toHaveBeenCalled();
    expect(queryMock).not.toHaveBeenCalled();
    expect(whereMock).not.toHaveBeenCalled();
    expect(onSnapshotMock).not.toHaveBeenCalled();
  });

  it('mantiene loading hasta recibir el snapshot actual', async () => {
    const unsubscribe = vi.fn();
    let handleSnapshot: SnapshotHandler | null = null;

    onSnapshotMock.mockImplementation((_query, onNext: SnapshotHandler) => {
      handleSnapshot = onNext;
      return unsubscribe;
    });

    const { result, unmount } = renderHook(() =>
      useFbGetAccountReceivableByInvoice('invoice-1'),
    );

    expect(result.current).toEqual({
      accountsReceivable: [],
      loading: true,
    });
    expect(collectionMock).toHaveBeenCalledWith(
      dbMock,
      'businesses',
      'business-1',
      'accountsReceivable',
    );
    expect(whereMock).toHaveBeenCalledWith('invoiceId', '==', 'invoice-1');

    act(() => {
      handleSnapshot?.(
        createSnapshot([
          {
            data: { balance: 150, invoiceId: 'invoice-1' },
            id: 'ar-1',
          },
        ]),
      );
    });

    await waitFor(() =>
      expect(result.current).toEqual({
        accountsReceivable: [
          {
            balance: 150,
            id: 'ar-1',
            invoiceId: 'invoice-1',
          },
        ],
        loading: false,
      }),
    );

    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('oculta el snapshot anterior mientras cambia a otra factura', async () => {
    const unsubscribeFirst = vi.fn();
    const unsubscribeSecond = vi.fn();
    let handleFirstSnapshot: SnapshotHandler | null = null;

    onSnapshotMock
      .mockImplementationOnce((_query, onNext: SnapshotHandler) => {
        handleFirstSnapshot = onNext;
        return unsubscribeFirst;
      })
      .mockImplementationOnce((_query, onNext: SnapshotHandler) => {
        expect(onNext).toBeTypeOf('function');
        return unsubscribeSecond;
      });

    const { result, rerender } = renderHook(
      ({ invoiceId }: { invoiceId: string }) =>
        useFbGetAccountReceivableByInvoice(invoiceId),
      {
        initialProps: { invoiceId: 'invoice-1' },
      },
    );

    act(() => {
      handleFirstSnapshot?.(
        createSnapshot([
          {
            data: { invoiceId: 'invoice-1' },
            id: 'ar-old',
          },
        ]),
      );
    });

    await waitFor(() =>
      expect(result.current.accountsReceivable.map((item) => item.id)).toEqual([
        'ar-old',
      ]),
    );

    whereMock.mockReturnValue({
      field: 'invoiceId',
      operator: '==',
      value: 'invoice-2',
    });
    rerender({ invoiceId: 'invoice-2' });

    await waitFor(() => expect(unsubscribeFirst).toHaveBeenCalledOnce());
    expect(result.current).toEqual({
      accountsReceivable: [],
      loading: true,
    });
  });

  it('limpia los datos cuando Firestore reporta error', async () => {
    const firestoreError = new Error('permission denied');
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
      useFbGetAccountReceivableByInvoice('invoice-1'),
    );

    act(() => {
      handleSnapshot?.(
        createSnapshot([
          {
            data: { invoiceId: 'invoice-1' },
            id: 'ar-1',
          },
        ]),
      );
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      handleSnapshotError?.(firestoreError);
    });

    await waitFor(() =>
      expect(result.current).toEqual({
        accountsReceivable: [],
        loading: false,
      }),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching accounts receivable by invoice:',
      firestoreError,
    );

    consoleErrorSpy.mockRestore();
  });
});
