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
        },
      ],
      [
        'evt-2',
        {
          id: 'evt-2',
          eventType: 'invoice.committed',
          sourceDocumentType: 'invoice',
          sourceDocumentId: 'inv-2',
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
      reference: 'inv-2',
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
      reference: 'inv-2',
      runningBalance: 160,
    });
    expect(searchedSnapshot.pagination.totalEntries).toBe(1);
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
});
