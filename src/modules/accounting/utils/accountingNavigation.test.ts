import { describe, expect, it } from 'vitest';

import {
  buildAccountingEntryRoute,
  findAccountingLedgerRecord,
  getAccountingEntryLocatorFromSearch,
  resolveAccountingEntryTarget,
} from './accountingNavigation';

import type { AccountingLedgerRecord } from '@/modules/accounting/pages/AccountingWorkspace/utils/accountingWorkspace';

const createRecord = (
  overrides: Partial<AccountingLedgerRecord> = {},
): AccountingLedgerRecord => ({
  id: 'record-1',
  entryDate: new Date('2026-04-05T12:00:00.000Z'),
  periodKey: '2026-04',
  sourceKind: 'automatic',
  sourceLabel: 'Automatizado',
  detailMode: 'posted',
  eventType: 'purchase.committed',
  moduleKey: 'purchases',
  moduleLabel: 'Compras',
  title: 'Compra confirmada',
  description: 'Movimiento contable',
  reference: 'PO-1',
  internalReference: null,
  amount: 100,
  statusLabel: 'Posteado',
  statusTone: 'success',
  lines: [],
  journalEntry: {
    id: 'entry-1',
    businessId: 'business-1',
    eventId: 'event-1',
    eventType: 'purchase.committed',
    eventVersion: 1,
    status: 'posted',
    sourceType: 'purchase',
    sourceId: 'purchase-1',
    reversalOfEntryId: null,
    reversalOfEventId: null,
    totals: {
      debit: 100,
      credit: 100,
    },
    lines: [],
    metadata: {},
  },
  event: {
    id: 'event-1',
    businessId: 'business-1',
    eventType: 'purchase.committed',
    eventVersion: 1,
    status: 'projected',
    sourceType: 'purchase',
    sourceId: 'purchase-1',
    sourceDocumentType: 'purchase',
    sourceDocumentId: 'purchase-1',
    payload: {},
    metadata: {},
    projection: {
      status: 'projected',
      journalEntryId: 'entry-1',
      projectorVersion: 1,
      lastAttemptAt: null,
      projectedAt: null,
      lastError: null,
    },
  },
  profile: null,
  searchIndex: 'compra purchase-1',
  ...overrides,
});

describe('accountingNavigation', () => {
  it('builds a journal-book route from source document locator', () => {
    expect(
      buildAccountingEntryRoute({
        eventType: 'purchase.committed',
        sourceDocumentId: 'purchase-1',
        sourceDocumentType: 'purchase',
      }),
    ).toBe(
      '/accounting/journal-book?accountingSourceDocumentType=purchase&accountingSourceDocumentId=purchase-1&accountingEventType=purchase.committed',
    );
  });

  it('builds a journal-book route from journal entry id', () => {
    expect(
      resolveAccountingEntryTarget({
        journalEntryId: 'entry-9',
      }),
    ).toEqual({
      kind: 'route',
      label: 'Ver asiento contable',
      locator: {
        journalEntryId: 'entry-9',
        sourceDocumentType: null,
        sourceDocumentId: null,
        eventType: null,
      },
      route: '/accounting/journal-book?accountingJournalEntryId=entry-9',
    });
  });

  it('parses accounting locator params from search', () => {
    expect(
      getAccountingEntryLocatorFromSearch(
        '?accountingSourceDocumentType=accountsReceivablePayment&accountingSourceDocumentId=payment-1&accountingEventType=accounts_receivable.payment.recorded',
      ),
    ).toEqual({
      journalEntryId: null,
      sourceDocumentType: 'accountsreceivablepayment',
      sourceDocumentId: 'payment-1',
      eventType: 'accounts_receivable.payment.recorded',
    });
  });

  it('finds a record by exact journal entry id', () => {
    const record = createRecord();

    expect(
      findAccountingLedgerRecord([record], {
        journalEntryId: 'entry-1',
      }),
    ).toBe(record);
  });

  it('finds a record by source document and event type', () => {
    const purchaseRecord = createRecord();
    const paymentRecord = createRecord({
      id: 'record-2',
      eventType: 'accounts_payable.payment.recorded',
      moduleKey: 'accounts_payable',
      moduleLabel: 'Cuentas por pagar',
      title: 'Pago a suplidor registrado',
      journalEntry: {
        ...createRecord().journalEntry!,
        id: 'entry-2',
        eventId: 'event-2',
        eventType: 'accounts_payable.payment.recorded',
        sourceType: 'accountsPayablePayment',
        sourceId: 'payment-1',
      },
      event: {
        ...createRecord().event!,
        id: 'event-2',
        eventType: 'accounts_payable.payment.recorded',
        sourceType: 'accountsPayablePayment',
        sourceId: 'payment-1',
        sourceDocumentType: 'accountsPayablePayment',
        sourceDocumentId: 'payment-1',
        projection: {
          status: 'projected',
          journalEntryId: 'entry-2',
          projectorVersion: 1,
          lastAttemptAt: null,
          projectedAt: null,
          lastError: null,
        },
      },
      searchIndex: 'pago payment-1',
    });

    expect(
      findAccountingLedgerRecord([purchaseRecord, paymentRecord], {
        eventType: 'accounts_payable.payment.recorded',
        sourceDocumentId: 'payment-1',
        sourceDocumentType: 'accountsPayablePayment',
      }),
    ).toBe(paymentRecord);
  });

  it('returns null when source locator is ambiguous', () => {
    const recorded = createRecord({
      id: 'record-1',
      journalEntry: {
        ...createRecord().journalEntry!,
        id: 'entry-1',
      },
    });
    const projected = createRecord({
      id: 'record-2',
      journalEntry: {
        ...createRecord().journalEntry!,
        id: 'entry-2',
      },
    });

    expect(
      findAccountingLedgerRecord([recorded, projected], {
        sourceDocumentId: 'purchase-1',
        sourceDocumentType: 'purchase',
      }),
    ).toBeNull();
  });
});
