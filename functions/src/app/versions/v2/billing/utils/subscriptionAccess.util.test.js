import { beforeEach, describe, expect, it, vi } from 'vitest';

let docMock = vi.fn();
const resolveSubscriptionOperationAccessMock = vi.fn();
const resolveEffectiveSubscriptionForBusinessMock = vi.fn();
const assertUsageCanIncreaseMock = vi.fn();
const getBusinessUsageSnapshotMock = vi.fn();
const normalizePlanEntitlementsMock = vi.fn();

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    doc: (...args) => docMock(...args),
  },
}));

vi.mock('../config/limitOperations.config.js', () => ({
  resolveSubscriptionOperationAccess: (...args) =>
    resolveSubscriptionOperationAccessMock(...args),
}));

vi.mock('../services/subscriptionSnapshot.service.js', () => ({
  resolveEffectiveSubscriptionForBusiness: (...args) =>
    resolveEffectiveSubscriptionForBusinessMock(...args),
}));

vi.mock('../services/usage.service.js', () => ({
  assertUsageCanIncrease: (...args) => assertUsageCanIncreaseMock(...args),
  getBusinessUsageSnapshot: (...args) => getBusinessUsageSnapshotMock(...args),
}));

vi.mock('./planEntitlements.util.js', () => ({
  normalizePlanEntitlements: (...args) => normalizePlanEntitlementsMock(...args),
}));

import {
  assertBillingAccessForBusiness,
  assertBusinessSubscriptionAccess,
} from './subscriptionAccess.util.js';

describe('subscriptionAccess.util', () => {
  beforeEach(() => {
    resolveSubscriptionOperationAccessMock.mockReset();
    resolveEffectiveSubscriptionForBusinessMock.mockReset();
    assertUsageCanIncreaseMock.mockReset();
    getBusinessUsageSnapshotMock.mockReset();
    normalizePlanEntitlementsMock.mockReset();

    normalizePlanEntitlementsMock.mockImplementation((subscription) => ({
      modules: subscription?.modules || {},
      addons: subscription?.addons || {},
    }));
  });

  it('allows platform developers to bypass business membership checks', async () => {
    docMock = vi.fn((path) => ({
      get: vi.fn(async () => {
        if (path === 'businesses/business-1') {
          return { exists: true, data: () => ({}) };
        }
        if (path === 'businesses/business-1/members/user-1') {
          return { exists: false };
        }
        if (path === 'users/user-1') {
          return {
            exists: true,
            data: () => ({
              activeRole: 'dev',
              platformRoles: { dev: true },
            }),
          };
        }
        throw new Error(`Unexpected path: ${path}`);
      }),
    }));

    await expect(
      assertBillingAccessForBusiness({
        businessId: 'business-1',
        actorUserId: 'user-1',
      }),
    ).resolves.toEqual({
      allowed: true,
      role: 'dev',
      policy: 'platform-dev',
    });
  });

  it('rejects inactive memberships even if the member document exists', async () => {
    docMock = vi.fn((path) => ({
      get: vi.fn(async () => {
        if (path === 'businesses/business-1') {
          return { exists: true, data: () => ({}) };
        }
        if (path === 'businesses/business-1/members/user-1') {
          return {
            exists: true,
            data: () => ({
              status: 'suspended',
              role: 'admin',
            }),
          };
        }
        if (path === 'users/user-1') {
          return { exists: true, data: () => ({}) };
        }
        throw new Error(`Unexpected path: ${path}`);
      }),
    }));

    await expect(
      assertBillingAccessForBusiness({
        businessId: 'business-1',
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Membresía inactiva para este negocio');
  });

  it('allows legacy businesses without subscription node during migration', async () => {
    docMock = vi.fn((path) => ({
      get: vi.fn(async () => {
        if (path === 'businesses/business-1') {
          return { exists: true, data: () => ({}) };
        }
        throw new Error(`Unexpected path: ${path}`);
      }),
    }));
    resolveEffectiveSubscriptionForBusinessMock.mockResolvedValue({});

    const result = await assertBusinessSubscriptionAccess({
      businessId: 'business-1',
      action: 'write',
    });

    expect(result).toEqual(
      expect.objectContaining({
        allowed: true,
        policy: 'no-subscription-node',
      }),
    );
  });

  it('rejects writes when the subscription is blocked', async () => {
    docMock = vi.fn((path) => ({
      get: vi.fn(async () => {
        if (path === 'businesses/business-1') {
          return {
            exists: true,
            data: () => ({
              subscription: {
                status: 'past_due',
                planId: 'plus',
              },
            }),
          };
        }
        throw new Error(`Unexpected path: ${path}`);
      }),
    }));

    await expect(
      assertBusinessSubscriptionAccess({
        businessId: 'business-1',
        action: 'write',
      }),
    ).rejects.toThrow('La suscripción del negocio está en estado past_due');
  });

  it('rejects access when the required module is not enabled in the plan', async () => {
    docMock = vi.fn((path) => ({
      get: vi.fn(async () => {
        if (path === 'businesses/business-1') {
          return {
            exists: true,
            data: () => ({
              subscription: {
                status: 'active',
                planId: 'plus',
                modules: {
                  inventory: false,
                },
              },
            }),
          };
        }
        throw new Error(`Unexpected path: ${path}`);
      }),
    }));

    await expect(
      assertBusinessSubscriptionAccess({
        businessId: 'business-1',
        action: 'write',
        requiredModule: 'inventory',
      }),
    ).rejects.toThrow('Tu suscripción no tiene habilitado el módulo inventory.');
  });

  it('returns usage details when a strict plan passes the limit check', async () => {
    docMock = vi.fn((path) => ({
      get: vi.fn(async () => {
        if (path === 'businesses/business-1') {
          return {
            exists: true,
            data: () => ({
              subscription: {
                status: 'active',
                planId: 'plus',
                limits: {
                  monthlyInvoices: 10,
                },
                modules: {
                  billing: true,
                },
              },
            }),
          };
        }
        throw new Error(`Unexpected path: ${path}`);
      }),
    }));
    resolveSubscriptionOperationAccessMock.mockReturnValue({
      metricKey: 'monthlyInvoices',
      incrementBy: 1,
      requiredModule: 'billing',
    });
    getBusinessUsageSnapshotMock.mockResolvedValue({
      current: { monthlyInvoices: 2 },
      monthly: { monthlyInvoices: 3 },
    });
    assertUsageCanIncreaseMock.mockReturnValue({
      ok: true,
      limit: 10,
      nextValue: 4,
      remaining: 6,
    });

    const result = await assertBusinessSubscriptionAccess({
      businessId: 'business-1',
      action: 'write',
      operation: 'createInvoice',
    });

    expect(assertUsageCanIncreaseMock).toHaveBeenCalledWith({
      subscription: expect.objectContaining({
        status: 'active',
        planId: 'plus',
      }),
      metricKey: 'monthlyInvoices',
      currentValue: 3,
      incrementBy: 1,
      planId: 'plus',
    });
    expect(result).toEqual(
      expect.objectContaining({
        allowed: true,
        policy: 'active-write-allowed-with-limit-check',
        module: {
          key: 'billing',
          enabled: true,
        },
        usage: {
          metricKey: 'monthlyInvoices',
          currentValue: 3,
          incrementBy: 1,
          limit: 10,
          nextValue: 4,
          remaining: 6,
        },
      }),
    );
  });
});
