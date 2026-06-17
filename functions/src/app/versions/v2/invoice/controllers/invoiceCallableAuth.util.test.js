import { beforeEach, describe, expect, it, vi } from 'vitest';

const resolveCallableAuthUidMock = vi.hoisted(() => vi.fn());

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  },
}));

vi.mock('../../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

import { resolveRequiredCallableActorUid } from './invoiceCallableAuth.util.js';

describe('resolveRequiredCallableActorUid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue('user-1');
  });

  it('rejects payload-only user identity when callable auth is missing', async () => {
    resolveCallableAuthUidMock.mockResolvedValue(null);

    await expect(
      resolveRequiredCallableActorUid({
        data: {
          user: {
            uid: 'spoofed-user',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
    });
  });

  it('rejects payload user mismatch', async () => {
    await expect(
      resolveRequiredCallableActorUid({
        auth: { uid: 'user-1' },
        data: {
          userId: 'user-2',
        },
      }),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });

  it('returns the authenticated actor uid when payload matches', async () => {
    await expect(
      resolveRequiredCallableActorUid({
        auth: { uid: 'user-1' },
        data: {
          user: {
            uid: 'user-1',
          },
        },
      }),
    ).resolves.toBe('user-1');
  });
});
