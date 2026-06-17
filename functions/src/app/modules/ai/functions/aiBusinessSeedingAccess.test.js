import { beforeEach, describe, expect, it, vi } from 'vitest';

const { MockHttpsError, resolveCallableAuthUidMock, userDocGetMock } =
  vi.hoisted(() => {
    class HoistedHttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    }

    return {
      MockHttpsError: HoistedHttpsError,
      resolveCallableAuthUidMock: vi.fn(),
      userDocGetMock: vi.fn(),
    };
  });

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: vi.fn(() => ({
      get: userDocGetMock,
    })),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

import { db } from '../../../core/config/firebase.js';
import { assertAiBusinessSeedingDeveloperAccess } from './aiBusinessSeedingAccess.js';

describe('assertAiBusinessSeedingDeveloperAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue(' session-dev ');
    userDocGetMock.mockResolvedValue({
      exists: true,
      data: () => ({
        platformRoles: {
          dev: true,
        },
      }),
    });
  });

  it('resolves the actor through callable session auth before checking dev access', async () => {
    const request = {
      auth: {
        uid: 'direct-auth-user',
      },
      data: {
        sessionToken: 'session-token',
      },
    };

    await expect(
      assertAiBusinessSeedingDeveloperAccess(request),
    ).resolves.toMatchObject({
      uid: 'session-dev',
      userData: {
        platformRoles: {
          dev: true,
        },
      },
    });

    expect(resolveCallableAuthUidMock).toHaveBeenCalledWith(request);
    expect(db.doc).toHaveBeenCalledWith('users/session-dev');
  });

  it('rejects requests without a resolved actor before reading the user document', async () => {
    resolveCallableAuthUidMock.mockResolvedValue(null);

    await expect(
      assertAiBusinessSeedingDeveloperAccess({
        data: {
          user: {
            uid: 'payload-user',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
    });

    expect(db.doc).not.toHaveBeenCalled();
  });
});
