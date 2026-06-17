import { describe, expect, it } from 'vitest';

import type { ServiceCommissionRecord } from '@/domain/commissions/types';

import {
  buildServiceCommissionsReportExportRows,
  buildServiceCommissionsReportFileName,
} from './serviceCommissionsReportExport';

const rows: ServiceCommissionRecord[] = [
  {
    id: 'commission-1',
    businessId: 'business-1',
    invoiceId: 'invoice-1',
    invoiceNumber: 'F-001',
    date: new Date(2026, 5, 2, 10, 0, 0),
    lineId: 'line-1',
    serviceName: 'Instalacion',
    collaboratorId: 'employee-1',
    collaboratorCode: 'EMP-1',
    collaboratorName: 'Ana Perez',
    billedAmount: 2500,
    commissionAmount: 250,
    status: 'active',
    commission: {
      calculationBase: 'netSubtotalWithoutTax',
      rateValue: 10,
      source: 'collaborator',
      type: 'percentage',
    },
  },
];

describe('serviceCommissionsReportExport', () => {
  it('builds a stable file name from the selected range', () => {
    expect(
      buildServiceCommissionsReportFileName({
        endDate: new Date(2026, 5, 30),
        startDate: new Date(2026, 5, 1),
      }),
    ).toBe('reporte_comisiones_servicios_2026-06-01_2026-06-30.xlsx');
  });

  it('maps commission report rows for Excel', () => {
    expect(buildServiceCommissionsReportExportRows(rows)).toEqual([
      {
        Fecha: '02/06/2026',
        Factura: 'F-001',
        Servicio: 'Instalacion',
        Colaborador: 'EMP-1 - Ana Perez',
        'Base comisionable': 2500,
        'Base de cálculo': 'Subtotal sin ITBIS',
        Tasa: '10%',
        Tipo: 'Porcentaje',
        'Regla aplicada': 'Regla del colaborador',
        Fórmula: 'RD$2,500.00 x 10% = RD$250.00',
        Comisión: 250,
        Estado: 'Activa',
      },
    ]);
  });
});
