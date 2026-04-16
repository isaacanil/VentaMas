import { beforeEach, describe, expect, it, vi } from 'vitest';

const { docGetMock, MockHttpsError } = vi.hoisted(() => {
  const hoistedDocGetMock = vi.fn();

  class HoistedHttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }

  return {
    docGetMock: hoistedDocGetMock,
    MockHttpsError: HoistedHttpsError,
  };
});

vi.mock('firebase-functions', () => ({
  https: {
    HttpsError: MockHttpsError,
  },
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    doc: (path) => ({
      id: path.split('/').at(-1),
      path,
      get: (...args) => docGetMock(path, ...args),
    }),
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        id: 'task-1',
        set: vi.fn(),
      })),
      where: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(async () => ({ empty: true })),
          })),
        })),
        limit: vi.fn(() => ({
          get: vi.fn(async () => ({ empty: true })),
        })),
      })),
    })),
  },
  FieldValue: {
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  },
}));

vi.mock('./audit.service.js', () => ({
  auditSafe: vi.fn(),
}));

import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from './repairTasks.service.js';

describe('repairTasks.service assertUserAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite acceso global a dev de plataforma aunque activeBusinessId sea otro', async () => {
    docGetMock.mockImplementation(async (path) => {
      if (path === 'users/dev-user') {
        return {
          exists: true,
          data: () => ({
            role: 'admin',
            activeBusinessId: 'business-other',
            platformRoles: {
              dev: true,
            },
          }),
        };
      }

      return {
        exists: false,
        data: () => ({}),
      };
    });

    await expect(
      assertUserAccess({
        authUid: 'dev-user',
        businessId: 'business-target',
        allowedRoles: MEMBERSHIP_ROLE_GROUPS.AUDIT,
      }),
    ).resolves.toEqual({
      businessId: 'business-target',
      role: 'dev',
      status: 'active',
      source: 'global-role',
    });
  });

  it('permite acceso global a dev de plataforma aunque membresía canónica sea cashier', async () => {
    docGetMock.mockImplementation(async (path) => {
      if (path === 'users/dev-user') {
        return {
          exists: true,
          data: () => ({
            activeBusinessId: 'business-target',
            activeRole: 'cashier',
            platformRoles: {
              dev: true,
            },
          }),
        };
      }

      if (path === 'businesses/business-target/members/dev-user') {
        return {
          exists: true,
          data: () => ({
            role: 'cashier',
            status: 'active',
          }),
        };
      }

      return {
        exists: false,
        data: () => ({}),
      };
    });

    await expect(
      assertUserAccess({
        authUid: 'dev-user',
        businessId: 'business-target',
        allowedRoles: MEMBERSHIP_ROLE_GROUPS.AUDIT,
      }),
    ).resolves.toEqual({
      businessId: 'business-target',
      role: 'dev',
      status: 'active',
      source: 'global-role',
    });
  });

  it('mantiene bloqueo para usuario sin membresía ni privilegio dev global', async () => {
    docGetMock.mockImplementation(async (path) => {
      if (path === 'users/regular-user') {
        return {
          exists: true,
          data: () => ({
            role: 'admin',
            activeBusinessId: 'business-other',
          }),
        };
      }

      return {
        exists: false,
        data: () => ({}),
      };
    });

    await expect(
      assertUserAccess({
        authUid: 'regular-user',
        businessId: 'business-target',
        allowedRoles: MEMBERSHIP_ROLE_GROUPS.AUDIT,
      }),
    ).rejects.toMatchObject({
      code: 'permission-denied',
      message: 'No autorizado para este negocio',
    });
  });
});
