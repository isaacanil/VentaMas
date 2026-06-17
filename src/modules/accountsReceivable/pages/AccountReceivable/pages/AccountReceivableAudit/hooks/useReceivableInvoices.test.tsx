import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type FirestoreDoc = {
  id: string;
  data: () => Record<string, unknown>;
  get?: (field: string) => unknown;
};

const {
  collectionMock,
  dbMock,
  getCountFromServerMock,
  getDocsMock,
  limitMock,
  orderByMock,
  queryMock,
  whereMock,
} = vi.hoisted(() => ({
  collectionMock: vi.fn(),
  dbMock: { name: 'db-mock' },
  getCountFromServerMock: vi.fn(),
  getDocsMock: vi.fn(),
  limitMock: vi.fn(),
  orderByMock: vi.fn(),
  queryMock: vi.fn(),
  whereMock: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  getCountFromServer: (...args: unknown[]) => getCountFromServerMock(...args),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  limit: (...args: unknown[]) => limitMock(...args),
  orderBy: (...args: unknown[]) => orderByMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  where: (...args: unknown[]) => whereMock(...args),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: dbMock,
}));

import { useReceivableInvoices } from './useReceivableInvoices';

const createSnapshot = (docs: FirestoreDoc[]) => ({
  docs,
});

const createCountSnapshot = (count: number) => ({
  data: () => ({ count }),
});

describe('useReceivableInvoices', () => {
  beforeEach(() => {
    collectionMock.mockReset();
    getCountFromServerMock.mockReset();
    getDocsMock.mockReset();
    limitMock.mockReset();
    orderByMock.mockReset();
    queryMock.mockReset();
    whereMock.mockReset();

    collectionMock.mockImplementation((...args: unknown[]) => ({
      args,
      type: 'collection',
    }));
    getCountFromServerMock.mockResolvedValue(createCountSnapshot(1));
    limitMock.mockImplementation((value: unknown) => ({
      type: 'limit',
      value,
    }));
    orderByMock.mockImplementation((field: unknown, direction: unknown) => ({
      direction,
      field,
      type: 'orderBy',
    }));
    queryMock.mockImplementation((...args: unknown[]) => ({
      args,
      type: 'query',
    }));
    whereMock.mockImplementation(
      (field: unknown, operator: unknown, value: unknown) => ({
        field,
        operator,
        type: 'where',
        value,
      }),
    );
  });

  it('devuelve estado vacío y no consulta Firestore cuando falta businessId', async () => {
    const { result } = renderHook(() => useReceivableInvoices(null));

    expect(result.current).toMatchObject({
      error: null,
      lastUpdated: null,
      loading: false,
      missingReceivableInvoices: [],
      receivableInvoices: [],
      receivablesByInvoice: {},
      totalCreditInvoicesCount: null,
    });

    await act(async () => {
      await result.current.fetchInvoices(10);
    });

    expect(collectionMock).not.toHaveBeenCalled();
    expect(getDocsMock).not.toHaveBeenCalled();
    expect(getCountFromServerMock).not.toHaveBeenCalled();
  });

  it('oculta datos previos cuando el businessId deja de estar disponible', async () => {
    getDocsMock
      .mockResolvedValueOnce(
        createSnapshot([
          {
            data: () => ({
              data: {
                client: { name: 'Cliente Demo' },
                date: { toMillis: () => 1700000000000 },
                isAddedToReceivables: true,
                numberID: 'F-001',
                totalPurchase: { value: 1250 },
              },
            }),
            id: 'invoice-1',
          },
        ]),
      )
      .mockResolvedValueOnce(
        createSnapshot([
          {
            data: () => ({
              arBalance: 1250,
              invoiceId: 'invoice-1',
              totalReceivable: 1250,
            }),
            get: () => null,
            id: 'ar-1',
          },
        ]),
      );

    const { result, rerender } = renderHook(
      ({ businessId }: { businessId: string | null }) =>
        useReceivableInvoices(businessId),
      {
        initialProps: { businessId: 'business-1' },
      },
    );

    await waitFor(() => expect(result.current.receivableInvoices).toHaveLength(1));
    expect(result.current.receivablesByInvoice['invoice-1']?.id).toBe('ar-1');

    const getDocsCallsBeforeMissingBusiness = getDocsMock.mock.calls.length;

    rerender({ businessId: null });

    expect(result.current).toMatchObject({
      error: null,
      lastUpdated: null,
      loading: false,
      missingReceivableInvoices: [],
      receivableInvoices: [],
      receivablesByInvoice: {},
      totalCreditInvoicesCount: null,
    });
    expect(getDocsMock).toHaveBeenCalledTimes(
      getDocsCallsBeforeMissingBusiness,
    );
  });
});
