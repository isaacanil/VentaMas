import { beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('../../../versions/v1/modules/warehouse/services/warehouse.service.js', () => ({
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

import { ensureDefaultWarehouse } from '../../../versions/v1/modules/warehouse/services/warehouse.service.js';
import { ensureBusinessOnboardingSubscription } from '../../../versions/v2/billing/services/subscriptionSnapshot.service.js';
import { runBusinessPostProvisioning } from './createBusiness.js';

describe('runBusinessPostProvisioning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
