import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  collectionSnapshots,
  documentRefs,
  documentSnapshots,
  getDocRef,
  runTransactionMock,
} = vi.hoisted(() => {
  const hoistedDocumentSnapshots = new Map();
  const hoistedCollectionSnapshots = new Map();
  const hoistedDocumentRefs = new Map();
  const hoistedRunTransactionMock = vi.fn();

  const toDocSnapshot = (path, data) => ({
    exists: data != null,
    id: path.split('/').at(-1) ?? null,
    data: () => data,
  });

  const getCollectionRef = (path) => ({
    path,
    get: vi.fn(async () => ({
      docs: (hoistedCollectionSnapshots.get(path) ?? []).map((entry) => ({
        id: entry.id,
        data: () => entry.data,
      })),
    })),
  });

  const hoistedGetDocRef = (path) => {
    if (!hoistedDocumentRefs.has(path)) {
      hoistedDocumentRefs.set(path, {
        path,
        get: vi.fn(async () => toDocSnapshot(path, hoistedDocumentSnapshots.get(path))),
        set: vi.fn(async (data) => {
          hoistedDocumentSnapshots.set(path, data);
        }),
        update: vi.fn(async (data) => {
          const current = hoistedDocumentSnapshots.get(path) ?? {};
          hoistedDocumentSnapshots.set(path, { ...current, ...data });
        }),
        delete: vi.fn(async () => {
          hoistedDocumentSnapshots.delete(path);
        }),
      });
    }

    return hoistedDocumentRefs.get(path);
  };

  return {
    collectionSnapshots: hoistedCollectionSnapshots,
    documentRefs: hoistedDocumentRefs,
    documentSnapshots: hoistedDocumentSnapshots,
    getDocRef: hoistedGetDocRef,
    getCollectionRef,
    runTransactionMock: hoistedRunTransactionMock,
  };
});

vi.mock('firebase-functions/v2/firestore', () => ({
  onDocumentCreated: (_options, handler) => handler,
}));

vi.mock('../../../core/config/firebase.js', () => ({
  Timestamp: class MockTimestamp {
    constructor(millis) {
      this.millis = millis;
    }

    static now() {
      return new MockTimestamp(Date.parse('2026-04-05T12:00:00.000Z'));
    }

    static fromMillis(millis) {
      return new MockTimestamp(millis);
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
    collection: (path) => ({
      path,
      get: vi.fn(async () => ({
        docs: (collectionSnapshots.get(path) ?? []).map((entry) => ({
          id: entry.id,
          data: () => entry.data,
        })),
      })),
    }),
    runTransaction: (...args) => runTransactionMock(...args),
  },
}));

import { projectAccountingEventToJournalEntry } from './projectAccountingEventToJournalEntry.js';

describe('projectAccountingEventToJournalEntry', () => {
  beforeEach(() => {
    documentSnapshots.clear();
    documentRefs.clear();
    collectionSnapshots.clear();
    vi.clearAllMocks();

    runTransactionMock.mockImplementation(async (callback) =>
      callback({
        get: vi.fn(async (ref) => ({
          exists: documentSnapshots.has(ref.path),
          id: ref.path.split('/').at(-1) ?? null,
          data: () => documentSnapshots.get(ref.path),
        })),
        set: vi.fn((ref, data) => {
          documentSnapshots.set(ref.path, data);
        }),
        update: vi.fn((ref, data) => {
          const current = documentSnapshots.get(ref.path) ?? {};
          documentSnapshots.set(ref.path, { ...current, ...data });
        }),
      }),
    );
  });

  it('persists a journal entry and marks the event as projected', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    documentSnapshots.set(
      'businesses/business-1/accountingEventProjectionDeadLetters/purchase.committed__purchase-1',
      {
        id: 'purchase.committed__purchase-1',
        projectionStatus: 'failed',
      },
    );
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', [
      {
        id: 'profile-1',
        data: {
          id: 'profile-1',
          name: 'Compra registrada',
          description: 'Compra proyectada',
          eventType: 'purchase.committed',
          status: 'active',
          priority: 10,
          linesTemplate: [
            {
              id: 'l1',
              side: 'debit',
              accountSystemKey: 'inventory',
              amountSource: 'purchase_total',
            },
            {
              id: 'l2',
              side: 'credit',
              accountSystemKey: 'accounts_payable',
              amountSource: 'purchase_total',
            },
          ],
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'inventory-1',
        data: {
          id: 'inventory-1',
          code: '1130',
          name: 'Inventario',
          status: 'active',
          postingAllowed: true,
          systemKey: 'inventory',
        },
      },
      {
        id: 'ap-1',
        data: {
          id: 'ap-1',
          code: '2100',
          name: 'Cuentas por pagar',
          status: 'active',
          postingAllowed: true,
          systemKey: 'accounts_payable',
        },
      },
    ]);

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'purchase.committed__purchase-1',
      },
      data: {
        data: () => ({
          id: 'purchase.committed__purchase-1',
          businessId: 'business-1',
          eventType: 'purchase.committed',
          eventVersion: 1,
          sourceType: 'purchase',
          sourceId: 'purchase-1',
          sourceDocumentId: 'purchase-1',
          sourceDocumentType: 'purchase',
          currency: 'USD',
          functionalCurrency: 'DOP',
          monetary: {
            amount: 100,
            functionalAmount: 6200,
          },
          payload: {},
        }),
      },
    });

    const journalEntry =
      documentSnapshots.get(
        'businesses/business-1/journalEntries/purchase.committed__purchase-1',
      ) ?? null;

    expect(journalEntry).toMatchObject({
      id: 'purchase.committed__purchase-1',
      eventType: 'purchase.committed',
      totals: {
        debit: 6200,
        credit: 6200,
      },
    });
    expect(journalEntry.lines).toHaveLength(2);

    const eventRecord =
      documentSnapshots.get(
        'businesses/business-1/accountingEvents/purchase.committed__purchase-1',
      ) ?? null;
    expect(eventRecord).toMatchObject({
      projection: expect.objectContaining({
        status: 'projected',
        journalEntryId: 'purchase.committed__purchase-1',
      }),
      'metadata.journalEntryId': 'purchase.committed__purchase-1',
    });
    expect(
      documentSnapshots.has(
        'businesses/business-1/accountingEventProjectionDeadLetters/purchase.committed__purchase-1',
      ),
    ).toBe(false);
  });

  it('skips projection and clears dead letters for voided accounting events', async () => {
    documentSnapshots.set(
      'businesses/business-1/accountingEventProjectionDeadLetters/hr_commission.accrued__period-1',
      {
        id: 'hr_commission.accrued__period-1',
        projectionStatus: 'pending_account_mapping',
      },
    );

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'hr_commission.accrued__period-1',
      },
      data: {
        data: () => ({
          id: 'hr_commission.accrued__period-1',
          businessId: 'business-1',
          eventType: 'hr_commission.accrued',
          eventVersion: 1,
          sourceType: 'hrCommissionPeriod',
          sourceId: 'period-1',
          sourceDocumentId: 'period-1',
          sourceDocumentType: 'hrCommissionPeriod',
          status: 'voided',
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: {
            amount: 16.1,
            functionalAmount: 16.1,
          },
          payload: {},
        }),
      },
    });

    const eventRecord =
      documentSnapshots.get(
        'businesses/business-1/accountingEvents/hr_commission.accrued__period-1',
      ) ?? null;
    expect(eventRecord).toMatchObject({
      projection: expect.objectContaining({
        status: 'voided',
        journalEntryId: null,
      }),
    });
    expect(
      documentSnapshots.has(
        'businesses/business-1/journalEntries/hr_commission.accrued__period-1',
      ),
    ).toBe(false);
    expect(
      documentSnapshots.has(
        'businesses/business-1/accountingEventProjectionDeadLetters/hr_commission.accrued__period-1',
      ),
    ).toBe(false);
  });

  it('skips zero amount events without creating a journal entry', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    documentSnapshots.set(
      'businesses/business-1/accountingEventProjectionDeadLetters/purchase.committed__zero-1',
      {
        id: 'purchase.committed__zero-1',
        projectionStatus: 'failed',
      },
    );
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', [
      {
        id: 'profile-1',
        data: {
          id: 'profile-1',
          name: 'Compra registrada',
          eventType: 'purchase.committed',
          status: 'active',
          priority: 10,
          linesTemplate: [
            {
              id: 'l1',
              side: 'debit',
              accountSystemKey: 'inventory',
              amountSource: 'purchase_total',
            },
            {
              id: 'l2',
              side: 'credit',
              accountSystemKey: 'accounts_payable',
              amountSource: 'purchase_total',
            },
          ],
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'inventory-1',
        data: {
          id: 'inventory-1',
          code: '1130',
          name: 'Inventario',
          status: 'active',
          postingAllowed: true,
          systemKey: 'inventory',
        },
      },
      {
        id: 'ap-1',
        data: {
          id: 'ap-1',
          code: '2100',
          name: 'Cuentas por pagar',
          status: 'active',
          postingAllowed: true,
          systemKey: 'accounts_payable',
        },
      },
    ]);

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'purchase.committed__zero-1',
      },
      data: {
        data: () => ({
          id: 'purchase.committed__zero-1',
          businessId: 'business-1',
          eventType: 'purchase.committed',
          eventVersion: 1,
          sourceType: 'purchase',
          sourceId: 'zero-1',
          sourceDocumentId: 'zero-1',
          sourceDocumentType: 'purchase',
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: {
            amount: 0,
            functionalAmount: 0,
          },
          payload: {},
        }),
      },
    });

    const eventRecord =
      documentSnapshots.get(
        'businesses/business-1/accountingEvents/purchase.committed__zero-1',
      ) ?? null;
    expect(eventRecord).toMatchObject({
      projection: expect.objectContaining({
        status: 'skipped_zero_amount',
        journalEntryId: null,
      }),
    });
    expect(
      documentSnapshots.has(
        'businesses/business-1/journalEntries/purchase.committed__zero-1',
      ),
    ).toBe(false);
    expect(
      documentSnapshots.has(
        'businesses/business-1/accountingEventProjectionDeadLetters/purchase.committed__zero-1',
      ),
    ).toBe(false);
  });

  it('projects receivable payments with third-party withholding as collected plus tax receivable', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', [
      {
        id: 'profile-ar-payment-withholding',
        data: {
          id: 'profile-ar-payment-withholding',
          name: 'Cobro con retencion sufrida',
          eventType: 'accounts_receivable.payment.recorded',
          status: 'active',
          priority: 10,
          conditions: {
            settlementKind: 'cash',
          },
          linesTemplate: [
            {
              id: 'l1',
              side: 'debit',
              accountSystemKey: 'cash',
              amountSource: 'accounts_receivable_collected_amount',
            },
            {
              id: 'l2',
              side: 'debit',
              accountSystemKey: 'tax_receivable',
              amountSource: 'accounts_receivable_withholding_amount',
              omitIfZero: true,
            },
            {
              id: 'l3',
              side: 'credit',
              accountSystemKey: 'accounts_receivable',
              amountSource: 'accounts_receivable_applied_amount',
            },
          ],
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'cash-1',
        data: {
          id: 'cash-1',
          code: '1100',
          name: 'Caja',
          status: 'active',
          postingAllowed: true,
          systemKey: 'cash',
        },
      },
      {
        id: 'tax-receivable-1',
        data: {
          id: 'tax-receivable-1',
          code: '1125',
          name: 'Impuestos por recuperar',
          status: 'active',
          postingAllowed: true,
          systemKey: 'tax_receivable',
        },
      },
      {
        id: 'ar-1',
        data: {
          id: 'ar-1',
          code: '1120',
          name: 'Cuentas por cobrar',
          status: 'active',
          postingAllowed: true,
          systemKey: 'accounts_receivable',
        },
      },
    ]);

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'accounts_receivable.payment.recorded__payment-1',
      },
      data: {
        data: () => ({
          id: 'accounts_receivable.payment.recorded__payment-1',
          businessId: 'business-1',
          eventType: 'accounts_receivable.payment.recorded',
          eventVersion: 1,
          sourceType: 'accountsReceivablePayment',
          sourceId: 'payment-1',
          sourceDocumentId: 'payment-1',
          sourceDocumentType: 'accountsReceivablePayment',
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: {
            amount: 118,
            functionalAmount: 100,
          },
          treasury: {
            paymentChannel: 'cash',
          },
          payload: {
            appliedAmount: 118,
            functionalAppliedAmount: 118,
            collectedAmount: 100,
            functionalCollectedAmount: 100,
            functionalWithholdingAmount: 18,
            thirdPartyWithholding: {
              itbisWithheld: 18,
              incomeTaxWithheld: 0,
              totalWithheld: 18,
              functionalTotalWithheld: 18,
            },
          },
        }),
      },
    });

    const journalEntry =
      documentSnapshots.get(
        'businesses/business-1/journalEntries/accounts_receivable.payment.recorded__payment-1',
      ) ?? null;

    expect(journalEntry).toMatchObject({
      eventType: 'accounts_receivable.payment.recorded',
      totals: {
        debit: 118,
        credit: 118,
      },
    });
    expect(journalEntry.lines).toEqual([
      expect.objectContaining({
        accountSystemKey: 'cash',
        debit: 100,
        credit: 0,
        amountSource: 'accounts_receivable_collected_amount',
      }),
      expect.objectContaining({
        accountSystemKey: 'tax_receivable',
        debit: 18,
        credit: 0,
        amountSource: 'accounts_receivable_withholding_amount',
      }),
      expect.objectContaining({
        accountSystemKey: 'accounts_receivable',
        debit: 0,
        credit: 118,
        amountSource: 'accounts_receivable_applied_amount',
      }),
    ]);
  });

  it('projects mixed payable payments with supplier credits split by payment source', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', [
      {
        id: 'profile-ap-payment-mixed',
        data: {
          id: 'profile-ap-payment-mixed',
          name: 'Pago mixto a suplidor',
          eventType: 'accounts_payable.payment.recorded',
          status: 'active',
          priority: 10,
          conditions: {
            settlementKind: 'mixed',
          },
          linesTemplate: [
            {
              id: 'l1',
              side: 'debit',
              accountSystemKey: 'accounts_payable',
              amountSource: 'accounts_payable_payment_amount',
            },
            {
              id: 'l2',
              side: 'credit',
              accountSystemKey: 'cash',
              amountSource: 'accounts_payable_cash_paid',
              omitIfZero: true,
            },
            {
              id: 'l3',
              side: 'credit',
              accountSystemKey: 'bank',
              amountSource: 'accounts_payable_bank_paid',
              omitIfZero: true,
            },
            {
              id: 'l4',
              side: 'credit',
              accountSystemKey: 'supplier_credits',
              amountSource: 'accounts_payable_credit_note_applied',
              omitIfZero: true,
            },
          ],
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'ap-1',
        data: {
          id: 'ap-1',
          code: '2100',
          name: 'Cuentas por pagar',
          status: 'active',
          postingAllowed: true,
          systemKey: 'accounts_payable',
        },
      },
      {
        id: 'cash-1',
        data: {
          id: 'cash-1',
          code: '1100',
          name: 'Caja',
          status: 'active',
          postingAllowed: true,
          systemKey: 'cash',
        },
      },
      {
        id: 'bank-1',
        data: {
          id: 'bank-1',
          code: '1110',
          name: 'Banco',
          status: 'active',
          postingAllowed: true,
          systemKey: 'bank',
        },
      },
      {
        id: 'supplier-credits-1',
        data: {
          id: 'supplier-credits-1',
          code: '1140',
          name: 'Saldos a favor de suplidores',
          status: 'active',
          postingAllowed: true,
          systemKey: 'supplier_credits',
        },
      },
    ]);

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'accounts_payable.payment.recorded__payment-1',
      },
      data: {
        data: () => ({
          id: 'accounts_payable.payment.recorded__payment-1',
          businessId: 'business-1',
          eventType: 'accounts_payable.payment.recorded',
          eventVersion: 1,
          sourceType: 'accountsPayablePayment',
          sourceId: 'payment-1',
          sourceDocumentId: 'payment-1',
          sourceDocumentType: 'accountsPayablePayment',
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: {
            amount: 100,
            functionalAmount: 100,
          },
          treasury: {
            paymentChannel: 'mixed',
          },
          payload: {
            paymentMethods: [
              {
                method: 'cash',
                amount: 10,
              },
              {
                method: 'transfer',
                amount: 60,
              },
              {
                method: 'supplierCreditNote',
                amount: 30,
                supplierCreditNoteId: 'scn-1',
              },
            ],
          },
        }),
      },
    });

    const journalEntry =
      documentSnapshots.get(
        'businesses/business-1/journalEntries/accounts_payable.payment.recorded__payment-1',
      ) ?? null;

    expect(journalEntry).toMatchObject({
      eventType: 'accounts_payable.payment.recorded',
      totals: {
        debit: 100,
        credit: 100,
      },
    });
    expect(journalEntry.lines).toEqual([
      expect.objectContaining({
        accountSystemKey: 'accounts_payable',
        debit: 100,
        credit: 0,
        amountSource: 'accounts_payable_payment_amount',
      }),
      expect.objectContaining({
        accountSystemKey: 'cash',
        debit: 0,
        credit: 10,
        amountSource: 'accounts_payable_cash_paid',
      }),
      expect.objectContaining({
        accountSystemKey: 'bank',
        debit: 0,
        credit: 60,
        amountSource: 'accounts_payable_bank_paid',
      }),
      expect.objectContaining({
        accountSystemKey: 'supplier_credits',
        debit: 0,
        credit: 30,
        amountSource: 'accounts_payable_credit_note_applied',
      }),
    ]);
  });

  it('projects issued supplier credit notes into supplier credits', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', [
      {
        id: 'profile-supplier-credit-issued',
        data: {
          id: 'profile-supplier-credit-issued',
          name: 'Saldo a favor de suplidor emitido',
          eventType: 'supplier_credit_note.issued',
          status: 'active',
          priority: 10,
          linesTemplate: [
            {
              id: 'l1',
              side: 'debit',
              accountSystemKey: 'supplier_credits',
              amountSource: 'document_total',
            },
            {
              id: 'l2',
              side: 'credit',
              accountSystemKey: 'accounts_payable',
              amountSource: 'document_total',
            },
          ],
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'supplier-credits-1',
        data: {
          id: 'supplier-credits-1',
          code: '1140',
          name: 'Saldos a favor de suplidores',
          status: 'active',
          postingAllowed: true,
          systemKey: 'supplier_credits',
        },
      },
      {
        id: 'ap-1',
        data: {
          id: 'ap-1',
          code: '2100',
          name: 'Cuentas por pagar',
          status: 'active',
          postingAllowed: true,
          systemKey: 'accounts_payable',
        },
      },
    ]);

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'supplier_credit_note.issued__purchase_overpaid_purchase-1',
      },
      data: {
        data: () => ({
          id: 'supplier_credit_note.issued__purchase_overpaid_purchase-1',
          businessId: 'business-1',
          eventType: 'supplier_credit_note.issued',
          eventVersion: 1,
          sourceType: 'supplierCreditNote',
          sourceId: 'purchase_overpaid_purchase-1',
          sourceDocumentId: 'purchase_overpaid_purchase-1',
          sourceDocumentType: 'supplierCreditNote',
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: {
            amount: 45,
            functionalAmount: 45,
          },
          payload: {
            purchaseId: 'purchase-1',
            supplierCreditNoteId: 'purchase_overpaid_purchase-1',
          },
        }),
      },
    });

    const journalEntry =
      documentSnapshots.get(
        'businesses/business-1/journalEntries/supplier_credit_note.issued__purchase_overpaid_purchase-1',
      ) ?? null;

    expect(journalEntry).toMatchObject({
      eventType: 'supplier_credit_note.issued',
      totals: {
        debit: 45,
        credit: 45,
      },
    });
    expect(journalEntry.lines).toEqual([
      expect.objectContaining({
        accountSystemKey: 'supplier_credits',
        debit: 45,
        credit: 0,
      }),
      expect.objectContaining({
        accountSystemKey: 'accounts_payable',
        debit: 0,
        credit: 45,
      }),
    ]);
  });

  it('projects payroll accruals as gross expense with net pay and deductions payable', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', [
      {
        id: 'profile-payroll-accrued',
        data: {
          id: 'profile-payroll-accrued',
          name: 'Nomina RRHH devengada',
          eventType: 'hr_commission.accrued',
          status: 'active',
          priority: 10,
          conditions: {
            documentNature: 'expense',
            settlementTiming: 'deferred',
          },
          linesTemplate: [
            {
              id: 'l1',
              side: 'debit',
              accountSystemKey: 'operating_expenses',
              amountSource: 'payroll_accrual_amount',
            },
            {
              id: 'l2',
              side: 'credit',
              accountSystemKey: 'payroll_payable',
              amountSource: 'payroll_net_payable_amount',
            },
            {
              id: 'l3',
              side: 'credit',
              accountSystemKey: 'tax_payable',
              amountSource: 'payroll_tax_deductions_amount',
              omitIfZero: true,
            },
            {
              id: 'l4',
              side: 'credit',
              accountSystemKey: 'payroll_withholdings_payable',
              amountSource: 'payroll_other_deductions_amount',
              omitIfZero: true,
            },
          ],
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'expense-1',
        data: {
          id: 'expense-1',
          code: '5200',
          name: 'Gastos operativos',
          status: 'active',
          postingAllowed: true,
          systemKey: 'operating_expenses',
        },
      },
      {
        id: 'payroll-payable-1',
        data: {
          id: 'payroll-payable-1',
          code: '2110',
          name: 'Nomina por pagar',
          status: 'active',
          postingAllowed: true,
          systemKey: 'payroll_payable',
        },
      },
      {
        id: 'tax-payable-1',
        data: {
          id: 'tax-payable-1',
          code: '2200',
          name: 'Impuestos por pagar',
          status: 'active',
          postingAllowed: true,
          systemKey: 'tax_payable',
        },
      },
      {
        id: 'payroll-withholdings-1',
        data: {
          id: 'payroll-withholdings-1',
          code: '2120',
          name: 'Retenciones laborales por pagar',
          status: 'active',
          postingAllowed: true,
          systemKey: 'payroll_withholdings_payable',
        },
      },
    ]);

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'hr_commission.accrued__period-1',
      },
      data: {
        data: () => ({
          id: 'hr_commission.accrued__period-1',
          businessId: 'business-1',
          eventType: 'hr_commission.accrued',
          eventVersion: 1,
          sourceType: 'hrCommissionPeriod',
          sourceId: 'period-1',
          sourceDocumentId: 'period-1',
          sourceDocumentType: 'hrCommissionPeriod',
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: {
            amount: 1000,
            functionalAmount: 1000,
          },
          payload: {
            documentNature: 'expense',
            settlementTiming: 'deferred',
            netAmount: 850,
            payrollDeductionSummary: {
              taxAmount: 50,
              otherPayableAmount: 100,
            },
          },
        }),
      },
    });

    const journalEntry =
      documentSnapshots.get(
        'businesses/business-1/journalEntries/hr_commission.accrued__period-1',
      ) ?? null;

    expect(journalEntry).toMatchObject({
      eventType: 'hr_commission.accrued',
      totals: {
        debit: 1000,
        credit: 1000,
      },
    });
    expect(journalEntry.lines).toEqual([
      expect.objectContaining({
        accountSystemKey: 'operating_expenses',
        debit: 1000,
        credit: 0,
        amountSource: 'payroll_accrual_amount',
      }),
      expect.objectContaining({
        accountSystemKey: 'payroll_payable',
        debit: 0,
        credit: 850,
        amountSource: 'payroll_net_payable_amount',
      }),
      expect.objectContaining({
        accountSystemKey: 'tax_payable',
        debit: 0,
        credit: 50,
        amountSource: 'payroll_tax_deductions_amount',
      }),
      expect.objectContaining({
        accountSystemKey: 'payroll_withholdings_payable',
        debit: 0,
        credit: 100,
        amountSource: 'payroll_other_deductions_amount',
      }),
    ]);
  });

  it('marks the event as pending_account_mapping when no profile applies', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', []);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', []);

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'expense.recorded__expense-1',
      },
      data: {
        data: () => ({
          id: 'expense.recorded__expense-1',
          businessId: 'business-1',
          eventType: 'expense.recorded',
          monetary: {
            amount: 100,
            functionalAmount: 100,
          },
        }),
      },
    });

    expect(
      documentSnapshots.get(
        'businesses/business-1/accountingEvents/expense.recorded__expense-1',
      ),
    ).toMatchObject({
      projection: expect.objectContaining({
        status: 'pending_account_mapping',
      }),
    });
    expect(
      documentSnapshots.get(
        'businesses/business-1/accountingEventProjectionDeadLetters/expense.recorded__expense-1',
      ),
    ).toMatchObject({
      id: 'expense.recorded__expense-1',
      projectionStatus: 'pending_account_mapping',
      retryable: true,
      lastError: expect.objectContaining({
        code: 'posting-profile-not-found',
      }),
    });
  });

  it('fails projection when the event period is already closed', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    documentSnapshots.set(
      'businesses/business-1/accountingPeriodClosures/2026-04',
      {
        id: '2026-04',
        status: 'closed',
      },
    );
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', []);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', []);

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'expense.recorded__expense-closed-1',
      },
      data: {
        data: () => ({
          id: 'expense.recorded__expense-closed-1',
          businessId: 'business-1',
          eventType: 'expense.recorded',
          occurredAt: new Date('2026-04-12T12:00:00.000Z'),
          monetary: {
            amount: 100,
            functionalAmount: 100,
          },
        }),
      },
    });

    expect(
      documentSnapshots.has(
        'businesses/business-1/journalEntries/expense.recorded__expense-closed-1',
      ),
    ).toBe(false);
    expect(
      documentSnapshots.get(
        'businesses/business-1/accountingEvents/expense.recorded__expense-closed-1',
      ),
    ).toMatchObject({
      projection: expect.objectContaining({
        status: 'failed',
        lastError: expect.objectContaining({
          code: 'accounting-period-closed',
        }),
      }),
    });
    expect(
      documentSnapshots.get(
        'businesses/business-1/accountingEventProjectionDeadLetters/expense.recorded__expense-closed-1',
      ),
    ).toMatchObject({
      id: 'expense.recorded__expense-closed-1',
      projectionStatus: 'failed',
      lastError: expect.objectContaining({
        code: 'accounting-period-closed',
      }),
    });
  });

  it('projects inventory COGS events into cost of sales and inventory', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', [
      {
        id: 'profile-cogs',
        data: {
          id: 'profile-cogs',
          name: 'Costo de venta',
          eventType: 'inventory.cogs.recorded',
          status: 'active',
          priority: 10,
          conditions: {
            documentNature: 'inventory',
          },
          linesTemplate: [
            {
              id: 'l1',
              side: 'debit',
              accountSystemKey: 'cost_of_sales',
              amountSource: 'document_total',
            },
            {
              id: 'l2',
              side: 'credit',
              accountSystemKey: 'inventory',
              amountSource: 'document_total',
            },
          ],
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'cost-of-sales-1',
        data: {
          id: 'cost-of-sales-1',
          code: '5100',
          name: 'Costo de venta',
          status: 'active',
          postingAllowed: true,
          systemKey: 'cost_of_sales',
        },
      },
      {
        id: 'inventory-1',
        data: {
          id: 'inventory-1',
          code: '1130',
          name: 'Inventario',
          status: 'active',
          postingAllowed: true,
          systemKey: 'inventory',
        },
      },
    ]);

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'inventory.cogs.recorded__invoice-1',
      },
      data: {
        data: () => ({
          id: 'inventory.cogs.recorded__invoice-1',
          businessId: 'business-1',
          eventType: 'inventory.cogs.recorded',
          eventVersion: 1,
          sourceType: 'invoice_inventory',
          sourceId: 'invoice-1',
          sourceDocumentId: 'invoice-1',
          sourceDocumentType: 'invoice',
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: {
            amount: 50,
            functionalAmount: 50,
          },
          payload: {
            documentNature: 'inventory',
          },
        }),
      },
    });

    expect(
      documentSnapshots.get(
        'businesses/business-1/journalEntries/inventory.cogs.recorded__invoice-1',
      ),
    ).toMatchObject({
      totals: {
        debit: 50,
        credit: 50,
      },
      lines: [
        expect.objectContaining({
          accountSystemKey: 'cost_of_sales',
          debit: 50,
          credit: 0,
        }),
        expect.objectContaining({
          accountSystemKey: 'inventory',
          debit: 0,
          credit: 50,
        }),
      ],
    });
  });

  it('marks the event as failed when the projected lines do not balance', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', [
      {
        id: 'profile-1',
        data: {
          id: 'profile-1',
          name: 'Perfil invalido',
          eventType: 'purchase.committed',
          status: 'active',
          priority: 10,
          linesTemplate: [
            {
              id: 'l1',
              side: 'debit',
              accountSystemKey: 'inventory',
              amountSource: 'purchase_total',
            },
            {
              id: 'l2',
              side: 'debit',
              accountSystemKey: 'accounts_payable',
              amountSource: 'purchase_total',
            },
          ],
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'inventory-1',
        data: {
          id: 'inventory-1',
          code: '1130',
          name: 'Inventario',
          status: 'active',
          postingAllowed: true,
          systemKey: 'inventory',
        },
      },
      {
        id: 'ap-1',
        data: {
          id: 'ap-1',
          code: '2100',
          name: 'Cuentas por pagar',
          status: 'active',
          postingAllowed: true,
          systemKey: 'accounts_payable',
        },
      },
    ]);

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'purchase.committed__purchase-2',
      },
      data: {
        data: () => ({
          id: 'purchase.committed__purchase-2',
          businessId: 'business-1',
          eventType: 'purchase.committed',
          monetary: {
            amount: 100,
            functionalAmount: 100,
          },
        }),
      },
    });

    expect(
      documentSnapshots.get(
        'businesses/business-1/accountingEvents/purchase.committed__purchase-2',
      ),
    ).toMatchObject({
      projection: expect.objectContaining({
        status: 'failed',
      }),
    });
    expect(
      documentSnapshots.has(
        'businesses/business-1/journalEntries/purchase.committed__purchase-2',
      ),
    ).toBe(false);
    expect(
      documentSnapshots.get(
        'businesses/business-1/accountingEventProjectionDeadLetters/purchase.committed__purchase-2',
      ),
    ).toMatchObject({
      id: 'purchase.committed__purchase-2',
      projectionStatus: 'failed',
      retryable: true,
      lastError: expect.objectContaining({
        code: 'unbalanced_projection',
      }),
    });
  });

  it('projects receivable and payable payment voids as inverse ledger lines', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', [
      {
        id: 'profile-ar-void-cash',
        data: {
          id: 'profile-ar-void-cash',
          name: 'Anulación de cobro en caja',
          eventType: 'accounts_receivable.payment.voided',
          status: 'active',
          priority: 10,
          conditions: {
            settlementKind: 'cash',
          },
          linesTemplate: [
            {
              id: 'l1',
              side: 'debit',
              accountSystemKey: 'accounts_receivable',
              amountSource: 'accounts_receivable_payment_amount',
            },
            {
              id: 'l2',
              side: 'credit',
              accountSystemKey: 'cash',
              amountSource: 'accounts_receivable_payment_amount',
            },
          ],
        },
      },
      {
        id: 'profile-ap-void-bank',
        data: {
          id: 'profile-ap-void-bank',
          name: 'Anulación de pago a suplidor por banco',
          eventType: 'accounts_payable.payment.voided',
          status: 'active',
          priority: 10,
          conditions: {
            settlementKind: 'bank',
          },
          linesTemplate: [
            {
              id: 'l1',
              side: 'debit',
              accountSystemKey: 'bank',
              amountSource: 'accounts_payable_payment_amount',
            },
            {
              id: 'l2',
              side: 'credit',
              accountSystemKey: 'accounts_payable',
              amountSource: 'accounts_payable_payment_amount',
            },
          ],
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'cash-1',
        data: {
          id: 'cash-1',
          code: '1100',
          name: 'Caja general',
          status: 'active',
          postingAllowed: true,
          systemKey: 'cash',
        },
      },
      {
        id: 'bank-1',
        data: {
          id: 'bank-1',
          code: '1110',
          name: 'Banco',
          status: 'active',
          postingAllowed: true,
          systemKey: 'bank',
        },
      },
      {
        id: 'ar-1',
        data: {
          id: 'ar-1',
          code: '1120',
          name: 'Cuentas por cobrar',
          status: 'active',
          postingAllowed: true,
          systemKey: 'accounts_receivable',
        },
      },
      {
        id: 'ap-1',
        data: {
          id: 'ap-1',
          code: '2100',
          name: 'Cuentas por pagar',
          status: 'active',
          postingAllowed: true,
          systemKey: 'accounts_payable',
        },
      },
    ]);

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'accounts_receivable.payment.voided__payment-1',
      },
      data: {
        data: () => ({
          id: 'accounts_receivable.payment.voided__payment-1',
          businessId: 'business-1',
          eventType: 'accounts_receivable.payment.voided',
          eventVersion: 1,
          sourceType: 'accountsReceivablePayment',
          sourceId: 'payment-1',
          sourceDocumentId: 'payment-1',
          sourceDocumentType: 'accountsReceivablePayment',
          monetary: {
            amount: 100,
            functionalAmount: 100,
          },
          treasury: {
            paymentChannel: 'cash',
          },
          reversalOfEventId: 'accounts_receivable.payment.recorded__payment-1',
        }),
      },
    });

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'accounts_payable.payment.voided__payment-2',
      },
      data: {
        data: () => ({
          id: 'accounts_payable.payment.voided__payment-2',
          businessId: 'business-1',
          eventType: 'accounts_payable.payment.voided',
          eventVersion: 1,
          sourceType: 'accountsPayablePayment',
          sourceId: 'payment-2',
          sourceDocumentId: 'payment-2',
          sourceDocumentType: 'accountsPayablePayment',
          monetary: {
            amount: 70,
            functionalAmount: 70,
          },
          treasury: {
            paymentChannel: 'bank',
          },
          reversalOfEventId: 'accounts_payable.payment.recorded__payment-2',
        }),
      },
    });

    const receivableVoidEntry =
      documentSnapshots.get(
        'businesses/business-1/journalEntries/accounts_receivable.payment.voided__payment-1',
      ) ?? null;
    expect(receivableVoidEntry).toMatchObject({
      eventType: 'accounts_receivable.payment.voided',
      reversalOfEventId: 'accounts_receivable.payment.recorded__payment-1',
      totals: {
        debit: 100,
        credit: 100,
      },
    });
    expect(receivableVoidEntry.lines).toEqual([
      expect.objectContaining({
        accountSystemKey: 'accounts_receivable',
        debit: 100,
        credit: 0,
      }),
      expect.objectContaining({
        accountSystemKey: 'cash',
        debit: 0,
        credit: 100,
      }),
    ]);

    const payableVoidEntry =
      documentSnapshots.get(
        'businesses/business-1/journalEntries/accounts_payable.payment.voided__payment-2',
      ) ?? null;
    expect(payableVoidEntry).toMatchObject({
      eventType: 'accounts_payable.payment.voided',
      reversalOfEventId: 'accounts_payable.payment.recorded__payment-2',
      totals: {
        debit: 70,
        credit: 70,
      },
    });
    expect(payableVoidEntry.lines).toEqual([
      expect.objectContaining({
        accountSystemKey: 'bank',
        debit: 70,
        credit: 0,
      }),
      expect.objectContaining({
        accountSystemKey: 'accounts_payable',
        debit: 0,
        credit: 70,
      }),
    ]);
  });

  it('splits mixed USD sales between cash and accounts receivable using functional amounts', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', [
      {
        id: 'profile-sale-credit-split',
        data: {
          id: 'profile-sale-credit-split',
          name: 'Venta credito con abono',
          description: 'Factura confirmada con cobro parcial y saldo a cuentas por cobrar.',
          eventType: 'invoice.committed',
          status: 'active',
          priority: 15,
          conditions: {
            paymentTerm: 'credit',
          },
          linesTemplate: [
            {
              id: 'l1',
              side: 'debit',
              accountSystemKey: 'cash',
              amountSource: 'sale_cash_received',
            },
            {
              id: 'l2',
              side: 'debit',
              accountSystemKey: 'accounts_receivable',
              amountSource: 'sale_receivable_balance',
            },
            {
              id: 'l3',
              side: 'credit',
              accountSystemKey: 'sales',
              amountSource: 'net_sales',
            },
            {
              id: 'l4',
              side: 'credit',
              accountSystemKey: 'tax_payable',
              amountSource: 'tax_total',
            },
          ],
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'cash-1',
        data: {
          id: 'cash-1',
          code: '1100',
          name: 'Caja general',
          status: 'active',
          postingAllowed: true,
          systemKey: 'cash',
        },
      },
      {
        id: 'ar-1',
        data: {
          id: 'ar-1',
          code: '1120',
          name: 'Cuentas por cobrar',
          status: 'active',
          postingAllowed: true,
          systemKey: 'accounts_receivable',
        },
      },
      {
        id: 'sales-1',
        data: {
          id: 'sales-1',
          code: '4100',
          name: 'Ventas',
          status: 'active',
          postingAllowed: true,
          systemKey: 'sales',
        },
      },
      {
        id: 'tax-1',
        data: {
          id: 'tax-1',
          code: '2200',
          name: 'Impuestos por pagar',
          status: 'active',
          postingAllowed: true,
          systemKey: 'tax_payable',
        },
      },
    ]);

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'invoice.committed__invoice-mixed-1',
      },
      data: {
        data: () => ({
          id: 'invoice.committed__invoice-mixed-1',
          businessId: 'business-1',
          eventType: 'invoice.committed',
          eventVersion: 1,
          sourceType: 'invoice',
          sourceId: 'invoice-mixed-1',
          sourceDocumentId: 'invoice-mixed-1',
          sourceDocumentType: 'invoice',
          currency: 'USD',
          functionalCurrency: 'DOP',
          monetary: {
            amount: 76.7,
            taxAmount: 11.7,
            functionalAmount: 4602,
            functionalTaxAmount: 702,
          },
          payload: {
            paymentTerm: 'credit',
            paymentMethods: [{ method: 'cash', value: 30 }],
          },
        }),
      },
    });

    const journalEntry =
      documentSnapshots.get(
        'businesses/business-1/journalEntries/invoice.committed__invoice-mixed-1',
      ) ?? null;

    expect(journalEntry).toMatchObject({
      id: 'invoice.committed__invoice-mixed-1',
      eventType: 'invoice.committed',
      totals: {
        debit: 4602,
        credit: 4602,
      },
    });
    expect(journalEntry.lines).toEqual([
      expect.objectContaining({
        accountSystemKey: 'cash',
        debit: 1800,
        credit: 0,
      }),
      expect.objectContaining({
        accountSystemKey: 'accounts_receivable',
        debit: 2802,
        credit: 0,
      }),
      expect.objectContaining({
        accountSystemKey: 'sales',
        debit: 0,
        credit: 3900,
      }),
      expect.objectContaining({
        accountSystemKey: 'tax_payable',
        debit: 0,
        credit: 702,
      }),
    ]);
  });

  it('splits bank-backed sales by linked bank account chart accounts', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', [
      {
        id: 'profile-bank-sale',
        data: {
          id: 'profile-bank-sale',
          name: 'Venta bancaria',
          eventType: 'invoice.committed',
          status: 'active',
          priority: 10,
          conditions: {
            paymentTerm: 'cash',
            settlementKind: 'bank',
          },
          linesTemplate: [
            {
              id: 'l1',
              side: 'debit',
              accountSystemKey: 'bank',
              amountSource: 'sale_bank_received',
            },
            {
              id: 'l2',
              side: 'credit',
              accountSystemKey: 'sales',
              amountSource: 'net_sales',
            },
          ],
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'bank-root',
        data: {
          id: 'bank-root',
          code: '1110',
          name: 'Cuentas bancarias',
          status: 'active',
          postingAllowed: true,
          systemKey: 'bank',
        },
      },
      {
        id: 'bank-popular-ledger',
        data: {
          id: 'bank-popular-ledger',
          code: '1110.01',
          name: 'Banco Popular Corriente 1234',
          status: 'active',
          postingAllowed: true,
          parentId: 'bank-root',
        },
      },
      {
        id: 'bank-bhd-ledger',
        data: {
          id: 'bank-bhd-ledger',
          code: '1110.02',
          name: 'Banco BHD Corriente 5678',
          status: 'active',
          postingAllowed: true,
          parentId: 'bank-root',
        },
      },
      {
        id: 'sales-1',
        data: {
          id: 'sales-1',
          code: '4100',
          name: 'Ventas',
          status: 'active',
          postingAllowed: true,
          systemKey: 'sales',
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/bankAccounts', [
      {
        id: 'bank-popular',
        data: {
          id: 'bank-popular',
          status: 'active',
          chartOfAccountId: 'bank-popular-ledger',
        },
      },
      {
        id: 'bank-bhd',
        data: {
          id: 'bank-bhd',
          status: 'active',
          chartOfAccountId: 'bank-bhd-ledger',
        },
      },
    ]);

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'invoice.committed__invoice-bank-split-1',
      },
      data: {
        data: () => ({
          id: 'invoice.committed__invoice-bank-split-1',
          businessId: 'business-1',
          eventType: 'invoice.committed',
          eventVersion: 1,
          sourceType: 'invoice',
          sourceId: 'invoice-bank-split-1',
          sourceDocumentId: 'invoice-bank-split-1',
          sourceDocumentType: 'invoice',
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: {
            amount: 1000,
            functionalAmount: 1000,
          },
          treasury: {
            paymentChannel: 'bank',
          },
          payload: {
            paymentTerm: 'cash',
            paymentMethods: [
              {
                method: 'card',
                value: 400,
                bankAccountId: 'bank-popular',
              },
              {
                method: 'transfer',
                value: 600,
                bankAccountId: 'bank-bhd',
              },
            ],
          },
        }),
      },
    });

    const journalEntry =
      documentSnapshots.get(
        'businesses/business-1/journalEntries/invoice.committed__invoice-bank-split-1',
      ) ?? null;

    expect(journalEntry).toMatchObject({
      totals: {
        debit: 1000,
        credit: 1000,
      },
    });
    expect(journalEntry.lines).toEqual([
      expect.objectContaining({
        accountId: 'bank-popular-ledger',
        accountCode: '1110.01',
        debit: 400,
        credit: 0,
        metadata: expect.objectContaining({
          bankAccountId: 'bank-popular',
        }),
      }),
      expect.objectContaining({
        accountId: 'bank-bhd-ledger',
        accountCode: '1110.02',
        debit: 600,
        credit: 0,
        metadata: expect.objectContaining({
          bankAccountId: 'bank-bhd',
        }),
      }),
      expect.objectContaining({
        accountSystemKey: 'sales',
        debit: 0,
        credit: 1000,
      }),
    ]);
  });

  it('projects issued customer credit notes into customer credits', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', [
      {
        id: 'profile-customer-credit-note-issued',
        data: {
          id: 'profile-customer-credit-note-issued',
          name: 'Nota de crédito emitida a cliente',
          eventType: 'customer_credit_note.issued',
          status: 'active',
          priority: 10,
          linesTemplate: [
            {
              id: 'l1',
              side: 'debit',
              accountSystemKey: 'sales',
              amountSource: 'credit_note_net_total',
            },
            {
              id: 'l2',
              side: 'debit',
              accountSystemKey: 'tax_payable',
              amountSource: 'tax_total',
            },
            {
              id: 'l3',
              side: 'credit',
              accountSystemKey: 'customer_credits',
              amountSource: 'document_total',
            },
          ],
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'sales-1',
        data: {
          id: 'sales-1',
          code: '4100',
          name: 'Ventas',
          status: 'active',
          postingAllowed: true,
          systemKey: 'sales',
        },
      },
      {
        id: 'tax-1',
        data: {
          id: 'tax-1',
          code: '2200',
          name: 'Impuestos por pagar',
          status: 'active',
          postingAllowed: true,
          systemKey: 'tax_payable',
        },
      },
      {
        id: 'customer-credits-1',
        data: {
          id: 'customer-credits-1',
          code: '2300',
          name: 'Créditos a clientes',
          status: 'active',
          postingAllowed: true,
          systemKey: 'customer_credits',
        },
      },
    ]);

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'customer_credit_note.issued__credit-note-1',
      },
      data: {
        data: () => ({
          id: 'customer_credit_note.issued__credit-note-1',
          businessId: 'business-1',
          eventType: 'customer_credit_note.issued',
          eventVersion: 1,
          sourceType: 'creditNote',
          sourceId: 'credit-note-1',
          sourceDocumentId: 'credit-note-1',
          sourceDocumentType: 'creditNote',
          monetary: {
            amount: 118,
            taxAmount: 18,
            functionalAmount: 118,
            functionalTaxAmount: 18,
          },
        }),
      },
    });

    const journalEntry =
      documentSnapshots.get(
        'businesses/business-1/journalEntries/customer_credit_note.issued__credit-note-1',
      ) ?? null;

    expect(journalEntry).toMatchObject({
      id: 'customer_credit_note.issued__credit-note-1',
      eventType: 'customer_credit_note.issued',
      totals: {
        debit: 118,
        credit: 118,
      },
    });
    expect(journalEntry.lines).toEqual([
      expect.objectContaining({
        accountSystemKey: 'sales',
        debit: 100,
        credit: 0,
      }),
      expect.objectContaining({
        accountSystemKey: 'tax_payable',
        debit: 18,
        credit: 0,
      }),
      expect.objectContaining({
        accountSystemKey: 'customer_credits',
        debit: 0,
        credit: 118,
      }),
    ]);
  });

  it('projects applied customer credit notes against accounts receivable', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', [
      {
        id: 'profile-customer-credit-note-applied',
        data: {
          id: 'profile-customer-credit-note-applied',
          name: 'Nota de crédito aplicada a CxC',
          eventType: 'customer_credit_note.applied',
          status: 'active',
          priority: 10,
          linesTemplate: [
            {
              id: 'l1',
              side: 'debit',
              accountSystemKey: 'customer_credits',
              amountSource: 'document_total',
            },
            {
              id: 'l2',
              side: 'credit',
              accountSystemKey: 'accounts_receivable',
              amountSource: 'document_total',
            },
          ],
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'customer-credits-1',
        data: {
          id: 'customer-credits-1',
          code: '2300',
          name: 'Créditos a clientes',
          status: 'active',
          postingAllowed: true,
          systemKey: 'customer_credits',
        },
      },
      {
        id: 'ar-1',
        data: {
          id: 'ar-1',
          code: '1120',
          name: 'Cuentas por cobrar',
          status: 'active',
          postingAllowed: true,
          systemKey: 'accounts_receivable',
        },
      },
    ]);

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'customer_credit_note.applied__application-1',
      },
      data: {
        data: () => ({
          id: 'customer_credit_note.applied__application-1',
          businessId: 'business-1',
          eventType: 'customer_credit_note.applied',
          eventVersion: 1,
          sourceType: 'creditNoteApplication',
          sourceId: 'application-1',
          sourceDocumentId: 'application-1',
          sourceDocumentType: 'creditNoteApplication',
          monetary: {
            amount: 75,
            functionalAmount: 75,
          },
        }),
      },
    });

    const journalEntry =
      documentSnapshots.get(
        'businesses/business-1/journalEntries/customer_credit_note.applied__application-1',
      ) ?? null;

    expect(journalEntry).toMatchObject({
      id: 'customer_credit_note.applied__application-1',
      eventType: 'customer_credit_note.applied',
      totals: {
        debit: 75,
        credit: 75,
      },
    });
    expect(journalEntry.lines).toEqual([
      expect.objectContaining({
        accountSystemKey: 'customer_credits',
        debit: 75,
        credit: 0,
      }),
      expect.objectContaining({
        accountSystemKey: 'accounts_receivable',
        debit: 0,
        credit: 75,
      }),
    ]);
  });

  it('projects cash over/short differences into the general ledger', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', [
      {
        id: 'profile-cash-over-short',
        data: {
          id: 'profile-cash-over-short',
          name: 'Diferencia de cuadre de caja',
          eventType: 'cash_over_short.recorded',
          status: 'active',
          priority: 10,
          linesTemplate: [
            {
              id: 'l1',
              side: 'debit',
              accountSystemKey: 'cash',
              amountSource: 'cash_over_short_gain',
            },
            {
              id: 'l2',
              side: 'debit',
              accountSystemKey: 'cash_over_short_expense',
              amountSource: 'cash_over_short_loss',
            },
            {
              id: 'l3',
              side: 'credit',
              accountSystemKey: 'cash',
              amountSource: 'cash_over_short_loss',
            },
            {
              id: 'l4',
              side: 'credit',
              accountSystemKey: 'cash_over_short_income',
              amountSource: 'cash_over_short_gain',
            },
          ],
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'cash-1',
        data: {
          id: 'cash-1',
          code: '1100',
          name: 'Caja general',
          status: 'active',
          postingAllowed: true,
          systemKey: 'cash',
        },
      },
      {
        id: 'cash-over-short-income-1',
        data: {
          id: 'cash-over-short-income-1',
          code: '4150',
          name: 'Ingresos por sobrante de caja',
          status: 'active',
          postingAllowed: true,
          systemKey: 'cash_over_short_income',
        },
      },
      {
        id: 'cash-over-short-expense-1',
        data: {
          id: 'cash-over-short-expense-1',
          code: '5250',
          name: 'Pérdidas por faltante de caja',
          status: 'active',
          postingAllowed: true,
          systemKey: 'cash_over_short_expense',
        },
      },
    ]);

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'cash_over_short.recorded__cash-1',
      },
      data: {
        data: () => ({
          id: 'cash_over_short.recorded__cash-1',
          businessId: 'business-1',
          eventType: 'cash_over_short.recorded',
          eventVersion: 1,
          sourceType: 'cashCount',
          sourceId: 'cash-1',
          sourceDocumentId: 'cash-1',
          sourceDocumentType: 'cashCount',
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: {
            amount: 18.25,
            functionalAmount: 18.25,
          },
          payload: {
            discrepancyDirection: 'over',
          },
        }),
      },
    });

    const journalEntry =
      documentSnapshots.get(
        'businesses/business-1/journalEntries/cash_over_short.recorded__cash-1',
      ) ?? null;

    expect(journalEntry).toMatchObject({
      id: 'cash_over_short.recorded__cash-1',
      eventType: 'cash_over_short.recorded',
      totals: {
        debit: 18.25,
        credit: 18.25,
      },
    });
    expect(journalEntry.lines).toEqual([
      expect.objectContaining({
        accountSystemKey: 'cash',
        debit: 18.25,
        credit: 0,
      }),
      expect.objectContaining({
        accountSystemKey: 'cash_over_short_income',
        debit: 0,
        credit: 18.25,
      }),
    ]);
  });

  it('projects bank statement adjustment losses into the general ledger', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', [
      {
        id: 'profile-bank-statement-adjustment',
        data: {
          id: 'profile-bank-statement-adjustment',
          name: 'Ajuste por diferencia bancaria',
          eventType: 'bank_statement_adjustment.recorded',
          status: 'active',
          priority: 10,
          linesTemplate: [
            {
              id: 'l1',
              side: 'debit',
              accountSystemKey: 'bank',
              amountSource: 'bank_statement_adjustment_gain',
            },
            {
              id: 'l2',
              side: 'debit',
              accountSystemKey: 'bank_reconciliation_expense',
              amountSource: 'bank_statement_adjustment_loss',
            },
            {
              id: 'l3',
              side: 'credit',
              accountSystemKey: 'bank',
              amountSource: 'bank_statement_adjustment_loss',
            },
            {
              id: 'l4',
              side: 'credit',
              accountSystemKey: 'bank_reconciliation_income',
              amountSource: 'bank_statement_adjustment_gain',
            },
          ],
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'bank-root',
        data: {
          id: 'bank-root',
          code: '1110',
          name: 'Banco',
          status: 'active',
          postingAllowed: true,
          systemKey: 'bank',
        },
      },
      {
        id: 'bank-ledger-1',
        data: {
          id: 'bank-ledger-1',
          code: '1110.01',
          name: 'Banco Popular Corriente 1234',
          status: 'active',
          postingAllowed: true,
          parentId: 'bank-root',
        },
      },
      {
        id: 'bank-reconciliation-expense-1',
        data: {
          id: 'bank-reconciliation-expense-1',
          code: '5260',
          name: 'Gastos por conciliación bancaria',
          status: 'active',
          postingAllowed: true,
          systemKey: 'bank_reconciliation_expense',
        },
      },
      {
        id: 'bank-reconciliation-income-1',
        data: {
          id: 'bank-reconciliation-income-1',
          code: '4160',
          name: 'Ingresos por conciliación bancaria',
          status: 'active',
          postingAllowed: true,
          systemKey: 'bank_reconciliation_income',
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/bankAccounts', [
      {
        id: 'bank-account-1',
        data: {
          id: 'bank-account-1',
          status: 'active',
          chartOfAccountId: 'bank-ledger-1',
        },
      },
    ]);

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'bank_statement_adjustment.recorded__statement-line-1',
      },
      data: {
        data: () => ({
          id: 'bank_statement_adjustment.recorded__statement-line-1',
          businessId: 'business-1',
          eventType: 'bank_statement_adjustment.recorded',
          eventVersion: 1,
          sourceType: 'bankStatementLine',
          sourceId: 'statement-line-1',
          sourceDocumentId: 'statement-line-1',
          sourceDocumentType: 'bank_statement_line',
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: {
            amount: -12.5,
            functionalAmount: -12.5,
          },
          treasury: {
            bankAccountId: 'bank-account-1',
            paymentChannel: 'bank',
          },
        }),
      },
    });

    const journalEntry =
      documentSnapshots.get(
        'businesses/business-1/journalEntries/bank_statement_adjustment.recorded__statement-line-1',
      ) ?? null;

    expect(journalEntry).toMatchObject({
      id: 'bank_statement_adjustment.recorded__statement-line-1',
      eventType: 'bank_statement_adjustment.recorded',
      totals: {
        debit: 12.5,
        credit: 12.5,
      },
    });
    expect(journalEntry.lines).toEqual([
      expect.objectContaining({
        accountSystemKey: 'bank_reconciliation_expense',
        debit: 12.5,
        credit: 0,
      }),
      expect.objectContaining({
        accountSystemKey: 'bank',
        accountId: 'bank-ledger-1',
        accountCode: '1110.01',
        debit: 0,
        credit: 12.5,
      }),
    ]);
  });

  it('projects recorded and voided FX settlement losses without reclassifying the reversal as income', async () => {
    documentSnapshots.set('businesses/business-1/settings/accounting', {
      rolloutEnabled: true,
      generalAccountingEnabled: true,
      functionalCurrency: 'DOP',
    });
    collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', [
      {
        id: 'profile-fx-settlement-recorded',
        data: {
          id: 'profile-fx-settlement-recorded',
          name: 'Diferencia cambiaria liquidada',
          eventType: 'fx_settlement.recorded',
          status: 'active',
          priority: 10,
          linesTemplate: [
            {
              id: 'l1',
              side: 'debit',
              accountSystemKey: 'accounts_receivable',
              amountSource: 'fx_gain',
            },
            {
              id: 'l2',
              side: 'debit',
              accountSystemKey: 'fx_loss',
              amountSource: 'fx_loss',
            },
            {
              id: 'l3',
              side: 'credit',
              accountSystemKey: 'accounts_receivable',
              amountSource: 'fx_loss',
            },
            {
              id: 'l4',
              side: 'credit',
              accountSystemKey: 'fx_gain',
              amountSource: 'fx_gain',
            },
          ],
        },
      },
      {
        id: 'profile-fx-settlement-voided',
        data: {
          id: 'profile-fx-settlement-voided',
          name: 'Anulacion de diferencia cambiaria',
          eventType: 'fx_settlement.voided',
          status: 'active',
          priority: 10,
          linesTemplate: [
            {
              id: 'v1',
              side: 'debit',
              accountSystemKey: 'fx_gain',
              amountSource: 'fx_gain',
            },
            {
              id: 'v2',
              side: 'debit',
              accountSystemKey: 'accounts_receivable',
              amountSource: 'fx_loss',
            },
            {
              id: 'v3',
              side: 'credit',
              accountSystemKey: 'accounts_receivable',
              amountSource: 'fx_gain',
            },
            {
              id: 'v4',
              side: 'credit',
              accountSystemKey: 'fx_loss',
              amountSource: 'fx_loss',
            },
          ],
        },
      },
    ]);
    collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
      {
        id: 'accounts-receivable-1',
        data: {
          id: 'accounts-receivable-1',
          code: '1120',
          name: 'Cuentas por cobrar',
          status: 'active',
          postingAllowed: true,
          systemKey: 'accounts_receivable',
        },
      },
      {
        id: 'fx-gain-1',
        data: {
          id: 'fx-gain-1',
          code: '4200',
          name: 'Ingresos por diferencia cambiaria',
          status: 'active',
          postingAllowed: true,
          systemKey: 'fx_gain',
        },
      },
      {
        id: 'fx-loss-1',
        data: {
          id: 'fx-loss-1',
          code: '5300',
          name: 'Gastos por diferencia cambiaria',
          status: 'active',
          postingAllowed: true,
          systemKey: 'fx_loss',
        },
      },
    ]);

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'fx_settlement.recorded__payment-1_ar-1',
      },
      data: {
        data: () => ({
          id: 'fx_settlement.recorded__payment-1_ar-1',
          businessId: 'business-1',
          eventType: 'fx_settlement.recorded',
          eventVersion: 1,
          sourceType: 'accountsReceivableFxSettlement',
          sourceId: 'payment-1_ar-1',
          monetary: {
            amount: -100,
            functionalAmount: -100,
          },
        }),
      },
    });

    await projectAccountingEventToJournalEntry({
      params: {
        businessId: 'business-1',
        eventId: 'fx_settlement.voided__payment-1_ar-1',
      },
      data: {
        data: () => ({
          id: 'fx_settlement.voided__payment-1_ar-1',
          businessId: 'business-1',
          eventType: 'fx_settlement.voided',
          eventVersion: 1,
          sourceType: 'accountsReceivableFxSettlement',
          sourceId: 'payment-1_ar-1',
          monetary: {
            amount: -100,
            functionalAmount: -100,
          },
          reversalOfEventId: 'fx_settlement.recorded__payment-1_ar-1',
        }),
      },
    });

    const recordedJournalEntry = documentSnapshots.get(
      'businesses/business-1/journalEntries/fx_settlement.recorded__payment-1_ar-1',
    );
    expect(recordedJournalEntry).toMatchObject({
      eventType: 'fx_settlement.recorded',
      totals: {
        debit: 100,
        credit: 100,
      },
    });
    expect(recordedJournalEntry.lines).toEqual([
      expect.objectContaining({
        accountSystemKey: 'fx_loss',
        debit: 100,
        credit: 0,
      }),
      expect.objectContaining({
        accountSystemKey: 'accounts_receivable',
        debit: 0,
        credit: 100,
      }),
    ]);

    const voidedJournalEntry = documentSnapshots.get(
      'businesses/business-1/journalEntries/fx_settlement.voided__payment-1_ar-1',
    );
    expect(voidedJournalEntry).toMatchObject({
      eventType: 'fx_settlement.voided',
      reversalOfEventId: 'fx_settlement.recorded__payment-1_ar-1',
      totals: {
        debit: 100,
        credit: 100,
      },
    });
    expect(voidedJournalEntry.lines).toEqual([
      expect.objectContaining({
        accountSystemKey: 'accounts_receivable',
        debit: 100,
        credit: 0,
      }),
      expect.objectContaining({
        accountSystemKey: 'fx_loss',
        debit: 0,
        credit: 100,
      }),
    ]);
  });
});
