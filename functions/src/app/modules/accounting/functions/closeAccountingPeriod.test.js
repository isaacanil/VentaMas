import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  collectionMock,
  collectionSnapshots,
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
  const hoistedCollectionSnapshots = new Map();
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

  const buildQueryRef = (path) => ({
    path,
    where: vi.fn(() => buildQueryRef(path)),
    get: vi.fn(async () => ({
      docs: (hoistedCollectionSnapshots.get(path) ?? []).map((entry) => ({
        id: entry.id,
        data: () => entry.data,
      })),
    })),
  });

  hoistedCollectionMock.mockImplementation((path) => buildQueryRef(path));

  return {
    assertUserAccessMock: hoistedAssertUserAccessMock,
    collectionMock: hoistedCollectionMock,
    collectionSnapshots: hoistedCollectionSnapshots,
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
  Timestamp: {
    fromDate: (date) => ({
      toDate: () => date,
      toMillis: () => date.getTime(),
    }),
    now: () => ({
      toMillis: () => Date.parse('2026-04-12T15:00:00.000Z'),
    }),
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

vi.mock('../../../versions/v2/auth/services/userAccess.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    ACCOUNTING_ADMIN: ['accounting-admin'],
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

import { closeAccountingPeriod } from './closeAccountingPeriod.js';

describe('closeAccountingPeriod', () => {
  beforeEach(() => {
    collectionSnapshots.clear();
    transactionSnapshots.clear();
    vi.clearAllMocks();

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      generalAccountingEnabled: true,
    });
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);
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

  const setFiscalChartOfAccounts = ({ includeRetained = true } = {}) => {
    collectionSnapshots.set(
      'businesses/business-1/chartOfAccounts',
      [
        {
          id: 'sales',
          data: {
            id: 'sales',
            code: '4000',
            name: 'Ventas',
            type: 'income',
            status: 'active',
            postingAllowed: true,
            systemKey: 'sales',
          },
        },
        {
          id: 'expense',
          data: {
            id: 'expense',
            code: '5000',
            name: 'Gastos',
            type: 'expense',
            status: 'active',
            postingAllowed: true,
            systemKey: 'operating_expenses',
          },
        },
        includeRetained
          ? {
              id: 'retained',
              data: {
                id: 'retained',
                code: '3200',
                name: 'Resultados acumulados',
                type: 'equity',
                status: 'active',
                postingAllowed: true,
                systemKey: 'retained_earnings',
              },
            }
          : null,
      ].filter(Boolean),
    );
  };

  const setFiscalJournalEntries = ({
    expenseDebit = 700,
    incomeCredit = 1000,
  } = {}) => {
    collectionSnapshots.set('businesses/business-1/journalEntries', [
      {
        id: 'sale-entry',
        data: {
          id: 'sale-entry',
          periodKey: '2026-02',
          status: 'posted',
          totals: { debit: incomeCredit, credit: incomeCredit },
          lines: [
            { accountId: 'ar', debit: incomeCredit, credit: 0 },
            { accountId: 'sales', debit: 0, credit: incomeCredit },
          ],
        },
      },
      {
        id: 'expense-entry',
        data: {
          id: 'expense-entry',
          periodKey: '2026-08',
          status: 'posted',
          totals: { debit: expenseDebit, credit: expenseDebit },
          lines: [
            { accountId: 'expense', debit: expenseDebit, credit: 0 },
            { accountId: 'bank', debit: 0, credit: expenseDebit },
          ],
        },
      },
    ]);
  };

  it('closes an open accounting period', async () => {
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await closeAccountingPeriod({
      data: {
        businessId: 'business-1',
        periodKey: '2026-04',
        note: 'Cierre operativo',
      },
    });

    expect(result).toEqual({
      ok: true,
      periodKey: '2026-04',
      reused: false,
    });
    expect(transactionSetMock).toHaveBeenCalledTimes(1);
  });

  it('reuses an already closed period without rewriting it', async () => {
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      { status: 'closed' },
    );

    const result = await closeAccountingPeriod({
      data: {
        businessId: 'business-1',
        periodKey: '2026-04',
      },
    });

    expect(result).toEqual({
      ok: true,
      periodKey: '2026-04',
      reused: true,
    });
    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('blocks period close when accounting events are not projected', async () => {
    collectionSnapshots.set('businesses/business-1/accountingEvents', [
      {
        id: 'invoice.committed__invoice-1',
        data: {
          eventType: 'invoice.committed',
          projection: {
            status: 'pending_account_mapping',
          },
        },
      },
    ]);
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    await expect(
      closeAccountingPeriod({
        data: {
          businessId: 'business-1',
          periodKey: '2026-04',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      details: expect.objectContaining({
        unresolvedEventCount: 1,
      }),
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('blocks period close when an event has no occurredAt but was recorded inside the period', async () => {
    collectionSnapshots.set('businesses/business-1/accountingEvents', [
      {
        id: 'expense.recorded__expense-1',
        data: {
          eventType: 'expense.recorded',
          recordedAt: '2026-04-15T12:00:00.000Z',
          projection: {
            status: 'pending',
          },
        },
      },
    ]);
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    await expect(
      closeAccountingPeriod({
        data: {
          businessId: 'business-1',
          periodKey: '2026-04',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      details: expect.objectContaining({
        unresolvedEventCount: 1,
        unresolvedEvents: [
          expect.objectContaining({
            id: 'expense.recorded__expense-1',
            projectionStatus: 'pending',
          }),
        ],
      }),
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('blocks period close when a projected accounting event points to a missing journal entry', async () => {
    collectionSnapshots.set('businesses/business-1/accountingEvents', [
      {
        id: 'invoice.committed__invoice-1',
        data: {
          eventType: 'invoice.committed',
          projection: {
            status: 'projected',
            journalEntryId: 'invoice.committed__invoice-1',
          },
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/journalEntries', []);
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    await expect(
      closeAccountingPeriod({
        data: {
          businessId: 'business-1',
          periodKey: '2026-04',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      details: expect.objectContaining({
        unresolvedEventCount: 1,
        unresolvedEvents: [
          expect.objectContaining({
            id: 'invoice.committed__invoice-1',
            journalEntryId: 'invoice.committed__invoice-1',
            projectionStatus: 'projected',
          }),
        ],
      }),
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('blocks period close when projection dead letters exist', async () => {
    collectionSnapshots.set(
      'businesses/business-1/accountingEventProjectionDeadLetters',
      [
        {
          id: 'purchase.committed__purchase-1',
          data: {
            eventId: 'purchase.committed__purchase-1',
            eventType: 'purchase.committed',
            projectionStatus: 'pending_account_mapping',
          },
        },
      ],
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    await expect(
      closeAccountingPeriod({
        data: {
          businessId: 'business-1',
          periodKey: '2026-04',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      details: expect.objectContaining({
        deadLetterCount: 1,
      }),
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('does not block period close with active projection dead letters from another period', async () => {
    collectionSnapshots.set(
      'businesses/business-1/accountingEventProjectionDeadLetters',
      [
        {
          id: 'purchase.committed__purchase-1',
          data: {
            eventId: 'purchase.committed__purchase-1',
            eventType: 'purchase.committed',
            periodKey: '2026-05',
            projectionStatus: 'pending_account_mapping',
          },
        },
      ],
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await closeAccountingPeriod({
      data: {
        businessId: 'business-1',
        periodKey: '2026-04',
      },
    });

    expect(result).toMatchObject({
      ok: true,
      periodKey: '2026-04',
    });
    expect(transactionSetMock).toHaveBeenCalled();
  });

  it('does not block period close with resolved projection dead letters', async () => {
    collectionSnapshots.set(
      'businesses/business-1/accountingEventProjectionDeadLetters',
      [
        {
          id: 'purchase.committed__purchase-1',
          data: {
            eventId: 'purchase.committed__purchase-1',
            eventType: 'purchase.committed',
            projectionStatus: 'resolved',
          },
        },
      ],
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await closeAccountingPeriod({
      data: {
        businessId: 'business-1',
        periodKey: '2026-04',
      },
    });

    expect(result).toMatchObject({
      ok: true,
      periodKey: '2026-04',
    });
    expect(transactionSetMock).toHaveBeenCalled();
  });

  it('does not block period close with dead letters from voided events', async () => {
    collectionSnapshots.set(
      'businesses/business-1/accountingEventProjectionDeadLetters',
      [
        {
          id: 'hr_commission.accrued__period-1',
          data: {
            eventId: 'hr_commission.accrued__period-1',
            eventType: 'hr_commission.accrued',
            metadata: {
              eventStatus: 'voided',
            },
            projectionStatus: 'pending_account_mapping',
          },
        },
      ],
    );
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await closeAccountingPeriod({
      data: {
        businessId: 'business-1',
        periodKey: '2026-04',
      },
    });

    expect(result).toMatchObject({
      ok: true,
      periodKey: '2026-04',
    });
    expect(transactionSetMock).toHaveBeenCalled();
  });

  it('blocks period close when a journal entry is unbalanced', async () => {
    collectionSnapshots.set('businesses/business-1/journalEntries', [
      {
        id: 'bad-entry',
        data: {
          id: 'bad-entry',
          periodKey: '2026-04',
          status: 'posted',
          totals: { debit: 100, credit: 90 },
          lines: [
            { accountId: 'expense', debit: 100, credit: 0 },
            { accountId: 'bank', debit: 0, credit: 90 },
          ],
        },
      },
    ]);
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    await expect(
      closeAccountingPeriod({
        data: {
          businessId: 'business-1',
          periodKey: '2026-04',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      details: expect.objectContaining({
        unbalancedJournalEntryCount: 1,
      }),
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('ignores voided accounting events when checking pending projections', async () => {
    collectionSnapshots.set('businesses/business-1/accountingEvents', [
      {
        id: 'hr_commission.accrued__period-1',
        data: {
          eventType: 'hr_commission.accrued',
          status: 'voided',
          projection: {
            status: 'pending',
          },
        },
      },
    ]);
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await closeAccountingPeriod({
      data: {
        businessId: 'business-1',
        periodKey: '2026-04',
      },
    });

    expect(result).toEqual({
      ok: true,
      periodKey: '2026-04',
      reused: false,
    });
    expect(transactionSetMock).toHaveBeenCalledTimes(1);
  });

  it('allows period close for zero-amount events skipped by projection', async () => {
    collectionSnapshots.set('businesses/business-1/accountingEvents', [
      {
        id: 'purchase.committed__zero-1',
        data: {
          eventType: 'purchase.committed',
          status: 'recorded',
          projection: {
            status: 'skipped_zero_amount',
          },
        },
      },
    ]);
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      null,
    );

    const result = await closeAccountingPeriod({
      data: {
        businessId: 'business-1',
        periodKey: '2026-04',
      },
    });

    expect(result).toEqual({
      ok: true,
      periodKey: '2026-04',
      reused: false,
    });
    expect(transactionSetMock).toHaveBeenCalledTimes(1);
  });

  it('creates an idempotent fiscal year close entry when closing December', async () => {
    collectionSnapshots.set('businesses/business-1/accountingEvents', []);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'sales',
        data: {
          id: 'sales',
          code: '4000',
          name: 'Ventas',
          type: 'income',
          status: 'active',
          postingAllowed: true,
          systemKey: 'sales',
        },
      },
      {
        id: 'expense',
        data: {
          id: 'expense',
          code: '5000',
          name: 'Gastos',
          type: 'expense',
          status: 'active',
          postingAllowed: true,
          systemKey: 'operating_expenses',
        },
      },
      {
        id: 'retained',
        data: {
          id: 'retained',
          code: '3200',
          name: 'Resultados acumulados',
          type: 'equity',
          status: 'active',
          postingAllowed: true,
          systemKey: 'retained_earnings',
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/journalEntries', [
      {
        id: 'sale-entry',
        data: {
          id: 'sale-entry',
          periodKey: '2026-02',
          status: 'posted',
          lines: [
            { accountId: 'ar', debit: 1000, credit: 0 },
            { accountId: 'sales', debit: 0, credit: 1000 },
          ],
        },
      },
      {
        id: 'expense-entry',
        data: {
          id: 'expense-entry',
          periodKey: '2026-08',
          status: 'posted',
          lines: [
            { accountId: 'expense', debit: 700, credit: 0 },
            { accountId: 'bank', debit: 0, credit: 700 },
          ],
        },
      },
    ]);
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-12',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/journalEntries/fiscal_year_close__2026',
      null,
    );

    const result = await closeAccountingPeriod({
      data: {
        businessId: 'business-1',
        confirmFiscalYearClose: true,
        periodKey: '2026-12',
        note: 'Cierre anual',
      },
    });

    expect(result).toEqual({
      ok: true,
      fiscalYearCloseCreated: true,
      fiscalYearCloseEntryId: 'fiscal_year_close__2026',
      fiscalYearCloseReused: false,
      periodKey: '2026-12',
      reused: false,
    });
    expect(transactionSetMock).toHaveBeenCalledTimes(3);
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/journalEntries/fiscal_year_close__2026',
      }),
      expect.objectContaining({
        eventType: 'manual.entry.recorded',
        sourceType: 'fiscal_year_close',
        lines: [
          expect.objectContaining({
            accountId: 'sales',
            debit: 1000,
            credit: 0,
          }),
          expect.objectContaining({
            accountId: 'expense',
            debit: 0,
            credit: 700,
          }),
          expect.objectContaining({
            accountId: 'retained',
            debit: 0,
            credit: 300,
          }),
        ],
        totals: { debit: 1000, credit: 1000 },
      }),
    );
  });

  it('requires explicit confirmation before closing December as fiscal year end', async () => {
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-12',
      null,
    );

    await expect(
      closeAccountingPeriod({
        data: {
          businessId: 'business-1',
          periodKey: '2026-12',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      details: expect.objectContaining({
        fiscalYearAssumption: 'jan_dec',
        requiredFlag: 'confirmFiscalYearClose',
      }),
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('creates a fiscal year close entry for a net loss', async () => {
    collectionSnapshots.set('businesses/business-1/accountingEvents', []);
    setFiscalChartOfAccounts();
    setFiscalJournalEntries({ incomeCredit: 400, expenseDebit: 900 });
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-12',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/journalEntries/fiscal_year_close__2026',
      null,
    );

    const result = await closeAccountingPeriod({
      data: {
        businessId: 'business-1',
        confirmFiscalYearClose: true,
        periodKey: '2026-12',
      },
    });

    expect(result).toMatchObject({
      ok: true,
      fiscalYearCloseCreated: true,
      fiscalYearCloseEntryId: 'fiscal_year_close__2026',
    });
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/journalEntries/fiscal_year_close__2026',
      }),
      expect.objectContaining({
        lines: [
          expect.objectContaining({
            accountId: 'sales',
            debit: 400,
            credit: 0,
          }),
          expect.objectContaining({
            accountId: 'expense',
            debit: 0,
            credit: 900,
          }),
          expect.objectContaining({
            accountId: 'retained',
            debit: 500,
            credit: 0,
          }),
        ],
        totals: { debit: 900, credit: 900 },
      }),
    );
  });

  it('reuses an existing fiscal year close entry without duplicating it', async () => {
    collectionSnapshots.set('businesses/business-1/accountingEvents', []);
    setFiscalChartOfAccounts();
    setFiscalJournalEntries();
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-12',
      null,
    );
    transactionSnapshots.set(
      'businesses/business-1/journalEntries/fiscal_year_close__2026',
      { id: 'fiscal_year_close__2026' },
    );

    const result = await closeAccountingPeriod({
      data: {
        businessId: 'business-1',
        confirmFiscalYearClose: true,
        periodKey: '2026-12',
      },
    });

    expect(result).toEqual({
      ok: true,
      fiscalYearCloseCreated: false,
      fiscalYearCloseEntryId: 'fiscal_year_close__2026',
      fiscalYearCloseReused: true,
      periodKey: '2026-12',
      reused: false,
    });
    expect(transactionSetMock).toHaveBeenCalledTimes(1);
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/accountingPeriodClosures/2026-12',
      }),
      expect.objectContaining({
        fiscalYearCloseEntryId: 'fiscal_year_close__2026',
        fiscalYearCloseReused: true,
      }),
    );
  });

  it('reuses a closed December period without a second fiscal year close attempt', async () => {
    collectionSnapshots.set('businesses/business-1/accountingEvents', []);
    setFiscalChartOfAccounts();
    setFiscalJournalEntries();
    transactionSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-12',
      { status: 'closed' },
    );
    transactionSnapshots.set(
      'businesses/business-1/journalEntries/fiscal_year_close__2026',
      { id: 'fiscal_year_close__2026' },
    );

    const result = await closeAccountingPeriod({
      data: {
        businessId: 'business-1',
        confirmFiscalYearClose: true,
        periodKey: '2026-12',
      },
    });

    expect(result).toEqual({
      ok: true,
      fiscalYearCloseEntryId: 'fiscal_year_close__2026',
      fiscalYearCloseReused: true,
      periodKey: '2026-12',
      reused: true,
    });
    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('blocks fiscal year close when retained earnings account is missing', async () => {
    collectionSnapshots.set('businesses/business-1/accountingEvents', []);
    setFiscalChartOfAccounts({ includeRetained: false });
    setFiscalJournalEntries();

    await expect(
      closeAccountingPeriod({
        data: {
          businessId: 'business-1',
          confirmFiscalYearClose: true,
          periodKey: '2026-12',
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });
});
