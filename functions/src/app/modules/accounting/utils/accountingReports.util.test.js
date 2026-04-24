import { describe, expect, it } from 'vitest';

import {
  buildAvailablePeriods,
  buildFinancialReports,
  buildGeneralLedgerAccountOptions,
  buildGeneralLedgerSnapshot,
  buildPostedLedgerRecords,
} from './accountingReports.util.js';

describe('accountingReports.util', () => {
  const accounts = [
    {
      id: 'cash',
      code: '1.1.01',
      name: 'Caja',
      type: 'asset',
      normalSide: 'debit',
      status: 'active',
      postingAllowed: true,
    },
    {
      id: 'sales',
      code: '4.1.01',
      name: 'Ventas',
      type: 'income',
      normalSide: 'credit',
      status: 'active',
      postingAllowed: true,
    },
  ];

  const records = buildPostedLedgerRecords({
    journalEntries: [
      {
        id: 'je-1',
        eventId: 'evt-1',
        eventType: 'invoice.committed',
        status: 'posted',
        entryDate: new Date('2026-03-10T12:00:00.000Z'),
        periodKey: '2026-03',
        description: 'Venta marzo',
        sourceType: 'invoice',
        sourceId: 'inv-1',
        totals: { debit: 100, credit: 100 },
        lines: [
          { lineNumber: 1, accountId: 'cash', accountCode: '1.1.01', accountName: 'Caja', debit: 100, credit: 0 },
          { lineNumber: 2, accountId: 'sales', accountCode: '4.1.01', accountName: 'Ventas', debit: 0, credit: 100 },
        ],
      },
      {
        id: 'je-2',
        eventId: 'evt-2',
        eventType: 'invoice.committed',
        status: 'posted',
        entryDate: new Date('2026-04-05T12:00:00.000Z'),
        periodKey: '2026-04',
        description: 'Venta abril',
        sourceType: 'invoice',
        sourceId: 'inv-2',
        totals: { debit: 60, credit: 60 },
        lines: [
          { lineNumber: 1, accountId: 'cash', accountCode: '1.1.01', accountName: 'Caja', debit: 60, credit: 0 },
          { lineNumber: 2, accountId: 'sales', accountCode: '4.1.01', accountName: 'Ventas', debit: 0, credit: 60 },
        ],
      },
    ],
    eventsById: new Map([
        [
          'evt-1',
          {
            id: 'evt-1',
            eventType: 'invoice.committed',
            sourceDocumentType: 'invoice',
            sourceDocumentId: 'inv-1',
            payload: {
              ncfCode: 'B0100000338',
              invoiceNumber: '338',
            },
          },
        ],
        [
          'evt-2',
          {
            id: 'evt-2',
            eventType: 'invoice.committed',
            sourceDocumentType: 'invoice',
            sourceDocumentId: 'inv-2',
            payload: {
              ncfCode: 'B0100000339',
              invoiceNumber: '339',
            },
          },
        ],
      ]),
  });

  it('calcula opciones del mayor y periodos disponibles', () => {
    const accountOptions = buildGeneralLedgerAccountOptions({
      accounts,
      records,
    });

    expect(accountOptions[0]).toMatchObject({
      id: 'cash',
      movementCount: 2,
    });
    expect(buildAvailablePeriods(records)).toContain('2026-04');
    expect(buildAvailablePeriods(records)).toContain('2026-03');
  });

  it('construye snapshot del libro mayor con saldo acumulado', () => {
    const snapshot = buildGeneralLedgerSnapshot({
      account: accounts[0],
      periodKey: '2026-04',
      records,
    });

    expect(snapshot.openingBalance).toBe(100);
    expect(snapshot.periodDebit).toBe(60);
    expect(snapshot.periodCredit).toBe(0);
    expect(snapshot.closingBalance).toBe(160);
    expect(snapshot.entries).toHaveLength(1);
    expect(snapshot.pagination).toMatchObject({
      page: 1,
      pageSize: 50,
      totalEntries: 1,
      totalPages: 1,
      hasNextPage: false,
    });
  });

  it('pagina y filtra movimientos del libro mayor sin perder saldo acumulado', () => {
    const pagedSnapshot = buildGeneralLedgerSnapshot({
      account: accounts[0],
      periodKey: null,
      records,
      page: 2,
      pageSize: 1,
    });

    expect(pagedSnapshot.entries).toHaveLength(1);
    expect(pagedSnapshot.entries[0]).toMatchObject({
      reference: 'B0100000339',
      runningBalance: 160,
    });
    expect(pagedSnapshot.pagination).toMatchObject({
      page: 2,
      pageSize: 1,
      totalEntries: 2,
      totalPages: 2,
      hasPreviousPage: true,
      hasNextPage: false,
    });

    const searchedSnapshot = buildGeneralLedgerSnapshot({
      account: accounts[0],
      periodKey: null,
      records,
      searchQuery: 'abril',
    });

    expect(searchedSnapshot.entries).toHaveLength(1);
    expect(searchedSnapshot.entries[0]).toMatchObject({
      reference: 'B0100000339',
      runningBalance: 160,
    });
    expect(searchedSnapshot.pagination.totalEntries).toBe(1);
  });

  it('compacta referencias tecnicas del mayor con alias corto de asiento', () => {
    const technicalRecords = buildPostedLedgerRecords({
      journalEntries: [
        {
          id: 'je-tech-1',
          eventId: 'evt-tech-1',
          eventType: 'internal_transfer.posted',
          status: 'posted',
          entryDate: new Date('2026-04-18T12:00:00.000Z'),
          periodKey: '2026-04',
          description: 'Transferencia entre cuentas',
          sourceType: 'internal_transfer',
          sourceId: 'internal_transfer.posted__0L_9_bBzY6Lw2SEwXDVde',
          totals: { debit: 80, credit: 80 },
          lines: [
            { lineNumber: 1, accountId: 'cash', accountCode: '1.1.01', accountName: 'Caja', debit: 80, credit: 0 },
            { lineNumber: 2, accountId: 'sales', accountCode: '4.1.01', accountName: 'Ventas', debit: 0, credit: 80 },
          ],
        },
      ],
      eventsById: new Map([
        [
          'evt-tech-1',
            {
              id: 'evt-tech-1',
              eventType: 'internal_transfer.posted',
              sourceDocumentType: 'internal_transfer',
              sourceDocumentId: 'internal_transfer.posted__0L_9_bBzY6Lw2SEwXDVde',
              payload: {
                reference: 'TRF-9001',
              },
            },
          ],
      ]),
    });

    const snapshot = buildGeneralLedgerSnapshot({
      account: accounts[0],
      periodKey: '2026-04',
      records: technicalRecords,
    });

    expect(snapshot.entries).toHaveLength(1);
    expect(snapshot.entries[0]).toMatchObject({
      reference: 'TRF-9001',
      internalReference: 'je-tech-1',
    });
    expect(snapshot.entries[0].sourceRecord.entryReference).toBe(
      'AST-2026-04-JE-TECH-1',
    );
  });

  it('construye reportes financieros desde asientos posteados', () => {
    const reports = buildFinancialReports({
      accounts,
      periodKey: '2026-04',
      records,
    });

    expect(reports.trialBalanceTotals).toEqual({
      debit: 160,
      credit: 160,
    });
    expect(reports.incomeTotals).toEqual({
      income: 60,
      expense: 0,
      netIncome: 60,
    });
  });

  it('asigna referencias AST estables derivadas del id del asiento', () => {
    const stableRecords = buildPostedLedgerRecords({
      journalEntries: [
        {
          id: 'je-older',
          eventType: 'manual.entry.recorded',
          entryDate: new Date('2026-04-14T10:00:00.000Z'),
          createdAt: new Date('2026-04-14T10:00:00.000Z'),
          periodKey: '2026-04',
          status: 'posted',
          sourceId: null,
          description: 'Asiento 1',
          lines: [],
          totals: { debit: 0, credit: 0 },
        },
        {
          id: 'je-newer',
          eventType: 'manual.entry.recorded',
          entryDate: new Date('2026-04-15T10:00:00.000Z'),
          createdAt: new Date('2026-04-15T10:00:00.000Z'),
          periodKey: '2026-04',
          status: 'posted',
          sourceId: null,
          description: 'Asiento 2',
          lines: [],
          totals: { debit: 0, credit: 0 },
        },
      ],
      eventsById: new Map(),
    });

    expect(stableRecords.map((record) => record.entryReference)).toEqual([
      'AST-2026-04-JE-OLDER',
      'AST-2026-04-JE-NEWER',
    ]);
  });
});
