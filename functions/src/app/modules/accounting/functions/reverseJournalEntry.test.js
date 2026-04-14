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
  transactionUpdateMock,
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
  const hoistedTransactionUpdateMock = vi.fn();

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
    transactionUpdateMock: hoistedTransactionUpdateMock,
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
      return new MockTimestamp(Date.parse('2026-04-12T16:00:00.000Z'));
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

import { reverseJournalEntry } from './reverseJournalEntry.js';

describe('reverseJournalEntry', () => {
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
            getDocRef('businesses/business-1/journalEntries/reversal-1'),
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
        update: transactionUpdateMock,
      }),
    );
  });

  it('creates a reversal journal entry and marks the original as reversed', async () => {
    transactionSnapshots.set('businesses/business-1/settings/accounting', {});
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );
    transactionSnapshots.set('businesses/business-1/journalEntries/entry-1', {
      eventId: 'manual.entry.recorded__entry-1',
      eventType: 'manual.entry.recorded',
      status: 'posted',
      description: 'Ajuste original',
      currency: 'DOP',
      functionalCurrency: 'DOP',
      lines: [
        { accountId: 'cash', debit: 100, credit: 0, description: 'Caja' },
        { accountId: 'sales', debit: 0, credit: 100, description: 'Ventas' },
      ],
      metadata: {},
    });

    const result = await reverseJournalEntry({
      data: {
        businessId: 'business-1',
        entryId: 'entry-1',
        reason: 'Reverso de prueba',
        reversalDate: '2026-04-12',
      },
    });

    expect(result).toEqual({
      ok: true,
      entryId: 'entry-1',
      reversalEntryId: 'reversal-1',
      reused: false,
    });
    expect(transactionUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/journalEntries/entry-1',
      }),
      expect.objectContaining({
        status: 'reversed',
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledTimes(1);
  });

  it('returns reused when the original entry was already reversed', async () => {
    transactionSnapshots.set('businesses/business-1/settings/accounting', {});
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );
    transactionSnapshots.set('businesses/business-1/journalEntries/entry-1', {
      status: 'reversed',
      metadata: {
        reversedByEntryId: 'reversal-existing',
      },
    });

    const result = await reverseJournalEntry({
      data: {
        businessId: 'business-1',
        entryId: 'entry-1',
      },
    });

    expect(result).toEqual({
      ok: true,
      entryId: 'entry-1',
      reversalEntryId: 'reversal-existing',
      reused: true,
    });
    expect(transactionSetMock).not.toHaveBeenCalled();
  });
});
