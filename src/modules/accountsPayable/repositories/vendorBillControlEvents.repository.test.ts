import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  collectionMock,
  dbMock,
  limitMock,
  onSnapshotMock,
  orderByMock,
  queryMock,
  whereMock,
} = vi.hoisted(() => ({
  collectionMock: vi.fn(),
  dbMock: { name: 'db-mock' },
  limitMock: vi.fn(),
  onSnapshotMock: vi.fn(),
  orderByMock: vi.fn(),
  queryMock: vi.fn(),
  whereMock: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  limit: (...args: unknown[]) => limitMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  orderBy: (...args: unknown[]) => orderByMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  where: (...args: unknown[]) => whereMock(...args),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: dbMock,
}));

import {
  DEFAULT_VENDOR_BILL_CONTROL_EVENTS_LIMIT,
  MAX_VENDOR_BILL_CONTROL_EVENTS_LIMIT,
  subscribeToVendorBillControlEvents,
} from './vendorBillControlEvents.repository';

describe('vendorBillControlEvents.repository', () => {
  beforeEach(() => {
    collectionMock.mockReset();
    limitMock.mockReset();
    onSnapshotMock.mockReset();
    orderByMock.mockReset();
    queryMock.mockReset();
    whereMock.mockReset();

    collectionMock.mockReturnValue({
      path: 'businesses/business-1/vendorBillControlEvents',
    });
    queryMock.mockImplementation((baseQuery, ...constraints) => ({
      baseQuery,
      constraints,
    }));
    whereMock.mockImplementation((field, operator, value) => ({
      field,
      operator,
      value,
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

  it('subscribes to recent control events by vendor bill id', () => {
    const onNext = vi.fn();
    const onError = vi.fn();

    subscribeToVendorBillControlEvents(
      'business-1',
      'purchase:purchase-1',
      onNext,
      onError,
    );

    expect(collectionMock).toHaveBeenCalledWith(
      dbMock,
      'businesses',
      'business-1',
      'vendorBillControlEvents',
    );
    expect(whereMock).toHaveBeenCalledWith(
      'vendorBillId',
      '==',
      'purchase:purchase-1',
    );
    expect(queryMock).toHaveBeenCalledWith(
      { path: 'businesses/business-1/vendorBillControlEvents' },
      {
        field: 'vendorBillId',
        operator: '==',
        value: 'purchase:purchase-1',
      },
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
        value: DEFAULT_VENDOR_BILL_CONTROL_EVENTS_LIMIT,
      },
    );
    expect(onSnapshotMock).toHaveBeenCalledWith(
      {
        baseQuery: { path: 'businesses/business-1/vendorBillControlEvents' },
        constraints: [
          {
            field: 'vendorBillId',
            operator: '==',
            value: 'purchase:purchase-1',
          },
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
            value: DEFAULT_VENDOR_BILL_CONTROL_EVENTS_LIMIT,
          },
        ],
      },
      onNext,
      expect.any(Function),
    );
  });

  it('passes non-index subscription errors to the provided handler', () => {
    const onNext = vi.fn();
    const onError = vi.fn();

    subscribeToVendorBillControlEvents(
      'business-1',
      'purchase:purchase-1',
      onNext,
      onError,
    );

    const [, , errorHandler] = onSnapshotMock.mock.calls[0] as [
      unknown,
      unknown,
      (error: unknown) => void,
    ];
    const error = { code: 'permission-denied' };
    errorHandler(error);

    expect(onError).toHaveBeenCalledWith(error);
    expect(onSnapshotMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to an index-light query when the ordered audit index is missing', () => {
    const onNext = vi.fn();
    const onError = vi.fn();
    const primaryUnsubscribe = vi.fn();
    const fallbackUnsubscribe = vi.fn();
    onSnapshotMock
      .mockReturnValueOnce(primaryUnsubscribe)
      .mockReturnValueOnce(fallbackUnsubscribe);

    const unsubscribe = subscribeToVendorBillControlEvents(
      'business-1',
      'purchase:purchase-1',
      onNext,
      onError,
    );

    const [, , errorHandler] = onSnapshotMock.mock.calls[0] as [
      unknown,
      unknown,
      (error: unknown) => void,
    ];
    errorHandler({ code: 'failed-precondition' });

    expect(primaryUnsubscribe).toHaveBeenCalledOnce();
    expect(queryMock).toHaveBeenLastCalledWith(
      { path: 'businesses/business-1/vendorBillControlEvents' },
      {
        field: 'vendorBillId',
        operator: '==',
        value: 'purchase:purchase-1',
      },
      {
        type: 'limit',
        value: DEFAULT_VENDOR_BILL_CONTROL_EVENTS_LIMIT,
      },
    );
    expect(onSnapshotMock).toHaveBeenCalledTimes(2);

    const [, fallbackNext] = onSnapshotMock.mock.calls[1] as [
      unknown,
      (snapshot: unknown) => void,
    ];
    const fallbackSnapshot = { docs: [] };
    fallbackNext(fallbackSnapshot);

    expect(onNext).toHaveBeenCalledWith(fallbackSnapshot);

    unsubscribe();
    expect(fallbackUnsubscribe).toHaveBeenCalledOnce();
  });

  it('caps custom limits to keep the audit query bounded', () => {
    subscribeToVendorBillControlEvents(
      'business-1',
      'purchase:purchase-1',
      vi.fn(),
      vi.fn(),
      { limit: MAX_VENDOR_BILL_CONTROL_EVENTS_LIMIT + 50 },
    );

    expect(limitMock).toHaveBeenCalledWith(
      MAX_VENDOR_BILL_CONTROL_EVENTS_LIMIT,
    );
  });
});
