import { beforeEach, describe, expect, it, vi } from 'vitest';

const resolveCallableAuthUidMock = vi.hoisted(() => vi.fn());
const getUserAccessProfileMock = vi.hoisted(() => vi.fn());
const ensureDefaultWarehouseMock = vi.hoisted(() => vi.fn());

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  },
  onCall: (handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    collection: vi.fn(),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  getUserAccessProfile: (...args) => getUserAccessProfileMock(...args),
}));

vi.mock('../../warehouse/services/defaultWarehouse.service.js', () => ({
  ensureDefaultWarehouse: (...args) => ensureDefaultWarehouseMock(...args),
}));

import { db } from '../../../core/config/firebase.js';
import { ensureDefaultWarehousesForBusinesses } from './ensureDefaultWarehousesForBusinesses.js';

describe('ensureDefaultWarehousesForBusinesses auth boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue('dev-1');
    getUserAccessProfileMock.mockResolvedValue({
      userSnap: { exists: true },
      hasGlobalUnscopedAccess: true,
    });
  });

  it('does not trust payload user uid when callable auth is missing', async () => {
    resolveCallableAuthUidMock.mockResolvedValue(null);

    await expect(
      ensureDefaultWarehousesForBusinesses({
        data: {
          user: {
            uid: 'spoofed-user',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'unauthenticated',
    });

    expect(getUserAccessProfileMock).not.toHaveBeenCalled();
    expect(db.collection).not.toHaveBeenCalled();
  });

  it('rejects non-platform users for the global warehouse backfill', async () => {
    resolveCallableAuthUidMock.mockResolvedValue('owner-1');
    getUserAccessProfileMock.mockResolvedValue({
      userSnap: { exists: true },
      hasGlobalUnscopedAccess: false,
    });

    await expect(
      ensureDefaultWarehousesForBusinesses({
        auth: { uid: 'owner-1' },
        data: {
          dryRun: true,
        },
      }),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });

    expect(getUserAccessProfileMock).toHaveBeenCalledWith('owner-1');
    expect(db.collection).not.toHaveBeenCalled();
  });
});
