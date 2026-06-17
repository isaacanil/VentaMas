import { beforeEach, describe, expect, it, vi } from 'vitest';

const resolveCallableAuthUidMock = vi.hoisted(() => vi.fn());
const firestoreMock = vi.hoisted(() => {
  const docs = new Map();
  const writes = [];

  const getPath = (path) => docs.get(path);

  const setPath = (path, payload, options = {}) => {
    writes.push({ path, payload, options });
    const previous = docs.get(path);
    docs.set(path, options?.merge ? { ...previous, ...payload } : payload);
  };

  const createDocRef = (path) => ({
    id: path.split('/').pop(),
    get: vi.fn(async () => {
      const payload = getPath(path);
      return {
        id: path.split('/').pop(),
        exists: payload !== undefined && payload !== null,
        data: () => payload,
        get: (field) => payload?.[field],
      };
    }),
    set: vi.fn(async (payload, options) => setPath(path, payload, options)),
    update: vi.fn(async (payload) => setPath(path, payload, { merge: true })),
  });

  const collection = vi.fn((collectionPath) => ({
    doc: (id = 'generated-invite-id') =>
      createDocRef(`${collectionPath}/${id}`),
  }));

  const doc = vi.fn((path) => createDocRef(path));

  return {
    collection,
    doc,
    docs,
    writes,
    reset() {
      docs.clear();
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
  onCall: (optionsOrHandler, maybeHandler) =>
    typeof optionsOrHandler === 'function' ? optionsOrHandler : maybeHandler,
}));

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    collection: firestoreMock.collection,
    doc: firestoreMock.doc,
  },
  FieldValue: {
    serverTimestamp: () => '__server_timestamp__',
  },
  Timestamp: {
    fromMillis: (value) => ({ toMillis: () => value }),
  },
}));

vi.mock('../../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async () => 'hashed-invite-code'),
  },
}));

vi.mock('nanoid', () => ({
  nanoid: () => 'abc123xyz0',
}));

vi.mock('../../billing/services/usage.service.js', () => ({
  incrementBusinessUsageMetric: vi.fn(),
}));

vi.mock('../../billing/utils/subscriptionAccess.util.js', () => ({
  assertBusinessSubscriptionAccess: vi.fn(),
}));

import { createBusinessInvite } from './businessInvites.controller.js';

const actorUserPath = 'users/actor-user';
const actorMemberPath = 'businesses/business-1/members/actor-user';

const callCreateBusinessInvite = () =>
  createBusinessInvite({
    auth: { uid: 'actor-user' },
    data: {
      businessId: 'business-1',
      role: 'cashier',
    },
  });

const getInviteWrite = () =>
  firestoreMock.writes.find(
    (write) => write.path === 'businessInvites/generated-invite-id',
  );

describe('createBusinessInvite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockImplementation(
      async (request) => request?.auth?.uid ?? null,
    );
    firestoreMock.reset();
  });

  it('resolves the actor through the central callable auth boundary', async () => {
    resolveCallableAuthUidMock.mockResolvedValue('actor-user');
    firestoreMock.docs.set(actorUserPath, {
      accessControl: [
        {
          businessId: 'business-1',
          role: 'owner',
          status: 'active',
        },
      ],
    });

    const result = await callCreateBusinessInvite();

    expect(result).toMatchObject({
      ok: true,
      businessId: 'business-1',
    });
    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith({
      auth: { uid: 'actor-user' },
      data: {
        businessId: 'business-1',
        role: 'cashier',
      },
    });
    expect(getInviteWrite()?.payload).toMatchObject({
      createdBy: 'actor-user',
    });
  });

  it('does not bypass the central auth resolver when it rejects the request', async () => {
    resolveCallableAuthUidMock.mockResolvedValue(null);
    firestoreMock.docs.set(actorUserPath, {
      accessControl: [
        {
          businessId: 'business-1',
          role: 'owner',
          status: 'active',
        },
      ],
    });

    await expect(callCreateBusinessInvite()).rejects.toMatchObject({
      code: 'unauthenticated',
    });

    expect(getInviteWrite()).toBeUndefined();
  });

  it('prefers the canonical member role before legacy accessControl', async () => {
    firestoreMock.docs.set(actorUserPath, {
      accessControl: [
        {
          businessId: 'business-1',
          role: 'cashier',
          status: 'active',
        },
      ],
    });
    firestoreMock.docs.set(actorMemberPath, {
      businessId: 'business-1',
      role: 'admin',
      status: 'active',
    });

    const result = await callCreateBusinessInvite();

    expect(result).toMatchObject({
      ok: true,
      businessId: 'business-1',
      role: 'cashier',
      code: 'VM-ABC123XYZ0',
    });
    expect(getInviteWrite()?.payload).toMatchObject({
      businessId: 'business-1',
      createdBy: 'actor-user',
      status: 'active',
      codeHash: 'hashed-invite-code',
    });
  });

  it('does not fall back to legacy accessControl when canonical member is inactive', async () => {
    firestoreMock.docs.set(actorUserPath, {
      accessControl: [
        {
          businessId: 'business-1',
          role: 'admin',
          status: 'active',
        },
      ],
    });
    firestoreMock.docs.set(actorMemberPath, {
      businessId: 'business-1',
      role: 'admin',
      status: 'suspended',
    });

    await expect(callCreateBusinessInvite()).rejects.toMatchObject({
      code: 'permission-denied',
    });
    expect(getInviteWrite()).toBeUndefined();
  });

  it('keeps legacy accessControl compatibility when canonical member is missing', async () => {
    firestoreMock.docs.set(actorUserPath, {
      accessControl: [
        {
          businessId: 'business-1',
          role: 'owner',
          status: 'active',
        },
      ],
    });

    const result = await callCreateBusinessInvite();

    expect(result).toMatchObject({
      ok: true,
      businessId: 'business-1',
      role: 'cashier',
    });
    expect(getInviteWrite()).toBeTruthy();
  });
});
