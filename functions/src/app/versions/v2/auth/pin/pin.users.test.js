import { beforeEach, describe, expect, it, vi } from 'vitest';

const resolveCallableAuthUidMock = vi.hoisted(() => vi.fn());
const firestoreMock = vi.hoisted(() => {
  const createSnap = (id, payload) => ({
    id,
    exists: payload !== undefined && payload !== null,
    data: () => payload,
  });

  const users = new Map();
  const docs = new Map();
  const collection = vi.fn((collectionName) => {
    if (collectionName !== 'users') {
      throw new Error(`Unexpected collection: ${collectionName}`);
    }

    return {
      doc: (id) => ({
        get: vi.fn(async () => createSnap(id, users.get(id))),
      }),
    };
  });
  const doc = vi.fn((path) => ({
    get: vi.fn(async () => {
      const id = path.split('/').pop();
      return createSnap(id, docs.get(path));
    }),
  }));

  return {
    collection,
    doc,
    docs,
    users,
  };
});

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  },
}));

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    collection: firestoreMock.collection,
    doc: firestoreMock.doc,
  },
}));

vi.mock('../../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

import { resolveActorContext } from './pin.users.js';

const seedActiveActor = (uid = 'auth-user') => {
  firestoreMock.users.set(uid, {
    uid,
    name: 'Usuario Autenticado',
    displayName: 'Usuario Autenticado',
    active: true,
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
  firestoreMock.docs.set(`businesses/business-1/members/${uid}`, {
    role: 'admin',
    status: 'active',
  });
};

describe('resolveActorContext auth boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue(null);
    firestoreMock.users.clear();
    firestoreMock.docs.clear();
  });

  it('does not trust actorUid payload when callable auth is missing', async () => {
    await expect(
      resolveActorContext({
        data: {
          actorUid: 'spoofed-user',
          businessId: 'business-1',
        },
      }),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
    });

    expect(firestoreMock.collection).not.toHaveBeenCalled();
    expect(firestoreMock.doc).not.toHaveBeenCalled();
  });

  it('does not bypass the central auth resolver with request.auth.uid', async () => {
    await expect(
      resolveActorContext({
        auth: {
          uid: 'legacy-auth-user',
        },
        data: {
          businessId: 'business-1',
        },
      }),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
    });

    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith({
      auth: {
        uid: 'legacy-auth-user',
      },
      data: {
        businessId: 'business-1',
      },
    });
    expect(firestoreMock.collection).not.toHaveBeenCalled();
    expect(firestoreMock.doc).not.toHaveBeenCalled();
  });

  it.each([
    ['data.actor.uid', { actor: { uid: 'spoofed-user' } }],
    ['data.actor.id', { actor: { id: 'spoofed-user' } }],
    ['data.currentUser.uid', { currentUser: { uid: 'spoofed-user' } }],
    ['data.user.uid', { user: { uid: 'spoofed-user' } }],
    ['data.actorUid', { actorUid: 'spoofed-user' }],
    ['data.uid', { uid: 'spoofed-user' }],
  ])('rejects %s mismatch with callable auth uid', async (_field, data) => {
    resolveCallableAuthUidMock.mockResolvedValue('auth-user');

    await expect(
      resolveActorContext({
        data: {
          ...data,
          businessId: 'business-1',
        },
      }),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });

    expect(firestoreMock.collection).not.toHaveBeenCalled();
    expect(firestoreMock.doc).not.toHaveBeenCalled();
  });

  it('resolves the actor from callable auth uid when matching metadata is present', async () => {
    resolveCallableAuthUidMock.mockResolvedValue('auth-user');
    seedActiveActor('auth-user');

    const context = await resolveActorContext({
      data: {
        actor: {
          uid: 'auth-user',
          businessId: 'business-1',
        },
      },
    });

    expect(context).toMatchObject({
      actorUid: 'auth-user',
      actorUser: {
        businessID: 'business-1',
        activeBusinessId: 'business-1',
        role: 'admin',
      },
      actorBusinessContext: {
        businessId: 'business-1',
        role: 'admin',
        source: 'canonical',
      },
    });
    expect(firestoreMock.collection).toHaveBeenCalledWith('users');
    expect(firestoreMock.doc).toHaveBeenCalledWith(
      'businesses/business-1/members/auth-user',
    );
  });
});
