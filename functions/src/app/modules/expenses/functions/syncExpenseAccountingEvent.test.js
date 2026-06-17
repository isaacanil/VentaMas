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
              updatedBy: 'user-2',
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
        monetary: expect.objectContaining({
          amount: 100,
          subtotalAmount: 100,
          taxAmount: 0,
          netPayableAmount: 100,
          functionalAmount: 6200,
          functionalSubtotalAmount: 6200,
          functionalTaxAmount: 0,
          functionalNetPayableAmount: 6200,
        }),
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
          fiscalTotals: {
            subtotal: 100,
            taxAmount: 0,
            withholdingITBISAmount: 0,
            withholdingISRAmount: 0,
            total: 100,
            netPayableAmount: 100,
          },
        }),
        createdBy: 'system:expense-derived-sync',
        metadata: {
          sourceExpenseCreatedBy: 'user-1',
          sourceExpenseUpdatedBy: 'user-2',
        },
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

  it('fails instead of clamping when expense withholdings exceed the total', async () => {
    await expect(
      syncExpenseAccountingEvent({
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
                amount: 100,
                monetary: {
                  documentTotals: {
                    total: 100,
                    withholdingITBISAmount: 70,
                    withholdingISRAmount: 40,
                  },
                },
              },
            }),
          },
        },
      }),
    ).rejects.toThrow(
      'expense expense-1: invalid fiscal totals. withholdingITBIS + withholdingISR (110) must be less than or equal to total (100); netPayableAmount must be >= 0 (calculated -10).',
    );

    expect(buildAccountingEventMock).not.toHaveBeenCalled();
    expect(
      getDocRef(
        'businesses/business-1/accountingEvents/expense.recorded__expense-1',
      ).set,
    ).not.toHaveBeenCalled();
  });

  it('uses top-level expense records with paymentMethods from bank', async () => {
    await syncExpenseAccountingEvent({
      params: {
        businessId: 'business-1',
        expenseId: 'expense-1',
      },
      data: {
        before: {
          data: () => ({
            status: 'draft',
          }),
        },
        after: {
          data: () => ({
            status: 'active',
            numberId: 'G-002',
            totals: {
              subtotal: 10000,
              tax: 1800,
              total: 11800,
            },
            paymentMethods: [
              {
                amount: 11800,
                bankAccountId: 'bank-1',
                method: 'transfer',
                reference: 'TRX-2',
              },
            ],
          }),
        },
      },
    });

    expect(buildAccountingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        monetary: expect.objectContaining({
          amount: 11800,
          subtotalAmount: 10000,
          taxAmount: 1800,
          netPayableAmount: 11800,
        }),
        treasury: {
          bankAccountId: 'bank-1',
          cashAccountId: null,
          cashCountId: null,
          paymentChannel: 'bank',
        },
        payload: expect.objectContaining({
          paymentMethod: 'transfer',
          paymentMethodCount: 1,
          paymentMethods: [
            {
              amount: 11800,
              bankAccountId: 'bank-1',
              cashAccountId: null,
              cashCountId: null,
              method: 'transfer',
              reference: 'TRX-2',
              sourceType: null,
              value: 11800,
            },
          ],
          settlementTiming: 'immediate',
        }),
      }),
    );
  });

  it('reconstructs expense total from subtotal and treats missing payment evidence as payable', async () => {
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
              monetary: {
                documentTotals: {
                  subtotal: 1000,
                  tax: 180,
                  total: 0,
                },
                functionalTotals: {
                  subtotal: 1000,
                  tax: 180,
                  total: 0,
                },
              },
            },
          }),
        },
      },
    });

    expect(buildAccountingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        monetary: expect.objectContaining({
          amount: 1180,
          subtotalAmount: 1000,
          taxAmount: 180,
          netPayableAmount: 1180,
          functionalAmount: 1180,
          functionalSubtotalAmount: 1000,
          functionalTaxAmount: 180,
          functionalNetPayableAmount: 1180,
        }),
        treasury: {
          bankAccountId: null,
          cashAccountId: null,
          cashCountId: null,
          paymentChannel: null,
        },
        payload: expect.objectContaining({
          settlementTiming: 'deferred',
          fiscalTotals: expect.objectContaining({
            subtotal: 1000,
            taxAmount: 180,
            total: 1180,
            netPayableAmount: 1180,
          }),
        }),
      }),
    );
  });

  it('uses paymentMethods from cash expenses', async () => {
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
              totals: {
                total: 3200,
                tax: 0,
              },
              paymentMethods: [
                {
                  amount: 3200,
                  cashCountId: 'cash-count-1',
                  method: 'cash',
                },
              ],
            },
          }),
        },
      },
    });

    expect(buildAccountingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        treasury: {
          bankAccountId: null,
          cashAccountId: null,
          cashCountId: 'cash-count-1',
          paymentChannel: 'cash',
        },
        payload: expect.objectContaining({
          paymentMethod: 'cash',
          settlementTiming: 'immediate',
        }),
      }),
    );
  });

  it('marks credit expenses as deferred', async () => {
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
              amount: 944,
              paymentMethods: [
                {
                  amount: 944,
                  method: 'credit',
                },
              ],
            },
          }),
        },
      },
    });

    expect(buildAccountingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        treasury: {
          bankAccountId: null,
          cashAccountId: null,
          cashCountId: null,
          paymentChannel: null,
        },
        payload: expect.objectContaining({
          paymentMethod: 'credit',
          settlementTiming: 'deferred',
        }),
      }),
    );
  });

  it('keeps valid ITBIS and withholdings in the fiscal snapshot', async () => {
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
              totals: {
                subtotal: 1000,
                tax: 180,
                total: 1180,
                withholdingITBISAmount: 54,
                withholdingISRAmount: 20,
              },
              paymentMethods: [{ amount: 1106, method: 'cash' }],
            },
          }),
        },
      },
    });

    expect(buildAccountingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        monetary: expect.objectContaining({
          amount: 1180,
          subtotalAmount: 1000,
          taxAmount: 180,
          withholdingITBISAmount: 54,
          withholdingISRAmount: 20,
          netPayableAmount: 1106,
        }),
      }),
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
