import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertUserAccessMock,
  collectionMock,
  getPilotAccountingSettingsForBusinessMock,
  isAccountingRolloutEnabledForBusinessMock,
  MockHttpsError,
  resolveCallableAuthUidMock,
} = vi.hoisted(() => {
  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedGetPilotAccountingSettingsForBusinessMock = vi.fn();
  const hoistedIsAccountingRolloutEnabledForBusinessMock = vi.fn();
  const hoistedCollectionMock = vi.fn();

  class HoistedHttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }

  return {
    assertUserAccessMock: hoistedAssertUserAccessMock,
    collectionMock: hoistedCollectionMock,
    getPilotAccountingSettingsForBusinessMock:
      hoistedGetPilotAccountingSettingsForBusinessMock,
    isAccountingRolloutEnabledForBusinessMock:
      hoistedIsAccountingRolloutEnabledForBusinessMock,
    MockHttpsError: HoistedHttpsError,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
  };
});

vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: MockHttpsError,
  onCall: (_config, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    collection: (...args) => collectionMock(...args),
    doc: vi.fn((path) => ({
      path,
      id: path.split('/').at(-1) ?? null,
    })),
    getAll: vi.fn(async (...refs) =>
      refs.map((ref) => ({
        exists: true,
        id: ref.id,
        data: () => ({
          eventType: 'manual.entry.recorded',
          sourceDocumentType: 'journalEntry',
          sourceDocumentId: 'entry-1',
        }),
      })),
    ),
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

import { getAccountingReports } from './getAccountingReports.js';

describe('getAccountingReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      generalAccountingEnabled: true,
    });
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);

    collectionMock.mockImplementation((path) => {
      if (path === 'businesses/business-1/chartOfAccounts') {
        return {
          orderBy: vi.fn(() => ({
            get: vi.fn(async () => ({
              docs: [
                {
                  id: 'cash',
                  data: () => ({
                    code: '1.1.01',
                    name: 'Caja',
                    type: 'asset',
                    normalSide: 'debit',
                    status: 'active',
                    postingAllowed: true,
                  }),
                },
                {
                  id: 'sales',
                  data: () => ({
                    code: '4.1.01',
                    name: 'Ventas',
                    type: 'income',
                    normalSide: 'credit',
                    status: 'active',
                    postingAllowed: true,
                  }),
                },
              ],
            })),
          })),
        };
      }

      if (path === 'businesses/business-1/journalEntries') {
        return {
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: vi.fn(async () => ({
                docs: [
                  {
                    id: 'entry-1',
                    data: () => ({
                      periodKey: '2026-04',
                    }),
                  },
                ],
              })),
            })),
          })),
          where: vi.fn((_field, operator, periodKey) => ({
            get: vi.fn(async () => ({
              docs:
                periodKey === '2026-04'
                  ? [
                      {
                        id: 'entry-1',
                        data: () => ({
                          eventId: 'event-1',
                          eventType: 'manual.entry.recorded',
                          status: 'posted',
                          entryDate: new Date('2026-04-12T12:00:00.000Z'),
                          periodKey: operator === '<' ? '2026-03' : '2026-04',
                          description: 'Asiento abril',
                          sourceType: 'manual_entry',
                          sourceId: 'entry-1',
                          lines: [
                            {
                              accountId: 'cash',
                              accountCode: '1.1.01',
                              accountName: 'Caja',
                              debit: 100,
                              credit: 0,
                            },
                            {
                              accountId: 'sales',
                              accountCode: '4.1.01',
                              accountName: 'Ventas',
                              debit: 0,
                              credit: 100,
                            },
                          ],
                          totals: { debit: 100, credit: 100 },
                        }),
                      },
                    ]
                  : [],
            })),
          })),
        };
      }

      throw new Error(`Unexpected collection path: ${path}`);
    });
  });

  it('builds ledger and financial report snapshots from posted journal entries', async () => {
    const result = await getAccountingReports({
      data: {
        businessId: 'business-1',
        includeFinancialReports: true,
        includeGeneralLedger: true,
        reportPeriodKey: '2026-04',
        ledgerPeriodKey: '2026-04',
      },
    });

    expect(result.ok).toBe(true);
    expect(result.periods).toContain('2026-04');
    expect(result.generalLedger.selectedPeriodKey).toBe('2026-04');
    expect(result.generalLedger.accountOptions[0]).toMatchObject({
      id: 'cash',
    });
    expect(result.financialReports.snapshot).toMatchObject({
      trialBalanceTotals: {
        debit: 100,
        credit: 100,
      },
    });
  });
});
