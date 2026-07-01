import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  assertAccountingPeriodOpenInTransactionMock,
  assertUserAccessMock,
  auditTxMock,
  buildAccountingEventMock,
  buildJournalEntryMock,
  docSnapshots,
  MockHttpsError,
  querySnapshots,
  resolveCallableAuthUidMock,
  runTransactionMock,
  transactionDeleteMock,
  transactionSetMock,
  transactionUpdateMock,
} = vi.hoisted(() => {
  const hoistedDocSnapshots = new Map();
  const hoistedQuerySnapshots = new Map();
  const hoistedResolveCallableAuthUidMock = vi.fn();
  const hoistedAssertUserAccessMock = vi.fn();
  const hoistedAuditTxMock = vi.fn();
  const hoistedBuildAccountingEventMock = vi.fn();
  const hoistedBuildJournalEntryMock = vi.fn();
  const hoistedAssertAccountingPeriodOpenInTransactionMock = vi.fn();
  const hoistedRunTransactionMock = vi.fn();
  const hoistedTransactionSetMock = vi.fn();
  const hoistedTransactionUpdateMock = vi.fn();
  const hoistedTransactionDeleteMock = vi.fn();

  class HoistedHttpsError extends Error {
    constructor(code, message, details) {
      super(message);
      this.code = code;
      this.details = details;
    }
  }

  return {
    assertAccountingPeriodOpenInTransactionMock:
      hoistedAssertAccountingPeriodOpenInTransactionMock,
    assertUserAccessMock: hoistedAssertUserAccessMock,
    auditTxMock: hoistedAuditTxMock,
    buildAccountingEventMock: hoistedBuildAccountingEventMock,
    buildJournalEntryMock: hoistedBuildJournalEntryMock,
    docSnapshots: hoistedDocSnapshots,
    MockHttpsError: HoistedHttpsError,
    querySnapshots: hoistedQuerySnapshots,
    resolveCallableAuthUidMock: hoistedResolveCallableAuthUidMock,
    runTransactionMock: hoistedRunTransactionMock,
    transactionDeleteMock: hoistedTransactionDeleteMock,
    transactionSetMock: hoistedTransactionSetMock,
    transactionUpdateMock: hoistedTransactionUpdateMock,
  };
});

const getPathId = (path) => path.split('/').at(-1) ?? null;
const getNestedValue = (data, fieldPath) =>
  fieldPath.split('.').reduce((current, key) => current?.[key], data);

const docRef = (path) => ({ kind: 'doc', path, id: getPathId(path) });
const queryRef = (path, filters = []) => ({
  kind: 'query',
  path,
  filters,
  where(field, op, value) {
    return queryRef(path, [...filters, { field, op, value }]);
  },
  limit(value) {
    return { ...this, limitValue: value };
  },
});

const queryKey = (path, field, value) => `${path}|${field}==${value}`;

const snapshot = (path, data) => ({
  exists: data != null,
  id: getPathId(path),
  ref: docRef(path),
  data: () => data,
  get: (fieldPath) => getNestedValue(data ?? {}, fieldPath),
});

const querySnapshot = (docs = []) => ({
  empty: docs.length === 0,
  docs,
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
      return new MockTimestamp(Date.parse('2026-05-17T12:00:00.000Z'));
    }

    toMillis() {
      return this.millis;
    }
  },
  FieldValue: {
    arrayUnion: (value) => ({ __op: 'arrayUnion', value }),
    increment: (value) => ({ __op: 'increment', value }),
    serverTimestamp: () => 'server-timestamp',
  },
  db: {
    doc: (path) => docRef(path),
    collection: (path) => queryRef(path),
    runTransaction: (...args) => runTransactionMock(...args),
  },
}));

vi.mock('../../../core/utils/callableSessionAuth.util.js', () => ({
  resolveCallableAuthUid: (...args) => resolveCallableAuthUidMock(...args),
}));

vi.mock('../../../versions/v2/invoice/services/repairTasks.service.js', () => ({
  MEMBERSHIP_ROLE_GROUPS: {
    FINANCIAL_DOCUMENT_VOID: ['financial-document-void'],
    INVOICE_OPERATOR: ['invoice-operator'],
  },
  assertUserAccess: (...args) => assertUserAccessMock(...args),
}));

vi.mock('../../../versions/v2/invoice/services/audit.service.js', () => ({
  auditTx: (...args) => auditTxMock(...args),
}));

vi.mock(
  '../../../versions/v2/accounting/utils/accountingEvent.util.js',
  () => ({
    buildAccountingEvent: (...args) => buildAccountingEventMock(...args),
    roundAccountingAmount: (value) => Number(value || 0),
  }),
);

vi.mock('../../../versions/v2/accounting/utils/journalEntry.util.js', () => ({
  buildJournalEntry: (...args) => buildJournalEntryMock(...args),
  normalizeJournalEntryLine: (line, index) => ({
    ...line,
    lineNumber: index + 1,
  }),
}));

vi.mock(
  '../../../versions/v2/accounting/utils/accountingRollout.util.js',
  () => ({
    getPilotAccountingSettingsForBusiness: vi.fn(async () => ({})),
    isAccountingRolloutEnabledForBusiness: vi.fn(() => true),
  }),
);

vi.mock('../../../versions/v2/accounting/utils/periodClosure.util.js', () => ({
  assertAccountingPeriodOpenInTransaction: (...args) =>
    assertAccountingPeriodOpenInTransactionMock(...args),
}));

vi.mock('../../compliance/services/dgii608ReasonCatalog.service.js', () => ({
  DGII_608_REASON_CATALOG_VERSION: '2026-05-17',
}));

import {
  deleteDraftInvoice,
  updateInvoiceFinancialDocument,
  voidInvoiceFinancialDocument,
} from './invoiceLifecycle.js';

describe('invoiceLifecycle hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    docSnapshots.clear();
    querySnapshots.clear();

    resolveCallableAuthUidMock.mockResolvedValue('user-1');
    assertUserAccessMock.mockResolvedValue(undefined);
    assertAccountingPeriodOpenInTransactionMock.mockResolvedValue(undefined);
    buildAccountingEventMock.mockImplementation((payload) => ({
      id: `${payload.eventType}__invoice-1`,
      ...payload,
    }));
    buildJournalEntryMock.mockImplementation((payload) => ({
      id: payload.entryId,
      status: 'posted',
      ...payload,
    }));
    runTransactionMock.mockImplementation(async (callback) =>
      callback({
        get: async (ref) => {
          if (ref.kind === 'query') {
            const filter = ref.filters[0];
            return (
              querySnapshots.get(
                queryKey(ref.path, filter?.field, filter?.value),
              ) || querySnapshot()
            );
          }
          return snapshot(ref.path, docSnapshots.get(ref.path) ?? null);
        },
        set: transactionSetMock,
        update: transactionUpdateMock,
        delete: transactionDeleteMock,
      }),
    );
  });

  it('rechaza editar una factura ya emitida o posteada', async () => {
    docSnapshots.set('businesses/business-1/invoices/invoice-1', {
      data: {
        id: 'invoice-1',
        status: 'committed',
        numberID: 'F-001',
      },
    });

    await expect(
      updateInvoiceFinancialDocument({
        data: {
          businessId: 'business-1',
          invoiceId: 'invoice-1',
          invoice: { client: { name: 'Cambio' } },
        },
      }),
    ).rejects.toMatchObject({ code: 'failed-precondition' });

    expect(transactionSetMock).not.toHaveBeenCalled();
  });

  it('rechaza borrar fisicamente una factura emitida', async () => {
    docSnapshots.set('businesses/business-1/invoices/invoice-1', {
      data: {
        id: 'invoice-1',
        status: 'issued',
        NCF: 'B0100000001',
      },
    });

    await expect(
      deleteDraftInvoice({
        data: { businessId: 'business-1', invoiceId: 'invoice-1' },
      }),
    ).rejects.toMatchObject({ code: 'failed-precondition' });

    expect(transactionDeleteMock).not.toHaveBeenCalled();
  });

  it('genera evento y asiento de reverso al anular una factura posteada sin pagos', async () => {
    docSnapshots.set('businesses/business-1/invoices/invoice-1', {
      data: {
        id: 'invoice-1',
        status: 'committed',
        numberID: 'F-001',
        totalPurchase: { value: 118 },
        totalTaxes: { value: 18 },
        products: [],
      },
    });
    docSnapshots.set(
      'businesses/business-1/accountingEvents/invoice.committed__invoice-1',
      { id: 'invoice.committed__invoice-1' },
    );
    docSnapshots.set(
      'businesses/business-1/journalEntries/invoice.committed__invoice-1',
      {
        id: 'invoice.committed__invoice-1',
        eventId: 'invoice.committed__invoice-1',
        currency: 'DOP',
        functionalCurrency: 'DOP',
        totals: { debit: 118, credit: 118 },
        lines: [
          { accountId: '1101', debit: 118, credit: 0 },
          { accountId: '4101', debit: 0, credit: 118 },
        ],
      },
    );

    const result = await voidInvoiceFinancialDocument({
      data: {
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        cancellation: {
          reasonCode: '1',
          reasonLabel: 'Deterioro de factura pre-impresa',
        },
      },
    });

    expect(result).toMatchObject({
      ok: true,
      invoiceId: 'invoice-1',
      status: 'cancelled',
      reversalEntryId: 'invoice.voided__invoice-1',
    });
    expect(buildAccountingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'invoice.voided',
        reversalOfEventId: 'invoice.committed__invoice-1',
      }),
    );
    expect(buildJournalEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        reversalOfEntryId: 'invoice.committed__invoice-1',
        lines: expect.arrayContaining([
          expect.objectContaining({ accountId: '1101', debit: 0, credit: 118 }),
          expect.objectContaining({ accountId: '4101', debit: 118, credit: 0 }),
        ]),
      }),
    );
    expect(auditTxMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        event: 'invoice_voided',
      }),
    );
  });

  it('revierte COGS y restaura existencias detalladas al anular factura con inventario', async () => {
    docSnapshots.set('businesses/business-1/invoices/invoice-1', {
      data: {
        id: 'invoice-1',
        status: 'committed',
        numberID: 'F-001',
        totalPurchase: { value: 2360 },
        totalTaxes: { value: 360 },
        products: [
          { id: 'product-1', amountToBuy: 1 },
          {
            id: 'product-2',
            amountToBuy: 1,
            selectedSaleUnit: {
              id: 'box-12',
              conversionFactorToBase: 12,
            },
          },
          {
            id: 'product-3',
            amountToBuy: 1,
            weightDetail: {
              isSoldByWeight: true,
              weight: 2.5,
            },
          },
        ],
      },
    });
    docSnapshots.set(
      'businesses/business-1/accountingEvents/invoice.committed__invoice-1',
      { id: 'invoice.committed__invoice-1' },
    );
    docSnapshots.set(
      'businesses/business-1/journalEntries/invoice.committed__invoice-1',
      {
        id: 'invoice.committed__invoice-1',
        eventId: 'invoice.committed__invoice-1',
        currency: 'DOP',
        functionalCurrency: 'DOP',
        totals: { debit: 2360, credit: 2360 },
        lines: [
          { accountId: '1101', debit: 2360, credit: 0 },
          { accountId: '4101', debit: 0, credit: 2000 },
          { accountId: '2200', debit: 0, credit: 360 },
        ],
      },
    );
    docSnapshots.set(
      'businesses/business-1/accountingEvents/inventory.cogs.recorded__invoice-1',
      {
        id: 'inventory.cogs.recorded__invoice-1',
        payload: {
          lines: [
            {
              productId: 'product-1',
              productStockId: 'stock-1',
              batchId: 'batch-1',
              quantity: 1,
              unitCost: 1200,
              totalCost: 1200,
            },
            {
              productId: 'product-2',
              productStockId: 'stock-2',
              batchId: 'batch-2',
              quantity: 12,
              unitCost: 100,
              totalCost: 1200,
            },
            {
              productId: 'product-3',
              productStockId: 'stock-3',
              batchId: 'batch-3',
              quantity: 2.5,
              unitCost: 100,
              totalCost: 250,
            },
          ],
        },
      },
    );
    docSnapshots.set(
      'businesses/business-1/journalEntries/inventory.cogs.recorded__invoice-1',
      {
        id: 'inventory.cogs.recorded__invoice-1',
        eventId: 'inventory.cogs.recorded__invoice-1',
        currency: 'DOP',
        functionalCurrency: 'DOP',
        totals: { debit: 1200, credit: 1200 },
        lines: [
          {
            accountId: '5101',
            accountSystemKey: 'cost_of_goods_sold',
            debit: 1200,
            credit: 0,
          },
          {
            accountId: '1130',
            accountSystemKey: 'inventory',
            debit: 0,
            credit: 1200,
          },
        ],
      },
    );

    const result = await voidInvoiceFinancialDocument({
      data: {
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        cancellation: {
          reasonCode: '1',
          reasonLabel: 'Deterioro de factura pre-impresa',
        },
      },
    });

    expect(result).toMatchObject({
      ok: true,
      cogsReversalEntryId: 'inventory.cogs.voided__invoice-1',
    });
    expect(buildAccountingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'inventory.cogs.voided',
        reversalOfEventId: 'inventory.cogs.recorded__invoice-1',
        monetary: {
          amount: 1200,
          functionalAmount: 1200,
        },
      }),
    );
    expect(buildJournalEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entryId: 'inventory.cogs.voided__invoice-1',
        reversalOfEntryId: 'inventory.cogs.recorded__invoice-1',
        lines: expect.arrayContaining([
          expect.objectContaining({
            accountSystemKey: 'cost_of_goods_sold',
            debit: 0,
            credit: 1200,
          }),
          expect.objectContaining({
            accountSystemKey: 'inventory',
            debit: 1200,
            credit: 0,
          }),
        ]),
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/productsStock/stock-1',
      }),
      expect.objectContaining({
        quantity: { __op: 'increment', value: 1 },
        stock: { __op: 'increment', value: 1 },
        status: 'active',
      }),
      { merge: true },
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/batches/batch-1',
      }),
      expect.objectContaining({
        quantity: { __op: 'increment', value: 1 },
        status: 'active',
      }),
      { merge: true },
    );
    expect(transactionUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/products/product-1',
      }),
      expect.objectContaining({
        stock: { __op: 'increment', value: 1 },
      }),
    );
    expect(transactionUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/products/product-2',
      }),
      expect.objectContaining({
        stock: { __op: 'increment', value: 12 },
      }),
    );
    expect(transactionUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/products/product-3',
      }),
      expect.objectContaining({
        stock: { __op: 'increment', value: 2.5 },
      }),
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/productsStock/stock-2',
      }),
      expect.objectContaining({
        quantity: { __op: 'increment', value: 12 },
        stock: { __op: 'increment', value: 12 },
        status: 'active',
      }),
      { merge: true },
    );
    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/batches/batch-3',
      }),
      expect.objectContaining({
        quantity: { __op: 'increment', value: 2.5 },
        status: 'active',
      }),
      { merge: true },
    );
    expect(
      transactionUpdateMock.mock.calls.some(([, payload]) =>
        Object.prototype.hasOwnProperty.call(payload, 'product.stock'),
      ),
    ).toBe(false);
    expect(
      transactionSetMock.mock.calls.filter(
        ([ref]) => ref.path === 'businesses/business-1/productsStock/stock-1',
      ),
    ).toHaveLength(1);
    expect(
      transactionSetMock.mock.calls.filter(
        ([ref]) => ref.path === 'businesses/business-1/batches/batch-1',
      ),
    ).toHaveLength(1);
    expect(
      transactionUpdateMock.mock.calls.filter(
        ([ref]) => ref.path === 'businesses/business-1/products/product-1',
      ),
    ).toHaveLength(1);
  });

  it('bloquea anular factura con inventario fisico sin detalle COGS para restaurar stock', async () => {
    docSnapshots.set('businesses/business-1/invoices/invoice-1', {
      data: {
        id: 'invoice-1',
        status: 'committed',
        numberID: 'F-001',
        totalPurchase: { value: 118 },
        totalTaxes: { value: 18 },
        products: [
          {
            id: 'product-1',
            amountToBuy: 1,
            trackInventory: true,
            productStockId: 'stock-1',
            batchId: 'batch-1',
          },
        ],
      },
    });

    await expect(
      voidInvoiceFinancialDocument({
        data: {
          businessId: 'business-1',
          invoiceId: 'invoice-1',
          cancellation: {
            reasonCode: '1',
            reasonLabel: 'Deterioro de factura pre-impresa',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: expect.stringContaining('detalle COGS suficiente'),
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
    expect(transactionUpdateMock).not.toHaveBeenCalled();
    expect(buildAccountingEventMock).not.toHaveBeenCalled();
    expect(buildJournalEntryMock).not.toHaveBeenCalled();
    expect(auditTxMock).not.toHaveBeenCalled();
  });

  it('bloquea anular factura si COGS no trae productsStock y batch para restauracion detallada', async () => {
    docSnapshots.set('businesses/business-1/invoices/invoice-1', {
      data: {
        id: 'invoice-1',
        status: 'committed',
        numberID: 'F-001',
        totalPurchase: { value: 118 },
        totalTaxes: { value: 18 },
        products: [
          {
            id: 'product-1',
            amountToBuy: 1,
            trackInventory: true,
            productStockId: 'stock-1',
            batchId: 'batch-1',
          },
        ],
      },
    });
    docSnapshots.set(
      'businesses/business-1/accountingEvents/inventory.cogs.recorded__invoice-1',
      {
        id: 'inventory.cogs.recorded__invoice-1',
        payload: {
          lines: [
            {
              productId: 'product-1',
              quantity: 1,
              totalCost: 1200,
            },
          ],
        },
      },
    );
    docSnapshots.set(
      'businesses/business-1/journalEntries/inventory.cogs.recorded__invoice-1',
      {
        id: 'inventory.cogs.recorded__invoice-1',
        eventId: 'inventory.cogs.recorded__invoice-1',
        currency: 'DOP',
        functionalCurrency: 'DOP',
        totals: { debit: 1200, credit: 1200 },
        lines: [
          {
            accountId: '5101',
            accountSystemKey: 'cost_of_goods_sold',
            debit: 1200,
            credit: 0,
          },
          {
            accountId: '1130',
            accountSystemKey: 'inventory',
            debit: 0,
            credit: 1200,
          },
        ],
      },
    );

    await expect(
      voidInvoiceFinancialDocument({
        data: {
          businessId: 'business-1',
          invoiceId: 'invoice-1',
          cancellation: {
            reasonCode: '1',
            reasonLabel: 'Deterioro de factura pre-impresa',
          },
        },
      }),
    ).rejects.toMatchObject({
      code: 'failed-precondition',
      message: expect.stringContaining('detalle COGS suficiente'),
    });

    expect(transactionSetMock).not.toHaveBeenCalled();
    expect(transactionUpdateMock).not.toHaveBeenCalled();
    expect(buildAccountingEventMock).not.toHaveBeenCalled();
    expect(buildJournalEntryMock).not.toHaveBeenCalled();
    expect(auditTxMock).not.toHaveBeenCalled();
  });

  it('no restaura stock ni duplica COGS cuando se reintenta anular una factura ya cancelada', async () => {
    docSnapshots.set('businesses/business-1/invoices/invoice-1', {
      data: {
        id: 'invoice-1',
        status: 'cancelled',
        numberID: 'F-001',
        products: [{ id: 'product-1', amountToBuy: 1 }],
      },
    });
    docSnapshots.set(
      'businesses/business-1/journalEntries/invoice.voided__invoice-1',
      { id: 'invoice.voided__invoice-1' },
    );
    docSnapshots.set(
      'businesses/business-1/journalEntries/inventory.cogs.voided__invoice-1',
      { id: 'inventory.cogs.voided__invoice-1' },
    );

    const result = await voidInvoiceFinancialDocument({
      data: {
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        cancellation: {
          reasonCode: '1',
          reasonLabel: 'Deterioro de factura pre-impresa',
        },
      },
    });

    expect(result).toMatchObject({
      ok: true,
      reused: true,
      reversalEntryId: 'invoice.voided__invoice-1',
      status: 'cancelled',
    });
    expect(transactionUpdateMock).not.toHaveBeenCalled();
    expect(transactionSetMock).not.toHaveBeenCalled();
    expect(buildAccountingEventMock).not.toHaveBeenCalled();
    expect(buildJournalEntryMock).not.toHaveBeenCalled();
  });
});
