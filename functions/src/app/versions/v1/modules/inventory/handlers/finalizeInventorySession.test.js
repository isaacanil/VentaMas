import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertBusinessSubscriptionAccessMock,
  assertUserAccessMock,
  dbDocMock,
  docUpdateMock,
  MockHttpsError,
  resolveCallableAuthUidMock,
  serverTimestampMock,
} = vi.hoisted(() => {
  class HoistedHttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }

  return {
    assertBusinessSubscriptionAccessMock: vi.fn(),
    assertUserAccessMock: vi.fn(),
    dbDocMock: vi.fn((path) => ({
      id: path.split('/').at(-1),
      path,
      update: vi.fn(),
      set: vi.fn(),
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          id: 'nested-doc',
          path: `${path}/snapshots/nested-doc`,
          set: vi.fn(),
        })),
      })),
    })),
    docUpdateMock: vi.fn(),
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: vi.fn(),
    serverTimestampMock: vi.fn(() => 'server-timestamp'),
  };
});

vi.mock('firebase-functions', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (...args) => args.at(-1),
}));

vi.mock('../../../../../core/config/firebase.js', () => ({
  db: {
    batch: vi.fn(() => ({
      commit: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
    })),
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        id: 'generated-doc',
        path: 'generated-doc',
        set: vi.fn(),
      })),
      where: vi.fn(),
    })),
    doc: (...args) => {
      const ref = dbDocMock(...args);
      return {
        ...ref,
        update: (...updateArgs) => docUpdateMock(ref.path, ...updateArgs),
      };
    },
    runTransaction: vi.fn(),
  },
  FieldValue: {
    increment: vi.fn((value) => ({ __op: 'increment', value })),
    serverTimestamp: (...args) => serverTimestampMock(...args),
  },
  Timestamp: {
    fromDate: vi.fn((date) => ({
      toDate: () => date,
    })),
  },
}));

vi.mock('../../../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../../../core/utils/getNextID.js', () => ({
  getNextID: vi.fn(),
}));

vi.mock('../../../../v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    MAINTENANCE: ['maintenance'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock('../../../../v2/billing/utils/subscriptionAccess.util.js', () => ({
  assertBusinessSubscriptionAccess: (...args) =>
    assertBusinessSubscriptionAccessMock(...args),
}));

vi.mock('../../batch/services/batch.service.js', () => ({
  createBatch: vi.fn(),
}));

vi.mock('../../inventoryMovements/types/inventoryMovements.js', () => ({
  MovementReason: {
    Adjustment: 'adjustment',
  },
  MovementType: {
    Entry: 'in',
    Exit: 'out',
  },
}));

vi.mock('../../warehouse/services/warehouse.service.js', () => ({
  ensureDefaultWarehouse: vi.fn(),
}));

import { finalizeInventorySession } from './finalizeInventorySession.js';

describe('finalizeInventorySession identity boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue('auth-user');
    assertUserAccessMock.mockResolvedValue(undefined);
    assertBusinessSubscriptionAccessMock.mockResolvedValue({ allowed: true });
  });

  it('rechaza cuando data.user.uid no coincide con el actor autenticado', async () => {
    await expect(
      finalizeInventorySession({
        auth: { uid: 'auth-user' },
        data: {
          user: {
            uid: 'spoofed-user',
            businessID: 'business-1',
          },
          sessionId: 'session-1',
        },
      }),
    ).rejects.toMatchObject({
      code: 'permission-denied',
      message: 'El usuario autenticado no coincide con el payload',
    });

    expect(assertUserAccessMock).not.toHaveBeenCalled();
    expect(assertBusinessSubscriptionAccessMock).not.toHaveBeenCalled();
    expect(docUpdateMock).not.toHaveBeenCalled();
  });

  it('usa actorUid para cerrar la sesión cuando el payload no trae uid', async () => {
    await expect(
      finalizeInventorySession({
        auth: { uid: 'auth-user' },
        data: {
          user: {
            businessID: 'business-1',
          },
          sessionId: 'session-1',
          groups: [],
          counts: {},
          stocks: [],
          countsMeta: {},
        },
      }),
    ).resolves.toMatchObject({
      adjustments: [],
      expirationUpdates: [],
      productsUpdated: 0,
      batchesUpdated: 0,
      syntheticCreations: [],
      backOrdersCreated: 0,
    });

    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'auth-user',
      businessId: 'business-1',
      allowedRoles: ['maintenance'],
    });
    expect(assertBusinessSubscriptionAccessMock).toHaveBeenCalledWith({
      businessId: 'business-1',
      action: 'write',
      requiredModule: 'inventory',
    });
    expect(docUpdateMock).toHaveBeenCalledWith(
      'businesses/business-1/inventorySessions/session-1',
      expect.objectContaining({
        status: 'closed',
        closedBy: 'auth-user',
        updatedBy: 'auth-user',
      }),
    );
  });
});
