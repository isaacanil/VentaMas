import { describe, expect, it, vi } from 'vitest';

import {
  buildDgii606ValidationPreview,
  mapAccountsPayablePaymentDocToDgii606Record,
  mapExpenseDocToDgii606Record,
  mapPurchaseDocToDgii606Record,
  resolveMonthlyPeriodRange,
} from './dgii606MonthlyReport.service.js';

const createQueryMock = (docs) => {
  const query = {
    where: vi.fn(),
    orderBy: vi.fn(),
    get: vi.fn(async () => ({ docs })),
  };

  query.where.mockReturnValue(query);
  query.orderBy.mockReturnValue(query);

  return query;
};

const createDocSnap = (data) =>
  data
    ? {
        exists: true,
        data: () => data,
      }
    : {
        exists: false,
        data: () => null,
      };

const createFirestoreMock = ({
  docsByCollectionPath,
  docsByDocumentPath = {},
}) => {
  const queries = Object.fromEntries(
    Object.entries(docsByCollectionPath).map(([collectionPath, docs]) => [
      collectionPath,
      createQueryMock(docs),
    ]),
  );

  return {
    collection: vi.fn((collectionPath) => {
      const query = queries[collectionPath];
      if (!query) {
        throw new Error(`Unexpected collection path: ${collectionPath}`);
      }
      return query;
    }),
    doc: vi.fn((documentPath) => ({
      id: documentPath.split('/').at(-1),
      path: documentPath,
      get: vi.fn(async () => createDocSnap(docsByDocumentPath[documentPath])),
    })),
    queries,
  };
};

describe('dgii606MonthlyReport.service', () => {
  it('normaliza compra al shape del validador 606', () => {
    const result = mapPurchaseDocToDgii606Record({
      businessId: 'business-1',
      purchaseId: 'purchase-1',
      purchaseDoc: {
        id: 'purchase-1',
        numberId: 120,
        completedAt: {
          toDate: () => new Date('2026-04-05T13:20:00.000Z'),
        },
        providerId: 'supplier-1',
        provider: {
          rnc: '101010101',
        },
        documentType: 'goods',
        taxReceipt: {
          ncf: 'B01000000015',
        },
        totalAmount: 1180,
        taxBreakdown: {
          itbisTotal: 180,
        },
        classification: {
          dgii606ExpenseType: '01',
        },
        workflowStatus: 'completed',
      },
    });

    expect(result).toEqual({
      businessId: 'business-1',
      issuedAt: '2026-04-05T13:20:00.000Z',
      documentNumber: '120',
      counterparty: {
        id: 'supplier-1',
        identification: {
          number: '101010101',
        },
      },
      supplierId: 'supplier-1',
      documentType: 'goods',
      taxReceipt: {
        ncf: 'B01000000015',
      },
      totals: {
        total: 1180,
      },
      taxBreakdown: {
        itbisTotal: 180,
      },
      classification: {
        dgii606ExpenseType: '01',
      },
      status: 'completed',
      metadata: {
        recordId: 'purchase-1',
        sourcePath: 'businesses/business-1/purchases/purchase-1',
        issuedAtSource: '2026-04-05T13:20:00.000Z',
      },
    });
  });

  it('usa comprobante legado y deriva inventario para compras con productos', () => {
    const result = mapPurchaseDocToDgii606Record({
      businessId: 'business-1',
      purchaseId: 'purchase-legacy',
      purchaseDoc: {
        id: 'purchase-legacy',
        numberId: 121,
        completedAt: {
          toDate: () => new Date('2026-04-06T13:20:00.000Z'),
        },
        providerId: 'supplier-1',
        provider: {
          rnc: '101010101',
        },
        proofOfPurchase: 'B01000000016',
        totalAmount: 590,
        taxBreakdown: {
          itbisTotal: 90,
        },
        classification: {
          dgii606ExpenseType: '09',
        },
        replenishments: [{ id: 'product-1', name: 'Producto fiscal' }],
        workflowStatus: 'completed',
      },
    });

    expect(result.taxReceipt.ncf).toBe('B01000000016');
    expect(result.documentType).toBe('inventory');
  });

  it('hidrata RNC de proveedor cuando compra guarda provider como ID string', async () => {
    const { collection, doc } = createFirestoreMock({
      docsByCollectionPath: {
        'businesses/business-1/purchases': [
          {
            id: 'purchase-provider-string',
            data: () => ({
              id: 'purchase-provider-string',
              numberId: 'PUR-STRING',
              completedAt: {
                toDate: () => new Date('2026-04-05T13:20:00.000Z'),
              },
              provider: 'provider-1',
              taxReceipt: {
                ncf: 'B01000000015',
              },
              totalAmount: 1180,
              taxBreakdown: {
                itbisTotal: 180,
              },
              classification: {
                dgii606ExpenseType: '01',
              },
              workflowStatus: 'completed',
            }),
          },
        ],
        'businesses/business-1/expenses': [],
        'businesses/business-1/accountsPayablePayments': [],
      },
      docsByDocumentPath: {
        'businesses/business-1/providers/provider-1': {
          provider: {
            id: 'provider-1',
            rnc: '00100884501',
          },
        },
      },
    });

    const result = await buildDgii606ValidationPreview({
      businessId: 'business-1',
      periodKey: '2026-04',
      firestore: { collection, doc },
    });

    expect(result.sourceSnapshots.providerProfiles).toEqual({
      recordsRequested: 1,
      recordsResolved: 1,
      recordsMissing: 0,
    });
    expect(result.sourceRecords.purchases[0]).toMatchObject({
      recordId: 'purchase-provider-string',
      supplierId: 'provider-1',
      counterpartyIdentificationNumber: '00100884501',
    });
  });

  it('normaliza gasto y pago CxP a shapes auditables', () => {
    const expense = mapExpenseDocToDgii606Record({
      businessId: 'business-1',
      expenseId: 'expense-1',
      expenseDoc: {
        id: 'expense-1',
        number: 'G-001',
        expenseDate: {
          toDate: () => new Date('2026-04-08T09:00:00.000Z'),
        },
        providerId: 'supplier-9',
        provider: {
          rnc: '131313131',
        },
        amount: 400,
        taxBreakdown: {
          itbisTotal: 61.02,
        },
        expenseType: '02',
        taxReceipt: {
          ncf: 'B13000000001',
        },
        status: 'posted',
      },
    });
    const payment = mapAccountsPayablePaymentDocToDgii606Record({
      businessId: 'business-1',
      paymentId: 'payment-1',
      paymentDoc: {
        purchaseId: 'purchase-1',
        occurredAt: {
          toDate: () => new Date('2026-04-15T10:00:00.000Z'),
        },
        paymentMethods: [{ method: 'cash', amount: 40 }],
        paymentStateSnapshot: {
          paid: 40,
          balance: 60,
        },
        metadata: {
          appliedCreditNotes: [],
        },
        status: 'posted',
      },
    });

    expect(expense.documentNumber).toBe('G-001');
    expect(expense.classification.dgii606ExpenseType).toBe('02');
    expect(payment).toEqual({
      purchaseId: 'purchase-1',
      occurredAt: '2026-04-15T10:00:00.000Z',
      paymentMethods: [{ method: 'cash', amount: 40 }],
      paymentStateSnapshot: {
        paid: 40,
        balance: 60,
      },
      metadata: {
        recordId: 'payment-1',
        sourcePath: 'businesses/business-1/accountsPayablePayments/payment-1',
        appliedCreditNotes: [],
      },
      status: 'posted',
    });
  });

  it('carga compras, gastos y pagos del período; excluye void/draft y cruza pagos con compra', async () => {
    const { collection, doc, queries } = createFirestoreMock({
      docsByCollectionPath: {
        'businesses/business-1/purchases': [
          {
            id: 'purchase-1',
            data: () => ({
              id: 'purchase-1',
              numberId: 'PUR-001',
              completedAt: {
                toDate: () => new Date('2026-04-05T13:20:00.000Z'),
              },
              providerId: 'supplier-1',
              provider: {
                rnc: '101010101',
              },
              documentType: 'goods',
              taxReceipt: {
                ncf: 'B01000000015',
              },
              totalAmount: 1180,
              taxBreakdown: {
                itbisTotal: 180,
              },
              classification: {
                dgii606ExpenseType: '01',
              },
              workflowStatus: 'completed',
            }),
          },
          {
            id: 'purchase-void',
            data: () => ({
              id: 'purchase-void',
              numberId: 'PUR-002',
              completedAt: {
                toDate: () => new Date('2026-04-06T13:20:00.000Z'),
              },
              providerId: 'supplier-2',
              provider: {
                rnc: '202020202',
              },
              documentType: 'goods',
              taxReceipt: {
                ncf: 'B01000000016',
              },
              totalAmount: 500,
              taxBreakdown: {
                itbisTotal: 76.27,
              },
              classification: {
                dgii606ExpenseType: '02',
              },
              workflowStatus: 'canceled',
            }),
          },
        ],
        'businesses/business-1/expenses': [
          {
            id: 'expense-1',
            data: () => ({
              id: 'expense-1',
              number: 'EXP-001',
              expenseDate: {
                toDate: () => new Date('2026-04-10T09:00:00.000Z'),
              },
              providerId: 'supplier-3',
              provider: {
                rnc: '303030303',
              },
              amount: 400,
              taxBreakdown: {
                itbisTotal: 61.02,
              },
              expenseType: '03',
              taxReceipt: {
                ncf: 'B13000000001',
              },
              status: 'posted',
            }),
          },
        ],
        'businesses/business-1/accountsPayablePayments': [
          {
            id: 'payment-1',
            data: () => ({
              purchaseId: 'purchase-1',
              occurredAt: {
                toDate: () => new Date('2026-04-15T10:00:00.000Z'),
              },
              paymentMethods: [{ method: 'cash', amount: 40 }],
              paymentStateSnapshot: {
                paid: 40,
                balance: 60,
              },
              metadata: {
                appliedCreditNotes: [],
              },
              status: 'posted',
            }),
          },
          {
            id: 'payment-void',
            data: () => ({
              purchaseId: 'purchase-1',
              occurredAt: {
                toDate: () => new Date('2026-04-16T10:00:00.000Z'),
              },
              paymentMethods: [{ method: 'cash', amount: 20 }],
              paymentStateSnapshot: {
                paid: 60,
                balance: 40,
              },
              metadata: {
                appliedCreditNotes: [],
              },
              status: 'void',
            }),
          },
        ],
      },
      docsByDocumentPath: {
        'businesses/business-1/purchases/purchase-1': {
          id: 'purchase-1',
          numberId: 'PUR-001',
          completedAt: {
            toDate: () => new Date('2026-04-05T13:20:00.000Z'),
          },
          providerId: 'supplier-1',
          provider: {
            rnc: '101010101',
          },
          documentType: 'goods',
          taxReceipt: {
            ncf: 'B01000000015',
          },
          totalAmount: 1180,
          taxBreakdown: {
            itbisTotal: 180,
          },
          classification: {
            dgii606ExpenseType: '01',
          },
          workflowStatus: 'completed',
        },
      },
    });

    const result = await buildDgii606ValidationPreview({
      businessId: 'business-1',
      periodKey: '2026-04',
      firestore: { collection, doc },
    });

    expect(
      queries['businesses/business-1/purchases'].where,
    ).toHaveBeenCalledTimes(2);
    expect(
      queries['businesses/business-1/purchases'].orderBy,
    ).toHaveBeenCalledWith('completedAt', 'asc');
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.sourceSnapshots.purchases.recordsLoaded).toBe(1);
    expect(result.sourceSnapshots.purchases.recordsExcluded).toBe(1);
    expect(result.sourceSnapshots.accountsPayablePayments.recordsLoaded).toBe(
      1,
    );
    expect(result.sourceSnapshots.accountsPayablePayments.recordsExcluded).toBe(
      1,
    );
    expect(result.sourceSnapshots.linkedPurchases).toEqual({
      recordsRequested: 1,
      recordsResolved: 1,
      recordsMissing: 0,
    });
    expect(result.sourceRecords.excludedPurchases).toEqual([
      {
        index: 0,
        recordId: 'purchase-void',
        sourcePath: 'businesses/business-1/purchases/purchase-void',
        documentNumber: 'PUR-002',
        documentFiscalNumber: 'B01000000016',
        purchaseId: null,
        supplierId: 'supplier-2',
        counterpartyIdentificationNumber: '202020202',
        documentType: 'goods',
        expenseType: '02',
        total: 500,
        itbisTotal: 76.27,
        issuedAt: '2026-04-06T13:20:00.000Z',
        status: 'canceled',
      },
    ]);
    expect(result.sourceRecords.excludedAccountsPayablePayments).toEqual([
      {
        index: 0,
        recordId: 'payment-void',
        sourcePath:
          'businesses/business-1/accountsPayablePayments/payment-void',
        documentNumber: null,
        documentFiscalNumber: null,
        purchaseId: 'purchase-1',
        supplierId: null,
        counterpartyIdentificationNumber: null,
        documentType: null,
        expenseType: null,
        total: null,
        itbisTotal: null,
        issuedAt: '2026-04-16T10:00:00.000Z',
        status: 'void',
      },
    ]);
  });

  it('marca pagos con compra ligada fuera de período o faltante', async () => {
    const { collection, doc } = createFirestoreMock({
      docsByCollectionPath: {
        'businesses/business-1/purchases': [],
        'businesses/business-1/expenses': [],
        'businesses/business-1/accountsPayablePayments': [
          {
            id: 'payment-1',
            data: () => ({
              purchaseId: 'purchase-prev',
              occurredAt: {
                toDate: () => new Date('2026-04-15T10:00:00.000Z'),
              },
              paymentMethods: [{ method: 'cash', amount: 40 }],
              paymentStateSnapshot: {
                paid: 40,
                balance: 60,
              },
              metadata: {
                appliedCreditNotes: [],
              },
              status: 'posted',
            }),
          },
        ],
      },
      docsByDocumentPath: {
        'businesses/business-1/purchases/purchase-prev': {
          id: 'purchase-prev',
          numberId: 'PUR-090',
          completedAt: {
            toDate: () => new Date('2026-03-28T12:00:00.000Z'),
          },
          providerId: 'supplier-1',
          provider: {
            rnc: '101010101',
          },
          documentType: 'goods',
          taxReceipt: {
            ncf: 'B01000000990',
          },
          totalAmount: 1180,
          taxBreakdown: {
            itbisTotal: 180,
          },
          classification: {
            dgii606ExpenseType: '01',
          },
          workflowStatus: 'completed',
        },
      },
    });

    const result = await buildDgii606ValidationPreview({
      businessId: 'business-1',
      periodKey: '2026-04',
      firestore: { collection, doc },
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual([
      {
        sourceId: 'accountsPayablePayments',
        index: 0,
        fieldPath: 'purchaseId',
        code: 'linked-purchase-out-of-period',
        severity: 'warning',
        linkedRecordId: 'purchase-prev',
        linkedSourcePath: 'businesses/business-1/purchases/purchase-prev',
        linkedPeriodKey: '2026-03',
        recordId: 'payment-1',
        sourcePath: 'businesses/business-1/accountsPayablePayments/payment-1',
        documentNumber: null,
        documentFiscalNumber: null,
      },
    ]);
  });

  it('rechaza períodos inválidos antes de consultar Firestore', async () => {
    await expect(
      buildDgii606ValidationPreview({
        businessId: 'business-1',
        periodKey: '2026-13',
        firestore: createFirestoreMock({
          docsByCollectionPath: {
            'businesses/business-1/purchases': [],
            'businesses/business-1/expenses': [],
            'businesses/business-1/accountsPayablePayments': [],
          },
        }),
      }),
    ).rejects.toThrow('Período mensual inválido: 2026-13');
  });

  it('resuelve el rango mensual con límite superior exclusivo', () => {
    expect(resolveMonthlyPeriodRange('2026-04')).toEqual({
      periodKey: '2026-04',
      start: new Date('2026-04-01T00:00:00.000Z'),
      endExclusive: new Date('2026-05-01T00:00:00.000Z'),
    });
  });
});
