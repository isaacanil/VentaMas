import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertBusinessSubscriptionAccessMock,
  assertUserAccessMock,
  ensureDefaultWarehouseMock,
  resolveCallableAuthUidMock,
} = vi.hoisted(() => ({
  assertBusinessSubscriptionAccessMock: vi.fn(),
  assertUserAccessMock: vi.fn(),
  ensureDefaultWarehouseMock: vi.fn(),
  resolveCallableAuthUidMock: vi.fn(),
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  },
  onCall: (handler) => handler,
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

vi.mock('../../warehouse/services/defaultWarehouse.service.js', () => ({
  ensureDefaultWarehouse: (...args) => ensureDefaultWarehouseMock(...args),
}));

import { ensureDefaultWarehouseForBusiness } from './ensureDefaultWarehouseForBusiness.js';

describe('ensureDefaultWarehouseForBusiness auth boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockImplementation(async (request) => {
      if (request?.data?.sessionToken === 'valid-session-token') {
        return 'session-user';
      }

      return request?.auth?.uid || null;
    });
    assertUserAccessMock.mockResolvedValue(undefined);
    assertBusinessSubscriptionAccessMock.mockResolvedValue(undefined);
    ensureDefaultWarehouseMock.mockResolvedValue({
      id: 'warehouse-1',
      defaultWarehouse: true,
    });
  });

  it('rejects before access checks or warehouse service when no actor resolves', async () => {
    await expect(
      ensureDefaultWarehouseForBusiness({
        data: {
          businessID: 'business-1',
          user: {
            uid: 'spoofed-user',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
    });

    expect(assertUserAccessMock).not.toHaveBeenCalled();
    expect(assertBusinessSubscriptionAccessMock).not.toHaveBeenCalled();
    expect(ensureDefaultWarehouseMock).not.toHaveBeenCalled();
  });

  it('passes the resolved callable actor to assertUserAccess and the service', async () => {
    const request = {
      auth: {
        uid: 'owner-1',
      },
      data: {
        businessId: ' business-1 ',
      },
    };

    await expect(ensureDefaultWarehouseForBusiness(request)).resolves.toEqual({
      ok: true,
      warehouse: {
        id: 'warehouse-1',
        defaultWarehouse: true,
      },
    });

    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith(request);
    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'owner-1',
      businessId: 'business-1',
      allowedRoles: ['maintenance'],
    });
    expect(assertBusinessSubscriptionAccessMock).toHaveBeenCalledWith({
      businessId: 'business-1',
      action: 'write',
      requiredModule: 'inventory',
    });
    expect(ensureDefaultWarehouseMock).toHaveBeenCalledWith({
      businessID: 'business-1',
      uid: 'owner-1',
    });
  });

  it('accepts a session token actor resolved by the callable auth helper', async () => {
    const request = {
      data: {
        businessID: 'business-2',
        sessionToken: 'valid-session-token',
      },
    };

    await expect(ensureDefaultWarehouseForBusiness(request)).resolves.toEqual({
      ok: true,
      warehouse: {
        id: 'warehouse-1',
        defaultWarehouse: true,
      },
    });

    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'session-user',
      businessId: 'business-2',
      allowedRoles: ['maintenance'],
    });
    expect(ensureDefaultWarehouseMock).toHaveBeenCalledWith({
      businessID: 'business-2',
      uid: 'session-user',
    });
  });
});
