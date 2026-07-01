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
      hoistedDocumentRefs.set(path, {
        id: path.split('/').at(-1) ?? null,
        path,
      });
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

    static fromDate(date) {
      return new MockTimestamp(date.getTime());
    }

    static fromMillis(millis) {
      return new MockTimestamp(millis);
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

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    FINANCE_CONFIG: ['owner', 'admin', 'accountant', 'controller'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

import {
  backfillBankAccountChartLinks,
  createAccountingPostingProfile,
  createBankAccount,
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

  it('creates a bank account with a linked 1110 child chart account', async () => {
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'assets-root',
        data: {
          code: '1000',
          name: 'Activos',
          type: 'asset',
          status: 'active',
          postingAllowed: false,
        },
      },
      {
        id: 'bank-root',
        data: {
          code: '1110',
          name: 'Cuentas bancarias',
          type: 'asset',
          status: 'active',
          postingAllowed: true,
          systemKey: 'bank',
        },
      },
      {
        id: 'bank-existing',
        data: {
          code: '1110.01',
          name: 'Banco existente',
          type: 'asset',
          status: 'active',
          postingAllowed: true,
          parentId: 'bank-root',
        },
      },
    ]);

    const result = await createBankAccount({
      data: {
        businessId: 'business-1',
        bankAccount: {
          name: 'Cuenta operativa',
          currency: 'DOP',
          type: 'checking',
          institutionName: 'Banco Popular Dominicano',
          accountNumberLast4: '1234',
        },
      },
    });

    const chartWrite = setCalls.find((call) =>
      call.ref.path.includes('/chartOfAccounts/'),
    );
    const bankWrite = setCalls.find((call) =>
      call.ref.path.includes('/bankAccounts/'),
    );

    expect(result).toMatchObject({
      ok: true,
      bankAccountId: 'generated-1',
      chartOfAccountId: 'generated-1',
    });
    expect(chartWrite?.data).toMatchObject({
      businessId: 'business-1',
      code: '1110.02',
      name: 'Banco Popular Dominicano Corriente 1234',
      parentId: 'bank-root',
      subtype: 'bank_account',
      metadata: {
        source: 'bank_account',
        bankAccountId: 'generated-1',
      },
    });
    expect(bankWrite?.data).toMatchObject({
      businessId: 'business-1',
      name: 'Cuenta operativa',
      chartOfAccountId: 'generated-1',
      accountNumberLast4: '1234',
    });
  });

  it('rejects chart accounts deeper than the sixth level', async () => {
    collectionSnapshots.set(
      'businesses/business-1/chartOfAccounts',
      Array.from({ length: 6 }).map((_, index) => ({
        id: `level-${index + 1}`,
        data: {
          code: `1${index + 1}00`,
          name: `Nivel ${index + 1}`,
          type: 'asset',
          status: 'active',
          postingAllowed: true,
          parentId: index === 0 ? null : `level-${index}`,
        },
      })),
    );

    await expect(
      createChartOfAccount({
        data: {
          businessId: 'business-1',
          account: {
            code: '1700',
            name: 'Nivel 7',
            type: 'asset',
            parentId: 'level-6',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'El catálogo solo permite subcuentas hasta el nivel 6.',
    });
    expect(setCalls).toHaveLength(0);
  });

  it('backfills legacy bank accounts with linked 1110 child chart accounts', async () => {
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'bank-root',
        data: {
          code: '1110',
          name: 'Cuentas bancarias',
          type: 'asset',
          status: 'active',
          postingAllowed: true,
          systemKey: 'bank',
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/bankAccounts', [
      {
        id: 'legacy-bank-1',
        data: {
          name: 'Cuenta legacy',
          currency: 'DOP',
          type: 'checking',
          institutionName: 'Banco Popular Dominicano',
          accountNumberLast4: '1234',
          status: 'active',
        },
      },
    ]);

    const result = await backfillBankAccountChartLinks({
      data: {
        businessId: 'business-1',
      },
    });

    const chartWrite = setCalls.find((call) =>
      call.ref.path.includes('/chartOfAccounts/'),
    );
    const bankWrite = setCalls.find(
      (call) =>
        call.ref.path ===
        'businesses/business-1/bankAccounts/legacy-bank-1',
    );

    expect(result).toMatchObject({
      ok: true,
      processed: 1,
      created: 1,
      linkedExisting: 0,
      skippedAlreadyLinked: 0,
    });
    expect(chartWrite?.data).toMatchObject({
      code: '1110.01',
      name: 'Banco Popular Dominicano Corriente 1234',
      parentId: 'bank-root',
      metadata: {
        source: 'bank_account',
        bankAccountId: 'legacy-bank-1',
      },
    });
    expect(bankWrite?.data).toMatchObject({
      chartOfAccountId: 'generated-1',
      updatedBy: 'accountant-1',
    });
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

  it('rejects posting profiles that reference cuenta mayor accounts', async () => {
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'cash-root',
        data: {
          code: '1100',
          name: 'Caja',
          type: 'asset',
          status: 'active',
          postingAllowed: true,
        },
      },
      {
        id: 'cash-detail',
        data: {
          code: '1101',
          name: 'Caja principal',
          type: 'asset',
          status: 'active',
          postingAllowed: true,
          parentId: 'cash-root',
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
                accountId: 'cash-root',
                amountSource: 'document_total',
              },
              {
                side: 'credit',
                accountId: 'cash-root',
                amountSource: 'document_total',
              },
            ],
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'Todas las cuentas usadas por el perfil deben ser Cuentas Detalle.',
    });
    expect(setCalls).toHaveLength(0);
  });
});
