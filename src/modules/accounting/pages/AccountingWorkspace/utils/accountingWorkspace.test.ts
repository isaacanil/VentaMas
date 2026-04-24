import { describe, expect, it } from 'vitest';

import { normalizeJournalEntryRecord } from '@/utils/accounting/journalEntries';

import {
  buildGeneralLedgerSnapshot,
  buildLedgerRecords,
} from './accountingWorkspace';

const buildAccount = ({
  code,
  id,
  name,
  normalSide,
  type,
}: {
  code: string;
  id: string;
  name: string;
  normalSide: 'debit' | 'credit';
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
}) => ({
  id,
  businessId: 'business-1',
  code,
  name,
  type,
  postingAllowed: true,
  status: 'active' as const,
  normalSide,
  currencyMode: 'functional_only' as const,
});

describe('accountingWorkspace manual entry references', () => {
  it('usa la referencia escrita por el usuario en el libro diario y en la busqueda', () => {
    const journalEntry = normalizeJournalEntryRecord('entry-1', 'business-1', {
      eventType: 'manual.entry.recorded',
      status: 'posted',
      sourceId: 'entry-1',
      description: 'Compra menor de oficina',
      metadata: {
        note: 'REC-OFI-001',
      },
      lines: [
        {
          lineNumber: 1,
          accountId: 'expense-1',
          accountName: 'Gastos operativos',
          debit: 850,
          credit: 0,
          reference: 'REC-OFI-001',
        },
        {
          lineNumber: 2,
          accountId: 'cash-1',
          accountName: 'Caja general',
          debit: 0,
          credit: 850,
          reference: 'REC-OFI-001',
        },
      ],
    });

    const [record] = buildLedgerRecords({
      accounts: [],
      events: [],
      journalEntries: [journalEntry],
      postingProfiles: [],
    });

    expect(record.reference).toBe('REC-OFI-001');
    expect(record.internalReference).toBe('entry-1');
    expect(record.searchIndex).toContain('rec-ofi-001');
  });

  it('no expone el id interno como referencia visible cuando el asiento no tiene referencia manual', () => {
    const journalEntry = normalizeJournalEntryRecord('entry-2', 'business-1', {
      eventType: 'manual.entry.recorded',
      status: 'posted',
      sourceId: 'entry-2',
      description: 'Ajuste sin soporte externo',
      lines: [
        {
          lineNumber: 1,
          accountId: 'expense-1',
          accountName: 'Gastos operativos',
          debit: 120,
          credit: 0,
        },
        {
          lineNumber: 2,
          accountId: 'cash-1',
          accountName: 'Caja general',
          debit: 0,
          credit: 120,
        },
      ],
    });

    const [record] = buildLedgerRecords({
      accounts: [],
      events: [],
      journalEntries: [journalEntry],
      postingProfiles: [],
    });

    expect(record.reference).toBe('Sin referencia');
    expect(record.internalReference).toBe('entry-2');
    expect(record.searchIndex).toContain('entry-2');
  });
});

describe('accountingWorkspace automatic entry aliases', () => {
  it('genera un alias estable de asiento y conserva el id tecnico como referencia interna', () => {
    const [record] = buildLedgerRecords({
      accounts: [],
      events: [
        {
          id: 'invoice.committed__GZEWUo6_n1XbZTaszmXPn',
          businessId: 'business-1',
          eventType: 'invoice.committed',
          eventVersion: 1,
          status: 'projected',
          occurredAt: new Date('2026-04-14T12:00:00.000Z'),
          recordedAt: new Date('2026-04-14T12:00:00.000Z'),
          sourceId: 'invoice-1',
          sourceDocumentType: 'invoice',
          sourceDocumentId: 'invoice-1',
          counterpartyType: null,
          counterpartyId: null,
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: { amount: 1250 },
          treasury: {},
          payload: {
            ncfCode: 'B0100000339',
            invoiceNumber: '339',
          },
          dedupeKey: 'dedupe-1',
          idempotencyKey: 'idem-1',
          projection: { status: 'projected', journalEntryId: null },
          reversalOfEventId: null,
          createdAt: new Date('2026-04-14T12:00:00.000Z'),
          createdBy: 'ana@ventamas.do',
          metadata: {},
        },
      ],
      journalEntries: [],
      postingProfiles: [],
    });

    expect(record.entryReference).toBe(
      'AST-2026-04-INVOICE-COMMITTED-GZEWUO6-N1XBZTASZMXPN',
    );
    expect(record.reference).toBe('B0100000339');
    expect(record.documentReference).toBe('B0100000339');
    expect(record.internalReference).toBe(
      'invoice.committed__GZEWUo6_n1XbZTaszmXPn',
    );
    expect(record.searchIndex).toContain('b0100000339');
    expect(record.searchIndex).toContain(
      'ast-2026-04-invoice-committed-gzewuo6-n1xbztaszmxpn',
    );
  });

  it('prefiere el nombre resuelto del usuario cuando createdBy es un uid', () => {
    const [record] = buildLedgerRecords({
      accounts: [],
      events: [
        {
          id: 'invoice.committed__abc123',
          businessId: 'business-1',
          eventType: 'invoice.committed',
          eventVersion: 1,
          status: 'projected',
          occurredAt: new Date('2026-04-14T12:00:00.000Z'),
          recordedAt: new Date('2026-04-14T12:00:00.000Z'),
          sourceId: 'invoice-1',
          sourceDocumentType: 'invoice',
          sourceDocumentId: 'invoice-1',
          counterpartyType: null,
          counterpartyId: null,
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: { amount: 1250 },
          treasury: {},
          payload: {},
          dedupeKey: 'dedupe-1',
          idempotencyKey: 'idem-1',
          projection: { status: 'projected', journalEntryId: null },
          reversalOfEventId: null,
          createdAt: new Date('2026-04-14T12:00:00.000Z'),
          createdBy: 'BdNGtDt3y0',
          metadata: {},
        },
      ],
      journalEntries: [],
      postingProfiles: [],
      userNamesById: {
        BdNGtDt3y0: 'Jonathan Lora',
      },
    });

    expect(record.userLabel).toBe('Jonathan Lora');
  });

  it('asigna referencias AST estables derivadas del id de cada evento', () => {
    const records = buildLedgerRecords({
      accounts: [],
      events: [
        {
          id: 'invoice.committed__older',
          businessId: 'business-1',
          eventType: 'invoice.committed',
          eventVersion: 1,
          status: 'projected',
          occurredAt: new Date('2026-04-14T12:00:00.000Z'),
          recordedAt: new Date('2026-04-14T12:00:00.000Z'),
          sourceId: 'invoice-older',
          sourceDocumentType: 'invoice',
          sourceDocumentId: 'invoice-older',
          counterpartyType: null,
          counterpartyId: null,
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: { amount: 1250 },
          treasury: {},
          payload: {},
          dedupeKey: 'dedupe-older',
          idempotencyKey: 'idem-older',
          projection: { status: 'projected', journalEntryId: null },
          reversalOfEventId: null,
          createdAt: new Date('2026-04-14T12:00:00.000Z'),
          createdBy: 'ana@ventamas.do',
          metadata: {},
        },
        {
          id: 'invoice.committed__newer',
          businessId: 'business-1',
          eventType: 'invoice.committed',
          eventVersion: 1,
          status: 'projected',
          occurredAt: new Date('2026-04-15T12:00:00.000Z'),
          recordedAt: new Date('2026-04-15T12:00:00.000Z'),
          sourceId: 'invoice-newer',
          sourceDocumentType: 'invoice',
          sourceDocumentId: 'invoice-newer',
          counterpartyType: null,
          counterpartyId: null,
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: { amount: 1500 },
          treasury: {},
          payload: {},
          dedupeKey: 'dedupe-newer',
          idempotencyKey: 'idem-newer',
          projection: { status: 'projected', journalEntryId: null },
          reversalOfEventId: null,
          createdAt: new Date('2026-04-15T12:00:00.000Z'),
          createdBy: 'ana@ventamas.do',
          metadata: {},
        },
      ],
      journalEntries: [],
      postingProfiles: [],
    });

    expect(records.map((record) => record.entryReference)).toEqual([
      'AST-2026-04-INVOICE-COMMITTED-OLDER',
      'AST-2026-04-INVOICE-COMMITTED-NEWER',
    ]);
  });

  it('prefiere referencias negocio por modulo sin romper id tecnico de navegacion', () => {
    const records = buildLedgerRecords({
      accounts: [],
      events: [
        {
          id: 'purchase.committed__purchase-1',
          businessId: 'business-1',
          eventType: 'purchase.committed',
          eventVersion: 1,
          status: 'projected',
          occurredAt: new Date('2026-04-16T12:00:00.000Z'),
          recordedAt: new Date('2026-04-16T12:00:00.000Z'),
          sourceId: 'purchase-1',
          sourceDocumentType: 'purchase',
          sourceDocumentId: 'purchase-1',
          counterpartyType: null,
          counterpartyId: null,
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: { amount: 700 },
          treasury: {},
          payload: {
            vendorReference: 'B0100000044',
            invoiceNumber: 'FAC-44',
            purchaseNumber: 'PC-001',
          },
          dedupeKey: 'dedupe-purchase',
          idempotencyKey: 'idem-purchase',
          projection: { status: 'projected', journalEntryId: null },
          reversalOfEventId: null,
          createdAt: new Date('2026-04-16T12:00:00.000Z'),
          createdBy: 'ana@ventamas.do',
          metadata: {},
        },
        {
          id: 'accounts_receivable.payment.recorded__payment-1',
          businessId: 'business-1',
          eventType: 'accounts_receivable.payment.recorded',
          eventVersion: 1,
          status: 'projected',
          occurredAt: new Date('2026-04-17T12:00:00.000Z'),
          recordedAt: new Date('2026-04-17T12:00:00.000Z'),
          sourceId: 'payment-1',
          sourceDocumentType: 'accountsReceivablePayment',
          sourceDocumentId: 'payment-1',
          counterpartyType: null,
          counterpartyId: null,
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: { amount: 700 },
          treasury: {},
          payload: {
            receiptNumber: 'RCC-0001',
            reference: 'DEP-001',
          },
          dedupeKey: 'dedupe-collection',
          idempotencyKey: 'idem-collection',
          projection: { status: 'projected', journalEntryId: null },
          reversalOfEventId: null,
          createdAt: new Date('2026-04-17T12:00:00.000Z'),
          createdBy: 'ana@ventamas.do',
          metadata: {},
        },
      ],
      journalEntries: [],
      postingProfiles: [],
    });

    expect(records[1]).toMatchObject({
      reference: 'RCC-0001',
      documentReference: 'RCC-0001',
      event: expect.objectContaining({
        sourceDocumentId: 'payment-1',
      }),
    });
    expect(records[0]).toMatchObject({
      reference: 'B0100000044',
      documentReference: 'B0100000044',
      event: expect.objectContaining({
        sourceDocumentId: 'purchase-1',
      }),
    });
  });
});

describe('buildGeneralLedgerSnapshot', () => {
  it('calcula saldo inicial y saldo corrido para cuentas deudoras', () => {
    const cashAccount = buildAccount({
      id: 'cash-1',
      code: '101',
      name: 'Caja general',
      type: 'asset',
      normalSide: 'debit',
    });

    const openingEntry = normalizeJournalEntryRecord('entry-opening', 'business-1', {
      eventType: 'manual.entry.recorded',
      status: 'posted',
      sourceId: 'entry-opening',
      description: 'Saldo inicial',
      entryDate: new Date('2026-02-28T12:00:00.000Z'),
      periodKey: '2026-02',
      totals: {
        debit: 1000,
        credit: 1000,
      },
      lines: [
        {
          lineNumber: 1,
          accountId: 'cash-1',
          accountCode: '101',
          accountName: 'Caja general',
          debit: 1000,
          credit: 0,
        },
        {
          lineNumber: 2,
          accountId: 'equity-1',
          accountCode: '301',
          accountName: 'Capital',
          debit: 0,
          credit: 1000,
        },
      ],
    });
    const debitEntry = normalizeJournalEntryRecord('entry-debit', 'business-1', {
      eventType: 'manual.entry.recorded',
      status: 'posted',
      sourceId: 'entry-debit',
      description: 'Cobro del periodo',
      entryDate: new Date('2026-03-05T12:00:00.000Z'),
      periodKey: '2026-03',
      totals: {
        debit: 200,
        credit: 200,
      },
      lines: [
        {
          lineNumber: 1,
          accountId: 'cash-1',
          accountCode: '101',
          accountName: 'Caja general',
          debit: 200,
          credit: 0,
        },
        {
          lineNumber: 2,
          accountId: 'income-1',
          accountCode: '401',
          accountName: 'Ventas',
          debit: 0,
          credit: 200,
        },
      ],
    });
    const creditEntry = normalizeJournalEntryRecord('entry-credit', 'business-1', {
      eventType: 'manual.entry.recorded',
      status: 'posted',
      sourceId: 'entry-credit',
      description: 'Gasto del periodo',
      entryDate: new Date('2026-03-10T12:00:00.000Z'),
      periodKey: '2026-03',
      totals: {
        debit: 50,
        credit: 50,
      },
      lines: [
        {
          lineNumber: 1,
          accountId: 'expense-1',
          accountCode: '501',
          accountName: 'Gasto operativo',
          debit: 50,
          credit: 0,
        },
        {
          lineNumber: 2,
          accountId: 'cash-1',
          accountCode: '101',
          accountName: 'Caja general',
          debit: 0,
          credit: 50,
        },
      ],
    });

    const records = buildLedgerRecords({
      accounts: [cashAccount],
      events: [],
      journalEntries: [openingEntry, debitEntry, creditEntry],
      postingProfiles: [],
    });

    const snapshot = buildGeneralLedgerSnapshot({
      account: cashAccount,
      periodKey: '2026-03',
      records,
    });

    expect(snapshot.openingBalance).toBe(1000);
    expect(snapshot.periodDebit).toBe(200);
    expect(snapshot.periodCredit).toBe(50);
    expect(snapshot.closingBalance).toBe(1150);
    expect(snapshot.entries).toHaveLength(2);
    expect(snapshot.entries[0]?.runningBalance).toBe(1200);
    expect(snapshot.entries[1]?.runningBalance).toBe(1150);
  });

  it('respeta el saldo normal acreedor en el saldo corrido', () => {
    const payableAccount = buildAccount({
      id: 'payable-1',
      code: '201',
      name: 'Cuentas por pagar',
      type: 'liability',
      normalSide: 'credit',
    });

    const openingEntry = normalizeJournalEntryRecord('entry-opening', 'business-1', {
      eventType: 'manual.entry.recorded',
      status: 'posted',
      sourceId: 'entry-opening',
      description: 'Saldo inicial por pagar',
      entryDate: new Date('2026-02-15T12:00:00.000Z'),
      periodKey: '2026-02',
      totals: {
        debit: 300,
        credit: 300,
      },
      lines: [
        {
          lineNumber: 1,
          accountId: 'expense-1',
          accountCode: '501',
          accountName: 'Gasto operativo',
          debit: 300,
          credit: 0,
        },
        {
          lineNumber: 2,
          accountId: 'payable-1',
          accountCode: '201',
          accountName: 'Cuentas por pagar',
          debit: 0,
          credit: 300,
        },
      ],
    });
    const debitEntry = normalizeJournalEntryRecord('entry-debit', 'business-1', {
      eventType: 'manual.entry.recorded',
      status: 'posted',
      sourceId: 'entry-debit',
      description: 'Pago parcial',
      entryDate: new Date('2026-03-05T12:00:00.000Z'),
      periodKey: '2026-03',
      totals: {
        debit: 100,
        credit: 100,
      },
      lines: [
        {
          lineNumber: 1,
          accountId: 'payable-1',
          accountCode: '201',
          accountName: 'Cuentas por pagar',
          debit: 100,
          credit: 0,
        },
        {
          lineNumber: 2,
          accountId: 'cash-1',
          accountCode: '101',
          accountName: 'Caja general',
          debit: 0,
          credit: 100,
        },
      ],
    });
    const creditEntry = normalizeJournalEntryRecord('entry-credit', 'business-1', {
      eventType: 'manual.entry.recorded',
      status: 'posted',
      sourceId: 'entry-credit',
      description: 'Nueva obligacion',
      entryDate: new Date('2026-03-20T12:00:00.000Z'),
      periodKey: '2026-03',
      totals: {
        debit: 40,
        credit: 40,
      },
      lines: [
        {
          lineNumber: 1,
          accountId: 'expense-1',
          accountCode: '501',
          accountName: 'Gasto operativo',
          debit: 40,
          credit: 0,
        },
        {
          lineNumber: 2,
          accountId: 'payable-1',
          accountCode: '201',
          accountName: 'Cuentas por pagar',
          debit: 0,
          credit: 40,
        },
      ],
    });

    const records = buildLedgerRecords({
      accounts: [payableAccount],
      events: [],
      journalEntries: [openingEntry, debitEntry, creditEntry],
      postingProfiles: [],
    });

    const snapshot = buildGeneralLedgerSnapshot({
      account: payableAccount,
      periodKey: '2026-03',
      records,
    });

    expect(snapshot.openingBalance).toBe(300);
    expect(snapshot.periodDebit).toBe(100);
    expect(snapshot.periodCredit).toBe(40);
    expect(snapshot.entries[0]?.runningBalance).toBe(200);
    expect(snapshot.entries[1]?.runningBalance).toBe(240);
    expect(snapshot.closingBalance).toBe(240);
  });
});
