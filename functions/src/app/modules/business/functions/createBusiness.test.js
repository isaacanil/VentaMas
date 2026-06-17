import { beforeEach, describe, expect, it, vi } from 'vitest';

const resolveCallableAuthUidMock = vi.hoisted(() => vi.fn());

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
  onCall: (handler) => handler,
}));

vi.mock('nanoid', () => ({
  nanoid: () => 'generated-business-id',
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: vi.fn(),
    collection: vi.fn(),
    runTransaction: vi.fn(),
  },
  FieldValue: {
    serverTimestamp: vi.fn(() => ({ __op: 'serverTimestamp' })),
  },
}));

vi.mock('../../warehouse/services/defaultWarehouse.service.js', () => ({
  ensureDefaultWarehouse: vi.fn(),
}));

vi.mock('../../../versions/v2/billing/services/billingAccount.service.js', () => ({
  ensureBillingAccountForOwner: vi.fn(),
}));

vi.mock('../../../versions/v2/billing/config/limitOperations.config.js', () => ({
  LIMIT_OPERATION_KEYS: {
    BUSINESS_CREATE: 'business:create',
  },
  resolveSubscriptionOperationAccess: vi.fn(),
}));

vi.mock('../../../versions/v2/billing/services/subscriptionSnapshot.service.js', () => ({
  ensureBusinessOnboardingSubscription: vi.fn(),
  getActiveSubscriptionForBillingAccount: vi.fn(),
}));

vi.mock('../../../versions/v2/billing/services/usage.service.js', () => ({
  assertUsageCanIncrease: vi.fn(),
}));

vi.mock('../../../versions/v2/billing/utils/billingCommon.util.js', () => ({
  toCleanString: (value) => (typeof value === 'string' ? value.trim() : ''),
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

import { db } from '../../../core/config/firebase.js';
import { ensureDefaultWarehouse } from '../../warehouse/services/defaultWarehouse.service.js';
import { ensureBusinessOnboardingSubscription } from '../../../versions/v2/billing/services/subscriptionSnapshot.service.js';
import {
  createBusiness,
  runBusinessPostProvisioning,
} from './createBusiness.js';

describe('runBusinessPostProvisioning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    ensureBusinessOnboardingSubscription.mockResolvedValue({ ok: true });
    ensureDefaultWarehouse.mockResolvedValue({ ok: true });
  });

  it('ensures the onboarding subscription for newly provisioned businesses', async () => {
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

describe('createBusiness auth boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue(null);
  });

  it('does not trust payload user uid when callable auth is missing', async () => {
    await expect(
      createBusiness({
        data: {
          business: {
            id: 'business-1',
            name: 'Negocio',
          },
          user: {
            uid: 'spoofed-user',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
    });

    expect(db.runTransaction).not.toHaveBeenCalled();
  });
});
