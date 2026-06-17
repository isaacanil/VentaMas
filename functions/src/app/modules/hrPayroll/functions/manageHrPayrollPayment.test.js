import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  collectionSnapshots,
  documentRefs,
  documentSnapshots,
  getDocRef,
  makeQuery,
  MockHttpsError,
  resolveCallableAuthUidMock,
  runTransactionMock,
  setCalls,
} = vi.hoisted(() => {
  const hoistedCollectionSnapshots = new Map();
  const hoistedDocumentRefs = new Map();
  const hoistedDocumentSnapshots = new Map();
  const hoistedSetCalls = [];

  class HoistedHttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }

  const hoistedGetDocRef = (path) => {
    if (!hoistedDocumentRefs.has(path)) {
      hoistedDocumentRefs.set(path, {
        id: path.split('/').at(-1) ?? null,
        path,
      });
    }
    return hoistedDocumentRefs.get(path);
  };

  const toDocSnapshot = (collectionPath, entry) => ({
    exists: entry?.data != null,
    id: entry?.id ?? collectionPath.split('/').at(-1) ?? null,
    ref: hoistedGetDocRef(`${collectionPath}/${entry?.id}`),
    data: () => entry?.data,
  });

  const toSingleSnapshot = (ref) => {
    const data = hoistedDocumentSnapshots.get(ref.path);
    return {
      exists: data != null,
      id: ref.id,
      ref,
      data: () => data,
    };
  };

  const executeQuery = (queryRef) => {
    const entries = hoistedCollectionSnapshots.get(queryRef.path) ?? [];
    const filteredEntries = (queryRef.filters ?? []).reduce(
      (current, filter) =>
        current.filter((entry) => entry.data?.[filter.field] === filter.value),
      entries,
    );

    return {
      docs: filteredEntries.map((entry) => toDocSnapshot(queryRef.path, entry)),
    };
  };

  const makeQuery = (path, filters = []) => ({
    path,
    filters,
    where(field, operator, value) {
      return makeQuery(path, [...filters, { field, operator, value }]);
    },
    get: vi.fn(async () => executeQuery({ path, filters })),
  });

  return {
    assertUserAccessMock: vi.fn(),
    collectionSnapshots: hoistedCollectionSnapshots,
    documentRefs: hoistedDocumentRefs,
    documentSnapshots: hoistedDocumentSnapshots,
    getDocRef: hoistedGetDocRef,
    makeQuery,
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: vi.fn(),
    runTransactionMock: vi.fn(async (callback) =>
      callback({
        get: vi.fn(async (ref) =>
          ref?.filters ? executeQuery(ref) : toSingleSnapshot(ref),
        ),
        set: vi.fn((ref, data, options) => {
          hoistedSetCalls.push({ data, options, ref });
        }),
      }),
    ),
    setCalls: hoistedSetCalls,
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  FieldValue: {
    serverTimestamp: () => 'server-timestamp',
  },
  Timestamp: class MockTimestamp {
    static fromDate(date) {
      return { date, toDate: () => date };
    }
  },
  db: {
    collection: (path) => makeQuery(path),
    doc: (path) => ({
      ...getDocRef(path),
      get: vi.fn(async () => {
        const data = documentSnapshots.get(path);
        return {
          exists: data != null,
          id: path.split('/').at(-1) ?? null,
          ref: getDocRef(path),
          data: () => data,
        };
      }),
    }),
    runTransaction: (...args) => runTransactionMock(...args),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    ACCOUNTING_WRITE: ['accounting-write'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock('../services/hrPayrollPayments.service.js', () => ({
  buildHrPayrollPaymentAggregateStatusPatch: () => ({
    status: 'partially_paid',
    updatedAt: 'server-timestamp',
  }),
  buildHrPayrollPaymentDocuments: ({ line }) => ({
    ok: true,
    payment: {
      id: 'payment-1',
      businessId: 'business-1',
      payrollLineId: line.id,
      periodId: line.periodId,
      payrollRunId: line.payrollRunId,
      employeeId: line.employeeId,
      amount: line.netAmount,
      currency: 'DOP',
      status: 'confirmed',
      accountingEventId: 'event-1',
      cashMovementIds: [],
    },
    accountingEvent: { id: 'event-1' },
    cashMovements: [],
    linePatch: {
      status: 'paid',
      employeePaymentId: 'payment-1',
      paymentAccountingEventId: 'event-1',
    },
    entryPatch: {
      status: 'paid',
      employeePaymentId: 'payment-1',
      paymentAccountingEventId: 'event-1',
    },
  }),
  buildHrPayrollPaymentId: () => 'payment-1',
}));

import { manageHrPayrollPayment } from './manageHrPayrollPayment.js';

const buildRequest = (data) => ({ data });

describe('manageHrPayrollPayment retroactive entries', () => {
  beforeEach(() => {
    collectionSnapshots.clear();
    documentRefs.clear();
    documentSnapshots.clear();
    setCalls.length = 0;
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue('admin-1');
    assertUserAccessMock.mockResolvedValue(undefined);
  });

  it('marks regular and retroactive commission entries as paid', async () => {
    const line = {
      id: 'line-1',
      businessId: 'business-1',
      periodId: 'period-1',
      payrollRunId: 'run-1',
      employeeId: 'emp-1',
      status: 'approved',
      netAmount: 125,
      commissionEntryIds: ['entry-normal'],
      retroactiveEntryIds: ['entry-retro'],
    };
    documentSnapshots.set(
      'businesses/business-1/hrPayrollEmployeeLines/line-1',
      line,
    );
    collectionSnapshots.set('businesses/business-1/hrPayrollEmployeeLines', [
      { id: 'line-1', data: line },
    ]);

    const result = await manageHrPayrollPayment(
      buildRequest({
        action: 'record',
        businessId: 'business-1',
        payrollLineId: 'line-1',
        paymentDate: '2026-06-30T12:00:00.000Z',
      }),
    );

    expect(result).toMatchObject({
      ok: true,
      paymentId: 'payment-1',
    });
    expect(setCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ref: expect.objectContaining({
            path: 'businesses/business-1/hrCommissionEntries/entry-normal',
          }),
          data: expect.objectContaining({
            status: 'paid',
            employeePaymentId: 'payment-1',
          }),
        }),
        expect.objectContaining({
          ref: expect.objectContaining({
            path: 'businesses/business-1/hrCommissionEntries/entry-retro',
          }),
          data: expect.objectContaining({
            status: 'paid',
            employeePaymentId: 'payment-1',
            isRetroactive: true,
            retroactiveResolutionStatus: 'paid',
            retroactiveTargetPeriodId: 'period-1',
            retroactiveTargetPayrollRunId: 'run-1',
            retroactiveTargetLineId: 'line-1',
          }),
        }),
      ]),
    );
  });
});
