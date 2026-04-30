import { describe, expect, it } from 'vitest';

import { resolveAccountingOriginTarget } from './accountingOrigin';

import type { AccountingLedgerRecord } from './accountingWorkspace';

const createRecord = (
  overrides: Partial<AccountingLedgerRecord> = {},
): AccountingLedgerRecord => ({
  id: 'record-1',
  entryDate: new Date('2026-04-05T12:00:00.000Z'),
  periodKey: '2026-04',
  sourceKind: 'automatic',
  sourceLabel: 'Automatizado',
  detailMode: 'posted',
  eventType: 'invoice.committed',
  moduleKey: 'sales',
  moduleLabel: 'Ventas',
  title: 'Factura confirmada',
  description: 'Movimiento contable',
  reference: 'INV-1',
  internalReference: null,
  amount: 100,
  statusLabel: 'Posteado',
  statusTone: 'success',
  lines: [],
  journalEntry: null,
  event: {
    id: 'event-1',
    businessId: 'business-1',
    eventType: 'invoice.committed',
    eventVersion: 1,
    status: 'projected',
    sourceType: 'invoice',
    sourceId: 'invoice-1',
    sourceDocumentType: 'invoice',
    sourceDocumentId: 'invoice-1',
    payload: {},
    metadata: {},
  },
  profile: null,
  searchIndex: 'factura',
  ...overrides,
});

describe('resolveAccountingOriginTarget', () => {
  it('returns invoice preview target for invoice events', () => {
    expect(resolveAccountingOriginTarget(createRecord())).toEqual({
      kind: 'invoice-preview',
      documentId: 'invoice-1',
      label: 'Ver origen',
    });
  });

  it('uses the internal invoice id when fiscal document id is the visible NCF', () => {
    const record = createRecord({
      event: {
        id: 'event-1',
        businessId: 'business-1',
        eventType: 'invoice.committed',
        eventVersion: 1,
        status: 'projected',
        sourceType: 'invoice',
        sourceId: 'invoice-doc-1',
        sourceDocumentType: 'invoice',
        sourceDocumentId: 'B0100000144',
        payload: {},
        metadata: {},
      },
    });

    expect(resolveAccountingOriginTarget(record)).toEqual({
      kind: 'invoice-preview',
      documentId: 'invoice-doc-1',
      label: 'Ver origen',
    });
  });

  it('routes receivable payments to the related accounts receivable detail', () => {
    const record = createRecord({
      eventType: 'accounts_receivable.payment.recorded',
      moduleKey: 'accounts_receivable',
      moduleLabel: 'Cuentas por cobrar',
      event: {
        id: 'event-2',
        businessId: 'business-1',
        eventType: 'accounts_receivable.payment.recorded',
        eventVersion: 1,
        status: 'projected',
        sourceType: 'accountsReceivablePayment',
        sourceId: 'payment-1',
        sourceDocumentType: 'accountsReceivablePayment',
        sourceDocumentId: 'payment-1',
        payload: {
          arId: 'ar-1',
        },
        metadata: {},
      },
    });

    expect(resolveAccountingOriginTarget(record)).toEqual({
      kind: 'route',
      documentId: 'ar-1',
      label: 'Ver origen',
      route: '/account-receivable/list?arId=ar-1',
    });
  });

  it('returns null for manual entries without source document', () => {
    const record = createRecord({
      sourceKind: 'manual',
      detailMode: 'posted',
      eventType: 'manual.entry.recorded',
      moduleKey: 'general_ledger',
      moduleLabel: 'Libro diario',
      event: null,
      journalEntry: {
        id: 'entry-1',
        businessId: 'business-1',
        eventId: 'manual:entry-1',
        eventType: 'manual.entry.recorded',
        eventVersion: 1,
        status: 'posted',
        sourceType: null,
        sourceId: null,
        reversalOfEntryId: null,
        reversalOfEventId: null,
        totals: {
          debit: 100,
          credit: 100,
        },
        lines: [],
        metadata: {},
      },
    });

    expect(resolveAccountingOriginTarget(record)).toBeNull();
  });
});
