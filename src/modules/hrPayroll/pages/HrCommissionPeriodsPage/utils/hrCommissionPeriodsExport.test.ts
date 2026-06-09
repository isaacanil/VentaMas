import { describe, expect, it } from 'vitest';

import type {
  HrCommissionEntryRecord,
  HrCommissionPeriodRecord,
  HrEmployeePaymentRecord,
  HrPayrollEmployeeLineRecord,
} from '@/types/hrPayroll';

import {
  buildHrCommissionPeriodEmployeePdfGroups,
  buildHrCommissionLineExportRows,
  buildHrCommissionPeriodGeneralPdfRows,
  buildHrCommissionPeriodExportRows,
  buildHrCommissionPeriodsFileName,
  buildHrCommissionPeriodsPdfFileName,
  buildHrEmployeePaymentExportRows,
} from './hrCommissionPeriodsExport';

const periods: HrCommissionPeriodRecord[] = [
  {
    id: 'period-1',
    businessId: 'business-1',
    type: 'commission',
    periodKey: '2026-06',
    label: 'Junio 2026',
    status: 'approved',
    startDateKey: '2026-06-01',
    endDateKey: '2026-06-15',
    currency: 'DOP',
    entriesCount: 8,
    employeesCount: 2,
    totalCommissionAmount: 15000,
    retroactiveAdjustmentAmount: 250,
    retroactiveAdjustmentsCount: 1,
    hasRetroactiveAdjustments: true,
    payrollRunId: 'run-1',
  },
];

const lines: HrPayrollEmployeeLineRecord[] = [
  {
    id: 'line-1',
    businessId: 'business-1',
    periodId: 'period-1',
    payrollRunId: 'run-1',
    employeeId: 'employee-1',
    employeeCode: 'EMP-1',
    employeeNameSnapshot: 'Ana Perez',
    type: 'commission',
    status: 'approved',
    currency: 'DOP',
    grossAmount: 8000,
    deductionsAmount: 500,
    netAmount: 7500,
    commissionAmount: 8000,
    retroactiveAdjustmentAmount: 250,
    retroactiveAdjustmentsCount: 1,
    retroactiveEntryIds: ['entry-retro'],
    hasRetroactiveAdjustments: true,
    deductionLines: [],
    commissionEntryIds: ['entry-1'],
    entriesCount: 5,
    manualAdjustmentAmount: 500,
    manualAdjustmentComment: 'Ajuste autorizado por gerencia',
    paymentMethod: 'bank_transfer',
  },
];

const payments: HrEmployeePaymentRecord[] = [
  {
    id: 'payment-1',
    businessId: 'business-1',
    periodId: 'period-1',
    payrollRunId: 'run-1',
    payrollLineId: 'line-1',
    employeeId: 'employee-1',
    employeeCode: 'EMP-1',
    employeeNameSnapshot: 'Ana Perez',
    amount: 7500,
    currency: 'DOP',
    status: 'confirmed',
    paymentMethod: 'bank_transfer',
    transferReference: 'TRX-001',
    cashMovementIds: [],
  },
];

const entries: HrCommissionEntryRecord[] = [
  {
    id: 'entry-1',
    businessId: 'business-1',
    employeeId: 'employee-1',
    employeeCode: 'EMP-1',
    employeeNameSnapshot: 'Ana Perez',
    invoiceId: 'invoice-1',
    invoiceNumber: 'F-001',
    invoiceItemId: 'line-1',
    sourceType: 'invoice_line',
    customerId: 'client-1',
    customerNameSnapshot: 'Cliente Uno',
    serviceId: 'service-1',
    serviceName: 'Consulta',
    baseAmount: 5000,
    rateType: 'percentage',
    rateValue: 10,
    commissionAmount: 500,
    currency: 'DOP',
    status: 'included_in_cut',
    periodId: 'period-1',
    payrollRunId: 'run-1',
    payrollEmployeeLineId: 'line-1',
  },
];

describe('hrCommissionPeriodsExport', () => {
  it('builds a stable file name', () => {
    expect(buildHrCommissionPeriodsFileName()).toBe(
      'cortes_comisiones_rrhh.xlsx',
    );
    expect(buildHrCommissionPeriodsFileName(periods[0])).toBe(
      'cortes_comisiones_rrhh_junio_2026.xlsx',
    );
    expect(
      buildHrCommissionPeriodsPdfFileName({
        mode: 'general',
        selectedPeriod: periods[0],
      }),
    ).toBe('corte_comisiones_rrhh_general_junio_2026.pdf');
  });

  it('maps period, collaborator and payment rows for Excel', () => {
    expect(buildHrCommissionPeriodExportRows(periods)).toEqual([
      {
        Corte: 'Junio 2026',
        Desde: '1 jun 2026',
        Hasta: '15 jun 2026',
        Estado: 'Aprobado',
        Colaboradores: 2,
        Comisiones: 8,
        Retroactivas: 1,
        AjusteRetroactivo: 250,
        Deducciones: 0,
        Total: 15000,
        Moneda: 'DOP',
        Nómina: 'run-1',
      },
    ]);

    expect(buildHrCommissionLineExportRows(lines)).toEqual([
      {
        Colaborador: 'Ana Perez',
        Código: 'EMP-1',
        Entradas: 5,
        Estado: 'Aprobado',
        Comisión: 8000,
        AjusteRetroactivo: 250,
        Deducciones: 500,
        Ajuste: 500,
        Neto: 7500,
        Moneda: 'DOP',
        Método: 'Transferencia',
        PagadoEl: '-',
        Comentario: 'Ajuste autorizado por gerencia',
      },
    ]);

    expect(buildHrEmployeePaymentExportRows(payments)).toEqual([
      {
        Colaborador: 'Ana Perez',
        Código: 'EMP-1',
        Fecha: '-',
        Método: 'Transferencia',
        CuentaCaja: '-',
        Monto: 7500,
        Moneda: 'DOP',
        Referencia: 'TRX-001',
        Estado: 'Confirmado',
        Usuario: '-',
      },
    ]);
  });

  it('maps general PDF rows from employee lines', () => {
    expect(buildHrCommissionPeriodGeneralPdfRows(lines)).toEqual([
      {
        Colaborador: 'Ana Perez',
        Código: 'EMP-1',
        Entradas: '5',
        Estado: 'Aprobado',
        Comisión: 'RD$8,000.00',
        AjusteRetroactivo: 'RD$250.00',
        Deducciones: 'RD$500.00',
        Comentario: 'Ajuste autorizado por gerencia',
        Neto: 'RD$7,500.00',
      },
    ]);
  });

  it('groups detail PDF rows by employee with invoice context', () => {
    expect(
      buildHrCommissionPeriodEmployeePdfGroups({
        employeeLines: lines,
        entries,
      }),
    ).toEqual([
      {
        Colaborador: 'Ana Perez',
        Código: 'EMP-1',
        Entradas: '1',
        Comisión: 'RD$8,000.00',
        AjusteRetroactivo: 'RD$250.00',
        Neto: 'RD$7,500.00',
        Comentario: 'Ajuste autorizado por gerencia',
        rows: [
          {
            Factura: 'F-001',
            Cliente: 'Cliente Uno',
            Servicio: 'Consulta',
            Neto: 'RD$5,000.00',
            Porcentaje: '10%',
            Comisión: 'RD$500.00',
          },
        ],
      },
    ]);
  });
});
