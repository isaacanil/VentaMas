import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  collectionMock,
  countMock,
  dbMock,
  getAggregateFromServerMock,
  limitMock,
  onSnapshotMock,
  orderByMock,
  queryMock,
  sumMock,
  timestampFromMillisMock,
  whereMock,
} = vi.hoisted(() => ({
  collectionMock: vi.fn(),
  countMock: vi.fn(),
  dbMock: { name: 'db-mock' },
  getAggregateFromServerMock: vi.fn(),
  limitMock: vi.fn(),
  onSnapshotMock: vi.fn(),
  orderByMock: vi.fn(),
  queryMock: vi.fn(),
  sumMock: vi.fn(),
  timestampFromMillisMock: vi.fn(),
  whereMock: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  count: (...args: unknown[]) => countMock(...args),
  getAggregateFromServer: (...args: unknown[]) =>
    getAggregateFromServerMock(...args),
  limit: (...args: unknown[]) => limitMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  orderBy: (...args: unknown[]) => orderByMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  sum: (...args: unknown[]) => sumMock(...args),
  Timestamp: {
    fromMillis: (...args: unknown[]) => timestampFromMillisMock(...args),
  },
  where: (...args: unknown[]) => whereMock(...args),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: dbMock,
}));

import {
  DEFAULT_VENDOR_BILL_QUERY_LIMIT,
  DEFAULT_VENDOR_BILL_QUERY_STATUSES,
  MAX_VENDOR_BILL_QUERY_LIMIT,
  fetchVendorBillAgingAggregateSummary,
  subscribeToVendorBills,
} from './vendorBills.repository';

const aggregateSnapshot = (data: Record<string, unknown>) => ({
  data: () => data,
});

const startOfDay = (millis: number): number => {
  const date = new Date(millis);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

describe('vendorBills.repository', () => {
  beforeEach(() => {
    collectionMock.mockReset();
    countMock.mockReset();
    getAggregateFromServerMock.mockReset();
    limitMock.mockReset();
    onSnapshotMock.mockReset();
    orderByMock.mockReset();
    queryMock.mockReset();
    sumMock.mockReset();
    timestampFromMillisMock.mockReset();
    whereMock.mockReset();

    collectionMock.mockReturnValue({
      path: 'businesses/business-1/vendorBills',
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
    countMock.mockReturnValue({ type: 'count' });
    sumMock.mockImplementation((field) => ({
      field,
      type: 'sum',
    }));
    timestampFromMillisMock.mockImplementation((millis) => ({
      millis,
      type: 'timestamp',
    }));
    onSnapshotMock.mockReturnValue(vi.fn());
  });

  it('subscribes to open vendor bills by default', () => {
    const onNext = vi.fn();

    subscribeToVendorBills('business-1', null, onNext);

    expect(collectionMock).toHaveBeenCalledWith(
      dbMock,
      'businesses',
      'business-1',
      'vendorBills',
    );
    expect(whereMock).toHaveBeenCalledWith('status', 'in', [
      ...DEFAULT_VENDOR_BILL_QUERY_STATUSES,
    ]);
    expect(queryMock).toHaveBeenCalledWith(
      { path: 'businesses/business-1/vendorBills' },
      {
        field: 'status',
        operator: 'in',
        value: [...DEFAULT_VENDOR_BILL_QUERY_STATUSES],
      },
      {
        direction: 'asc',
        field: 'dueAt',
        type: 'orderBy',
      },
      {
        direction: 'asc',
        field: '__name__',
        type: 'orderBy',
      },
      {
        type: 'limit',
        value: DEFAULT_VENDOR_BILL_QUERY_LIMIT + 1,
      },
    );
    expect(onSnapshotMock).toHaveBeenCalledWith(
      {
        baseQuery: { path: 'businesses/business-1/vendorBills' },
        constraints: [
          {
            field: 'status',
            operator: 'in',
            value: [...DEFAULT_VENDOR_BILL_QUERY_STATUSES],
          },
          {
            direction: 'asc',
            field: 'dueAt',
            type: 'orderBy',
          },
          {
            direction: 'asc',
            field: '__name__',
            type: 'orderBy',
          },
          {
            type: 'limit',
            value: DEFAULT_VENDOR_BILL_QUERY_LIMIT + 1,
          },
        ],
      },
      expect.any(Function),
      expect.any(Function),
    );

    const [, primaryNext] = onSnapshotMock.mock.calls[0] as [
      unknown,
      (snapshot: unknown) => void,
    ];
    const primarySnapshot = {
      docs: [
        {
          data: () => ({
            status: DEFAULT_VENDOR_BILL_QUERY_STATUSES[0],
          }),
        },
      ],
    };
    primaryNext(primarySnapshot);

    expect(onNext).toHaveBeenCalledWith(primarySnapshot, {
      hasMore: false,
      isClientFiltered: false,
      rawDocCount: 1,
      visibleDocCount: 1,
    });
  });

  it('reads one extra vendor bill to expose when more results exist', () => {
    const onNext = vi.fn();

    subscribeToVendorBills('business-1', null, onNext);

    const [, primaryNext] = onSnapshotMock.mock.calls[0] as [
      unknown,
      (snapshot: unknown) => void,
    ];
    const docs = Array.from(
      { length: DEFAULT_VENDOR_BILL_QUERY_LIMIT + 1 },
      (_, index) => ({
        data: () => ({
          reference: index + 1,
          status: DEFAULT_VENDOR_BILL_QUERY_STATUSES[0],
        }),
      }),
    );

    primaryNext({ docs });

    expect(onNext).toHaveBeenCalledWith(
      expect.objectContaining({
        docs: docs.slice(0, DEFAULT_VENDOR_BILL_QUERY_LIMIT),
      }),
      {
        hasMore: true,
        isClientFiltered: false,
        rawDocCount: DEFAULT_VENDOR_BILL_QUERY_LIMIT + 1,
        visibleDocCount: DEFAULT_VENDOR_BILL_QUERY_LIMIT,
      },
    );
  });

  it('orders open vendor bills by descending due date when requested', () => {
    subscribeToVendorBills(
      'business-1',
      {
        dueAtDirection: 'desc',
      },
      vi.fn(),
    );

    expect(queryMock).toHaveBeenCalledWith(
      { path: 'businesses/business-1/vendorBills' },
      {
        field: 'status',
        operator: 'in',
        value: [...DEFAULT_VENDOR_BILL_QUERY_STATUSES],
      },
      {
        direction: 'desc',
        field: 'dueAt',
        type: 'orderBy',
      },
      {
        direction: 'desc',
        field: '__name__',
        type: 'orderBy',
      },
      {
        type: 'limit',
        value: DEFAULT_VENDOR_BILL_QUERY_LIMIT + 1,
      },
    );
  });

  it('passes subscription errors to the provided handler', () => {
    const onNext = vi.fn();
    const onError = vi.fn();

    subscribeToVendorBills('business-1', null, onNext, onError);

    expect(onSnapshotMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Function),
      expect.any(Function),
    );

    const [, , errorHandler] = onSnapshotMock.mock.calls[0] as [
      unknown,
      unknown,
      (error: unknown) => void,
    ];
    const error = { code: 'permission-denied' };
    errorHandler(error);

    expect(onError).toHaveBeenCalledWith(error);
  });

  it('falls back to an index-light query when the optimized query index is missing', () => {
    const onNext = vi.fn();
    const primaryUnsubscribe = vi.fn();
    const fallbackUnsubscribe = vi.fn();
    onSnapshotMock
      .mockReturnValueOnce(primaryUnsubscribe)
      .mockReturnValueOnce(fallbackUnsubscribe);

    const unsubscribe = subscribeToVendorBills('business-1', null, onNext);

    const [, , errorHandler] = onSnapshotMock.mock.calls[0] as [
      unknown,
      unknown,
      (error: unknown) => void,
    ];
    errorHandler({ code: 'failed-precondition' });

    expect(primaryUnsubscribe).toHaveBeenCalledTimes(1);
    expect(queryMock).toHaveBeenLastCalledWith(
      { path: 'businesses/business-1/vendorBills' },
      {
        field: 'status',
        operator: 'in',
        value: [...DEFAULT_VENDOR_BILL_QUERY_STATUSES],
      },
      {
        type: 'limit',
        value: DEFAULT_VENDOR_BILL_QUERY_LIMIT + 1,
      },
    );
    expect(onSnapshotMock).toHaveBeenCalledTimes(2);

    const [, fallbackNext] = onSnapshotMock.mock.calls[1] as [
      unknown,
      (snapshot: unknown) => void,
    ];
    const fallbackSnapshot = {
      docs: [
        {
          data: () => ({
            status: DEFAULT_VENDOR_BILL_QUERY_STATUSES[0],
          }),
        },
      ],
    };
    fallbackNext(fallbackSnapshot);

    expect(onNext).toHaveBeenCalledWith(fallbackSnapshot, {
      hasMore: false,
      isClientFiltered: false,
      rawDocCount: 1,
      visibleDocCount: 1,
    });

    unsubscribe();
    expect(fallbackUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('client-filters fallback results to preserve ERP workbench filters', () => {
    const onNext = vi.fn();
    const primaryUnsubscribe = vi.fn();
    onSnapshotMock
      .mockReturnValueOnce(primaryUnsubscribe)
      .mockReturnValue(vi.fn());

    subscribeToVendorBills(
      'business-1',
      {
        condition: 'thirty_days',
        paymentControlStatus: 'payable',
        providerId: 'supplier-1',
      },
      onNext,
    );

    const [, , errorHandler] = onSnapshotMock.mock.calls[0] as [
      unknown,
      unknown,
      (error: unknown) => void,
    ];
    errorHandler({ code: 'failed-precondition' });

    expect(queryMock).toHaveBeenLastCalledWith(
      { path: 'businesses/business-1/vendorBills' },
      {
        field: 'supplierId',
        operator: '==',
        value: 'supplier-1',
      },
      {
        type: 'limit',
        value: DEFAULT_VENDOR_BILL_QUERY_LIMIT + 1,
      },
    );

    const [, fallbackNext] = onSnapshotMock.mock.calls[1] as [
      unknown,
      (snapshot: unknown) => void,
    ];
    fallbackNext({
      docs: [
        {
          data: () => ({
            paymentControl: { status: 'payable' },
            paymentTerms: { condition: 'thirty_days' },
            status: DEFAULT_VENDOR_BILL_QUERY_STATUSES[0],
            supplierId: 'supplier-1',
          }),
        },
        {
          data: () => ({
            paymentControl: { status: 'payable' },
            paymentTerms: { condition: 'cash' },
            status: DEFAULT_VENDOR_BILL_QUERY_STATUSES[0],
            supplierId: 'supplier-1',
          }),
        },
      ],
    });

    expect(onNext).toHaveBeenCalledWith(
      expect.objectContaining({
        docs: [expect.any(Object)],
      }),
      {
        hasMore: false,
        isClientFiltered: true,
        rawDocCount: 2,
        visibleDocCount: 1,
      },
    );
  });

  it('combines open status with provider and payment condition filters', () => {
    subscribeToVendorBills(
      'business-1',
      {
        condition: 'thirty_days',
        paymentControlStatus: 'payable',
        providerId: 'supplier-1',
      },
      vi.fn(),
    );

    expect(queryMock).toHaveBeenCalledWith(
      { path: 'businesses/business-1/vendorBills' },
      {
        field: 'status',
        operator: 'in',
        value: [...DEFAULT_VENDOR_BILL_QUERY_STATUSES],
      },
      {
        field: 'paymentTerms.condition',
        operator: '==',
        value: 'thirty_days',
      },
      {
        field: 'paymentControl.status',
        operator: '==',
        value: 'payable',
      },
      {
        field: 'supplierId',
        operator: '==',
        value: 'supplier-1',
      },
      {
        direction: 'asc',
        field: 'dueAt',
        type: 'orderBy',
      },
      {
        direction: 'asc',
        field: '__name__',
        type: 'orderBy',
      },
      {
        type: 'limit',
        value: DEFAULT_VENDOR_BILL_QUERY_LIMIT + 1,
      },
    );
  });

  it('allows explicit status scopes for administrative reads', () => {
    subscribeToVendorBills(
      'business-1',
      {
        providerId: 'supplier-1',
        statuses: [],
      },
      vi.fn(),
    );

    expect(whereMock).toHaveBeenCalledTimes(1);
    expect(whereMock).toHaveBeenCalledWith('supplierId', '==', 'supplier-1');
    expect(queryMock).toHaveBeenCalledWith(
      { path: 'businesses/business-1/vendorBills' },
      {
        field: 'supplierId',
        operator: '==',
        value: 'supplier-1',
      },
      {
        direction: 'asc',
        field: 'dueAt',
        type: 'orderBy',
      },
      {
        direction: 'asc',
        field: '__name__',
        type: 'orderBy',
      },
      {
        type: 'limit',
        value: DEFAULT_VENDOR_BILL_QUERY_LIMIT + 1,
      },
    );
  });

  it('uses custom query limits above the initial workbench batch', () => {
    subscribeToVendorBills(
      'business-1',
      {
        limit: 1000,
      },
      vi.fn(),
    );

    expect(limitMock).toHaveBeenCalledWith(1001);
  });

  it('caps custom query limits to the ERP workbench maximum', () => {
    subscribeToVendorBills(
      'business-1',
      {
        limit: MAX_VENDOR_BILL_QUERY_LIMIT + 500,
      },
      vi.fn(),
    );

    expect(limitMock).toHaveBeenCalledWith(MAX_VENDOR_BILL_QUERY_LIMIT + 1);
  });

  it('fetches server aggregate totals and aging buckets without relying on the visible batch', async () => {
    const now = new Date('2026-07-01T15:30:00.000Z').getTime();
    const todayStart = startOfDay(now);
    const thirtyDaysAgoStart = todayStart - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgoStart = todayStart - 60 * 24 * 60 * 60 * 1000;
    getAggregateFromServerMock
      .mockResolvedValueOnce(
        aggregateSnapshot({
          totalBalanceAmount: 500,
          totalCount: 3,
        }),
      )
      .mockResolvedValueOnce(
        aggregateSnapshot({
          totalBalanceAmount: 250,
          totalCount: 2,
        }),
      )
      .mockResolvedValueOnce(
        aggregateSnapshot({
          totalBalanceAmount: 200,
          totalCount: 1,
        }),
      )
      .mockResolvedValueOnce(
        aggregateSnapshot({
          totalBalanceAmount: 150,
          totalCount: 1,
        }),
      )
      .mockResolvedValueOnce(
        aggregateSnapshot({
          totalBalanceAmount: 100,
          totalCount: 1,
        }),
      );

    const summary = await fetchVendorBillAgingAggregateSummary(
      'business-1',
      null,
      now,
    );

    expect(summary).toEqual({
      buckets: [
        { balanceAmount: 500, count: 3, key: 'current' },
        { balanceAmount: 250, count: 2, key: 'due_1_30' },
        { balanceAmount: 200, count: 1, key: 'due_31_60' },
        { balanceAmount: 150, count: 1, key: 'due_61_plus' },
        { balanceAmount: 100, count: 1, key: 'no_due_date' },
      ],
      totalBalanceAmount: 1200,
      totalCount: 8,
    });
    expect(getAggregateFromServerMock).toHaveBeenCalledTimes(5);
    expect(getAggregateFromServerMock).toHaveBeenNthCalledWith(
      1,
      {
        baseQuery: { path: 'businesses/business-1/vendorBills' },
        constraints: [
          {
            field: 'status',
            operator: 'in',
            value: [...DEFAULT_VENDOR_BILL_QUERY_STATUSES],
          },
          {
            field: 'dueAt',
            operator: '>=',
            value: { millis: todayStart, type: 'timestamp' },
          },
        ],
      },
      {
        totalBalanceAmount: {
          field: 'paymentState.balance',
          type: 'sum',
        },
        totalCount: { type: 'count' },
      },
    );
    expect(getAggregateFromServerMock.mock.calls[1][0]).toEqual({
      baseQuery: { path: 'businesses/business-1/vendorBills' },
      constraints: [
        {
          field: 'status',
          operator: 'in',
          value: [...DEFAULT_VENDOR_BILL_QUERY_STATUSES],
        },
        {
          field: 'dueAt',
          operator: '>=',
          value: { millis: thirtyDaysAgoStart, type: 'timestamp' },
        },
        {
          field: 'dueAt',
          operator: '<',
          value: { millis: todayStart, type: 'timestamp' },
        },
      ],
    });
    expect(getAggregateFromServerMock.mock.calls[2][0]).toEqual({
      baseQuery: { path: 'businesses/business-1/vendorBills' },
      constraints: [
        {
          field: 'status',
          operator: 'in',
          value: [...DEFAULT_VENDOR_BILL_QUERY_STATUSES],
        },
        {
          field: 'dueAt',
          operator: '>=',
          value: { millis: sixtyDaysAgoStart, type: 'timestamp' },
        },
        {
          field: 'dueAt',
          operator: '<',
          value: { millis: thirtyDaysAgoStart, type: 'timestamp' },
        },
      ],
    });
    expect(getAggregateFromServerMock.mock.calls[3][0]).toEqual({
      baseQuery: { path: 'businesses/business-1/vendorBills' },
      constraints: [
        {
          field: 'status',
          operator: 'in',
          value: [...DEFAULT_VENDOR_BILL_QUERY_STATUSES],
        },
        {
          field: 'dueAt',
          operator: '<',
          value: { millis: sixtyDaysAgoStart, type: 'timestamp' },
        },
      ],
    });
    expect(getAggregateFromServerMock.mock.calls[4][0]).toEqual({
      baseQuery: { path: 'businesses/business-1/vendorBills' },
      constraints: [
        {
          field: 'status',
          operator: 'in',
          value: [...DEFAULT_VENDOR_BILL_QUERY_STATUSES],
        },
        {
          field: 'dueAt',
          operator: '==',
          value: null,
        },
      ],
    });
  });

  it('uses server-side aggregate filters and ignores list ordering and limits', async () => {
    const now = new Date('2026-07-01T15:30:00.000Z').getTime();
    const todayStart = startOfDay(now);
    getAggregateFromServerMock.mockResolvedValue(
      aggregateSnapshot({
        totalBalanceAmount: 0,
        totalCount: 0,
      }),
    );

    await fetchVendorBillAgingAggregateSummary(
      'business-1',
      {
        condition: 'thirty_days',
        dueAtDirection: 'desc',
        limit: 1000,
        paymentControlStatus: 'payable',
        providerId: 'supplier-1',
        statuses: [],
      },
      now,
    );

    expect(orderByMock).not.toHaveBeenCalled();
    expect(limitMock).not.toHaveBeenCalled();
    expect(getAggregateFromServerMock.mock.calls[0][0]).toEqual({
      baseQuery: { path: 'businesses/business-1/vendorBills' },
      constraints: [
        {
          field: 'paymentTerms.condition',
          operator: '==',
          value: 'thirty_days',
        },
        {
          field: 'paymentControl.status',
          operator: '==',
          value: 'payable',
        },
        {
          field: 'supplierId',
          operator: '==',
          value: 'supplier-1',
        },
        {
          field: 'dueAt',
          operator: '>=',
          value: { millis: todayStart, type: 'timestamp' },
        },
      ],
    });
  });
});
