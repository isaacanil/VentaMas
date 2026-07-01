import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  collectionMock,
  dbMock,
  limitMock,
  onSnapshotMock,
  orderByMock,
  queryMock,
} = vi.hoisted(() => ({
  collectionMock: vi.fn(),
  dbMock: { name: 'db-mock' },
  limitMock: vi.fn(),
  onSnapshotMock: vi.fn(),
  orderByMock: vi.fn(),
  queryMock: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  limit: (...args: unknown[]) => limitMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  orderBy: (...args: unknown[]) => orderByMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: dbMock,
}));

import {
  DEFAULT_PAYMENT_RUNS_LIMIT,
  MAX_PAYMENT_RUNS_LIMIT,
  subscribeToAccountsPayablePaymentRunEvents,
  subscribeToAccountsPayablePaymentRuns,
} from './paymentRuns.repository';

describe('paymentRuns.repository', () => {
  beforeEach(() => {
    collectionMock.mockReset();
    limitMock.mockReset();
    onSnapshotMock.mockReset();
    orderByMock.mockReset();
    queryMock.mockReset();

    collectionMock.mockReturnValue({ path: 'collection-ref' });
    queryMock.mockImplementation((baseQuery, ...constraints) => ({
      baseQuery,
      constraints,
    }));
    orderByMock.mockImplementation((field, direction) => ({
      direction,
      field,
      type: 'orderBy',
    }));
    limitMock.mockImplementation((value) => ({
      type: 'limit',
      value,
    }));
    onSnapshotMock.mockReturnValue(vi.fn());
  });

  it('reads one extra payment run and trims the visible snapshot', () => {
    const onNext = vi.fn();

    subscribeToAccountsPayablePaymentRuns('business-1', onNext);

    expect(collectionMock).toHaveBeenCalledWith(
      dbMock,
      'businesses',
      'business-1',
      'accountsPayablePaymentRuns',
    );
    expect(queryMock).toHaveBeenCalledWith(
      { path: 'collection-ref' },
      {
        direction: 'desc',
        field: 'createdAt',
        type: 'orderBy',
      },
      {
        direction: 'desc',
        field: '__name__',
        type: 'orderBy',
      },
      {
        type: 'limit',
        value: DEFAULT_PAYMENT_RUNS_LIMIT + 1,
      },
    );

    const [, primaryNext] = onSnapshotMock.mock.calls[0] as [
      unknown,
      (snapshot: unknown) => void,
    ];
    const docs = Array.from(
      { length: DEFAULT_PAYMENT_RUNS_LIMIT + 1 },
      (_, index) => ({
        data: () => ({ id: `run-${index + 1}` }),
        id: `run-${index + 1}`,
      }),
    );

    primaryNext({ docs });

    expect(onNext).toHaveBeenCalledWith(
      expect.objectContaining({
        docs: docs.slice(0, DEFAULT_PAYMENT_RUNS_LIMIT),
      }),
      {
        hasMore: true,
        rawDocCount: DEFAULT_PAYMENT_RUNS_LIMIT + 1,
        visibleDocCount: DEFAULT_PAYMENT_RUNS_LIMIT,
      },
    );
  });

  it('does not flag hasMore when payment run events fit the visible limit', () => {
    const onNext = vi.fn();

    subscribeToAccountsPayablePaymentRunEvents('business-1', onNext, vi.fn(), {
      limit: 2,
    });

    expect(collectionMock).toHaveBeenCalledWith(
      dbMock,
      'businesses',
      'business-1',
      'accountsPayablePaymentRunEvents',
    );
    expect(limitMock).toHaveBeenCalledWith(3);

    const [, primaryNext] = onSnapshotMock.mock.calls[0] as [
      unknown,
      (snapshot: unknown) => void,
    ];
    const snapshot = {
      docs: [
        { data: () => ({ action: 'approve' }), id: 'event-1' },
        { data: () => ({ action: 'submit' }), id: 'event-2' },
      ],
    };

    primaryNext(snapshot);

    expect(onNext).toHaveBeenCalledWith(snapshot, {
      hasMore: false,
      rawDocCount: 2,
      visibleDocCount: 2,
    });
  });

  it('surfaces missing index errors instead of starting an unordered fallback', () => {
    const onError = vi.fn();

    subscribeToAccountsPayablePaymentRuns('business-1', vi.fn(), onError);

    const [, , errorHandler] = onSnapshotMock.mock.calls[0] as [
      unknown,
      unknown,
      (error: unknown) => void,
    ];
    const error = { code: 'failed-precondition' };

    errorHandler(error);

    expect(onError).toHaveBeenCalledWith(error);
    expect(onSnapshotMock).toHaveBeenCalledTimes(1);
  });

  it('caps visible limits while still reading an extra document', () => {
    subscribeToAccountsPayablePaymentRuns('business-1', vi.fn(), vi.fn(), {
      limit: MAX_PAYMENT_RUNS_LIMIT + 50,
    });

    expect(limitMock).toHaveBeenCalledWith(MAX_PAYMENT_RUNS_LIMIT + 1);
  });
});
