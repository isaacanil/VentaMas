import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertBusinessSubscriptionAccessMock,
  assertUserAccessMock,
  businessDocMock,
  dbCollectionMock,
  MockHttpsError,
  productStockQueryMock,
  resolveCallableAuthUidMock,
} = vi.hoisted(() => {
  class HoistedHttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }

  const queryMock = {};
  queryMock.select = vi.fn(() => queryMock);
  queryMock.where = vi.fn(() => queryMock);
  queryMock.stream = vi.fn(() => (async function* emptyProductStocks() {})());

  const docMock = vi.fn((businessId) => ({
    id: businessId,
    collection: vi.fn((collectionName) => {
      if (collectionName === 'productsStock') {
        return queryMock;
      }

      return {
        doc: vi.fn((docId) => ({
          id: docId,
          path: `businesses/${businessId}/${collectionName}/${docId}`,
        })),
      };
    }),
  }));

  const collectionMock = vi.fn((collectionName) => {
    if (collectionName === 'businesses') {
      return {
        doc: docMock,
      };
    }

    return queryMock;
  });

  return {
    assertBusinessSubscriptionAccessMock: vi.fn(),
    assertUserAccessMock: vi.fn(),
    businessDocMock: docMock,
    dbCollectionMock: collectionMock,
    MockHttpsError: HoistedHttpsError,
    productStockQueryMock: queryMock,
    resolveCallableAuthUidMock: vi.fn(),
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (...args) => args.at(-1),
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    bulkWriter: vi.fn(() => ({
      close: vi.fn(),
      onWriteError: vi.fn(),
      update: vi.fn(),
    })),
    collection: (...args) => dbCollectionMock(...args),
  },
  serverTimestamp: vi.fn(() => 'server-timestamp'),
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    MAINTENANCE: ['maintenance'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock(
  '../../../versions/v2/billing/utils/subscriptionAccess.util.js',
  () => ({
    assertBusinessSubscriptionAccess: (...args) =>
      assertBusinessSubscriptionAccessMock(...args),
  }),
);

vi.mock('../utils/stockQuantity.util.js', () => ({
  normalizePositiveStockQuantity: vi.fn((value) => Number(value) || 0),
}));

import { recalculateProductStockTotals } from './recalculateProductStockTotals.js';

describe('recalculateProductStockTotals auth boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue('resolved-user');
    assertUserAccessMock.mockResolvedValue(undefined);
    assertBusinessSubscriptionAccessMock.mockResolvedValue(undefined);
    productStockQueryMock.stream.mockImplementation(() =>
      (async function* emptyProductStocks() {})(),
    );
  });

  it('rejects before access checks or stock services when no actor resolves', async () => {
    resolveCallableAuthUidMock.mockResolvedValue(null);

    const request = {
      data: {
        businessId: 'business-from-payload',
        user: {
          uid: 'spoofed-user',
        },
      },
    };

    await expect(recalculateProductStockTotals(request)).rejects.toMatchObject({
      code: 'unauthenticated',
    });

    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith(request);
    expect(assertUserAccessMock).not.toHaveBeenCalled();
    expect(assertBusinessSubscriptionAccessMock).not.toHaveBeenCalled();
    expect(dbCollectionMock).not.toHaveBeenCalled();
  });

  it('passes the resolved actor to assertUserAccess and preserves payload businessId', async () => {
    const request = {
      auth: {
        uid: 'firebase-user',
        token: {
          businessId: 'business-from-token',
        },
      },
      data: {
        businessId: 'business-from-payload',
        user: {
          businessID: 'business-from-user',
        },
      },
    };

    await expect(recalculateProductStockTotals(request)).resolves.toMatchObject(
      {
        businessId: 'business-from-payload',
        processedStocks: 0,
        productsUpdated: 0,
      },
    );

    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith(request);
    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'resolved-user',
      businessId: 'business-from-payload',
      allowedRoles: ['maintenance'],
    });
    expect(assertBusinessSubscriptionAccessMock).toHaveBeenCalledWith({
      businessId: 'business-from-payload',
      action: 'write',
      requiredModule: 'inventory',
    });
    expect(businessDocMock).toHaveBeenCalledWith('business-from-payload');
  });
});
