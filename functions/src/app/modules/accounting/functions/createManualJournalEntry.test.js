import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  collectionMock,
  getDocRef,
  getPilotAccountingSettingsForBusinessMock,
  isAccountingRolloutEnabledForBusinessMock,
  MockHttpsError,
  resolveCallableAuthUidMock,
  runTransactionMock,
  toSnapshot,
  transactionGetMock,
  transactionSetMock,
  transactionSnapshots,
} = vi.hoisted(() => {
  const hoistedTransactionSnapshots = new Map();

  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedGetPilotAccountingSettingsForBusinessMock = vi.fn();
  const hoistedIsAccountingRolloutEnabledForBusinessMock = vi.fn();
  const hoistedCollectionMock = vi.fn();
  const hoistedRunTransactionMock = vi.fn();
  const hoistedTransactionGetMock = vi.fn();
  const hoistedTransactionSetMock = vi.fn();

  class HoistedHttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }

  const hoistedToSnapshot = (path, data) => ({
    exists: data != null,
    id: path.split('/').at(-1) ?? null,
    data: () => data,
  });

  const hoistedGetDocRef = (path) => ({
    path,
    id: path.split('/').at(-1) ?? null,
  });

  return {
    assertUserAccessMock: hoistedAssertUserAccessMock,
    collectionMock: hoistedCollectionMock,
    getDocRef: hoistedGetDocRef,
    getPilotAccountingSettingsForBusinessMock:
      hoistedGetPilotAccountingSettingsForBusinessMock,
    isAccountingRolloutEnabledForBusinessMock:
      hoistedIsAccountingRolloutEnabledForBusinessMock,
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
    runTransactionMock: hoistedRunTransactionMock,
    toSnapshot: hoistedToSnapshot,
    transactionGetMock: hoistedTransactionGetMock,
    transactionSetMock: hoistedTransactionSetMock,
    transactionSnapshots: hoistedTransactionSnapshots,
  };
});

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (_config, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  Timestamp: class MockTimestamp {
    constructor(millis) {
      this.millis = millis;
    }

    static now() {
      return new MockTimestamp(Date.parse('2026-04-12T14:00:00.000Z'));
    }

    static fromDate(date) {
      return new MockTimestamp(date.getTime());
    }

    toMillis() {
      return this.millis;
    }

    toDate() {
      return new Date(this.millis);
    }
  },
  db: {
    doc: (path) => getDocRef(path),
    collection: (...args) => collectionMock(...args),
    runTransaction: (...args) => runTransactionMock(...args),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/invoice/services/repairTasks.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    INVOICE_OPERATOR: ['invoice-operator'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock('../../../versions/v2/accounting/utils/accountingRollout.util.js', () => ({
  getPilotAccountingSettingsForBusiness: (...args) =>
    getPilotAccountingSettingsForBusinessMock(...args),
  isAccountingRolloutEnabledForBusiness: (...args) =>
    isAccountingRolloutEnabledForBusinessMock(...args),
}));

import { createManualJournalEntry } from './createManualJournalEntry.js';

describe('createManualJournalEntry', () => {
  beforeEach(() => {
    transactionSnapshots.clear();
    vi.clearAllMocks();

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);
    collectionMock.mockImplementation((path) => {
      if (path === 'businesses/business-1/journalEntries') {
        return {
          doc: vi.fn(() =>
            getDocRef('businesses/business-1/journalEntries/entry-1'),
          ),
        };
      }
      throw new Error(`Unexpected collection path: ${path}`);
    });
    transactionGetMock.mockImplementation(async (ref) =>
      toSnapshot(ref.path, transactionSnapshots.get(ref.path)),
    );
    runTransactionMock.mockImplementation(async (callback) =>
      callback({
        get: transactionGetMock,
        set: transactionSetMock,
      }),
    );
  });

  it('rejects unbalanced manual journal entries before writing', async () => {
    await expect(
      createManualJournalEntry({
        data: {
          businessId: 'business-1',
          description: 'Asiento invalido',
          entryDate: '2026-04-12',
          lines: [
            { accountId: 'cash', debit: 100, credit: 0 },
            { accountId: 'sales', debit: 0, credit: 90 },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'invalid-argument',
      message: 'El asiento no cuadra. Debito y credito deben coincidir.',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('creates a posted manual journal entry when all accounts are active', async () => {
    transactionSnapshots.set('businesses/business-1/settings/accounting', {});
    transactionSnapshots.set('businesses/business-1/chartOfAccounts/cash', {
      code: '1.1.01',
      name: 'Caja',
      status: 'active',
      postingAllowed: true,
    });
    transactionSnapshots.set('businesses/business-1/chartOfAccounts/sales', {
      code: '4.1.01',
      name: 'Ventas',
      status: 'active',
      postingAllowed: true,
    });
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await createManualJournalEntry({
      data: {
        businessId: 'business-1',
        description: 'Ajuste manual',
        entryDate: '2026-04-12',
        note: 'Cierre de prueba',
        lines: [
          { accountId: 'cash', debit: 100, credit: 0 },
          { accountId: 'sales', debit: 0, credit: 100 },
        ],
      },
    });

    expect(result).toEqual({
      ok: true,
      entryId: 'entry-1',
      eventId: 'manual.entry.recorded__entry-1',
      status: 'posted',
    });
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/journalEntries/entry-1',
      }),
      expect.objectContaining({
        id: 'entry-1',
        status: 'posted',
        periodKey: '2026-04',
      }),
    );
  });
});
