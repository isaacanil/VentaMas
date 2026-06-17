import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertBusinessSubscriptionAccessMock,
  assertUserAccessMock,
  cashCountsQuery,
  collectionMock,
  docRefs,
  getDocRef,
  getNextIDTransactionalMock,
  incrementBusinessUsageMetricMock,
  MockHttpsError,
  openCashCountsGetMock,
  resolveCallableAuthUidMock,
  runTransactionMock,
  transaction,
  transactionSetMock,
} = vi.hoisted(() => {
  const hoistedAssertBusinessSubscriptionAccessMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedCollectionMock = vi.fn();
  const hoistedDocRefs = new Map();
  const hoistedGetNextIDTransactionalMock = vi.fn();
  const hoistedIncrementBusinessUsageMetricMock = vi.fn();
  const hoistedOpenCashCountsGetMock = vi.fn();
  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedRunTransactionMock = vi.fn();
  const hoistedTransactionSetMock = vi.fn();
  const hoistedTransaction = {
    set: hoistedTransactionSetMock,
  };

  class HoistedHttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }

  const hoistedCashCountsQuery = {
    where: vi.fn(() => hoistedCashCountsQuery),
    limit: vi.fn(() => ({
      get: hoistedOpenCashCountsGetMock,
    })),
  };

  const hoistedGetDocRef = (path) => {
    if (!hoistedDocRefs.has(path)) {
      hoistedDocRefs.set(path, {
        id: path.split('/').at(-1) ?? null,
        path,
      });
    }
    return hoistedDocRefs.get(path);
  };

  return {
    assertBusinessSubscriptionAccessMock:
      hoistedAssertBusinessSubscriptionAccessMock,
    assertUserAccessMock: hoistedAssertUserAccessMock,
    cashCountsQuery: hoistedCashCountsQuery,
    collectionMock: hoistedCollectionMock,
    docRefs: hoistedDocRefs,
    getDocRef: hoistedGetDocRef,
    getNextIDTransactionalMock: hoistedGetNextIDTransactionalMock,
    incrementBusinessUsageMetricMock: hoistedIncrementBusinessUsageMetricMock,
    MockHttpsError: HoistedHttpsError,
    openCashCountsGetMock: hoistedOpenCashCountsGetMock,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
    runTransactionMock: hoistedRunTransactionMock,
    transaction: hoistedTransaction,
    transactionSetMock: hoistedTransactionSetMock,
  };
});

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: (path) => getDocRef(path),
    collection: (...args) => collectionMock(...args),
    runTransaction: (...args) => runTransactionMock(...args),
  },
  Timestamp: class MockTimestamp {
    constructor(millis) {
      this.millis = millis;
    }

    static fromMillis(millis) {
      return new MockTimestamp(millis);
    }
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../core/utils/getNextID.js', () => ({
  getNextIDTransactional: (...args) => getNextIDTransactionalMock(...args),
}));

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    INVOICE_OPERATOR: ['invoice-operator'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock('../../../versions/v2/billing/config/limitOperations.config.js', () => ({
  LIMIT_OPERATION_KEYS: {
    CASH_REGISTER_OPEN: 'cash-register-open',
  },
}));

vi.mock('../../../versions/v2/billing/services/usage.service.js', () => ({
  incrementBusinessUsageMetric: (...args) =>
    incrementBusinessUsageMetricMock(...args),
}));

vi.mock('../../../versions/v2/billing/utils/subscriptionAccess.util.js', () => ({
  assertBusinessSubscriptionAccess: (...args) =>
    assertBusinessSubscriptionAccessMock(...args),
}));

import { openCashCount } from './openCashCount.js';

const buildRequest = (data = {}) => ({
  data: {
    businessId: 'business-1',
    approvalEmployeeID: 'manager-1',
    cashCount: {
      id: 'cash-1',
      opening: {
        banknotes: [
          {
            ref: 'DOP-100',
            value: '100',
            quantity: '2',
          },
        ],
      },
    },
    ...data,
  },
});

describe('openCashCount identity boundary', () => {
  beforeEach(() => {
    docRefs.clear();
    vi.clearAllMocks();

    resolveCallableAuthUidMock.mockResolvedValue('auth-user');
    assertUserAccessMock.mockResolvedValue(undefined);
    assertBusinessSubscriptionAccessMock.mockResolvedValue(undefined);
    getNextIDTransactionalMock.mockResolvedValue(7);
    incrementBusinessUsageMetricMock.mockResolvedValue({ ok: true });
    openCashCountsGetMock.mockResolvedValue({ empty: true, docs: [] });
    collectionMock.mockImplementation((path) => {
      if (path === 'businesses/business-1/cashCounts') {
        return cashCountsQuery;
      }

      throw new Error(`Unexpected collection path: ${path}`);
    });
    runTransactionMock.mockImplementation(async (callback) =>
      callback(transaction),
    );
  });

  it.each(['employeeID', 'employeeId'])(
    'rejects a payload %s that targets a different cashier',
    async (employeeKey) => {
      await expect(
        openCashCount(buildRequest({ [employeeKey]: 'other-user' })),
      ).rejects.toMatchObject({
        code: 'permission-denied',
      });

      expect(assertUserAccessMock).not.toHaveBeenCalled();
      expect(assertBusinessSubscriptionAccessMock).not.toHaveBeenCalled();
      expect(collectionMock).not.toHaveBeenCalled();
      expect(runTransactionMock).not.toHaveBeenCalled();
      expect(incrementBusinessUsageMetricMock).not.toHaveBeenCalled();
    },
  );

  it('opens the cash count for the authenticated uid when no employee is supplied', async () => {
    await expect(openCashCount(buildRequest())).resolves.toEqual({
      ok: true,
      businessId: 'business-1',
      cashCountId: 'cash-1',
    });

    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'auth-user',
      businessId: 'business-1',
      allowedRoles: ['invoice-operator'],
    });
    expect(assertBusinessSubscriptionAccessMock).toHaveBeenCalledWith({
      businessId: 'business-1',
      action: 'write',
      operation: 'cash-register-open',
    });

    expect(cashCountsQuery.where).toHaveBeenCalledWith(
      'cashCount.opening.employee',
      '==',
      expect.objectContaining({
        path: 'users/auth-user',
      }),
    );
    expect(getNextIDTransactionalMock).toHaveBeenCalledWith(
      transaction,
      { uid: 'auth-user', businessID: 'business-1' },
      'lastCashCountId',
      1,
    );

    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/cashCounts/cash-1',
      }),
      expect.objectContaining({
        cashCount: expect.objectContaining({
          id: 'cash-1',
          incrementNumber: 7,
          state: 'open',
          opening: expect.objectContaining({
            employee: expect.objectContaining({
              path: 'users/auth-user',
            }),
            approvalEmployee: expect.objectContaining({
              path: 'users/manager-1',
            }),
            initialized: true,
            banknotes: [
              {
                ref: 'DOP-100',
                value: 100,
                quantity: 2,
              },
            ],
          }),
          stateHistory: [
            expect.objectContaining({
              state: 'open',
              updatedBy: 'auth-user',
            }),
          ],
        }),
      }),
    );
    expect(incrementBusinessUsageMetricMock).toHaveBeenCalledWith({
      businessId: 'business-1',
      metricKey: 'openCashRegisters',
      incrementBy: 1,
    });
  });
});
