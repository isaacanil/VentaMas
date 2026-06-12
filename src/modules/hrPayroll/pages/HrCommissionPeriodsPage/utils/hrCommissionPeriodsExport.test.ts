import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  HrCommissionEntryRecord,
  HrCommissionPeriodRecord,
  HrEmployeePaymentRecord,
  HrPayrollEmployeeLineRecord,
} from '@/types/hrPayroll';

import {
  buildHrCommissionLineSupportDetailRows,
  buildHrCommissionLineSupportFileName,
  buildHrCommissionLineSupportSummaryRows,
  buildHrCommissionPeriodEmployeePdfGroups,
  buildHrCommissionPeriodEmployeeSupportPdfGroup,
  buildHrCommissionLineExportRows,
  buildHrCommissionPeriodGeneralPdfRows,
  buildHrCommissionPeriodExportRows,
  buildHrCommissionPeriodsFileName,
  buildHrCommissionPeriodsPdfFileName,
  buildHrEmployeePaymentExportRows,
  exportHrCommissionPeriodsPdf,
} from './hrCommissionPeriodsExport';

const pdfMocks = vi.hoisted(() => {
  const addPage = vi.fn();
  const autoTable = vi.fn(function autoTableMock(this: {
    lastAutoTable?: { finalY?: number };
  }) {
    this.lastAutoTable = { finalY: 42 };
  });
  const save = vi.fn();
  const splitTextToSize = vi.fn((text: string) => [text]);
  const text = vi.fn();

  class MockJsPdf {
    internal = {
      pageSize: {
        getHeight: () => 216,
        getWidth: () => 279,
      },
    };

    lastAutoTable?: { finalY?: number };

    addPage = addPage;

    getNumberOfPages = vi.fn(() => 1);

    save = save;

    setFontSize = vi.fn();

    setPage = vi.fn();

    setTextColor = vi.fn();

    splitTextToSize = splitTextToSize;

    text = text;
  }

  const applyPlugin = vi.fn((JsPdfConstructor: typeof MockJsPdf) => {
    JsPdfConstructor.prototype.autoTable = autoTable;
  });

  return {
    addPage,
    applyPlugin,
    autoTable,
    save,
    splitTextToSize,
    text,
    MockJsPdf,
  };
});

vi.mock('jspdf', () => ({ jsPDF: pdfMocks.MockJsPdf }));
vi.mock('jspdf-autotable', () => ({ applyPlugin: pdfMocks.applyPlugin }));

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
    depositAccount: {
      bankName: 'Banco Popular',
      accountType: 'savings',
      accountNumber: '123456789',
      holderName: 'Ana Perez',
    },
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
    bankAccountId: 'bank-origin-1',
    depositAccount: {
      bankName: 'Banco Popular',
      accountType: 'savings',
      accountNumber: '123456789',
      holderName: 'Ana Perez',
    },
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
  beforeEach(() => {
    pdfMocks.addPage.mockClear();
    pdfMocks.applyPlugin.mockClear();
    pdfMocks.autoTable.mockClear();
    pdfMocks.save.mockClear();
    pdfMocks.splitTextToSize.mockClear();
    pdfMocks.text.mockClear();
  });

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
    expect(
      buildHrCommissionPeriodsPdfFileName({
        employeeName: 'Ana Perez',
        mode: 'employee',
        selectedPeriod: periods[0],
      }),
    ).toBe('comision_individual_ana_perez_junio_2026.pdf');
    expect(
      buildHrCommissionLineSupportFileName({
        employeeLine: lines[0],
        selectedPeriod: periods[0],
      }),
    ).toBe('comision_individual_ana_perez_junio_2026.xlsx');
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
        CuentaDestino: 'Banco Popular · Ahorros · ****6789',
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
        CuentaOrigen: 'bank-origin-1',
        CuentaDestino: 'Banco Popular · Ahorros · ****6789',
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
        AjusteManual: 'RD$500.00',
        AjusteRetroactivo: 'RD$250.00',
        Colaborador: 'Ana Perez',
        Código: 'EMP-1',
        Entradas: '1',
        Estado: 'Aprobado',
        Comisión: 'RD$8,000.00',
        Deducciones: 'RD$500.00',
        Fórmula:
          'Comisión normal RD$8,000.00 + retroactiva RD$250.00 - deducciones RD$500.00 +/- ajuste manual RD$500.00 = neto confirmado RD$7,500.00',
        Neto: 'RD$7,500.00',
        Pendiente: 'RD$7,500.00',
        Comentario: 'Ajuste autorizado por gerencia',
        rows: [
          {
            AjusteManual: 'RD$0.00',
            Base: 'RD$5,000.00',
            Factura: 'F-001',
            Cliente: 'Cliente Uno',
            Servicio: 'Consulta',
            Referencia: 'line-1',
            Fecha: '-',
            Fórmula: 'RD$5,000.00 x 10% = RD$500.00',
            Regla: 'Regla general',
            Porcentaje: '10%',
            Comisión: 'RD$500.00',
            Retroactiva: 'RD$0.00',
            Deducción: 'RD$0.00',
            Total: 'RD$500.00',
            CorteOriginal: '-',
          },
        ],
      },
    ]);

    expect(
      buildHrCommissionPeriodEmployeeSupportPdfGroup({
        employeeLine: lines[0],
        entries,
      }).Colaborador,
    ).toBe('Ana Perez');
  });

  it('builds individual Excel support rows with formula and auditable fields', () => {
    expect(
      buildHrCommissionLineSupportSummaryRows({
        employeeLine: lines[0],
        entries,
        selectedPeriod: periods[0],
      }),
    ).toEqual(
      expect.arrayContaining([
        { Campo: 'Colaborador', Valor: 'Ana Perez' },
        { Campo: 'Código', Valor: 'EMP-1' },
        { Campo: 'Base comisionable', Valor: 'RD$5,000.00' },
        {
          Campo: 'Fórmula',
          Valor:
            'Comisión normal RD$8,000.00 + retroactiva RD$250.00 - deducciones RD$500.00 +/- ajuste manual RD$500.00 = neto confirmado RD$7,500.00',
        },
      ]),
    );

    expect(
      buildHrCommissionLineSupportDetailRows({
        employeeLine: lines[0],
        entries,
      }),
    ).toEqual([
      {
        AjusteManual: 0,
        Base: 5000,
        Cliente: 'Cliente Uno',
        Comisión: 500,
        CorteOriginal: '-',
        Deducción: 0,
        Factura: 'F-001',
        Fecha: '-',
        Fórmula: 'RD$5,000.00 x 10% = RD$500.00',
        Moneda: 'DOP',
        Referencia: 'line-1',
        Regla: 'Regla general',
        Retroactiva: 0,
        Servicio: 'Consulta',
        Tasa: '10%',
        Total: 500,
      },
    ]);
  });

  it('registers jsPDF autoTable before exporting an individual support PDF', async () => {
    await exportHrCommissionPeriodsPdf({
      employeeLineId: 'line-1',
      employeeLines: lines,
      entries,
      mode: 'employee',
      payments,
      selectedPeriod: periods[0],
    });

    expect(pdfMocks.applyPlugin).toHaveBeenCalledTimes(1);
    expect(pdfMocks.autoTable).toHaveBeenCalled();
    expect(pdfMocks.save).toHaveBeenCalledWith(
      'comision_individual_ana_perez_junio_2026.pdf',
    );

    pdfMocks.save.mockClear();

    await exportHrCommissionPeriodsPdf({
      employeeLines: lines,
      entries,
      mode: 'detail',
      payments,
      selectedPeriod: periods[0],
    });

    expect(pdfMocks.save).toHaveBeenCalledWith(
      'corte_comisiones_rrhh_detail_junio_2026.pdf',
    );
  });
});
