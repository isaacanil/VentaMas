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
      return new MockTimestamp(Date.parse('2026-04-12T18:00:00.000Z'));
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
    ACCOUNTING_WRITE: ['accounting-write'],
    INVOICE_OPERATOR: ['invoice-operator'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock(
  '../../../versions/v2/accounting/utils/accountingRollout.util.js',
  () => ({
    getPilotAccountingSettingsForBusiness: (...args) =>
      getPilotAccountingSettingsForBusinessMock(...args),
    isAccountingRolloutEnabledForBusiness: (...args) =>
      isAccountingRolloutEnabledForBusinessMock(...args),
  }),
);

import { updateJournalEntry } from './updateJournalEntry.js';

const seedPostingAccounts = () => {
  transactionSnapshots.set('businesses/business-1/chartOfAccounts/ar', {
    code: '1.1.02',
    name: 'Cuentas por cobrar',
    status: 'active',
    postingAllowed: true,
  });
  transactionSnapshots.set('businesses/business-1/chartOfAccounts/sales', {
    code: '4.1.01',
    name: 'Ventas',
    status: 'active',
    postingAllowed: true,
  });
};

describe('updateJournalEntry', () => {
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
      if (path === 'businesses/business-1/chartOfAccounts') {
        return { path };
      }
      throw new Error(`Unexpected collection path: ${path}`);
    });
    transactionGetMock.mockImplementation(async (ref) => {
      if (ref.path === 'businesses/business-1/chartOfAccounts') {
        return {
          docs: Array.from(transactionSnapshots.entries())
            .filter(([path]) => path.startsWith(`${ref.path}/`))
            .map(([path, value]) => toSnapshot(path, value)),
        };
      }

      return toSnapshot(ref.path, transactionSnapshots.get(ref.path));
    });
    runTransactionMock.mockImplementation(async (callback) =>
      callback({
        get: transactionGetMock,
        set: transactionSetMock,
        update: transactionUpdateMock,
      }),
    );
  });

  it('updates an automatic posted journal entry and writes an audit record', async () => {
    seedPostingAccounts();
    transactionSnapshots.set('businesses/business-1/settings/accounting', {});
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );
    transactionSnapshots.set('businesses/business-1/accountingEvents/event-1', {
      eventType: 'invoice.committed',
      metadata: {},
    });
    transactionSnapshots.set('businesses/business-1/journalEntries/entry-1', {
      eventId: 'event-1',
      eventType: 'invoice.committed',
      sourceType: 'invoice',
      sourceId: 'invoice-1',
      status: 'posted',
      periodKey: '2026-04',
      entryDate: { toDate: () => new Date('2026-04-10T12:00:00.000Z') },
      description: 'Factura posteada',
      totals: { debit: 100, credit: 100 },
      lines: [
        { accountId: 'ar', debit: 100, credit: 0, description: 'CxC' },
        { accountId: 'sales', debit: 0, credit: 100, description: 'Ventas' },
      ],
      metadata: {},
    });

    const result = await updateJournalEntry({
      data: {
        businessId: 'business-1',
        entryId: 'entry-1',
        description: 'Factura corregida',
        entryDate: '2026-04-12',
        reason: 'Correccion de cuenta contable',
        lines: [
          { accountId: 'ar', debit: 120, credit: 0 },
          { accountId: 'sales', debit: 0, credit: 120 },
        ],
      },
    });

    expect(result).toEqual({
      ok: true,
      entryId: 'entry-1',
      editId: `entry-1__${Date.parse('2026-04-12T18:00:00.000Z')}`,
      status: 'posted',
    });
    expect(transactionUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/journalEntries/entry-1',
      }),
      expect.objectContaining({
        description: 'Factura corregida',
        periodKey: '2026-04',
        totals: { debit: 120, credit: 120 },
        metadata: expect.objectContaining({
          manuallyEdited: true,
          lastManualEditReason: 'Correccion de cuenta contable',
        }),
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: `businesses/business-1/journalEntryEdits/entry-1__${Date.parse(
          '2026-04-12T18:00:00.000Z',
        )}`,
      }),
      expect.objectContaining({
        entryId: 'entry-1',
        reason: 'Correccion de cuenta contable',
        previous: expect.objectContaining({
          description: 'Factura posteada',
        }),
        next: expect.objectContaining({
          description: 'Factura corregida',
        }),
      }),
    );
    expect(transactionUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountingEvents/event-1',
      }),
      expect.objectContaining({
        'metadata.journalEntryManuallyEdited': true,
      }),
    );
  });

  it('rejects manual journal entries', async () => {
    seedPostingAccounts();
    transactionSnapshots.set('businesses/business-1/settings/accounting', {});
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );
    transactionSnapshots.set('businesses/business-1/journalEntries/entry-1', {
      eventId: 'manual.entry.recorded__entry-1',
      eventType: 'manual.entry.recorded',
      sourceType: 'manual_entry',
      status: 'posted',
      periodKey: '2026-04',
      metadata: { entryOrigin: 'manual' },
      lines: [
        { accountId: 'ar', debit: 100, credit: 0 },
        { accountId: 'sales', debit: 0, credit: 100 },
      ],
    });

    await expect(
      updateJournalEntry({
        data: {
          businessId: 'business-1',
          entryId: 'entry-1',
          description: 'Manual corregido',
          entryDate: '2026-04-12',
          reason: 'Correccion',
          lines: [
            { accountId: 'ar', debit: 100, credit: 0 },
            { accountId: 'sales', debit: 0, credit: 100 },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'Esta edicion esta disponible para asientos generados automaticamente.',
    });
    expect(transactionUpdateMock).not.toHaveBeenCalled();
    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('rejects corrections without meaningful entry changes', async () => {
    seedPostingAccounts();
    transactionSnapshots.set('businesses/business-1/settings/accounting', {});
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );
    transactionSnapshots.set('businesses/business-1/journalEntries/entry-1', {
      eventId: 'event-1',
      eventType: 'invoice.committed',
      sourceType: 'invoice',
      status: 'posted',
      periodKey: '2026-04',
      entryDate: { toDate: () => new Date('2026-04-12T12:00:00.000Z') },
      description: 'Factura posteada',
      totals: { debit: 100, credit: 100 },
      lines: [
        { accountId: 'ar', debit: 100, credit: 0, description: 'CxC' },
        { accountId: 'sales', debit: 0, credit: 100, description: 'Ventas' },
      ],
      metadata: {},
    });

    await expect(
      updateJournalEntry({
        data: {
          businessId: 'business-1',
          entryId: 'entry-1',
          description: 'Factura posteada',
          entryDate: '2026-04-12',
          reason: 'Solo documentar sin cambio real',
          lines: [
            {
              accountId: 'ar',
              debit: 100,
              credit: 0,
              description: 'CxC',
            },
            {
              accountId: 'sales',
              debit: 0,
              credit: 100,
              description: 'Ventas',
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message:
        'Realiza al menos un cambio antes de registrar la correccion contable.',
    });
    expect(transactionUpdateMock).not.toHaveBeenCalled();
    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('rejects edits when the original accounting period is closed', async () => {
    seedPostingAccounts();
    transactionSnapshots.set('businesses/business-1/settings/accounting', {
      generalAccountingEnabled: true,
    });
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-03',
      { periodKey: '2026-03' },
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );
    transactionSnapshots.set('businesses/business-1/journalEntries/entry-1', {
      eventId: 'event-1',
      eventType: 'invoice.committed',
      sourceType: 'invoice',
      status: 'posted',
      periodKey: '2026-03',
      entryDate: { toDate: () => new Date('2026-03-20T12:00:00.000Z') },
      lines: [
        { accountId: 'ar', debit: 100, credit: 0 },
        { accountId: 'sales', debit: 0, credit: 100 },
      ],
    });

    await expect(
      updateJournalEntry({
        data: {
          businessId: 'business-1',
          entryId: 'entry-1',
          description: 'Factura corregida',
          entryDate: '2026-04-12',
          reason: 'Mover a periodo abierto',
          lines: [
            { accountId: 'ar', debit: 100, credit: 0 },
            { accountId: 'sales', debit: 0, credit: 100 },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
    });
    expect(transactionUpdateMock).not.toHaveBeenCalled();
    expect(transactionSetMock).not.toHaveBeenCalled();
  });
});
