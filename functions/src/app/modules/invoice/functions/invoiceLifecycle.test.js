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

vi.mock('../../../versions/v2/accounting/utils/accountingEvent.util.js', () => ({
  buildAccountingEvent: (...args) => buildAccountingEventMock(...args),
  roundAccountingAmount: (value) => Number(value || 0),
}));

vi.mock('../../../versions/v2/accounting/utils/journalEntry.util.js', () => ({
  buildJournalEntry: (...args) => buildJournalEntryMock(...args),
  normalizeJournalEntryLine: (line, index) => ({
    ...line,
    lineNumber: index + 1,
  }),
}));

vi.mock('../../../versions/v2/accounting/utils/accountingRollout.util.js', () => ({
  getPilotAccountingSettingsForBusiness: vi.fn(async () => ({})),
  isAccountingRolloutEnabledForBusiness: vi.fn(() => true),
}));

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
      id: 'invoice.voided__invoice-1',
      ...payload,
    }));
    buildJournalEntryMock.mockImplementation((payload) => ({
      id: 'invoice.voided__invoice-1',
      status: 'posted',
      ...payload,
    }));
    runTransactionMock.mockImplementation(async (callback) =>
      callback({
        get: async (ref) => {
          if (ref.kind === 'query') {
            const filter = ref.filters[0];
            return (
              querySnapshots.get(queryKey(ref.path, filter?.field, filter?.value)) ||
              querySnapshot()
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
});
