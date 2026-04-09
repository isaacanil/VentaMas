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

  it('splits mixed sales between cash and accounts receivable', async () => {
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
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: {
            amount: 76.7,
            taxAmount: 11.7,
            functionalAmount: 76.7,
            functionalTaxAmount: 11.7,
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
        debit: 76.7,
        credit: 76.7,
      },
    });
    expect(journalEntry.lines).toEqual([
      expect.objectContaining({
        accountSystemKey: 'cash',
        debit: 30,
        credit: 0,
      }),
      expect.objectContaining({
        accountSystemKey: 'accounts_receivable',
        debit: 46.7,
        credit: 0,
      }),
      expect.objectContaining({
        accountSystemKey: 'sales',
        debit: 0,
        credit: 65,
      }),
      expect.objectContaining({
        accountSystemKey: 'tax_payable',
        debit: 0,
        credit: 11.7,
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
});
