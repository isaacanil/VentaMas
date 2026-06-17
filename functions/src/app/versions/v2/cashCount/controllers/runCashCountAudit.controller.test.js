import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertBusinessSubscriptionAccessMock,
  assertUserAccessMock,
  collectionData,
  isAccountingRolloutEnabledForBusinessMock,
  resolveCallableAuthUidMock,
} = vi.hoisted(() => ({
  assertBusinessSubscriptionAccessMock: vi.fn(),
  assertUserAccessMock: vi.fn(),
  collectionData: new Map(),
  isAccountingRolloutEnabledForBusinessMock: vi.fn(),
  resolveCallableAuthUidMock: vi.fn(),
}));

const getNestedValue = (value, path) =>
  path
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), value);

const makeQuery = (path, filters = []) => ({
  orderBy: vi.fn(() => makeQuery(path, filters)),
  limit: vi.fn(() => makeQuery(path, filters)),
  where: vi.fn((field, op, expected) =>
    makeQuery(path, [...filters, { field, op, expected }]),
  ),
  get: vi.fn(async () => {
    const rows = collectionData.get(path) ?? [];
    const filtered = rows.filter((row) =>
      filters.every(({ field, op, expected }) => {
        if (op !== '==') return true;
        return getNestedValue(row.data, field) === expected;
      }),
    );

    return {
      docs: filtered.map((row) => ({
        id: row.id,
        data: () => row.data,
        get: (field) => getNestedValue(row.data, field),
      })),
    };
  }),
});

vi.mock('firebase-functions', () => ({
  https: {
    HttpsError: class HttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    },
    onCall: (handler) => handler,
  },
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    collection: (path) => makeQuery(path),
  },
}));

vi.mock('../../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    AUDIT: ['owner', 'admin', 'dev'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
  getUserAccessProfile: vi.fn(),
}));

vi.mock('../../billing/utils/subscriptionAccess.util.js', () => ({
  assertBusinessSubscriptionAccess: (...args) =>
    assertBusinessSubscriptionAccessMock(...args),
}));

vi.mock('../../accounting/utils/accountingRollout.util.js', () => ({
  isAccountingRolloutEnabledForBusiness: (...args) =>
    isAccountingRolloutEnabledForBusinessMock(...args),
}));

import { runCashCountAudit } from './runCashCountAudit.controller.js';

describe('runCashCountAudit', () => {
  beforeEach(() => {
    collectionData.clear();
    vi.clearAllMocks();
    assertBusinessSubscriptionAccessMock.mockResolvedValue(undefined);
    assertUserAccessMock.mockResolvedValue(undefined);
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);
    resolveCallableAuthUidMock.mockResolvedValue('auditor-1');
  });

  it('nets receivable payment void cash movements when recalculating discrepancies', async () => {
    resolveCallableAuthUidMock.mockResolvedValue('resolved-auditor-1');
    collectionData.set('businesses/business-1/cashCounts', [
      {
        id: 'cash-count-1',
        data: {
          cashCount: {
            id: 'cash-count-1',
            state: 'closed',
            createdAt: 1_777_766_400_000,
            opening: {
              date: 1_777_766_400_000,
              banknotes: [{ value: 100, quantity: 1 }],
            },
            closing: {
              date: 1_777_770_000_000,
              banknotes: [{ value: 130, quantity: 1 }],
            },
            totalCard: 0,
            totalTransfer: 0,
            totalCharged: 0,
            totalReceivables: 30,
            totalSystem: 130,
            totalRegister: 130,
            totalDiscrepancy: 0,
          },
        },
      },
    ]);
    collectionData.set('businesses/business-1/cashMovements', [
      {
        id: 'receivable-in-1',
        data: {
          cashCountId: 'cash-count-1',
          sourceType: 'receivable_payment',
          direction: 'in',
          method: 'cash',
          amount: 50,
          status: 'posted',
        },
      },
      {
        id: 'receivable-void-1',
        data: {
          cashCountId: 'cash-count-1',
          sourceType: 'receivable_payment_void',
          direction: 'out',
          method: 'cash',
          amount: 20,
          status: 'posted',
        },
      },
    ]);
    collectionData.set('businesses/business-1/invoices', []);
    collectionData.set('businesses/business-1/expenses', []);

    const payload = {
      businessId: 'business-1',
      threshold: 0,
    };
    const context = {
      auth: {
        uid: 'context-auditor-1',
      },
    };

    const result = await runCashCountAudit(payload, context);

    expect(result).toMatchObject({
      status: 'done',
      businessId: 'business-1',
      scanned: 1,
      discrepancies: [],
    });
    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith({
      data: payload,
      auth: context.auth,
    });
    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'resolved-auditor-1',
      businessId: 'business-1',
      allowedRoles: ['owner', 'admin', 'dev'],
    });
    expect(assertBusinessSubscriptionAccessMock).toHaveBeenCalledWith({
      businessId: 'business-1',
      action: 'read',
      requiredModule: 'cashReconciliation',
    });
  });

  it('resolves the callable actor from an adapted request', async () => {
    const payload = {
      businessId: 'business-1',
      sessionToken: 'session-token-1',
    };
    const context = {
      auth: {
        uid: 'firebase-auth-uid',
      },
    };

    const result = await runCashCountAudit(payload, context);

    expect(result).toMatchObject({
      status: 'done',
      businessId: 'business-1',
      scanned: 0,
      discrepancies: [],
    });
    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith({
      data: payload,
      auth: context.auth,
    });
  });

  it('rejects unauthenticated requests when no callable actor is resolved', async () => {
    resolveCallableAuthUidMock.mockResolvedValue(null);

    await expect(
      runCashCountAudit(
        {
          businessId: 'business-1',
        },
        {
          auth: {
            uid: 'firebase-auth-uid',
          },
        },
      ),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
      message: 'Usuario no autenticado',
    });

    expect(assertUserAccessMock).not.toHaveBeenCalled();
    expect(assertBusinessSubscriptionAccessMock).not.toHaveBeenCalled();
  });

  it('passes the resolved actor to assertUserAccess', async () => {
    resolveCallableAuthUidMock.mockResolvedValue('session-user-1');

    await runCashCountAudit(
      {
        businessId: 'business-1',
      },
      {
        auth: {
          uid: 'firebase-auth-uid',
        },
      },
    );

    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'session-user-1',
      businessId: 'business-1',
      allowedRoles: ['owner', 'admin', 'dev'],
    });
  });
});
