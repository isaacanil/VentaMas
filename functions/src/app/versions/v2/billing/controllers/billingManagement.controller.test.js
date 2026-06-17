import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const users = new Map();
  const docs = new Map();
  const writes = [];

  const createSnap = (path, payload) => ({
    id: path.split('/').pop(),
    exists: payload !== undefined && payload !== null,
    data: () => payload,
    get: (field) => payload?.[field],
  });

  const readPath = (path) => {
    if (path.startsWith('users/')) return users.get(path.split('/').pop());
    return docs.get(path);
  };

  const writePath = (path, payload, options = {}) => {
    writes.push({ path, payload, options });
    const target = path.startsWith('users/') ? users : docs;
    const id = path.startsWith('users/') ? path.split('/').pop() : path;
    const previous = target.get(id);
    target.set(id, options?.merge ? { ...previous, ...payload } : payload);
  };

  const createDocRef = (path) => ({
    id: path.split('/').pop(),
    path,
    collection: (subcollection) => ({
      doc: (id = 'generated-doc') =>
        createDocRef(`${path}/${subcollection}/${id}`),
    }),
    get: vi.fn(async () => createSnap(path, readPath(path))),
    set: vi.fn(async (payload, options) => writePath(path, payload, options)),
    update: vi.fn(async (payload) => writePath(path, payload, { merge: true })),
  });

  const collection = vi.fn((collectionPath) => ({
    doc: (id) => createDocRef(`${collectionPath}/${id}`),
    get: vi.fn(async () => ({ docs: [] })),
  }));
  const doc = vi.fn((path) => createDocRef(path));

  return {
    firestore: {
      collection,
      doc,
      docs,
      users,
      writes,
      reset() {
        users.clear();
        docs.clear();
        writes.length = 0;
      },
    },
    assertBillingAccessForBusiness: vi.fn(),
    assignSubscriptionToBillingAccount: vi.fn(),
    deletePlanCatalogDefinition: vi.fn(),
    ensureBillingAccountForOwner: vi.fn(),
    ensureBusinessBillingSetup: vi.fn(),
    getActiveSubscriptionForBillingAccount: vi.fn(),
    getBillingOverviewByBusiness: vi.fn(),
    getBusinessSubscriptionSnapshot: vi.fn(),
    getImplementedProviderIds: vi.fn(),
    listBillingAccounts: vi.fn(),
    listPlanCatalog: vi.fn(),
    previewPlanCatalogImpact: vi.fn(),
    publishPlanCatalogVersion: vi.fn(),
    refreshSubscriptionsForPlanCode: vi.fn(),
    resolveBillingAccountIdForOwner: vi.fn(),
    resolvePaymentProviderAdapter: vi.fn(),
    resolvePlanVersionSnapshot: vi.fn(),
    updatePlanCatalogLifecycle: vi.fn(),
    upsertPlanCatalogDefinition: vi.fn(),
    upsertPlanCatalogVersion: vi.fn(),
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
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
  onCall: (optionsOrHandler, maybeHandler) => maybeHandler || optionsOrHandler,
}));

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    collection: mocks.firestore.collection,
    doc: mocks.firestore.doc,
  },
  FieldValue: {
    serverTimestamp: () => '__server_timestamp__',
  },
}));

vi.mock('../../../../core/config/secrets.js', () => ({
  MAIL_SECRETS: [],
}));

vi.mock('../services/billingAccount.service.js', () => ({
  ensureBillingAccountForOwner: (...args) =>
    mocks.ensureBillingAccountForOwner(...args),
  getBillingOverviewByBusiness: (...args) =>
    mocks.getBillingOverviewByBusiness(...args),
  listBillingAccounts: (...args) => mocks.listBillingAccounts(...args),
  resolveBillingAccountIdForOwner: (...args) =>
    mocks.resolveBillingAccountIdForOwner(...args),
}));

vi.mock('../services/planCatalog.service.js', () => ({
  assertPlanCatalogAssignable: vi.fn(),
  deletePlanCatalogDefinition: (...args) =>
    mocks.deletePlanCatalogDefinition(...args),
  listPlanCatalog: (...args) => mocks.listPlanCatalog(...args),
  previewPlanCatalogImpact: (...args) =>
    mocks.previewPlanCatalogImpact(...args),
  publishPlanCatalogVersion: (...args) =>
    mocks.publishPlanCatalogVersion(...args),
  resolvePlanVersionSnapshot: (...args) =>
    mocks.resolvePlanVersionSnapshot(...args),
  updatePlanCatalogLifecycle: (...args) =>
    mocks.updatePlanCatalogLifecycle(...args),
  upsertPlanCatalogDefinition: (...args) =>
    mocks.upsertPlanCatalogDefinition(...args),
  upsertPlanCatalogVersion: (...args) =>
    mocks.upsertPlanCatalogVersion(...args),
}));

vi.mock('../services/providerAdapter.service.js', () => ({
  getImplementedProviderIds: (...args) =>
    mocks.getImplementedProviderIds(...args),
  resolvePaymentProviderAdapter: (...args) =>
    mocks.resolvePaymentProviderAdapter(...args),
}));

vi.mock('../services/subscriptionSnapshot.service.js', () => ({
  assignSubscriptionToBillingAccount: (...args) =>
    mocks.assignSubscriptionToBillingAccount(...args),
  ensureBusinessBillingSetup: (...args) =>
    mocks.ensureBusinessBillingSetup(...args),
  getActiveSubscriptionForBillingAccount: (...args) =>
    mocks.getActiveSubscriptionForBillingAccount(...args),
  refreshSubscriptionsForPlanCode: (...args) =>
    mocks.refreshSubscriptionsForPlanCode(...args),
}));

vi.mock('../utils/subscriptionAccess.util.js', () => ({
  assertBillingAccessForBusiness: (...args) =>
    mocks.assertBillingAccessForBusiness(...args),
  getBusinessSubscriptionSnapshot: (...args) =>
    mocks.getBusinessSubscriptionSnapshot(...args),
}));

import { processMockSubscriptionScenario } from './billingManagement.controller.js';

const BUSINESS_ID = 'business-1';
const BILLING_ACCOUNT_ID = 'billing-owner-1';

const seedUser = (userId, payload) => {
  mocks.firestore.users.set(userId, {
    id: userId,
    active: true,
    ...payload,
  });
};

const seedSession = (sessionToken, payload) => {
  mocks.firestore.docs.set(`sessionTokens/${sessionToken}`, payload);
};

const callMockScenario = (userId) =>
  processMockSubscriptionScenario({
    auth: { uid: userId },
    data: {
      businessId: BUSINESS_ID,
      nextStatus: 'active',
      paymentAmount: 0,
      recordPayment: false,
      note: 'test:mock-subscription-scenario',
    },
  });

const callMockScenarioWithSession = (sessionToken) =>
  processMockSubscriptionScenario({
    data: {
      businessId: BUSINESS_ID,
      nextStatus: 'active',
      paymentAmount: 0,
      recordPayment: false,
      sessionToken,
      note: 'test:mock-subscription-scenario',
    },
  });

describe('processMockSubscriptionScenario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.firestore.reset();

    mocks.firestore.docs.set(`businesses/${BUSINESS_ID}`, {
      ownerUid: 'owner-user',
      billingAccountId: BILLING_ACCOUNT_ID,
    });
    mocks.assertBillingAccessForBusiness.mockResolvedValue({
      allowed: true,
      role: 'owner',
      policy: 'business-role',
    });
    mocks.ensureBusinessBillingSetup.mockResolvedValue({ ok: true });
    mocks.getBusinessSubscriptionSnapshot.mockResolvedValue({
      status: 'trialing',
      planId: 'starter',
      raw: {
        priceMonthly: 0,
      },
    });
    mocks.assignSubscriptionToBillingAccount.mockResolvedValue({
      billingAccountId: BILLING_ACCOUNT_ID,
      subscriptionId: 'subscription-1',
      scope: 'business',
      targetBusinessId: BUSINESS_ID,
      subscription: {
        priceMonthly: 0,
      },
    });
    mocks.resolveBillingAccountIdForOwner.mockImplementation(
      (ownerUid) => `billing-${ownerUid}`,
    );
  });

  it('rejects owner/admin business users that are not platform developers', async () => {
    seedUser('owner-user', {
      activeRole: 'owner',
      activeBusinessId: BUSINESS_ID,
      platformRoles: {
        dev: false,
      },
    });

    await expect(callMockScenario('owner-user')).rejects.toMatchObject({
      code: 'permission-denied',
    });

    expect(mocks.ensureBusinessBillingSetup).not.toHaveBeenCalled();
    expect(mocks.assignSubscriptionToBillingAccount).not.toHaveBeenCalled();
  });

  it('allows platform developers to execute the mock subscription scenario', async () => {
    seedUser('dev-user', {
      activeRole: 'dev',
      platformRoles: {
        dev: true,
      },
    });

    await expect(callMockScenario('dev-user')).resolves.toMatchObject({
      ok: true,
      businessId: BUSINESS_ID,
      billingAccountId: BILLING_ACCOUNT_ID,
      subscriptionId: 'subscription-1',
      nextStatus: 'active',
      paymentId: null,
    });

    expect(mocks.assertBillingAccessForBusiness).toHaveBeenCalledWith({
      businessId: BUSINESS_ID,
      actorUserId: 'dev-user',
      allowRoles: ['owner', 'admin'],
    });
    expect(mocks.assignSubscriptionToBillingAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'dev-user',
        billingAccountId: BILLING_ACCOUNT_ID,
        planCode: 'starter',
        status: 'active',
      }),
    );
  });

  it('resolves platform developers from session tokens', async () => {
    seedUser('session-dev-user', {
      activeRole: 'dev',
      platformRoles: {
        dev: true,
      },
    });
    seedSession('session-token-1', {
      userId: 'session-dev-user',
      expiresAt: Date.now() + 60_000,
      lastActivity: Date.now(),
    });

    await expect(
      callMockScenarioWithSession('session-token-1'),
    ).resolves.toMatchObject({
      ok: true,
      businessId: BUSINESS_ID,
      billingAccountId: BILLING_ACCOUNT_ID,
      subscriptionId: 'subscription-1',
      nextStatus: 'active',
      paymentId: null,
    });

    expect(mocks.assertBillingAccessForBusiness).toHaveBeenCalledWith({
      businessId: BUSINESS_ID,
      actorUserId: 'session-dev-user',
      allowRoles: ['owner', 'admin'],
    });
    expect(mocks.assignSubscriptionToBillingAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'session-dev-user',
        billingAccountId: BILLING_ACCOUNT_ID,
        planCode: 'starter',
        status: 'active',
      }),
    );
    expect(mocks.firestore.writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'sessionTokens/session-token-1',
          payload: expect.objectContaining({
            lastActivity: '__server_timestamp__',
            status: 'active',
          }),
          options: { merge: true },
        }),
      ]),
    );
  });
});
