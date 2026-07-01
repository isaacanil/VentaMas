import { beforeEach, describe, expect, it, vi } from 'vitest';

const firestoreMock = vi.hoisted(() => {
  const users = new Map();
  const docs = new Map();
  const writes = [];

  const createSnap = (id, payload, path = id) => ({
    id,
    exists: payload !== undefined && payload !== null,
    data: () => payload,
    get: (field) => payload?.[field],
    ref: createDocRef(path),
  });

  const setPath = (path, payload, options = {}) => {
    writes.push({ path, payload, options });
    const target = path.startsWith('users/') ? users : docs;
    const id = path.startsWith('users/') ? path.split('/').pop() : path;
    const previous = target.get(id);
    target.set(id, options?.merge ? { ...previous, ...payload } : payload);
  };

  const getPath = (path) => {
    if (path.startsWith('users/')) {
      return users.get(path.split('/').pop());
    }
    return docs.get(path);
  };

  const createDocRef = (path) => ({
    delete: vi.fn(async () => {
      const target = path.startsWith('users/') ? users : docs;
      const id = path.startsWith('users/') ? path.split('/').pop() : path;
      target.delete(id);
    }),
    get: vi.fn(async () =>
      createSnap(path.split('/').pop(), getPath(path), path),
    ),
    set: vi.fn(async (payload, options) => setPath(path, payload, options)),
    update: vi.fn(async (payload) => setPath(path, payload, { merge: true })),
  });

  const collection = vi.fn((collectionPath) => {
    if (collectionPath === 'users') {
      return {
        doc: (id) => createDocRef(`users/${id}`),
        where: (field, _operator, value) => ({
          get: vi.fn(async () => {
            const matchingDocs = Array.from(users.entries())
              .filter(([, payload]) => payload?.[field] === value)
              .map(([id, payload]) => createSnap(id, payload, `users/${id}`));

            return {
              empty: matchingDocs.length === 0,
              docs: matchingDocs,
            };
          }),
        }),
      };
    }

    if (collectionPath.endsWith('/members')) {
      return {
        where: () => ({
          limit: () => ({
            get: vi.fn(async () => ({ docs: [] })),
          }),
        }),
      };
    }

    return {
      add: vi.fn(async (payload) =>
        setPath(`${collectionPath}/generated-doc`, payload),
      ),
      doc: (id) => createDocRef(`${collectionPath}/${id}`),
      where: () => ({
        get: vi.fn(async () => ({ empty: true, docs: [] })),
      }),
    };
  });

  const doc = vi.fn((path) => createDocRef(path));
  const runTransaction = vi.fn(async (callback) =>
    callback({
      get: async (ref) => ref.get(),
      set: (ref, payload, options) => ref.set(payload, options),
      update: (ref, payload) => ref.update(payload),
    }),
  );

  return {
    collection,
    doc,
    docs,
    runTransaction,
    users,
    writes,
    reset() {
      users.clear();
      docs.clear();
      writes.length = 0;
    },
  };
});

const resolveCallableAuthUidMock = vi.hoisted(() => vi.fn());
const createCustomTokenMock = vi.hoisted(() => vi.fn());

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  },
  onCall: (_options, handler) => handler,
}));

vi.mock('../../../../core/config/firebase.js', () => ({
  admin: {
    auth: () => ({
      createCustomToken: createCustomTokenMock,
    }),
  },
  db: {
    collection: firestoreMock.collection,
    doc: firestoreMock.doc,
    runTransaction: firestoreMock.runTransaction,
  },
  FieldValue: {
    delete: () => '__field_delete__',
    serverTimestamp: () => '__server_timestamp__',
  },
  Timestamp: {
    fromMillis: (value) => ({ toMillis: () => value }),
    now: () => '__timestamp_now__',
  },
}));

vi.mock('../../../../core/config/secrets.js', () => ({
  MAIL_SECRETS: [],
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

vi.mock('../../billing/services/usage.service.js', () => ({
  incrementBusinessUsageMetric: vi.fn(),
}));

vi.mock('../../billing/utils/subscriptionAccess.util.js', () => ({
  assertBusinessSubscriptionAccess: vi.fn(),
}));

import {
  clientRefreshSession,
  clientSendEmailVerification,
  clientSetUserPassword,
  clientUpdateUser,
  clientVerifyEmailCode,
} from './clientAuth.controller.js';

const seedActor = () => {
  firestoreMock.users.set('admin-user', {
    id: 'admin-user',
    name: 'admin',
    activeRole: 'admin',
    activeBusinessId: 'business-1',
    accessControl: [
      {
        businessId: 'business-1',
        role: 'admin',
        status: 'active',
      },
    ],
  });
};

const seedSession = (
  token = 'session-token',
  userId = 'admin-user',
  overrides = {},
) => {
  firestoreMock.docs.set(`sessionTokens/${token}`, {
    userId,
    expiresAt: {
      toMillis: () => Date.now() + 60_000,
    },
    lastActivity: {
      toMillis: () => Date.now(),
    },
    status: 'active',
    ...overrides,
  });
};

const callUpdateUser = (userData) =>
  clientUpdateUser({
    auth: { uid: 'admin-user' },
    data: { userData },
  });

const callUpdateUserWithSession = (userData, sessionToken = 'session-token') =>
  clientUpdateUser({
    data: { userData, sessionToken },
  });

const callRefreshSession = (sessionToken = 'session-token') =>
  clientRefreshSession({
    data: { sessionToken },
  });

const resetAuthControllerTestState = () => {
  vi.clearAllMocks();
  firestoreMock.reset();
  resolveCallableAuthUidMock.mockImplementation(
    async (request) => request?.auth?.uid || null,
  );
  createCustomTokenMock.mockResolvedValue('firebase-custom-token');
  seedActor();
};

const seedSameBusinessTarget = (overrides = {}) => {
  firestoreMock.users.set('target-user', {
    id: 'target-user',
    name: 'target',
    number: 7,
    active: true,
    activeRole: 'cashier',
    activeBusinessId: 'business-1',
    accessControl: [
      {
        businessId: 'business-1',
        role: 'cashier',
        status: 'active',
      },
    ],
    email: 'old@example.com',
    password: 'existing-hash',
    ...overrides,
  });
  firestoreMock.docs.set('businesses/business-1/members/target-user', {
    role: 'cashier',
    status: 'active',
  });
};

const seedOtherBusinessTarget = () => {
  firestoreMock.users.set('target-user', {
    id: 'target-user',
    name: 'target',
    number: 7,
    active: true,
    activeBusinessId: 'other-business',
    accessControl: [
      {
        businessId: 'other-business',
        role: 'cashier',
        status: 'active',
      },
    ],
    emailVerification: {
      code: 'hashed-code',
      email: 'target@example.com',
      expiresAt: {
        toMillis: () => Date.now() + 60_000,
      },
      attempts: 0,
    },
  });
};

const seedActiveActorBusiness = () => {
  firestoreMock.docs.set('businesses/business-1', {
    name: 'Business 1',
    ownerUid: 'owner-user',
    status: 'active',
  });
  firestoreMock.docs.set('businesses/business-1/members/admin-user', {
    role: 'admin',
    status: 'active',
  });
};

describe('clientRefreshSession', () => {
  beforeEach(() => {
    resetAuthControllerTestState();
    seedActiveActorBusiness();
    seedSession();
  });

  it('returns a Firebase custom token for an active session', async () => {
    const result = await callRefreshSession();

    expect(result).toMatchObject({
      ok: true,
      firebaseCustomToken: 'firebase-custom-token',
    });
    expect(createCustomTokenMock).toHaveBeenCalledWith('admin-user');
    expect(firestoreMock.docs.get('sessionTokens/session-token')).toMatchObject({
      status: 'active',
    });
  });

  it('does not revoke the session when creating the Firebase token fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    createCustomTokenMock.mockRejectedValueOnce(new Error('iam unavailable'));

    await expect(callRefreshSession()).rejects.toMatchObject({
      code: 'internal',
    });

    expect(firestoreMock.docs.has('sessionTokens/session-token')).toBe(true);
    expect(
      firestoreMock.writes.some(
        (write) =>
          write.path.startsWith('sessionLogs/') &&
          write.payload?.event === 'access-revoked',
      ),
    ).toBe(false);

    errorSpy.mockRestore();
  });

  it('revokes the session when the user account is inactive', async () => {
    firestoreMock.users.set('admin-user', {
      ...firestoreMock.users.get('admin-user'),
      active: false,
    });

    await expect(callRefreshSession()).rejects.toMatchObject({
      code: 'permission-denied',
    });

    expect(firestoreMock.docs.has('sessionTokens/session-token')).toBe(false);
  });
});

describe('clientUpdateUser', () => {
  beforeEach(() => {
    resetAuthControllerTestState();
  });

  it('rejects non-dev updates when the target user is not a business member', async () => {
    seedOtherBusinessTarget();

    await expect(
      callUpdateUser({
        id: 'target-user',
        businessID: 'business-1',
        name: 'renamed-target',
      }),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });

    expect(
      firestoreMock.writes.some((write) => write.path === 'users/target-user'),
    ).toBe(false);
  });

  it('keeps legitimate non-dev edits but ignores sensitive payload fields', async () => {
    seedSameBusinessTarget({
      password: 'existing-hash',
      loginAttempts: 1,
      lockUntil: 123,
      roleSimulation: {
        originalRole: 'cashier',
      },
    });

    await callUpdateUser({
      id: 'target-user',
      businessID: 'business-1',
      name: 'renamed-target',
      role: 'manager',
      active: true,
      email: 'New@Example.COM',
      password: 'PlainPassword1',
      loginAttempts: 99,
      lockUntil: 999,
      accessControl: [
        {
          businessId: 'attacker-business',
          role: 'owner',
          status: 'active',
        },
      ],
      roleSimulation: {
        originalRole: 'dev',
      },
    });

    const updatedUser = firestoreMock.users.get('target-user');
    expect(updatedUser).toMatchObject({
      name: 'renamed-target',
      activeRole: 'manager',
      active: true,
      email: 'new@example.com',
      password: 'existing-hash',
      loginAttempts: 1,
      lockUntil: 123,
      accessControl: [
        {
          businessId: 'business-1',
          role: 'cashier',
          status: 'active',
        },
      ],
      roleSimulation: {
        originalRole: 'cashier',
      },
    });
  });

  it('resolves the target business from a single legacy membership when payload omits businessID', async () => {
    firestoreMock.users.set('target-user', {
      id: 'target-user',
      name: 'target',
      number: 7,
      active: true,
      activeRole: 'cashier',
      accessControl: [
        {
          businessId: 'business-1',
          role: 'cashier',
          status: 'active',
        },
      ],
      email: 'old@example.com',
    });
    firestoreMock.docs.set('businesses/business-1/members/target-user', {
      role: 'cashier',
      status: 'active',
    });

    await callUpdateUser({
      id: 'target-user',
      name: 'legacy-target',
      email: 'Legacy@Example.COM',
    });

    expect(firestoreMock.users.get('target-user')).toMatchObject({
      name: 'legacy-target',
      email: 'legacy@example.com',
      accessControl: [
        {
          businessId: 'business-1',
          role: 'cashier',
          status: 'active',
        },
      ],
    });
  });

  it('allows admin updates authenticated with a sessionToken', async () => {
    seedSession();
    seedSameBusinessTarget();

    await callUpdateUserWithSession({
      id: 'target-user',
      businessID: 'business-1',
      name: 'session-admin-target',
    });

    expect(firestoreMock.users.get('target-user')).toMatchObject({
      name: 'session-admin-target',
    });
  });

  it('maps invalid admin sessionToken access to permission denied', async () => {
    seedSameBusinessTarget();

    await expect(
      callUpdateUserWithSession(
        {
          id: 'target-user',
          businessID: 'business-1',
          name: 'should-not-update',
        },
        'missing-session-token',
      ),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });

    expect(firestoreMock.users.get('target-user')).toMatchObject({
      name: 'target',
    });
  });

  it('uses the shared callable auth resolver when sessionToken is absent', async () => {
    resolveCallableAuthUidMock.mockResolvedValue('admin-user');
    seedSameBusinessTarget();

    await clientUpdateUser({
      data: {
        userData: {
          id: 'target-user',
          businessID: 'business-1',
          name: 'central-auth-target',
        },
      },
    });

    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userData: expect.objectContaining({
            id: 'target-user',
          }),
        }),
      }),
    );
    expect(firestoreMock.users.get('target-user')).toMatchObject({
      name: 'central-auth-target',
    });
  });

  it('does not trust raw auth.uid when the shared callable auth resolver rejects it', async () => {
    resolveCallableAuthUidMock.mockResolvedValue(null);
    seedSameBusinessTarget();

    await expect(
      clientUpdateUser({
        auth: { uid: 'admin-user' },
        data: {
          userData: {
            id: 'target-user',
            businessID: 'business-1',
            name: 'should-not-update',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });

    expect(firestoreMock.users.get('target-user')).toMatchObject({
      name: 'target',
    });
  });
});

describe('admin target user scope', () => {
  beforeEach(() => {
    resetAuthControllerTestState();
  });

  it('rejects setting password for a user outside the actor business', async () => {
    seedOtherBusinessTarget();

    await expect(
      clientSetUserPassword({
        auth: { uid: 'admin-user' },
        data: {
          userId: 'target-user',
          businessID: 'business-1',
          newPassword: 'NewPassword1',
        },
      }),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });

    expect(firestoreMock.users.get('target-user').password).toBeUndefined();
  });

  it('allows setting password for a user in the actor business', async () => {
    seedSameBusinessTarget();

    await expect(
      clientSetUserPassword({
        auth: { uid: 'admin-user' },
        data: {
          userId: 'target-user',
          businessID: 'business-1',
          newPassword: 'NewPassword1',
        },
      }),
    ).resolves.toMatchObject({
      ok: true,
    });

    const updatedUser = firestoreMock.users.get('target-user');
    expect(updatedUser.password).toBeTruthy();
    expect(updatedUser.password).not.toBe('NewPassword1');
    expect(updatedUser.passwordChangedAt).toBe('__timestamp_now__');
  });

  it('rejects sending email verification for a user outside the actor business', async () => {
    seedOtherBusinessTarget();

    await expect(
      clientSendEmailVerification({
        auth: { uid: 'admin-user' },
        data: {
          userId: 'target-user',
          businessID: 'business-1',
          email: 'attacker@example.com',
        },
      }),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });

    expect(firestoreMock.users.get('target-user').emailVerification.email).toBe(
      'target@example.com',
    );
  });

  it('rejects verifying email code for a user outside the actor business', async () => {
    seedOtherBusinessTarget();

    await expect(
      clientVerifyEmailCode({
        auth: { uid: 'admin-user' },
        data: {
          userId: 'target-user',
          businessID: 'business-1',
          code: '123456',
        },
      }),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });

    const targetUser = firestoreMock.users.get('target-user');
    expect(targetUser.email).toBeUndefined();
    expect(targetUser.emailVerified).toBeUndefined();
    expect(targetUser.emailVerification).toMatchObject({
      email: 'target@example.com',
    });
  });
});
