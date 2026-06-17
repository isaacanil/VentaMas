import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertBusinessSubscriptionAccessMock,
  assertUserAccessMock,
  MockHttpsError,
  productStockQuery,
  resolveCallableAuthUidMock,
  serverTimestampMock,
} = vi.hoisted(() => {
  const hoistedAssertBusinessSubscriptionAccessMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedServerTimestampMock = vi.fn(() => 'server-timestamp');

  class HoistedHttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }

  const hoistedProductStockQuery = {
    select: vi.fn(() => hoistedProductStockQuery),
    orderBy: vi.fn(() => hoistedProductStockQuery),
    stream: vi.fn(),
  };

  return {
    assertBusinessSubscriptionAccessMock:
      hoistedAssertBusinessSubscriptionAccessMock,
    assertUserAccessMock: hoistedAssertUserAccessMock,
    MockHttpsError: HoistedHttpsError,
    productStockQuery: hoistedProductStockQuery,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
    serverTimestampMock: hoistedServerTimestampMock,
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
    collection: vi.fn((collectionName) => {
      if (collectionName !== 'businesses') {
        throw new Error(`Unexpected collection: ${collectionName}`);
      }

      return {
        doc: vi.fn((businessId) => ({
          id: businessId,
          collection: vi.fn((subcollectionName) => {
            if (subcollectionName !== 'productsStock') {
              throw new Error(`Unexpected subcollection: ${subcollectionName}`);
            }

            return productStockQuery;
          }),
        })),
      };
    }),
  },
  serverTimestamp: (...args) => serverTimestampMock(...args),
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

import { reconcileBatchStatusFromStocks } from './reconcileBatchStatusFromStocks.js';

const emptyAsyncIterable = async function* emptyAsyncIterable() {};

describe('reconcileBatchStatusFromStocks auth boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    resolveCallableAuthUidMock.mockResolvedValue('session-user');
    assertUserAccessMock.mockResolvedValue(undefined);
    assertBusinessSubscriptionAccessMock.mockResolvedValue(undefined);
    productStockQuery.select.mockReturnValue(productStockQuery);
    productStockQuery.orderBy.mockReturnValue(productStockQuery);
    productStockQuery.stream.mockReturnValue(emptyAsyncIterable());
  });

  it('uses resolveCallableAuthUid as the actor for access and audit fields', async () => {
    const request = {
      data: {
        sessionToken: 'session-token',
        user: {
          uid: 'spoofed-user',
          businessID: 'business-1',
        },
        dryRun: true,
      },
    };

    await expect(
      reconcileBatchStatusFromStocks(request),
    ).resolves.toMatchObject({
      businessId: 'business-1',
      processedStocks: 0,
      batchesEvaluated: 0,
      dryRun: true,
      actorUid: 'session-user',
    });

    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith(request);
    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'session-user',
      businessId: 'business-1',
      allowedRoles: ['maintenance'],
    });
    expect(assertBusinessSubscriptionAccessMock).toHaveBeenCalledWith({
      businessId: 'business-1',
      action: 'write',
      requiredModule: 'inventory',
    });
  });

  it('rejects unauthenticated requests before access checks', async () => {
    resolveCallableAuthUidMock.mockResolvedValue(null);

    await expect(
      reconcileBatchStatusFromStocks({
        data: {
          businessId: 'business-1',
        },
      }),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
      message: 'Usuario no autenticado.',
    });

    expect(assertUserAccessMock).not.toHaveBeenCalled();
    expect(assertBusinessSubscriptionAccessMock).not.toHaveBeenCalled();
    expect(productStockQuery.stream).not.toHaveBeenCalled();
  });
});
