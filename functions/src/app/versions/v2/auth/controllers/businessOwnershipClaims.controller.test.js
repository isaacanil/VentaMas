import { beforeEach, describe, expect, it, vi } from 'vitest';

const resolveCallableAuthUidMock = vi.hoisted(() => vi.fn());
const firestoreMock = vi.hoisted(() => {
  const docs = new Map();
  const reads = [];
  const writes = [];

  const createSnap = (path, payload) => ({
    id: path.split('/').pop(),
    exists: payload !== undefined && payload !== null,
    data: () => payload,
    get: (field) => payload?.[field],
  });

  const readPath = (path) => {
    reads.push(path);
    return docs.get(path);
  };

  const writePath = (path, payload, options = {}) => {
    writes.push({ path, payload, options });
    const previous = docs.get(path);
    docs.set(path, options?.merge ? { ...previous, ...payload } : payload);
  };

  const createQueryRef = (collectionPath, filters = []) => {
    const queryRef = {
      where: (field, operator, value) =>
        createQueryRef(collectionPath, [
          ...filters,
          { field, operator, value },
        ]),
      limit: () => queryRef,
      get: vi.fn(async () => {
        reads.push(`${collectionPath}#query`);
        const docsList = Array.from(docs.entries())
          .filter(([path]) => path.startsWith(`${collectionPath}/`))
          .map(([path, payload]) => createSnap(path, payload))
          .filter((snap) =>
            filters.every(({ field, operator, value }) => {
              if (operator !== '==') return true;
              return snap.get(field) === value;
            }),
          );

        return {
          docs: docsList,
          empty: docsList.length === 0,
        };
      }),
    };

    return queryRef;
  };

  const createCollectionRef = (collectionPath) => ({
    doc: (id = 'generated-claim-id') => createDocRef(`${collectionPath}/${id}`),
    where: (field, operator, value) =>
      createQueryRef(collectionPath, [{ field, operator, value }]),
  });

  const createDocRef = (path) => ({
    id: path.split('/').pop(),
    path,
    collection: (name) => createCollectionRef(`${path}/${name}`),
    get: vi.fn(async () => createSnap(path, readPath(path))),
    set: vi.fn(async (payload, options) => writePath(path, payload, options)),
  });

  const collection = vi.fn((collectionPath) =>
    createCollectionRef(collectionPath),
  );
  const doc = vi.fn((path) => createDocRef(path));

  return {
    collection,
    doc,
    docs,
    reads,
    writes,
    reset() {
      docs.clear();
      reads.length = 0;
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
    hash: vi.fn(async () => 'hashed-claim-code'),
    compare: vi.fn(async () => false),
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

import { createBusinessOwnershipClaimToken } from './businessOwnershipClaims.controller.js';

const buildCreateClaimRequest = (overrides = {}) => ({
  auth: overrides.auth,
  data: {
    businessId: 'business-1',
    ...overrides.data,
  },
});

const seedClaimableBusiness = (actorUserId) => {
  firestoreMock.docs.set(`users/${actorUserId}`, {
    platformRoles: {
      dev: true,
    },
  });
  firestoreMock.docs.set('businesses/business-1', {
    name: 'Negocio Uno',
  });
};

const getClaimWrite = () =>
  firestoreMock.writes.find(
    (write) => write.path === 'businessOwnershipClaims/generated-claim-id',
  );

describe('createBusinessOwnershipClaimToken auth boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue(null);
    firestoreMock.reset();
  });

  it('rejects without touching Firestore when no actor resolves', async () => {
    const request = buildCreateClaimRequest();

    await expect(
      createBusinessOwnershipClaimToken(request),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
    });

    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith(request);
    expect(firestoreMock.reads).toHaveLength(0);
    expect(firestoreMock.writes).toHaveLength(0);
  });

  it('uses the actor resolved by the central callable auth helper', async () => {
    const request = buildCreateClaimRequest({
      auth: { uid: 'firebase-user' },
      data: {
        sessionToken: 'session-token-1',
        baseUrl: 'https://app.example.test/internal',
      },
    });
    resolveCallableAuthUidMock.mockResolvedValue('central-actor');
    seedClaimableBusiness('central-actor');

    const result = await createBusinessOwnershipClaimToken(request);

    expect(result).toMatchObject({
      ok: true,
      claimId: 'generated-claim-id',
      businessId: 'business-1',
      code: 'OWN-ABC123XYZ0',
      claimUrl: 'https://app.example.test/claim-business?token=OWN-ABC123XYZ0',
    });
    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith(request);
    expect(firestoreMock.reads).toContain('users/central-actor');
    expect(firestoreMock.reads).not.toContain('users/firebase-user');
    expect(getClaimWrite()?.payload).toMatchObject({
      businessId: 'business-1',
      createdBy: 'central-actor',
      status: 'active',
      codeHash: 'hashed-claim-code',
    });
  });

  it('does not bypass the central auth helper with request.auth.uid', async () => {
    const request = buildCreateClaimRequest({
      auth: { uid: 'firebase-user' },
    });
    seedClaimableBusiness('firebase-user');

    await expect(
      createBusinessOwnershipClaimToken(request),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
    });

    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith(request);
    expect(firestoreMock.reads).toHaveLength(0);
    expect(firestoreMock.writes).toHaveLength(0);
  });
});
