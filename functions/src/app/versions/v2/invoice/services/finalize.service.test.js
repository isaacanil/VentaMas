import { beforeEach, describe, expect, it, vi } from 'vitest';

let docMock = vi.fn();
let runTransactionMock = vi.fn();
const serverTimestampMock = vi.fn(() => ({ __op: 'serverTimestamp' }));
const arrayUnionMock = vi.fn((value) => ({ __op: 'arrayUnion', value }));
const timestampNowMock = vi.fn(() => ({ __op: 'timestampNow' }));

const auditTxMock = vi.fn();
const scheduleCompensationsInTxMock = vi.fn();
const areOnlyNonBlockingFailuresMock = vi.fn();
const buildNonBlockingFailureSummaryMock = vi.fn();
const summarizeOutboxTasksMock = vi.fn();
const buildAccountingEventMock = vi.fn();
const isAccountingRolloutEnabledForBusinessMock = vi.fn();

vi.mock('../../../../core/config/firebase.js', () => ({
  db: {
    doc: (...args) => docMock(...args),
    runTransaction: (...args) => runTransactionMock(...args),
  },
  FieldValue: {
    serverTimestamp: (...args) => serverTimestampMock(...args),
    arrayUnion: (...args) => arrayUnionMock(...args),
  },
  Timestamp: {
    now: (...args) => timestampNowMock(...args),
  },
}));

vi.mock('./audit.service.js', () => ({
  auditTx: (...args) => auditTxMock(...args),
}));

vi.mock('./compensation.service.js', () => ({
  scheduleCompensationsInTx: (...args) =>
    scheduleCompensationsInTxMock(...args),
}));

vi.mock('./failurePolicy.service.js', () => ({
  areOnlyNonBlockingFailures: (...args) =>
    areOnlyNonBlockingFailuresMock(...args),
  buildNonBlockingFailureSummary: (...args) =>
    buildNonBlockingFailureSummaryMock(...args),
  summarizeOutboxTasks: (...args) => summarizeOutboxTasksMock(...args),
}));

vi.mock('../../accounting/utils/accountingEvent.util.js', () => ({
  buildAccountingEvent: (...args) => buildAccountingEventMock(...args),
  resolveAccountingPaymentChannel: vi.fn(() => 'cash'),
  resolvePrimaryBankAccountId: vi.fn(() => null),
}));

vi.mock('../../accounting/utils/accountingRollout.util.js', () => ({
  isAccountingRolloutEnabledForBusiness: (...args) =>
    isAccountingRolloutEnabledForBusinessMock(...args),
}));

import { attemptFinalizeInvoice } from './finalize.service.js';

describe('finalize.service', () => {
  let invoiceRef;
  let idemRef;
  let usageRef;
  let canonicalInvoiceRef;
  let accountingSettingsRef;
  let accountingEventRef;
  let pendingQuery;
  let failedQuery;
  let tx;
  let invoiceSnapshot;
  let usageSnapshot;

  beforeEach(() => {
    serverTimestampMock.mockClear();
    arrayUnionMock.mockClear();
    timestampNowMock.mockClear();
    auditTxMock.mockClear();
    scheduleCompensationsInTxMock.mockClear();
    areOnlyNonBlockingFailuresMock.mockReset();
    buildNonBlockingFailureSummaryMock.mockReset();
    summarizeOutboxTasksMock.mockReset();
    buildAccountingEventMock.mockReset();
    isAccountingRolloutEnabledForBusinessMock.mockReset();

    pendingQuery = { kind: 'pending' };
    failedQuery = { kind: 'failed' };

    const outboxCol = {
      where: vi.fn((_field, _operator, status) => {
        if (status === 'pending') {
          return {
            limit: vi.fn(() => pendingQuery),
          };
        }
        if (status === 'failed') {
          return failedQuery;
        }
        throw new Error(`Unexpected outbox status query: ${status}`);
      }),
    };

    invoiceRef = {
      collection: vi.fn((name) => {
        if (name === 'outbox') return outboxCol;
        throw new Error(`Unexpected subcollection: ${name}`);
      }),
    };

    idemRef = { kind: 'idempotency' };
    usageRef = { kind: 'ncfUsage' };
    canonicalInvoiceRef = { kind: 'canonicalInvoice' };
    accountingSettingsRef = { kind: 'accountingSettings' };
    accountingEventRef = { kind: 'accountingEvent' };

    invoiceSnapshot = {
      exists: true,
      data: () => ({
        id: 'invoice-1',
        status: 'pending',
        idempotencyKey: 'idem-1',
        userId: 'user-1',
        snapshot: {
          client: { id: 'client-1' },
          monetary: {
            documentCurrency: { code: 'DOP' },
            functionalCurrency: { code: 'DOP' },
            totals: { total: 118, taxes: 18 },
            functionalTotals: { total: 118, taxes: 18 },
          },
        },
      }),
    };

    usageSnapshot = {
      exists: true,
      data: () => ({
        status: 'pending',
      }),
    };

    tx = {
      get: vi.fn(async (ref) => {
        if (ref === invoiceRef) return invoiceSnapshot;
        if (ref === pendingQuery) return { empty: true };
        if (ref === failedQuery) return { empty: true, docs: [] };
        if (ref === usageRef) return usageSnapshot;
        if (ref === accountingSettingsRef) {
          return {
            exists: true,
            data: () => ({
              generalAccountingEnabled: true,
              functionalCurrency: 'DOP',
            }),
          };
        }
        if (ref === canonicalInvoiceRef) {
          return {
            exists: true,
            data: () => ({
              data: {
                id: 'invoice-1',
                status: 'completed',
                numberID: 101,
                NCF: 'B0100000001',
                cashCountId: 'cash-1',
                client: { id: 'client-1' },
                paymentMethod: [{ method: 'cash', value: 118 }],
                monetary: {
                  documentCurrency: { code: 'DOP' },
                  functionalCurrency: { code: 'DOP' },
                  totals: { total: 118, taxes: 18 },
                  functionalTotals: { total: 118, taxes: 18 },
                },
              },
            }),
          };
        }
        throw new Error('Unexpected ref/query in tx.get');
      }),
      set: vi.fn(),
      update: vi.fn(),
    };
    buildAccountingEventMock.mockReturnValue({
      id: 'invoice.committed__invoice-1',
      eventType: 'invoice.committed',
    });
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(true);

    docMock = vi.fn((path) => {
      if (path === 'businesses/business-1/invoicesV2/invoice-1') {
        return invoiceRef;
      }
      if (path === 'businesses/business-1/invoices/invoice-1') {
        return canonicalInvoiceRef;
      }
      if (path === 'businesses/business-1/settings/accounting') {
        return accountingSettingsRef;
      }
      if (
        path ===
        'businesses/business-1/accountingEvents/invoice.committed__invoice-1'
      ) {
        return accountingEventRef;
      }
      if (path === 'businesses/business-1/idempotency/idem-1') {
        return idemRef;
      }
      if (path === 'businesses/business-1/ncfUsage/usage-1') {
        return usageRef;
      }
      throw new Error(`Unexpected doc path: ${path}`);
    });

    runTransactionMock = vi.fn(async (callback) => callback(tx));
  });

  it('records non-blocking failures without marking the invoice as failed', async () => {
    const summary = {
      taskTypes: ['attachToCashCount'],
      taskErrors: [{ type: 'attachToCashCount', lastError: 'cash count locked' }],
      requiresCashCountReview: true,
    };
    const failedDocs = [
      {
        id: 'task-1',
        data: () => ({
          type: 'attachToCashCount',
          status: 'failed',
          lastError: 'cash count locked',
        }),
      },
    ];

    tx.get.mockImplementation(async (ref) => {
      if (ref === invoiceRef) return invoiceSnapshot;
      if (ref === pendingQuery) return { empty: true };
      if (ref === failedQuery) return { empty: false, docs: failedDocs };
      throw new Error('Unexpected ref/query in tx.get');
    });

    summarizeOutboxTasksMock.mockReturnValue([
      {
        id: 'task-1',
        type: 'attachToCashCount',
        status: 'failed',
        lastError: 'cash count locked',
      },
    ]);
    areOnlyNonBlockingFailuresMock.mockReturnValue(true);
    buildNonBlockingFailureSummaryMock.mockReturnValue(summary);

    await attemptFinalizeInvoice({
      businessId: 'business-1',
      invoiceId: 'invoice-1',
    });

    expect(scheduleCompensationsInTxMock).not.toHaveBeenCalled();
    expect(auditTxMock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        event: 'finalize_non_blocking_failures',
        level: 'warn',
        data: summary,
      }),
    );
    expect(tx.set).toHaveBeenNthCalledWith(
      1,
      invoiceRef,
      expect.objectContaining({
        nonBlockingFailures: expect.objectContaining(summary),
        updatedAt: { __op: 'serverTimestamp' },
      }),
      { merge: true },
    );
    expect(tx.set).toHaveBeenNthCalledWith(
      2,
      idemRef,
      expect.objectContaining({
        status: 'pending',
        updatedAt: { __op: 'serverTimestamp' },
      }),
      { merge: true },
    );
    expect(tx.update).not.toHaveBeenCalledWith(
      invoiceRef,
      expect.objectContaining({ status: 'failed' }),
    );
  });

  it('marks the invoice as committed and consumes the reserved NCF when all outbox work is done', async () => {
    invoiceSnapshot = {
      exists: true,
      data: () => ({
        id: 'invoice-1',
        status: 'pending',
        idempotencyKey: 'idem-1',
        snapshot: {
          ncf: {
            usageId: 'usage-1',
          },
        },
      }),
    };

    await attemptFinalizeInvoice({
      businessId: 'business-1',
      invoiceId: 'invoice-1',
    });

    expect(tx.update).toHaveBeenCalledWith(
      usageRef,
      expect.objectContaining({
        status: 'used',
        invoiceId: 'invoice-1',
        usedAt: { __op: 'serverTimestamp' },
        updatedAt: { __op: 'serverTimestamp' },
      }),
    );
    expect(tx.update).toHaveBeenCalledWith(
      invoiceRef,
      expect.objectContaining({
        status: 'committed',
        committedAt: { __op: 'serverTimestamp' },
        updatedAt: { __op: 'serverTimestamp' },
      }),
    );
    expect(buildAccountingEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'business-1',
        eventType: 'invoice.committed',
        sourceId: 'invoice-1',
        sourceDocumentId: 'invoice-1',
      }),
    );
    expect(tx.set).toHaveBeenCalledWith(accountingEventRef, {
      id: 'invoice.committed__invoice-1',
      eventType: 'invoice.committed',
    });
    expect(tx.set).toHaveBeenCalledWith(
      idemRef,
      expect.objectContaining({
        status: 'committed',
        updatedAt: { __op: 'serverTimestamp' },
      }),
      { merge: true },
    );
    expect(auditTxMock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        businessId: 'business-1',
        invoiceId: 'invoice-1',
        event: 'finalize_committed',
        data: {
          committed: true,
          accountingEventCreated: true,
        },
      }),
    );
  });

  it('skips the accounting event when accounting is disabled for the business', async () => {
    isAccountingRolloutEnabledForBusinessMock.mockReturnValue(false);

    await attemptFinalizeInvoice({
      businessId: 'business-1',
      invoiceId: 'invoice-1',
    });

    expect(buildAccountingEventMock).not.toHaveBeenCalled();
    expect(tx.set).not.toHaveBeenCalledWith(
      accountingEventRef,
      expect.anything(),
    );
    expect(auditTxMock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        event: 'finalize_committed',
        data: {
          committed: true,
          accountingEventCreated: false,
        },
      }),
    );
  });
});
