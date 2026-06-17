import { describe, expect, it } from 'vitest';

import type { MonthlyComplianceRun } from '../../utils/monthlyCompliance';

import {
  formatCurrency,
  formatMoney,
  formatShortDate,
  getDgii606ItbisTotal,
  getDgii606Rows,
  getDgii607ExcludedRows,
  getDgii607Rows,
  getDgii608Rows,
  getRunRecordCount,
  resolveDgiiDocumentType,
  resolveExcludedReason,
  toPreviewText,
  toSourceRows,
} from './fiscalCompliancePreview';

const buildRun = (
  reportCode: MonthlyComplianceRun['reportCode'],
  sourceRecords: Record<string, unknown>,
): MonthlyComplianceRun => ({
  id: `run-${reportCode}`,
  reportCode,
  periodKey: '2026-04',
  version: 1,
  status: 'validated',
  createdAt: null,
  createdBy: null,
  issues: [],
  validationSummary: {
    ok: true,
    totalIssues: 0,
    issueSummary: {
      total: 0,
      bySeverity: {},
      bySource: {},
      byCode: {},
    },
    sourceSummaries: [
      {
        sourceId: 'fallback',
        ownerModule: 'accounting',
        collectionPath: 'fallback',
        recordsScanned: 9,
      },
    ],
    pendingGaps: [],
  },
  sourceSnapshot: {
    sourceSnapshots: {},
    sourceRecords,
  },
});

describe('fiscalCompliancePreview', () => {
  it('formats display values with the existing preview fallbacks', () => {
    expect(formatMoney(1234.5)).toBe('1,234.50');
    expect(formatMoney('bad-value')).toBe('-');
    expect(formatCurrency(25)).toBe('RD$ 25.00');
    expect(formatShortDate('2026-04-15T12:00:00.000Z')).toBe('15/04/2026');
    expect(formatShortDate('15/04/2026')).toBe('-');
    expect(toPreviewText('  B0100000012  ')).toBe('B0100000012');
    expect(toPreviewText('   ')).toBe('-');
  });

  it('maps source arrays into rows with stable source metadata', () => {
    expect(
      toSourceRows(
        {
          purchases: [
            { recordId: 'purchase-1', total: 100 },
            'legacy-value',
          ],
        },
        'purchases',
      ),
    ).toEqual([
      {
        recordId: 'purchase-1',
        total: 100,
        sourceId: 'purchases',
        index: 0,
      },
      {
        sourceId: 'purchases',
        index: 1,
      },
    ]);

    expect(toSourceRows({}, 'purchases')).toEqual([]);
  });

  it('builds 606 rows, count and ITBIS total from included purchase sources', () => {
    const run = buildRun('DGII_606', {
      purchases: [
        { recordId: 'late-purchase', issuedAt: '2026-04-20', itbisTotal: 3 },
        {
          recordId: 'early-purchase',
          issuedAt: '2026-04-01',
          itbisTotal: '7.50',
        },
      ],
      expenses: [
        {
          recordId: 'expense-1',
          issuedAt: '2026-04-10',
          itbisTotal: 'ignored',
        },
      ],
    });

    expect(getDgii606Rows(run).map((row) => row.recordId)).toEqual([
      'early-purchase',
      'expense-1',
      'late-purchase',
    ]);
    expect(getRunRecordCount(run)).toBe(3);
    expect(getDgii606ItbisTotal(run)).toBe(10.5);
    expect(getDgii606ItbisTotal(null)).toBe(0);
  });

  it('builds 607 rows only when an NCF is present and sorts by fiscal date', () => {
    const run = buildRun('DGII_607', {
      invoices: [
        {
          recordId: 'missing-ncf',
          issuedAt: '2026-04-01',
          documentFiscalNumber: '   ',
        },
        {
          recordId: 'invoice-1',
          issuedAt: '2026-04-12',
          documentFiscalNumber: 'B0100000001',
        },
      ],
      thirdPartyWithholdings: [
        {
          recordId: 'withholding-1',
          retentionDate: '2026-04-05',
          documentFiscalNumber: 'B0200000001',
        },
      ],
      creditNotes: [
        {
          recordId: 'credit-note-1',
          issuedAt: '2026-04-20',
          documentFiscalNumber: 'B0400000001',
        },
      ],
      debitNotes: [
        {
          recordId: 'debit-note-1',
          issuedAt: '2026-04-18',
          documentFiscalNumber: 'E330000000001',
        },
      ],
    });

    expect(getDgii607Rows(run).map((row) => row.recordId)).toEqual([
      'withholding-1',
      'invoice-1',
      'debit-note-1',
      'credit-note-1',
    ]);
    expect(getRunRecordCount(run)).toBe(4);
    expect(resolveDgiiDocumentType('b0100000001')).toBe('01');
    expect(resolveDgiiDocumentType('B0200000001')).toBe('02');
    expect(resolveDgiiDocumentType('B0300000001')).toBe('03');
    expect(resolveDgiiDocumentType('B0400000001')).toBe('04');
    expect(resolveDgiiDocumentType('E3100000001')).toBe('31');
    expect(resolveDgiiDocumentType('E3300000001')).toBe('33');
  });

  it('keeps excluded 607 rows sorted and resolves exclusion reasons', () => {
    const run = buildRun('DGII_607', {
      excludedInvoices: [
        {
          recordId: 'late-excluded',
          issuedAt: '2026-04-20',
          documentFiscalNumber: 'B0100000099',
        },
      ],
      excludedThirdPartyWithholdings: [
        {
          recordId: 'early-excluded',
          retentionDate: '2026-04-02',
          documentFiscalNumber: '',
        },
      ],
      excludedCreditNotes: [
        {
          recordId: 'middle-excluded',
          issuedAt: '2026-04-10',
          documentFiscalNumber: 'B0400000099',
        },
      ],
      excludedDebitNotes: [
        {
          recordId: 'debit-excluded',
          issuedAt: '2026-04-12',
          documentFiscalNumber: 'B0300000099',
        },
      ],
    });

    expect(getDgii607ExcludedRows(run).map((row) => row.recordId)).toEqual([
      'early-excluded',
      'middle-excluded',
      'debit-excluded',
      'late-excluded',
    ]);
    expect(resolveExcludedReason({ documentFiscalNumber: '' })).toBe(
      'Sin NCF',
    );
    expect(resolveExcludedReason({ documentFiscalNumber: 'B0100000001' })).toBe(
      'Fuera del reporte',
    );
  });

  it('builds 608 rows from invoices and credit notes', () => {
    const run = buildRun('DGII_608', {
      invoices: [{ recordId: 'invoice-1', issuedAt: '2026-04-12' }],
      creditNotes: [{ recordId: 'credit-note-1', issuedAt: '2026-04-03' }],
      debitNotes: [{ recordId: 'debit-note-1', issuedAt: '2026-04-08' }],
    });

    expect(getDgii608Rows(run).map((row) => row.recordId)).toEqual([
      'credit-note-1',
      'debit-note-1',
      'invoice-1',
    ]);
    expect(getRunRecordCount(run)).toBe(3);
  });
});
