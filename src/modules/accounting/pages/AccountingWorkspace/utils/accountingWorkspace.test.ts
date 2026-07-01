import { describe, expect, it } from 'vitest';

import { normalizeJournalEntryRecord } from '@/utils/accounting/journalEntries';

import {
  buildGeneralLedgerAccountOptions,
  buildGeneralLedgerSnapshot,
  buildLedgerRecords,
} from './accountingWorkspace';

const buildAccount = ({
  code,
  id,
  name,
  normalSide,
  parentId,
  type,
}: {
  code: string;
  id: string;
  name: string;
  normalSide: 'debit' | 'credit';
  parentId?: string | null;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
}) => ({
  id,
  businessId: 'business-1',
  code,
  name,
  parentId: parentId ?? null,
  type,
  postingAllowed: true,
  status: 'active' as const,
  normalSide,
  currencyMode: 'functional_only' as const,
});

describe('buildGeneralLedgerAccountOptions', () => {
  it('solo ofrece cuentas detalle en los selectores de mayor', () => {
    const options = buildGeneralLedgerAccountOptions({
      accounts: [
        buildAccount({
          id: 'cash-root',
          code: '1100',
          name: 'Caja',
          normalSide: 'debit',
          type: 'asset',
        }),
        buildAccount({
          id: 'cash-detail',
          code: '1101',
          name: 'Caja principal',
          normalSide: 'debit',
          parentId: 'cash-root',
          type: 'asset',
        }),
      ],
      records: [],
    });

    expect(options.map((account) => account.id)).toEqual(['cash-detail']);
  });
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

describe('accountingWorkspace journal book order', () => {
  it('ordena los asientos cronologicamente aunque lleguen desordenados', () => {
    const buildEntry = (id: string, entryDate: Date) =>
      normalizeJournalEntryRecord(id, 'business-1', {
        eventType: 'manual.entry.recorded',
        status: 'posted',
        sourceId: id,
        description: `Asiento ${id}`,
        entryDate,
        periodKey: entryDate.toISOString().slice(0, 7),
        totals: {
          debit: 100,
          credit: 100,
        },
        lines: [
          {
            lineNumber: 1,
            accountId: 'cash-1',
            accountCode: '101',
            accountName: 'Caja general',
            debit: 100,
            credit: 0,
          },
          {
            lineNumber: 2,
            accountId: 'income-1',
            accountCode: '401',
            accountName: 'Ventas',
            debit: 0,
            credit: 100,
          },
        ],
      });

    const records = buildLedgerRecords({
      accounts: [],
      events: [],
      journalEntries: [
        buildEntry('entry-17', new Date('2026-06-17T12:00:00.000Z')),
        buildEntry('entry-16-b', new Date('2026-06-16T15:00:00.000Z')),
        buildEntry('entry-16-a', new Date('2026-06-16T09:00:00.000Z')),
      ],
      postingProfiles: [],
    });

    expect(records.map((record) => record.journalEntry?.id)).toEqual([
      'entry-16-a',
      'entry-16-b',
      'entry-17',
    ]);
  });

  it('ordena empates de fecha por folio visible, no por hora oculta', () => {
    const buildEntry = (id: string, reference: string, entryDate: Date) =>
      normalizeJournalEntryRecord(id, 'business-1', {
        eventType: 'manual.entry.recorded',
        status: 'posted',
        sourceId: id,
        description: `Asiento ${id}`,
        entryDate,
        periodKey: '2026-06',
        metadata: {
          note: reference,
        },
        totals: {
          debit: 100,
          credit: 100,
        },
        lines: [
          {
            lineNumber: 1,
            accountId: 'cash-1',
            accountCode: '101',
            accountName: 'Caja general',
            debit: 100,
            credit: 0,
          },
          {
            lineNumber: 2,
            accountId: 'income-1',
            accountCode: '401',
            accountName: 'Ventas',
            debit: 0,
            credit: 100,
          },
        ],
      });

    const records = buildLedgerRecords({
      accounts: [],
      events: [],
      journalEntries: [
        buildEntry('entry-10', 'REC-10', new Date('2026-06-16T09:00:00.000Z')),
        buildEntry('entry-2', 'REC-2', new Date('2026-06-16T15:00:00.000Z')),
      ],
      postingProfiles: [],
    });

    expect(records.map((record) => record.journalEntry?.id)).toEqual([
      'entry-2',
      'entry-10',
    ]);
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

describe('accountingWorkspace projected profile lines', () => {
  it('previsualiza venta mixta separando caja, banco y saldo por cobrar', () => {
    const cashAccount = buildAccount({
      id: 'cash-1',
      code: '101',
      name: 'Caja general',
      type: 'asset',
      normalSide: 'debit',
    });
    const bankAccount = buildAccount({
      id: 'bank-1',
      code: '102',
      name: 'Banco principal',
      type: 'asset',
      normalSide: 'debit',
    });
    const receivableAccount = buildAccount({
      id: 'ar-1',
      code: '103',
      name: 'Cuentas por cobrar',
      type: 'asset',
      normalSide: 'debit',
    });
    const salesAccount = buildAccount({
      id: 'sales-1',
      code: '401',
      name: 'Ventas',
      type: 'income',
      normalSide: 'credit',
    });

    const [record] = buildLedgerRecords({
      accounts: [cashAccount, bankAccount, receivableAccount, salesAccount],
      events: [
        {
          id: 'invoice.committed__invoice-mixed-1',
          businessId: 'business-1',
          eventType: 'invoice.committed',
          eventVersion: 1,
          status: 'recorded',
          occurredAt: new Date('2026-04-18T12:00:00.000Z'),
          recordedAt: new Date('2026-04-18T12:00:00.000Z'),
          sourceId: 'invoice-mixed-1',
          sourceDocumentType: 'invoice',
          sourceDocumentId: 'invoice-mixed-1',
          counterpartyType: 'customer',
          counterpartyId: 'customer-1',
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: { amount: 1000, functionalAmount: 1000 },
          treasury: { paymentChannel: 'other' },
          payload: {
            paymentTerm: 'cash',
            paymentMethods: [
              { method: 'cash', value: 200 },
              { method: 'card', value: 300 },
            ],
          },
          dedupeKey: 'dedupe-mixed-sale',
          idempotencyKey: 'idem-mixed-sale',
          projection: { status: 'pending', journalEntryId: null },
          reversalOfEventId: null,
          createdAt: new Date('2026-04-18T12:00:00.000Z'),
          createdBy: 'ana@ventamas.do',
          metadata: {},
        },
      ],
      journalEntries: [],
      postingProfiles: [
        {
          id: 'profile-mixed-sale',
          businessId: 'business-1',
          name: 'Venta mixta',
          eventType: 'invoice.committed',
          moduleKey: 'sales',
          status: 'active',
          priority: 1,
          conditions: {
            paymentTerm: 'cash',
            settlementKind: 'other',
          },
          linesTemplate: [
            {
              id: 'debit-cash',
              side: 'debit',
              accountId: 'cash-1',
              accountCode: '101',
              accountName: 'Caja general',
              amountSource: 'sale_cash_received',
              omitIfZero: true,
            },
            {
              id: 'debit-bank',
              side: 'debit',
              accountId: 'bank-1',
              accountCode: '102',
              accountName: 'Banco principal',
              amountSource: 'sale_bank_received',
              omitIfZero: true,
            },
            {
              id: 'debit-ar',
              side: 'debit',
              accountId: 'ar-1',
              accountCode: '103',
              accountName: 'Cuentas por cobrar',
              amountSource: 'sale_receivable_balance',
              omitIfZero: true,
            },
            {
              id: 'credit-sales',
              side: 'credit',
              accountId: 'sales-1',
              accountCode: '401',
              accountName: 'Ventas',
              amountSource: 'document_total',
              omitIfZero: true,
            },
          ],
        },
      ],
    });

    expect(record.detailMode).toBe('projected');
    expect(record.lines).toEqual([
      expect.objectContaining({
        accountId: 'cash-1',
        debit: 200,
        credit: 0,
        amountSource: 'sale_cash_received',
      }),
      expect.objectContaining({
        accountId: 'bank-1',
        debit: 300,
        credit: 0,
        amountSource: 'sale_bank_received',
      }),
      expect.objectContaining({
        accountId: 'ar-1',
        debit: 500,
        credit: 0,
        amountSource: 'sale_receivable_balance',
      }),
      expect.objectContaining({
        accountId: 'sales-1',
        debit: 0,
        credit: 1000,
        amountSource: 'document_total',
      }),
    ]);
  });

  it('previsualiza ventas bancarias separadas por cuenta bancaria enlazada', () => {
    const bankRootAccount = {
      ...buildAccount({
        id: 'bank-root',
        code: '1110',
        name: 'Cuentas bancarias',
        type: 'asset',
        normalSide: 'debit',
      }),
      systemKey: 'bank',
    };
    const popularLedgerAccount = buildAccount({
      id: 'bank-popular-ledger',
      code: '1110.01',
      name: 'Banco Popular Corriente 1234',
      type: 'asset',
      normalSide: 'debit',
    });
    const bhdLedgerAccount = buildAccount({
      id: 'bank-bhd-ledger',
      code: '1110.02',
      name: 'Banco BHD Corriente 5678',
      type: 'asset',
      normalSide: 'debit',
    });
    const salesAccount = {
      ...buildAccount({
        id: 'sales-1',
        code: '401',
        name: 'Ventas',
        type: 'income',
        normalSide: 'credit',
      }),
      systemKey: 'sales',
    };

    const [record] = buildLedgerRecords({
      accounts: [
        bankRootAccount,
        popularLedgerAccount,
        bhdLedgerAccount,
        salesAccount,
      ],
      bankAccounts: [
        {
          id: 'bank-popular',
          businessId: 'business-1',
          name: 'Popular',
          currency: 'DOP',
          status: 'active',
          chartOfAccountId: 'bank-popular-ledger',
        },
        {
          id: 'bank-bhd',
          businessId: 'business-1',
          name: 'BHD',
          currency: 'DOP',
          status: 'active',
          chartOfAccountId: 'bank-bhd-ledger',
        },
      ] as any,
      events: [
        {
          id: 'invoice.committed__invoice-bank-split-1',
          businessId: 'business-1',
          eventType: 'invoice.committed',
          eventVersion: 1,
          status: 'recorded',
          occurredAt: new Date('2026-04-18T12:00:00.000Z'),
          recordedAt: new Date('2026-04-18T12:00:00.000Z'),
          sourceId: 'invoice-bank-split-1',
          sourceDocumentType: 'invoice',
          sourceDocumentId: 'invoice-bank-split-1',
          counterpartyType: 'customer',
          counterpartyId: 'customer-1',
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: { amount: 1000, functionalAmount: 1000 },
          treasury: { paymentChannel: 'bank' },
          payload: {
            paymentTerm: 'cash',
            paymentMethods: [
              { method: 'card', value: 400, bankAccountId: 'bank-popular' },
              { method: 'transfer', value: 600, bankAccountId: 'bank-bhd' },
            ],
          },
          dedupeKey: 'dedupe-bank-split-sale',
          idempotencyKey: 'idem-bank-split-sale',
          projection: { status: 'pending', journalEntryId: null },
          reversalOfEventId: null,
          createdAt: new Date('2026-04-18T12:00:00.000Z'),
          createdBy: 'ana@ventamas.do',
          metadata: {},
        },
      ],
      journalEntries: [],
      postingProfiles: [
        {
          id: 'profile-bank-sale',
          businessId: 'business-1',
          name: 'Venta bancaria',
          eventType: 'invoice.committed',
          moduleKey: 'sales',
          status: 'active',
          priority: 1,
          conditions: {
            paymentTerm: 'cash',
            settlementKind: 'bank',
          },
          linesTemplate: [
            {
              id: 'debit-bank',
              side: 'debit',
              accountId: 'bank-root',
              accountCode: '1110',
              accountName: 'Cuentas bancarias',
              accountSystemKey: 'bank',
              amountSource: 'sale_bank_received',
              omitIfZero: true,
            },
            {
              id: 'credit-sales',
              side: 'credit',
              accountSystemKey: 'sales',
              amountSource: 'net_sales',
              omitIfZero: true,
            },
          ],
        },
      ],
    });

    expect(record.lines).toEqual([
      expect.objectContaining({
        accountId: 'bank-popular-ledger',
        accountCode: '1110.01',
        debit: 400,
        credit: 0,
      }),
      expect.objectContaining({
        accountId: 'bank-bhd-ledger',
        accountCode: '1110.02',
        debit: 600,
        credit: 0,
      }),
      expect.objectContaining({
        accountId: 'sales-1',
        debit: 0,
        credit: 1000,
      }),
    ]);
  });

  it('previsualiza pagos CxP con retenciones fiscales como liquidacion no bancaria', () => {
    const payableAccount = {
      ...buildAccount({
        id: 'payable-1',
        code: '2100',
        name: 'Cuentas por pagar',
        type: 'liability',
        normalSide: 'credit',
      }),
      systemKey: 'accounts_payable',
    };
    const bankAccount = {
      ...buildAccount({
        id: 'bank-1',
        code: '1110',
        name: 'Banco principal',
        type: 'asset',
        normalSide: 'debit',
      }),
      systemKey: 'bank',
    };
    const itbisWithholdingAccount = {
      ...buildAccount({
        id: 'withholding-itbis-1',
        code: '2301',
        name: 'Retenciones ITBIS por pagar',
        type: 'liability',
        normalSide: 'credit',
      }),
      systemKey: 'withholding_itbis_payable',
    };
    const isrWithholdingAccount = {
      ...buildAccount({
        id: 'withholding-isr-1',
        code: '2302',
        name: 'Retenciones ISR por pagar',
        type: 'liability',
        normalSide: 'credit',
      }),
      systemKey: 'withholding_isr_payable',
    };

    const [record] = buildLedgerRecords({
      accounts: [
        payableAccount,
        bankAccount,
        itbisWithholdingAccount,
        isrWithholdingAccount,
      ],
      events: [
        {
          id: 'accounts_payable.payment.recorded__payment-1',
          businessId: 'business-1',
          eventType: 'accounts_payable.payment.recorded',
          eventVersion: 1,
          status: 'recorded',
          occurredAt: new Date('2026-04-18T12:00:00.000Z'),
          recordedAt: new Date('2026-04-18T12:00:00.000Z'),
          sourceId: 'payment-1',
          sourceDocumentType: 'accounts_payable_payment',
          sourceDocumentId: 'payment-1',
          counterpartyType: 'supplier',
          counterpartyId: 'supplier-1',
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: { amount: 1106, functionalAmount: 1106 },
          treasury: { paymentChannel: 'bank' },
          payload: {
            settlementAmount: 1180,
            paymentMethods: [{ method: 'transfer', value: 1106 }],
            withholdingApplications: [
              { type: 'itbis', amount: 54 },
              { type: 'isr', amount: 20 },
            ],
          },
          dedupeKey: 'dedupe-ap-payment',
          idempotencyKey: 'idem-ap-payment',
          projection: { status: 'pending', journalEntryId: null },
          reversalOfEventId: null,
          createdAt: new Date('2026-04-18T12:00:00.000Z'),
          createdBy: 'ana@ventamas.do',
          metadata: {},
        },
      ],
      journalEntries: [],
      postingProfiles: [
        {
          id: 'profile-ap-payment-bank',
          businessId: 'business-1',
          name: 'Pago CxP bancario',
          eventType: 'accounts_payable.payment.recorded',
          moduleKey: 'purchases',
          status: 'active',
          priority: 1,
          conditions: {
            settlementKind: 'bank',
          },
          linesTemplate: [
            {
              id: 'debit-payable',
              side: 'debit',
              accountSystemKey: 'accounts_payable',
              amountSource: 'accounts_payable_payment_amount',
              omitIfZero: true,
            },
            {
              id: 'credit-bank',
              side: 'credit',
              accountSystemKey: 'bank',
              amountSource: 'accounts_payable_bank_paid',
              omitIfZero: true,
            },
            {
              id: 'credit-withholding-itbis',
              side: 'credit',
              accountSystemKey: 'withholding_itbis_payable',
              amountSource: 'accounts_payable_withholding_itbis',
              omitIfZero: true,
            },
            {
              id: 'credit-withholding-isr',
              side: 'credit',
              accountSystemKey: 'withholding_isr_payable',
              amountSource: 'accounts_payable_withholding_isr',
              omitIfZero: true,
            },
          ],
        },
      ],
    });

    expect(record.detailMode).toBe('projected');
    expect(record.lines.reduce((total, line) => total + line.debit, 0)).toBe(
      1180,
    );
    expect(record.lines.reduce((total, line) => total + line.credit, 0)).toBe(
      1180,
    );
    expect(record.lines).toEqual([
      expect.objectContaining({
        accountId: 'payable-1',
        debit: 1180,
        credit: 0,
        amountSource: 'accounts_payable_payment_amount',
      }),
      expect.objectContaining({
        accountId: 'bank-1',
        debit: 0,
        credit: 1106,
        amountSource: 'accounts_payable_bank_paid',
      }),
      expect.objectContaining({
        accountId: 'withholding-itbis-1',
        debit: 0,
        credit: 54,
        amountSource: 'accounts_payable_withholding_itbis',
      }),
      expect.objectContaining({
        accountId: 'withholding-isr-1',
        debit: 0,
        credit: 20,
        amountSource: 'accounts_payable_withholding_isr',
      }),
    ]);
  });

  it('respeta condiciones de naturaleza documental en perfiles proyectados', () => {
    const inventoryAccount = buildAccount({
      id: 'inventory-1',
      code: '130',
      name: 'Inventario',
      type: 'asset',
      normalSide: 'debit',
    });
    const payableAccount = buildAccount({
      id: 'payable-1',
      code: '201',
      name: 'Cuentas por pagar',
      type: 'liability',
      normalSide: 'credit',
    });

    const [record] = buildLedgerRecords({
      accounts: [inventoryAccount, payableAccount],
      events: [
        {
          id: 'purchase.committed__purchase-inventory-1',
          businessId: 'business-1',
          eventType: 'purchase.committed',
          eventVersion: 1,
          status: 'recorded',
          occurredAt: new Date('2026-04-18T12:00:00.000Z'),
          recordedAt: new Date('2026-04-18T12:00:00.000Z'),
          sourceId: 'purchase-inventory-1',
          sourceDocumentType: 'purchase',
          sourceDocumentId: 'purchase-inventory-1',
          counterpartyType: 'supplier',
          counterpartyId: 'supplier-1',
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: { amount: 850, functionalAmount: 850 },
          treasury: {},
          payload: {
            documentNature: 'inventory',
          },
          dedupeKey: 'dedupe-inventory-purchase',
          idempotencyKey: 'idem-inventory-purchase',
          projection: { status: 'pending', journalEntryId: null },
          reversalOfEventId: null,
          createdAt: new Date('2026-04-18T12:00:00.000Z'),
          createdBy: 'ana@ventamas.do',
          metadata: {},
        },
      ],
      journalEntries: [],
      postingProfiles: [
        {
          id: 'profile-expense-purchase',
          businessId: 'business-1',
          name: 'Compra de gasto',
          eventType: 'purchase.committed',
          moduleKey: 'purchases',
          status: 'active',
          priority: 1,
          conditions: {
            documentNature: 'expense',
          },
          linesTemplate: [
            {
              id: 'debit-expense',
              side: 'debit',
              accountId: 'inventory-1',
              amountSource: 'purchase_total',
              omitIfZero: true,
            },
            {
              id: 'credit-payable-expense',
              side: 'credit',
              accountId: 'payable-1',
              amountSource: 'purchase_total',
              omitIfZero: true,
            },
          ],
        },
        {
          id: 'profile-inventory-purchase',
          businessId: 'business-1',
          name: 'Compra de inventario',
          eventType: 'purchase.committed',
          moduleKey: 'purchases',
          status: 'active',
          priority: 2,
          conditions: {
            documentNature: 'inventory',
          },
          linesTemplate: [
            {
              id: 'debit-inventory',
              side: 'debit',
              accountId: 'inventory-1',
              amountSource: 'purchase_total',
              omitIfZero: true,
            },
            {
              id: 'credit-payable-inventory',
              side: 'credit',
              accountId: 'payable-1',
              amountSource: 'purchase_total',
              omitIfZero: true,
            },
          ],
        },
      ],
    });

    expect(record.profile?.id).toBe('profile-inventory-purchase');
    expect(record.lines).toEqual([
      expect.objectContaining({
        accountId: 'inventory-1',
        debit: 850,
        credit: 0,
      }),
      expect.objectContaining({
        accountId: 'payable-1',
        debit: 0,
        credit: 850,
      }),
    ]);
  });

  it('previsualiza ajustes bancarios negativos contra gasto de conciliacion y banco', () => {
    const bankRootAccount = {
      ...buildAccount({
        id: 'bank-root',
        code: '1110',
        name: 'Cuentas bancarias',
        type: 'asset',
        normalSide: 'debit',
      }),
      systemKey: 'bank',
    };
    const bankLedgerAccount = buildAccount({
      id: 'bank-ledger-1',
      code: '1110.01',
      name: 'Banco Popular Corriente 1234',
      type: 'asset',
      normalSide: 'debit',
    });
    const reconciliationExpense = buildAccount({
      id: 'expense-1',
      code: '5260',
      name: 'Gastos por conciliacion bancaria',
      type: 'expense',
      normalSide: 'debit',
    });

    const [record] = buildLedgerRecords({
      accounts: [bankRootAccount, bankLedgerAccount, reconciliationExpense],
      bankAccounts: [
        {
          id: 'bank-account-1',
          businessId: 'business-1',
          name: 'Cuenta operativa',
          currency: 'DOP',
          status: 'active',
          chartOfAccountId: 'bank-ledger-1',
        },
      ] as any,
      events: [
        {
          id: 'bank_statement_adjustment.recorded__statement-line-1',
          businessId: 'business-1',
          eventType: 'bank_statement_adjustment.recorded',
          eventVersion: 1,
          status: 'recorded',
          occurredAt: new Date('2026-04-18T12:00:00.000Z'),
          recordedAt: new Date('2026-04-18T12:00:00.000Z'),
          sourceId: 'statement-line-1',
          sourceDocumentType: 'bank_statement_line',
          sourceDocumentId: 'statement-line-1',
          counterpartyType: null,
          counterpartyId: null,
          currency: 'DOP',
          functionalCurrency: 'DOP',
          monetary: { amount: -12.5, functionalAmount: -12.5 },
          treasury: { bankAccountId: 'bank-account-1', paymentChannel: 'bank' },
          payload: {},
          dedupeKey: 'dedupe-bank-adjustment',
          idempotencyKey: 'idem-bank-adjustment',
          projection: { status: 'pending', journalEntryId: null },
          reversalOfEventId: null,
          createdAt: new Date('2026-04-18T12:00:00.000Z'),
          createdBy: 'ana@ventamas.do',
          metadata: {},
        },
      ],
      journalEntries: [],
      postingProfiles: [
        {
          id: 'profile-bank-adjustment',
          businessId: 'business-1',
          name: 'Ajuste por diferencia bancaria',
          eventType: 'bank_statement_adjustment.recorded',
          moduleKey: 'banking',
          status: 'active',
          priority: 1,
          linesTemplate: [
            {
              id: 'debit-loss',
              side: 'debit',
              accountId: 'expense-1',
              accountCode: '5260',
              accountName: 'Gastos por conciliacion bancaria',
              accountSystemKey: 'bank_reconciliation_expense',
              amountSource: 'bank_statement_adjustment_loss',
              omitIfZero: true,
            },
            {
              id: 'credit-bank',
              side: 'credit',
              accountId: 'bank-root',
              accountCode: '1110',
              accountName: 'Cuentas bancarias',
              accountSystemKey: 'bank',
              amountSource: 'bank_statement_adjustment_loss',
              omitIfZero: true,
            },
          ],
        },
      ],
    });

    expect(record.detailMode).toBe('projected');
    expect(record.lines).toEqual([
      expect.objectContaining({
        accountId: 'expense-1',
        debit: 12.5,
        credit: 0,
        amountSource: 'bank_statement_adjustment_loss',
      }),
      expect.objectContaining({
        accountId: 'bank-ledger-1',
        accountCode: '1110.01',
        debit: 0,
        credit: 12.5,
        amountSource: 'bank_statement_adjustment_loss',
      }),
    ]);
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

    const openingEntry = normalizeJournalEntryRecord(
      'entry-opening',
      'business-1',
      {
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
      },
    );
    const debitEntry = normalizeJournalEntryRecord(
      'entry-debit',
      'business-1',
      {
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
      },
    );
    const creditEntry = normalizeJournalEntryRecord(
      'entry-credit',
      'business-1',
      {
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
      },
    );

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

    const openingEntry = normalizeJournalEntryRecord(
      'entry-opening',
      'business-1',
      {
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
      },
    );
    const debitEntry = normalizeJournalEntryRecord(
      'entry-debit',
      'business-1',
      {
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
      },
    );
    const creditEntry = normalizeJournalEntryRecord(
      'entry-credit',
      'business-1',
      {
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
      },
    );

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
