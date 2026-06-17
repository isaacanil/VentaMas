import { beforeEach, describe, expect, it, vi } from 'vitest';

const resolveCallableAuthUidMock = vi.hoisted(() => vi.fn());
const firestoreMock = vi.hoisted(() => {
  const users = new Map();
  const docs = new Map();
  const txOverrides = new Map();
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
    path,
    get: vi.fn(async () => createSnap(path, readPath(path))),
    set: vi.fn(async (payload, options) => writePath(path, payload, options)),
    update: vi.fn(async (payload) => writePath(path, payload, { merge: true })),
  });

  const collection = vi.fn((collectionPath) => ({
    add: vi.fn(async (payload) =>
      writePath(`${collectionPath}/generated-doc`, payload),
    ),
    doc: (id) => createDocRef(`${collectionPath}/${id}`),
    where: () => ({
      get: vi.fn(async () => ({ empty: true, docs: [] })),
    }),
  }));

  const doc = vi.fn((path) => createDocRef(path));
  const runTransaction = vi.fn(async (callback) =>
    callback({
      get: async (ref) =>
        createSnap(
          ref.path,
          txOverrides.has(ref.path)
            ? txOverrides.get(ref.path)
            : readPath(ref.path),
        ),
      set: (ref, payload, options) => writePath(ref.path, payload, options),
      update: (ref, payload) => writePath(ref.path, payload, { merge: true }),
    }),
  );

  return {
    collection,
    doc,
    docs,
    runTransaction,
    txOverrides,
    users,
    writes,
    reset() {
      users.clear();
      docs.clear();
      txOverrides.clear();
      writes.length = 0;
    },
  };
});

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  },
  onCall: (optionsOrHandler, maybeHandler) => maybeHandler || optionsOrHandler,
}));

vi.mock('nanoid', () => ({
  nanoid: () => 'generated-business-id',
}));

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    collection: firestoreMock.collection,
    doc: firestoreMock.doc,
    runTransaction: firestoreMock.runTransaction,
  },
  FieldValue: {
    serverTimestamp: () => '__server_timestamp__',
  },
  Timestamp: {
    fromDate: (date) => ({
      toMillis: () => date.getTime(),
    }),
  },
}));

vi.mock('../../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock(
  '../../../../modules/business/services/businessProvisioning.service.js',
  () => ({
    assertBusinessCreationLimit: vi.fn(),
    provisionBusinessCoreInTransaction: vi.fn(),
    runBusinessPostProvisioning: vi.fn(),
  }),
);

vi.mock('../../billing/services/subscriptionSnapshot.service.js', () => ({
  ensureBusinessOnboardingSubscription: vi.fn(async () => ({
    subscription: {
      status: 'trialing',
      planId: 'starter',
    },
  })),
}));

vi.mock('../../billing/services/usage.service.js', () => ({
  incrementBusinessUsageMetric: vi.fn(),
}));

import { db } from '../../../../core/config/firebase.js';
import {
  assertBusinessCreationLimit,
  provisionBusinessCoreInTransaction,
  runBusinessPostProvisioning,
} from '../../../../modules/business/services/businessProvisioning.service.js';
import { incrementBusinessUsageMetric } from '../../billing/services/usage.service.js';
import {
  clientCreateBusinessForCurrentAccount,
  clientSelectActiveBusiness,
} from './businessContext.controller.js';

const buildCreateBusinessRequest = ({
  authUid,
  businessId = 'business-1',
  businessName = 'Negocio Uno',
  sessionToken,
} = {}) => ({
  auth: authUid ? { uid: authUid } : undefined,
  data: {
    ...(sessionToken ? { sessionToken } : {}),
    business: {
      id: businessId,
      name: businessName,
    },
  },
});

const callCreateBusiness = (userId) =>
  clientCreateBusinessForCurrentAccount(
    buildCreateBusinessRequest({
      authUid: userId,
    }),
  );

const callSelectActiveBusiness = () =>
  clientSelectActiveBusiness({
    auth: { uid: 'firebase-user' },
    data: {
      businessId: 'business-1',
    },
  });

describe('clientCreateBusinessForCurrentAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockImplementation(
      async (request) => request?.auth?.uid ?? null,
    );
    firestoreMock.reset();
  });

  it('resolves the creator through the central callable auth boundary', async () => {
    const request = buildCreateBusinessRequest({
      authUid: 'firebase-user',
      sessionToken: 'session-token-1',
    });
    resolveCallableAuthUidMock.mockResolvedValue('session-user');
    firestoreMock.users.set('session-user', {
      active: true,
      activeRole: 'cashier',
      accessControl: [],
    });

    const result = await clientCreateBusinessForCurrentAccount(request);

    expect(result).toMatchObject({
      ok: true,
      businessId: 'business-1',
      role: 'owner',
    });
    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith(request);
    expect(assertBusinessCreationLimit).toHaveBeenCalledWith({
      ownerUid: 'session-user',
    });
    expect(provisionBusinessCoreInTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'business-1',
        createdBy: 'session-user',
        requireNewBusiness: true,
      }),
    );
    expect(runBusinessPostProvisioning).toHaveBeenCalledWith({
      businessId: 'business-1',
      actorUserId: 'session-user',
    });
    expect(
      firestoreMock.writes.find(
        (write) => write.path === 'businesses/business-1/members/session-user',
      )?.payload,
    ).toMatchObject({
      userId: 'session-user',
      role: 'owner',
      status: 'active',
    });
  });

  it('does not bypass the central auth resolver when creating a business', async () => {
    resolveCallableAuthUidMock.mockResolvedValue(null);
    firestoreMock.users.set('firebase-user', {
      active: true,
      activeRole: 'admin',
    });

    await expect(callCreateBusiness('firebase-user')).rejects.toMatchObject({
      code: 'unauthenticated',
    });

    expect(assertBusinessCreationLimit).not.toHaveBeenCalled();
    expect(db.runTransaction).not.toHaveBeenCalled();
    expect(provisionBusinessCoreInTransaction).not.toHaveBeenCalled();
    expect(firestoreMock.writes).toHaveLength(0);
  });

  it('rejects inactive users before checking business creation limits', async () => {
    firestoreMock.users.set('inactive-user', {
      active: false,
      activeRole: 'admin',
      activeBusinessId: 'existing-business',
      accessControl: [
        {
          businessId: 'existing-business',
          role: 'admin',
          status: 'active',
        },
      ],
    });

    await expect(callCreateBusiness('inactive-user')).rejects.toMatchObject({
      code: 'permission-denied',
    });

    expect(assertBusinessCreationLimit).not.toHaveBeenCalled();
    expect(db.runTransaction).not.toHaveBeenCalled();
    expect(provisionBusinessCoreInTransaction).not.toHaveBeenCalled();
    expect(firestoreMock.writes).toHaveLength(0);
  });

  it('rejects if the user becomes inactive inside the transaction', async () => {
    const initiallyActiveUser = {
      active: true,
      activeRole: 'admin',
      activeBusinessId: 'existing-business',
      accessControl: [
        {
          businessId: 'existing-business',
          role: 'admin',
          status: 'active',
        },
      ],
    };
    firestoreMock.users.set('race-user', initiallyActiveUser);
    firestoreMock.txOverrides.set('users/race-user', {
      ...initiallyActiveUser,
      active: false,
    });

    await expect(callCreateBusiness('race-user')).rejects.toMatchObject({
      code: 'permission-denied',
    });

    expect(assertBusinessCreationLimit).toHaveBeenCalledWith({
      ownerUid: 'race-user',
    });
    expect(db.runTransaction).toHaveBeenCalledTimes(1);
    expect(provisionBusinessCoreInTransaction).not.toHaveBeenCalled();
    expect(incrementBusinessUsageMetric).not.toHaveBeenCalled();
    expect(runBusinessPostProvisioning).not.toHaveBeenCalled();
    expect(firestoreMock.writes).toHaveLength(0);
  });
});

describe('clientSelectActiveBusiness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockImplementation(
      async (request) => request?.auth?.uid ?? null,
    );
    firestoreMock.reset();
  });

  it('does not bypass the central auth resolver when selecting a business', async () => {
    resolveCallableAuthUidMock.mockResolvedValue(null);

    await expect(callSelectActiveBusiness()).rejects.toMatchObject({
      code: 'unauthenticated',
    });

    expect(firestoreMock.writes).toHaveLength(0);
  });
});
