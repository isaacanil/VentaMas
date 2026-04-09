import { describe, expect, it } from 'vitest';

import type { AccountingPeriodClosure } from '../../utils/accountingWorkspace';

import {
  buildPeriodCloseExportFileName,
  buildPeriodClosureExportRows,
  buildPeriodStatusExportRows,
} from './periodCloseExport';

const periods = [
  {
    amount: 15000,
    entries: 20,
    label: 'abril de 2026',
    periodKey: '2026-04',
    status: 'open' as const,
  },
  {
    amount: 9800,
    entries: 14,
    label: 'marzo de 2026',
    periodKey: '2026-03',
    status: 'closed' as const,
  },
];

const closures: AccountingPeriodClosure[] = [
  {
    id: '2026-03',
    periodKey: '2026-03',
    closedAt: new Date('2026-04-02T14:30:00.000Z'),
    closedBy: 'jonat',
    note: 'Cierre fiscal validado',
  },
];

describe('periodCloseExport', () => {
  it('builds a stable file name', () => {
    expect(buildPeriodCloseExportFileName()).toBe('cierres_contables.xlsx');
  });

  it('maps period status rows and closure history rows', () => {
    expect(buildPeriodStatusExportRows(periods)).toEqual([
      {
        Periodo: 'abril de 2026',
        Estado: 'Abierto',
        Movimientos: 20,
        Acumulado: 15000,
      },
      {
        Periodo: 'marzo de 2026',
        Estado: 'Cerrado',
        Movimientos: 14,
        Acumulado: 9800,
      },
    ]);

    expect(buildPeriodClosureExportRows(closures, periods)).toEqual([
      {
        Periodo: 'marzo de 2026',
        Estado: 'Cerrado',
        Usuario: 'jonat',
        CerradoEl: '02/04/2026, 10:30',
        Nota: 'Cierre fiscal validado',
      },
    ]);
  });
});
