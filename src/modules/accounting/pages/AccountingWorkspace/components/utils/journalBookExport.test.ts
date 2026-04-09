import { describe, expect, it } from 'vitest';

import type { AccountingLedgerRecord } from '../../utils/accountingWorkspace';

import {
  buildJournalBookExportFileName,
  buildJournalBookExportRows,
} from './journalBookExport';

const sampleRecords: AccountingLedgerRecord[] = [
  {
    id: 'record-1',
    entryDate: new Date('2026-04-08T12:00:00.000Z'),
    periodKey: '2026-04',
    sourceKind: 'automatic',
    sourceLabel: 'Factura INV-1',
    detailMode: 'posted',
    eventType: 'invoice.committed',
    moduleKey: 'sales',
    moduleLabel: 'Ventas',
    title: 'Factura confirmada',
    description: 'Venta al contado',
    reference: 'INV-1',
    internalReference: null,
    amount: 1250,
    statusLabel: 'Posteado',
    statusTone: 'success',
    lines: [],
    journalEntry: null,
    event: null,
    profile: null,
    searchIndex: 'ventas factura',
  },
];

describe('journalBookExport', () => {
  it('builds a stable file name for the current filters', () => {
    expect(
      buildJournalBookExportFileName({
        moduleFilter: 'Ventas',
        dateFrom: '2026-04-01',
        dateTo: '2026-04-30',
      }),
    ).toBe('libro_diario_ventas_2026-04-01_2026-04-30.xlsx');
  });

  it('maps journal records into export rows', () => {
    expect(buildJournalBookExportRows(sampleRecords)).toEqual([
      {
        Fecha: '08/04/2026',
        Periodo: '2026-04',
        Modulo: 'Ventas',
        Origen: 'Factura INV-1',
        Referencia: 'INV-1',
        Descripcion: 'Factura confirmada — Venta al contado',
        Monto: 1250,
        Estado: 'Posteado',
        Tipo: 'Automatico',
      },
    ]);
  });
});
