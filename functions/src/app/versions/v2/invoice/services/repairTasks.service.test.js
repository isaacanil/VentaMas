import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  docGetMock,
  failedTasksGetMock,
  failedTaskSetMock,
  pendingTasksGetMock,
  repairTaskSetMock,
  MockHttpsError,
} = vi.hoisted(() => {
  const hoistedDocGetMock = vi.fn();
  const hoistedFailedTasksGetMock = vi.fn(async () => ({
    empty: true,
    docs: [],
  }));
  const hoistedFailedTaskSetMock = vi.fn();
  const hoistedPendingTasksGetMock = vi.fn(async () => ({
    empty: true,
    docs: [],
  }));
  const hoistedRepairTaskSetMock = vi.fn();

  class HoistedHttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }

  return {
    docGetMock: hoistedDocGetMock,
    failedTasksGetMock: hoistedFailedTasksGetMock,
    failedTaskSetMock: hoistedFailedTaskSetMock,
    pendingTasksGetMock: hoistedPendingTasksGetMock,
    repairTaskSetMock: hoistedRepairTaskSetMock,
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
    collection: vi.fn(() => {
      const resolveGet = (filters) => {
        const statusFilter = filters.find((filter) => filter.field === 'status');
        if (statusFilter?.value === 'pending') {
          return pendingTasksGetMock(filters);
        }
        if (statusFilter?.value === 'failed') {
          return failedTasksGetMock(filters);
        }
        return { empty: true, docs: [] };
      };
      const buildQuery = (filters = []) => ({
        where: vi.fn((field, operator, value) =>
          buildQuery([...filters, { field, operator, value }]),
        ),
        limit: vi.fn(() => ({
          get: vi.fn(async () => resolveGet(filters)),
        })),
        get: vi.fn(async () => resolveGet(filters)),
      });

      return {
        doc: vi.fn(() => ({
          id: 'task-1',
          set: repairTaskSetMock,
        })),
        where: buildQuery().where,
      };
    }),
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
  enqueueRepairTask,
  sanitizeTasks,
} from './repairTasks.service.js';

describe('repairTasks.service sanitizeTasks', () => {
  it('permite reprogramar la emision fiscal electronica', () => {
    expect(sanitizeTasks(['issueElectronicTaxReceipt'])).toEqual([
      'issueElectronicTaxReceipt',
    ]);
  });
});

describe('repairTasks.service enqueueRepairTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pendingTasksGetMock.mockResolvedValue({ empty: true, docs: [] });
    failedTasksGetMock.mockResolvedValue({ empty: true, docs: [] });
  });

  it('marca las tareas fallidas previas del mismo tipo como reemplazadas', async () => {
    failedTasksGetMock.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'failed-task-1',
          ref: {
            set: failedTaskSetMock,
          },
        },
      ],
    });

    const result = await enqueueRepairTask({
      businessId: 'business-1',
      invoiceId: 'invoice-1',
      type: 'issueElectronicTaxReceipt',
      payload: { businessId: 'business-1', invoiceId: 'invoice-1' },
      authUid: 'user-1',
      reason: 'retry after GISYS payload fix',
      invoice: { userId: 'seller-1' },
    });

    expect(result).toMatchObject({
      status: 'scheduled',
      taskId: 'task-1',
      supersededFailedTasks: 1,
    });
    expect(repairTaskSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'issueElectronicTaxReceipt',
        status: 'pending',
        manualRetry: true,
      }),
    );
    expect(failedTaskSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'superseded',
        supersededBy: 'task-1',
        supersededByUser: 'user-1',
        supersededReason: 'retry after GISYS payload fix',
      }),
      { merge: true },
    );
  });
});

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
