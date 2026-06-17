import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpsError } from 'firebase-functions/v2/https';

const firestoreMock = vi.hoisted(() => {
  const businessLinksGet = vi.fn(async () => ({ size: 0 }));
  const doc = vi.fn((path) => ({
    path,
    collection: vi.fn(() => ({
      get: businessLinksGet,
    })),
  }));
  const collection = vi.fn((path) => ({
    doc: vi.fn((id) => ({
      path: `${path}/${id}`,
    })),
  }));

  return {
    businessLinksGet,
    collection,
    doc,
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  },
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    collection: firestoreMock.collection,
    doc: firestoreMock.doc,
  },
  FieldValue: {
    serverTimestamp: vi.fn(() => ({ __op: 'serverTimestamp' })),
  },
}));

vi.mock('../../warehouse/services/defaultWarehouse.service.js', () => ({
  ensureDefaultWarehouse: vi.fn(),
}));

vi.mock(
  '../../../versions/v2/billing/services/billingAccount.service.js',
  () => ({
    ensureBillingAccountForOwner: vi.fn(),
  }),
);

vi.mock(
  '../../../versions/v2/billing/config/limitOperations.config.js',
  () => ({
    LIMIT_OPERATION_KEYS: {
      BUSINESS_CREATE: 'business:create',
    },
    resolveSubscriptionOperationAccess: vi.fn(),
  }),
);

vi.mock(
  '../../../versions/v2/billing/services/subscriptionSnapshot.service.js',
  () => ({
    ensureBusinessOnboardingSubscription: vi.fn(),
    getActiveSubscriptionForBillingAccount: vi.fn(),
  }),
);

vi.mock('../../../versions/v2/billing/services/usage.service.js', () => ({
  assertUsageCanIncrease: vi.fn(),
}));

vi.mock('../../../versions/v2/billing/utils/billingCommon.util.js', () => ({
  toCleanString: (value) => (typeof value === 'string' ? value.trim() : ''),
}));

import { logger } from 'firebase-functions';
import { ensureDefaultWarehouse } from '../../warehouse/services/defaultWarehouse.service.js';
import { ensureBillingAccountForOwner } from '../../../versions/v2/billing/services/billingAccount.service.js';
import {
  ensureBusinessOnboardingSubscription,
  getActiveSubscriptionForBillingAccount,
} from '../../../versions/v2/billing/services/subscriptionSnapshot.service.js';
import { resolveSubscriptionOperationAccess } from '../../../versions/v2/billing/config/limitOperations.config.js';
import { assertUsageCanIncrease } from '../../../versions/v2/billing/services/usage.service.js';
import {
  assertBusinessCreationLimit,
  provisionBusinessCoreInTransaction,
  runBusinessPostProvisioning,
} from './businessProvisioning.service.js';

describe('runBusinessPostProvisioning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureBusinessOnboardingSubscription.mockResolvedValue({ ok: true });
    ensureDefaultWarehouse.mockResolvedValue({ ok: true });
  });

  it('ensures onboarding subscription and default warehouse', async () => {
    await runBusinessPostProvisioning({
      businessId: 'business-1',
      actorUserId: 'user-1',
    });

    expect(ensureBusinessOnboardingSubscription).toHaveBeenCalledWith({
      businessId: 'business-1',
      actorUserId: 'user-1',
    });
    expect(ensureDefaultWarehouse).toHaveBeenCalledWith({
      businessID: 'business-1',
      uid: 'user-1',
    });
  });
});

describe('provisionBusinessCoreInTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes the core business provisioning documents when missing', async () => {
    const tx = {
      get: vi.fn(async () => ({ exists: false })),
      set: vi.fn(),
    };

    const result = await provisionBusinessCoreInTransaction({
      tx,
      businessId: 'business-1',
      business: {
        name: 'Negocio',
        features: {
          fiscal: {
            reportingEnabled: true,
          },
        },
      },
      createdBy: 'owner-1',
      requireNewBusiness: true,
    });

    expect(result.businessRef).toMatchObject({ path: 'businesses/business-1' });
    expect(tx.get).toHaveBeenCalledTimes(5);
    expect(tx.set).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'businesses/business-1' }),
      expect.objectContaining({
        ownerUid: 'owner-1',
        owners: ['owner-1'],
        business: expect.objectContaining({
          id: 'business-1',
          name: 'Negocio',
          createdBy: 'owner-1',
          features: expect.objectContaining({
            fiscal: expect.objectContaining({
              reportingEnabled: true,
              taxationEnabled: true,
            }),
          }),
        }),
      }),
    );
    expect(tx.set).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/settings/billing',
      }),
      expect.objectContaining({
        billingMode: 'direct',
        invoiceType: 'template1',
      }),
    );
    expect(tx.set).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/settings/taxReceipt',
      }),
      { taxReceiptEnabled: false },
    );
    expect(tx.set).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/taxReceipts/02',
      }),
      expect.objectContaining({
        data: expect.objectContaining({
          id: '02',
          name: 'CONSUMIDOR FINAL',
        }),
      }),
    );
  });
});

describe('assertBusinessCreationLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestoreMock.businessLinksGet.mockResolvedValue({ size: 0 });
    ensureBillingAccountForOwner.mockResolvedValue({
      billingAccountId: 'billing-1',
    });
    getActiveSubscriptionForBillingAccount.mockResolvedValue({
      planId: 'demo',
      limits: {
        maxBusinesses: 2,
      },
    });
    resolveSubscriptionOperationAccess.mockReturnValue({
      metricKey: 'businessesTotal',
      incrementBy: 1,
    });
  });

  it('maps exhausted strict-plan limits to the business creation message', async () => {
    firestoreMock.businessLinksGet.mockResolvedValue({ size: 2 });
    assertUsageCanIncrease.mockImplementation(() => {
      throw new HttpsError('resource-exhausted', 'raw limit');
    });

    await expect(
      assertBusinessCreationLimit({ ownerUid: ' owner-1 ' }),
    ).rejects.toMatchObject({
      code: 'resource-exhausted',
      message:
        'Has agotado el máximo de negocios (2) para tu plan actual. Actualiza tu plan para crear más negocios.',
    });

    expect(ensureBillingAccountForOwner).toHaveBeenCalledWith({
      ownerUid: 'owner-1',
      actorUserId: 'owner-1',
    });
    expect(assertUsageCanIncrease).toHaveBeenCalledWith(
      expect.objectContaining({
        currentValue: 2,
        incrementBy: 1,
        metricKey: 'businessesTotal',
        planId: 'demo',
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      '[createBusiness] blocked by maxBusinesses limit',
      expect.objectContaining({
        billingAccountId: 'billing-1',
        currentBusinesses: 2,
        maxBusinesses: 2,
        ownerUid: 'owner-1',
        planId: 'demo',
      }),
    );
  });
});
