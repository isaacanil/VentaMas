import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  collectionSnapshots,
  documentRefs,
  documentSnapshots,
  getDocRef,
  MockHttpsError,
  resolveCallableAuthUidMock,
  runTransactionMock,
  setCalls,
} = vi.hoisted(() => {
  const hoistedDocumentSnapshots = new Map();
  const hoistedCollectionSnapshots = new Map();
  const hoistedDocumentRefs = new Map();
  const hoistedSetCalls = [];

  class HoistedHttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }

  const hoistedToSnapshot = (path, data) => ({
    exists: data != null,
    id: path.split('/').at(-1) ?? null,
    data: () => data,
    get: (field) =>
      field
        .split('.')
        .reduce((current, key) => current?.[key], data ?? null),
  });

  const hoistedGetDocRef = (path) => {
    if (!hoistedDocumentRefs.has(path)) {
      hoistedDocumentRefs.set(path, { path });
    }
    return hoistedDocumentRefs.get(path);
  };

  const hoistedTransactionGetMock = vi.fn(async (ref) => {
    if (ref?.collectionPath) {
      const entries = hoistedCollectionSnapshots.get(ref.collectionPath) ?? [];
      const filteredEntries = ref.filter
        ? entries.filter((entry) => {
            const value = entry.data?.[ref.filter.field];
            if (ref.filter.operator === 'array-contains') {
              return Array.isArray(value) && value.includes(ref.filter.value);
            }
            return value === ref.filter.value;
          })
        : entries;
      return {
        empty: filteredEntries.length === 0,
        docs: filteredEntries
          .slice(0, ref.queryLimit ?? filteredEntries.length)
          .map((entry) => ({
            id: entry.id,
            data: () => entry.data,
          })),
      };
    }

    return hoistedToSnapshot(ref.path, hoistedDocumentSnapshots.get(ref.path));
  });

  return {
    assertUserAccessMock: vi.fn(),
    collectionSnapshots: hoistedCollectionSnapshots,
    documentRefs: hoistedDocumentRefs,
    documentSnapshots: hoistedDocumentSnapshots,
    getDocRef: hoistedGetDocRef,
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: vi.fn(),
    runTransactionMock: vi.fn(async (callback) =>
      callback({
        get: hoistedTransactionGetMock,
        set: vi.fn((ref, data, options) => {
          hoistedSetCalls.push({ ref, data, options });
        }),
      }),
    ),
    setCalls: hoistedSetCalls,
  };
});

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (_options, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  Timestamp: class MockTimestamp {
    constructor(millis) {
      this.millis = millis;
    }

    static now() {
      return new MockTimestamp(Date.parse('2026-04-15T12:00:00.000Z'));
    }

    toMillis() {
      return this.millis;
    }
  },
  db: {
    doc: (path) => getDocRef(path),
    collection: (path) => ({
      collectionPath: path,
      doc: (id) => getDocRef(`${path}/${id || 'generated-1'}`),
      where: (field, operator, value) => ({
        collectionPath: path,
        filter: { field, operator, value },
        limit(queryLimit) {
          return {
            collectionPath: path,
            filter: { field, operator, value },
            queryLimit,
          };
        },
      }),
    }),
    runTransaction: (...args) => runTransactionMock(...args),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/invoice/services/repairTasks.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    FINANCE_CONFIG: ['owner', 'admin', 'accountant', 'controller'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

import {
  createAccountingPostingProfile,
  createChartOfAccount,
  disableChartOfAccount,
} from './manageAccountingConfiguration.js';

describe('manageAccountingConfiguration', () => {
  beforeEach(() => {
    collectionSnapshots.clear();
    documentRefs.clear();
    documentSnapshots.clear();
    setCalls.length = 0;
    vi.clearAllMocks();
    resolveCallableAuthUidMock.mockResolvedValue('accountant-1');
    assertUserAccessMock.mockResolvedValue(undefined);
  });

  it('requires the finance configuration role group for chart writes', async () => {
    await createChartOfAccount({
      data: {
        businessId: 'business-1',
        account: {
          code: '1200',
          name: 'Banco pruebas',
          type: 'asset',
        },
      },
    });

    expect(assertUserAccessMock).toHaveBeenCalledWith({
      authUid: 'accountant-1',
      businessId: 'business-1',
      allowedRoles: ['owner', 'admin', 'accountant', 'controller'],
    });
    expect(setCalls[0].data).toEqual(
      expect.objectContaining({
        businessId: 'business-1',
        code: '1200',
        name: 'Banco pruebas',
        createdBy: 'accountant-1',
        updatedBy: 'accountant-1',
      }),
    );
  });

  it('blocks disabling a chart account used by posted journal entries', async () => {
    documentSnapshots.set(
      'businesses/business-1/chartOfAccounts/account-1',
      {
        id: 'account-1',
        code: '1100',
        name: 'Caja',
        type: 'asset',
        status: 'active',
        postingAllowed: true,
      },
    );
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'account-1',
        data: {
          code: '1100',
          name: 'Caja',
          type: 'asset',
          status: 'active',
        },
      },
    ]);
    collectionSnapshots.set(
      'businesses/business-1/accountingPostingProfiles',
      [],
    );
    collectionSnapshots.set('businesses/business-1/journalEntries', [
      {
        id: 'entry-1',
        data: {
          accountIds: ['account-1'],
        },
      },
    ]);

    await expect(
      disableChartOfAccount({
        data: {
          businessId: 'business-1',
          accountId: 'account-1',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'La cuenta ya está usada por asientos contables y no puede desactivarse sin revisión contable.',
    });
    expect(setCalls).toHaveLength(0);
  });

  it('rejects posting profiles that reference inactive accounts', async () => {
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'account-1',
        data: {
          code: '1100',
          name: 'Caja',
          type: 'asset',
          status: 'inactive',
          postingAllowed: true,
        },
      },
    ]);
    collectionSnapshots.set(
      'businesses/business-1/accountingPostingProfiles',
      [],
    );

    await expect(
      createAccountingPostingProfile({
        data: {
          businessId: 'business-1',
          profile: {
            name: 'Venta prueba',
            eventType: 'invoice.committed',
            priority: 10,
            linesTemplate: [
              {
                side: 'debit',
                accountId: 'account-1',
                amountSource: 'document_total',
              },
              {
                side: 'credit',
                accountId: 'account-1',
                amountSource: 'document_total',
              },
            ],
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'Todas las cuentas usadas por el perfil deben estar activas.',
    });
    expect(setCalls).toHaveLength(0);
  });
});
