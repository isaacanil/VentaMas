import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  buildAccountingEventMock,
  documentRefs,
  getDocRef,
  getPilotAccountingSettingsForBusinessMock,
  isAccountingRolloutEnabledForBusinessMock,
} = vi.hoisted(() => {
  const hoistedDocumentRefs = new Map();
  const hoistedBuildAccountingEventMock = vi.fn();
  const hoistedGetPilotAccountingSettingsForBusinessMock = vi.fn();
  const hoistedIsAccountingRolloutEnabledForBusinessMock = vi.fn();

  const hoistedGetDocRef = (path) => {
    if (!hoistedDocumentRefs.has(path)) {
      hoistedDocumentRefs.set(path, {
        path,
        set: vi.fn(async () => undefined),
      });
    }

    return hoistedDocumentRefs.get(path);
  };

  return {
    buildAccountingEventMock: hoistedBuildAccountingEventMock,
    documentRefs: hoistedDocumentRefs,
    getDocRef: hoistedGetDocRef,
    getPilotAccountingSettingsForBusinessMock:
      hoistedGetPilotAccountingSettingsForBusinessMock,
    isAccountingRolloutEnabledForBusinessMock:
      hoistedIsAccountingRolloutEnabledForBusinessMock,
  };
});

vi.mock('firebase-functions/v2/firestore', () => ({
  onDocumentWritten: (_options, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  db: {
    doc: (path) => getDocRef(path),
  },
}));

vi.mock('../../../versions/v2/accounting/utils/accountingRollout.util.js', () => ({
  getPilotAccountingSettingsForBusiness: (...args) =>
    getPilotAccountingSettingsForBusinessMock(...args),
  isAccountingRolloutEnabledForBusiness: (...args) =>
    isAccountingRolloutEnabledForBusinessMock(...args),
}));

vi.mock('../../../versions/v2/accounting/utils/accountingEvent.util.js', async () => {
  const actual = await vi.importActual(
    '../../../versions/v2/accounting/utils/accountingEvent.util.js',
  );

  return {
    ...actual,
    buildAccountingEvent: (...args) => buildAccountingEventMock(...args),
  };
});

import { syncExpenseAccountingEvent } from './syncExpenseAccountingEvent.js';

describe('syncExpenseAccountingEvent', () => {
  beforeEach(() => {
    documentRefs.clear();
    vi.clearAllMocks();

    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      functionalCurrency: 'DOP',
      generalAccountingEnabled: true,
    });
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);
    buildAccountingEventMock.mockReturnValue({
      id: 'expense.recorded__expense-1',
      eventType: 'expense.recorded',
    });
  });

  it('emits expense.recorded when the expense becomes active', async () => {
    await syncExpenseAccountingEvent({
      params: {
        businessId: 'business-1',
        expenseId: 'expense-1',
      },
      data: {
        before: {
          data: () => ({
            expense: {
              status: 'draft',
            },
          }),
        },
        after: {
          data: () => ({
            expense: {
              status: 'active',
              numberId: 'G-001',
              categoryId: 'cat-1',
              category: 'Servicios',
              description: 'Internet oficina',
              amount: 100,
              payment: {
                method: 'bank_transfer',
                sourceType: 'bank',
                bankAccountId: 'bank-1',
                reference: 'TRX-1',
              },
              invoice: {
                ncf: 'B0100000001',
              },
              attachments: [{ id: 'att-1' }],
              monetary: {
                documentCurrency: { code: 'USD' },
                functionalCurrency: { code: 'DOP' },
                documentTotals: { total: 100 },
                functionalTotals: { total: 6200 },
              },
              dates: {
                expenseDate: {
                  toMillis: () => Date.parse('2026-04-05T09:00:00.000Z'),
                },
                createdAt: {
                  toMillis: () => Date.parse('2026-04-05T09:05:00.000Z'),
                },
              },
              createdBy: 'user-1',
            },
          }),
        },
      },
    });

    expect(buildAccountingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'business-1',
        eventType: 'expense.recorded',
        sourceType: 'expense',
        sourceId: 'expense-1',
        sourceDocumentType: 'expense',
        sourceDocumentId: 'expense-1',
        currency: 'USD',
        functionalCurrency: 'DOP',
        monetary: {
          amount: 100,
          functionalAmount: 6200,
        },
        treasury: {
          cashAccountId: null,
          cashCountId: null,
          bankAccountId: 'bank-1',
          paymentChannel: 'bank',
        },
        payload: expect.objectContaining({
          numberId: 'G-001',
          categoryId: 'cat-1',
          category: 'Servicios',
          description: 'Internet oficina',
          paymentMethod: 'bank_transfer',
          paymentSourceType: 'bank',
          documentNature: 'expense',
          settlementTiming: 'immediate',
          reference: 'TRX-1',
          invoiceNcf: 'B0100000001',
          attachmentCount: 1,
        }),
        createdBy: 'user-1',
      }),
    );

    expect(
      getDocRef(
        'businesses/business-1/accountingEvents/expense.recorded__expense-1',
      ).set,
    ).toHaveBeenCalledWith(
      {
        id: 'expense.recorded__expense-1',
        eventType: 'expense.recorded',
      },
      { merge: true },
    );
  });

  it('does not emit again when the expense was already active before the write', async () => {
    await syncExpenseAccountingEvent({
      params: {
        businessId: 'business-1',
        expenseId: 'expense-1',
      },
      data: {
        before: {
          data: () => ({
            expense: {
              status: 'active',
            },
          }),
        },
        after: {
          data: () => ({
            expense: {
              status: 'active',
            },
          }),
        },
      },
    });

    expect(buildAccountingEventMock).not.toHaveBeenCalled();
  });

  it('skips emission when general accounting is disabled', async () => {
    getPilotAccountingSettingsForBusinessMock.mockResolvedValue({
      functionalCurrency: 'DOP',
      generalAccountingEnabled: false,
    });

    await syncExpenseAccountingEvent({
      params: {
        businessId: 'business-1',
        expenseId: 'expense-1',
      },
      data: {
        before: {
          data: () => ({
            expense: {
              status: 'draft',
            },
          }),
        },
        after: {
          data: () => ({
            expense: {
              status: 'active',
            },
          }),
        },
      },
    });

    expect(buildAccountingEventMock).not.toHaveBeenCalled();
  });
});
