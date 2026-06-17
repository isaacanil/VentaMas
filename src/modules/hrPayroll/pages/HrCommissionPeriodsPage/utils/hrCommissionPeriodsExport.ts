import type { Worksheet } from 'exceljs';
import type { UserOptions } from 'jspdf-autotable';

import {
  addReportHeader,
  applyProfessionalStyling,
  formatCurrencyColumns,
  formatNumberColumns,
} from '@/utils/export/excel/exportConfig';
import {
  formatHrDate,
  formatHrPeriodDate,
  formatHrMoney,
  HR_COMMISSION_PERIOD_STATUS_LABELS,
  HR_EMPLOYEE_PAYMENT_STATUS_LABELS,
  HR_PAYMENT_METHOD_LABELS,
  HR_PAYROLL_RUN_STATUS_LABELS,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type {
  HrCommissionEntryRecord,
  HrCommissionPeriodRecord,
  HrEmployeePaymentRecord,
  HrPayrollEmployeeLineRecord,
} from '@/types/hrPayroll';
import { saveXlsxFile } from '@/utils/export/xlsx';
import { formatHrDepositAccount } from '@/domain/hrPayroll/depositAccounts';
import { normalizeText } from '@/utils/text';
import {
  getHrCommissionLineAdjustmentAmount as getLineAdjustmentAmount,
  getHrCommissionLinePendingAmount as getLinePendingAmount,
  getHrCommissionLineRetroactiveAdjustmentAmount as getLineRetroactiveAdjustmentAmount,
  getHrCommissionPeriodPayableAmount as getPeriodPayableAmount,
} from './hrCommissionPeriodAmounts';

type HrCommissionPeriodExportRow = {
  AjusteRetroactivo: number;
  Colaboradores: number;
  Comisiones: number;
  Corte: string;
  Deducciones: number;
  Desde: string;
  Estado: string;
  Hasta: string;
  Moneda: string;
  Nómina: string;
  Retroactivas: number;
  Total: number;
};

type HrCommissionLineExportRow = {
  Ajuste: number;
  AjusteRetroactivo: number;
  Código: string;
  Colaborador: string;
  Comisión: number;
  Comentario: string;
  CuentaDestino: string;
  Deducciones: number;
  Entradas: number;
  Estado: string;
  Método: string;
  Moneda: string;
  Neto: number;
  PagadoEl: string;
};

type HrEmployeePaymentExportRow = {
  CuentaDestino: string;
  CuentaOrigen: string;
  Código: string;
  Colaborador: string;
  Estado: string;
  Fecha: string;
  Método: string;
  Moneda: string;
  Monto: number;
  Referencia: string;
  Usuario: string;
};

type HrCommissionLineSupportSummaryRow = {
  Campo: string;
  Valor: string;
};

type HrCommissionLineSupportDetailRow = {
  AjusteManual: number;
  Base: number;
  Cliente: string;
  Comisión: number;
  CorteOriginal: string;
  Deducción: number;
  Factura: string;
  Fecha: string;
  Fórmula: string;
  Moneda: string;
  Referencia: string;
  Regla: string;
  Retroactiva: number;
  Servicio: string;
  Tasa: string;
  Total: number;
};

export type HrCommissionPeriodsPdfMode = 'detail' | 'employee' | 'general';

export type HrCommissionPeriodGeneralPdfRow = {
  AjusteRetroactivo: string;
  Código: string;
  Colaborador: string;
  Comisión: string;
  Comentario: string;
  Deducciones: string;
  Entradas: string;
  Estado: string;
  Neto: string;
};

export type HrCommissionPeriodDetailPdfRow = {
  AjusteManual: string;
  Base: string;
  Cliente: string;
  Comisión: string;
  CorteOriginal: string;
  Deducción: string;
  Factura: string;
  Fecha: string;
  Fórmula: string;
  Porcentaje: string;
  Referencia: string;
  Regla: string;
  Retroactiva: string;
  Servicio: string;
  Total: string;
};

export type HrCommissionPeriodEmployeePdfGroup = {
  AjusteManual: string;
  AjusteRetroactivo: string;
  Código: string;
  Colaborador: string;
  Comisión: string;
  Comentario: string;
  Deducciones: string;
  Entradas: string;
  Estado: string;
  Fórmula: string;
  Neto: string;
  Pendiente: string;
  rows: HrCommissionPeriodDetailPdfRow[];
};

const PERIOD_COLUMNS = [
  'Corte',
  'Desde',
  'Hasta',
  'Estado',
  'Colaboradores',
  'Comisiones',
  'Retroactivas',
  'AjusteRetroactivo',
  'Deducciones',
  'Total',
  'Moneda',
  'Nómina',
];

const LINE_COLUMNS = [
  'Colaborador',
  'Código',
  'Entradas',
  'Estado',
  'Comisión',
  'AjusteRetroactivo',
  'Deducciones',
  'Ajuste',
  'Neto',
  'Moneda',
  'Método',
  'CuentaDestino',
  'PagadoEl',
  'Comentario',
];

const PAYMENT_COLUMNS = [
  'Colaborador',
  'Código',
  'Fecha',
  'Método',
  'CuentaOrigen',
  'CuentaDestino',
  'Monto',
  'Moneda',
  'Referencia',
  'Estado',
  'Usuario',
];

const LINE_SUPPORT_SUMMARY_COLUMNS = ['Campo', 'Valor'];

const LINE_SUPPORT_DETAIL_COLUMNS = [
  'Fecha',
  'Factura',
  'Cliente',
  'Servicio',
  'Referencia',
  'Base',
  'Tasa',
  'Regla',
  'Fórmula',
  'Comisión',
  'Retroactiva',
  'AjusteManual',
  'Deducción',
  'Total',
  'CorteOriginal',
  'Moneda',
];

const getEmployeeName = (
  row: HrEmployeePaymentRecord | HrPayrollEmployeeLineRecord,
): string =>
  row.employeeNameSnapshot || row.employeeCode || row.employeeId || 'N/A';

const getEmployeeCode = (
  row: HrEmployeePaymentRecord | HrPayrollEmployeeLineRecord,
): string => row.employeeCode || row.employeeId || 'N/A';

const getPaymentReference = (payment: HrEmployeePaymentRecord): string =>
  payment.reference ||
  payment.transferReference ||
  payment.checkNumber ||
  payment.bankAccountId ||
  payment.cashAccountId ||
  '-';

const getPaymentAccountReference = (payment: HrEmployeePaymentRecord): string =>
  payment.bankAccountId || payment.cashAccountId || payment.cashCountId || '-';

const getPaymentDestinationReference = (
  row: HrEmployeePaymentRecord | HrPayrollEmployeeLineRecord,
): string =>
  formatHrDepositAccount({
    depositAccount: row.depositAccount,
    paymentDestination: row.paymentDestination,
  });

const getPeriodLabel = (period: HrCommissionPeriodRecord | null): string =>
  period?.label || period?.periodKey || period?.id || 'Corte seleccionado';

const formatPaymentMethod = (
  method?: HrEmployeePaymentRecord['paymentMethod'] | null,
): string => (method ? HR_PAYMENT_METHOD_LABELS[method] : '-');

const getLineDeductionAmount = (line: HrPayrollEmployeeLineRecord): number =>
  line.deductionsAmount ||
  Math.max(0, (line.grossAmount || line.commissionAmount) - line.netAmount);

const getLineAdjustmentComment = (line: HrPayrollEmployeeLineRecord): string =>
  line.manualAdjustmentComment || '-';

const formatPdfMoney = (amount: number, currency = 'DOP'): string =>
  formatHrMoney(Number(amount || 0), currency);

const toMoneyNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const formatRate = (entry: HrCommissionEntryRecord): string => {
  if (entry.rateType === 'percentage') {
    return `${new Intl.NumberFormat('es-DO', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(Number(entry.rateValue || 0))}%`;
  }
  return formatPdfMoney(entry.rateValue, entry.currency);
};

const getEntrySourceReference = (entry: HrCommissionEntryRecord): string =>
  entry.sourceCommissionId ||
  entry.invoiceItemId ||
  entry.invoiceId ||
  entry.id;

const getEntryOriginalCut = (entry: HrCommissionEntryRecord): string =>
  entry.originalPeriodLabel ||
  entry.originalPeriodId ||
  (entry.isRetroactive ? 'Corte anterior' : '-');

const getEntryManualAdjustment = (entry: HrCommissionEntryRecord): number =>
  toMoneyNumber(entry.manualAdjustmentAmount ?? entry.adjustmentAmount);

const getEntryDeduction = (entry: HrCommissionEntryRecord): number =>
  toMoneyNumber(entry.deductionAmount ?? entry.deductionsAmount);

const getEntryIsRetroactive = (
  entry: HrCommissionEntryRecord,
  line?: HrPayrollEmployeeLineRecord,
): boolean =>
  Boolean(entry.isRetroactive || line?.retroactiveEntryIds?.includes(entry.id));

const getEntryNormalCommission = (
  entry: HrCommissionEntryRecord,
  isRetroactive: boolean,
): number => (isRetroactive ? 0 : entry.commissionAmount);

const getEntryRetroactiveAdjustment = (
  entry: HrCommissionEntryRecord,
  isRetroactive: boolean,
): number => (isRetroactive ? entry.commissionAmount : 0);

const getEntryTotal = (
  entry: HrCommissionEntryRecord,
  isRetroactive: boolean,
): number =>
  getEntryNormalCommission(entry, isRetroactive) +
  getEntryRetroactiveAdjustment(entry, isRetroactive) -
  getEntryManualAdjustment(entry) -
  getEntryDeduction(entry);

const getEntryRuleLabel = (entry: HrCommissionEntryRecord): string =>
  entry.commissionRuleNameSnapshot ||
  entry.commissionRuleId ||
  entry.calculationBase ||
  'Regla general';

const buildEntryFormula = (
  entry: HrCommissionEntryRecord,
  isRetroactive: boolean,
): string => {
  if (isRetroactive) {
    return `Retroactiva ${formatPdfMoney(
      entry.commissionAmount,
      entry.currency,
    )} desde ${getEntryOriginalCut(entry)}`;
  }

  const base = formatPdfMoney(entry.baseAmount, entry.currency);
  const rate = formatRate(entry);
  const commission = formatPdfMoney(entry.commissionAmount, entry.currency);
  const formula =
    entry.rateType === 'percentage'
      ? `${base} x ${rate} = ${commission}`
      : `${base} · fijo ${rate} = ${commission}`;
  const total = getEntryTotal(entry, isRetroactive);

  if (
    getEntryManualAdjustment(entry) > 0 ||
    getEntryDeduction(entry) > 0 ||
    total !== entry.commissionAmount
  ) {
    return `${formula} | total ${formatPdfMoney(total, entry.currency)}`;
  }

  return formula;
};

const buildLineFormula = (line: HrPayrollEmployeeLineRecord): string => {
  const currency = line.currency;
  const parts = [
    `Comisión normal ${formatPdfMoney(line.commissionAmount, currency)}`,
  ];
  const retroactiveAdjustmentAmount = getLineRetroactiveAdjustmentAmount(line);
  const deductionAmount = getLineDeductionAmount(line);
  const adjustmentAmount = getLineAdjustmentAmount(line);

  if (retroactiveAdjustmentAmount > 0) {
    parts.push(
      `+ retroactiva ${formatPdfMoney(retroactiveAdjustmentAmount, currency)}`,
    );
  }

  if (deductionAmount > 0) {
    parts.push(`- deducciones ${formatPdfMoney(deductionAmount, currency)}`);
  }

  if (adjustmentAmount > 0) {
    parts.push(
      `+/- ajuste manual ${formatPdfMoney(adjustmentAmount, currency)}`,
    );
  }

  return `${parts.join(' ')} = neto confirmado ${formatPdfMoney(
    line.netAmount,
    currency,
  )}`;
};

const sanitizeFileNamePart = (value: string): string => {
  const cleanValue = normalizeText(value)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleanValue || 'corte';
};

const createPdfDocument = async (mode: HrCommissionPeriodsPdfMode) => {
  const { jsPDF } = await import('jspdf');
  const { applyPlugin } = await import('jspdf-autotable');
  applyPlugin(jsPDF);

  return new jsPDF({
    orientation: mode === 'general' ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'letter',
  }) as import('jspdf').jsPDF & {
    autoTable: (options: UserOptions) => void;
    lastAutoTable?: { finalY?: number };
  };
};

const addPdfHeader = (
  doc: import('jspdf').jsPDF,
  title: string,
  subtitle: string,
) => {
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(subtitle, 14, 22);
};

const addPdfFooter = (doc: import('jspdf').jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.text(`Página ${page} de ${pageCount}`, width / 2, height - 8, {
      align: 'center',
    });
  }
};

const addSummaryTable = (
  doc: Awaited<ReturnType<typeof createPdfDocument>>,
  rows: string[][],
  startY: number,
) => {
  doc.autoTable({
    body: rows,
    margin: { left: 14, right: 14 },
    startY,
    styles: { cellPadding: 2, fontSize: 8, textColor: [31, 41, 55] },
    theme: 'plain',
  });
};

const addPaymentsPdfTable = (
  doc: Awaited<ReturnType<typeof createPdfDocument>>,
  payments: HrEmployeePaymentRecord[],
  startY: number,
): number => {
  if (!payments.length) return startY;

  const pageHeight = doc.internal.pageSize.getHeight();
  let safeStartY = startY;
  if (safeStartY > pageHeight - 60) {
    doc.addPage();
    safeStartY = 16;
  }

  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text('Pagos registrados', 14, safeStartY);
  doc.autoTable({
    body: payments.map((payment) => [
      getEmployeeName(payment),
      getEmployeeCode(payment),
      formatHrDate(payment.paymentDate),
      formatPaymentMethod(payment.paymentMethod),
      getPaymentAccountReference(payment),
      getPaymentDestinationReference(payment),
      getPaymentReference(payment),
      HR_EMPLOYEE_PAYMENT_STATUS_LABELS[payment.status],
      formatPdfMoney(payment.amount, payment.currency),
    ]),
    head: [
      [
        'Colaborador',
        'Código',
        'Fecha',
        'Método',
        'Cuenta origen',
        'Cuenta destino',
        'Referencia',
        'Estado',
        'Monto',
      ],
    ],
    headStyles: { fillColor: [31, 41, 55], textColor: 255 },
    margin: { left: 14, right: 14 },
    startY: safeStartY + 5,
    styles: { cellPadding: 2, fontSize: 7 },
    theme: 'striped',
  });

  return (doc.lastAutoTable?.finalY ?? safeStartY) + 10;
};

const getEntryMatchesLine = (
  entry: HrCommissionEntryRecord,
  line: HrPayrollEmployeeLineRecord,
): boolean =>
  entry.payrollEmployeeLineId === line.id ||
  line.commissionEntryIds.includes(entry.id) ||
  (line.retroactiveEntryIds ?? []).includes(entry.id) ||
  (entry.periodId === line.periodId && entry.employeeId === line.employeeId);

const mapDetailEntryRow = (
  entry: HrCommissionEntryRecord,
  line?: HrPayrollEmployeeLineRecord,
): HrCommissionPeriodDetailPdfRow => {
  const isRetroactive = getEntryIsRetroactive(entry, line);

  return {
    Fecha: formatHrDate(entry.date),
    Factura: entry.invoiceNumber || entry.invoiceId || '-',
    Cliente: entry.customerNameSnapshot || entry.customerId || '-',
    Servicio: entry.serviceName || entry.invoiceItemId || '-',
    Referencia: getEntrySourceReference(entry),
    Base: formatPdfMoney(entry.baseAmount, entry.currency),
    Porcentaje: formatRate(entry),
    Regla: getEntryRuleLabel(entry),
    Fórmula: buildEntryFormula(entry, isRetroactive),
    Comisión: formatPdfMoney(
      getEntryNormalCommission(entry, isRetroactive),
      entry.currency,
    ),
    Retroactiva: formatPdfMoney(
      getEntryRetroactiveAdjustment(entry, isRetroactive),
      entry.currency,
    ),
    AjusteManual: formatPdfMoney(
      getEntryManualAdjustment(entry),
      entry.currency,
    ),
    Deducción: formatPdfMoney(getEntryDeduction(entry), entry.currency),
    Total: formatPdfMoney(getEntryTotal(entry, isRetroactive), entry.currency),
    CorteOriginal: getEntryOriginalCut(entry),
  };
};

const configureSheet = <T extends Record<string, unknown>>({
  columns,
  currencyColumns = [],
  numberColumns = [],
  rows,
  sheet,
  title,
}: {
  columns: string[];
  currencyColumns?: string[];
  numberColumns?: string[];
  rows: T[];
  sheet: Worksheet;
  title: string;
}) => {
  sheet.columns = columns.map((column) => ({
    header: column,
    key: column,
    width: Math.max(12, column.length + 4),
  }));

  rows.forEach((row) => sheet.addRow(row));
  applyProfessionalStyling(sheet, rows.length);
  addReportHeader(sheet, title);
  formatCurrencyColumns(sheet, columns, currencyColumns);
  formatNumberColumns(sheet, columns, numberColumns);
};

export const buildHrCommissionPeriodsFileName = (
  selectedPeriod: HrCommissionPeriodRecord | null = null,
): string => {
  if (!selectedPeriod) return 'cortes_comisiones_rrhh.xlsx';
  return `cortes_comisiones_rrhh_${sanitizeFileNamePart(
    getPeriodLabel(selectedPeriod),
  )}.xlsx`;
};

export const buildHrCommissionPeriodsPdfFileName = ({
  employeeName,
  mode,
  selectedPeriod,
}: {
  employeeName?: string | null;
  mode: HrCommissionPeriodsPdfMode;
  selectedPeriod: HrCommissionPeriodRecord | null;
}): string => {
  const periodPart = sanitizeFileNamePart(getPeriodLabel(selectedPeriod));
  if (mode === 'employee') {
    const employeePart = sanitizeFileNamePart(employeeName || 'colaborador');
    return `comision_individual_${employeePart}_${periodPart}.pdf`;
  }
  return `corte_comisiones_rrhh_${mode}_${periodPart}.pdf`;
};

export const buildHrCommissionLineSupportFileName = ({
  employeeLine,
  selectedPeriod,
}: {
  employeeLine: HrPayrollEmployeeLineRecord;
  selectedPeriod: HrCommissionPeriodRecord | null;
}): string => {
  const employeePart = sanitizeFileNamePart(getEmployeeName(employeeLine));
  const periodPart = sanitizeFileNamePart(getPeriodLabel(selectedPeriod));
  return `comision_individual_${employeePart}_${periodPart}.xlsx`;
};

export const buildHrCommissionPeriodExportRows = (
  periods: HrCommissionPeriodRecord[],
): HrCommissionPeriodExportRow[] =>
  periods.map((period) => ({
    Corte: period.label || period.periodKey || period.id,
    Desde: formatHrPeriodDate(period, 'start'),
    Hasta: formatHrPeriodDate(period, 'end'),
    Estado: HR_COMMISSION_PERIOD_STATUS_LABELS[period.status],
    Colaboradores: period.employeesCount,
    Comisiones: period.entriesCount,
    Retroactivas: period.retroactiveAdjustmentsCount ?? 0,
    AjusteRetroactivo: period.retroactiveAdjustmentAmount ?? 0,
    Deducciones: period.deductionsAmount ?? 0,
    Total: getPeriodPayableAmount(period),
    Moneda: period.currency,
    Nómina: period.payrollRunId || '-',
  }));

export const buildHrCommissionLineExportRows = (
  lines: HrPayrollEmployeeLineRecord[],
): HrCommissionLineExportRow[] =>
  lines.map((line) => ({
    Colaborador: getEmployeeName(line),
    Código: getEmployeeCode(line),
    Entradas: line.entriesCount,
    Estado: HR_PAYROLL_RUN_STATUS_LABELS[line.status],
    Comisión: line.commissionAmount,
    AjusteRetroactivo: getLineRetroactiveAdjustmentAmount(line),
    Deducciones: getLineDeductionAmount(line),
    Ajuste: getLineAdjustmentAmount(line),
    Neto: line.netAmount,
    Moneda: line.currency,
    Método: formatPaymentMethod(line.paymentMethod),
    CuentaDestino: getPaymentDestinationReference(line),
    PagadoEl: formatHrDate(line.paidAt),
    Comentario: getLineAdjustmentComment(line),
  }));

export const buildHrEmployeePaymentExportRows = (
  payments: HrEmployeePaymentRecord[],
): HrEmployeePaymentExportRow[] =>
  payments.map((payment) => ({
    Colaborador: getEmployeeName(payment),
    Código: getEmployeeCode(payment),
    Fecha: formatHrDate(payment.paymentDate),
    Método: formatPaymentMethod(payment.paymentMethod),
    CuentaOrigen: getPaymentAccountReference(payment),
    CuentaDestino: getPaymentDestinationReference(payment),
    Monto: payment.amount,
    Moneda: payment.currency,
    Referencia: getPaymentReference(payment),
    Estado: HR_EMPLOYEE_PAYMENT_STATUS_LABELS[payment.status],
    Usuario: payment.createdBy || '-',
  }));

const getLineEntries = (
  entries: HrCommissionEntryRecord[],
  employeeLine: HrPayrollEmployeeLineRecord,
): HrCommissionEntryRecord[] =>
  entries.filter((entry) => getEntryMatchesLine(entry, employeeLine));

const getLinePayments = (
  payments: HrEmployeePaymentRecord[],
  employeeLine: HrPayrollEmployeeLineRecord,
): HrEmployeePaymentRecord[] =>
  payments.filter(
    (payment) =>
      payment.payrollLineId === employeeLine.id ||
      payment.employeeId === employeeLine.employeeId,
  );

export const buildHrCommissionLineSupportSummaryRows = ({
  employeeLine,
  entries,
  selectedPeriod,
}: {
  employeeLine: HrPayrollEmployeeLineRecord;
  entries: HrCommissionEntryRecord[];
  selectedPeriod: HrCommissionPeriodRecord;
}): HrCommissionLineSupportSummaryRow[] => {
  const lineEntries = getLineEntries(entries, employeeLine);
  const baseAmount = lineEntries.reduce(
    (sum, entry) => sum + entry.baseAmount,
    0,
  );

  return [
    { Campo: 'Colaborador', Valor: getEmployeeName(employeeLine) },
    { Campo: 'Código', Valor: getEmployeeCode(employeeLine) },
    {
      Campo: 'Cuenta destino',
      Valor: getPaymentDestinationReference(employeeLine),
    },
    { Campo: 'Corte', Valor: getPeriodLabel(selectedPeriod) },
    {
      Campo: 'Rango',
      Valor: `${formatHrPeriodDate(
        selectedPeriod,
        'start',
      )} - ${formatHrPeriodDate(selectedPeriod, 'end')}`,
    },
    {
      Campo: 'Estado del corte',
      Valor: HR_COMMISSION_PERIOD_STATUS_LABELS[selectedPeriod.status],
    },
    {
      Campo: 'Estado de la comisión',
      Valor: HR_PAYROLL_RUN_STATUS_LABELS[employeeLine.status],
    },
    {
      Campo: 'Entradas',
      Valor: String(lineEntries.length || employeeLine.entriesCount),
    },
    {
      Campo: 'Base comisionable',
      Valor: formatPdfMoney(baseAmount, employeeLine.currency),
    },
    {
      Campo: 'Comisión normal',
      Valor: formatPdfMoney(
        employeeLine.commissionAmount,
        employeeLine.currency,
      ),
    },
    {
      Campo: 'Retroactiva',
      Valor: formatPdfMoney(
        getLineRetroactiveAdjustmentAmount(employeeLine),
        employeeLine.currency,
      ),
    },
    {
      Campo: 'Deducciones',
      Valor: formatPdfMoney(
        getLineDeductionAmount(employeeLine),
        employeeLine.currency,
      ),
    },
    {
      Campo: 'Ajuste manual',
      Valor: formatPdfMoney(
        getLineAdjustmentAmount(employeeLine),
        employeeLine.currency,
      ),
    },
    {
      Campo: 'Neto a pagar',
      Valor: formatPdfMoney(employeeLine.netAmount, employeeLine.currency),
    },
    {
      Campo: 'Pendiente',
      Valor: formatPdfMoney(
        getLinePendingAmount(employeeLine),
        employeeLine.currency,
      ),
    },
    { Campo: 'Fórmula', Valor: buildLineFormula(employeeLine) },
    { Campo: 'Comentario', Valor: getLineAdjustmentComment(employeeLine) },
  ];
};

export const buildHrCommissionLineSupportDetailRows = ({
  employeeLine,
  entries,
}: {
  employeeLine: HrPayrollEmployeeLineRecord;
  entries: HrCommissionEntryRecord[];
}): HrCommissionLineSupportDetailRow[] =>
  getLineEntries(entries, employeeLine).map((entry) => {
    const isRetroactive = getEntryIsRetroactive(entry, employeeLine);

    return {
      Fecha: formatHrDate(entry.date),
      Factura: entry.invoiceNumber || entry.invoiceId || '-',
      Cliente: entry.customerNameSnapshot || entry.customerId || '-',
      Servicio: entry.serviceName || entry.invoiceItemId || '-',
      Referencia: getEntrySourceReference(entry),
      Base: entry.baseAmount,
      Tasa: formatRate(entry),
      Regla: getEntryRuleLabel(entry),
      Fórmula: buildEntryFormula(entry, isRetroactive),
      Comisión: getEntryNormalCommission(entry, isRetroactive),
      Retroactiva: getEntryRetroactiveAdjustment(entry, isRetroactive),
      AjusteManual: getEntryManualAdjustment(entry),
      Deducción: getEntryDeduction(entry),
      Total: getEntryTotal(entry, isRetroactive),
      CorteOriginal: getEntryOriginalCut(entry),
      Moneda: entry.currency,
    };
  });

export const buildHrCommissionPeriodGeneralPdfRows = (
  lines: HrPayrollEmployeeLineRecord[],
): HrCommissionPeriodGeneralPdfRow[] =>
  lines.map((line) => ({
    Colaborador: getEmployeeName(line),
    Código: getEmployeeCode(line),
    Entradas: String(line.entriesCount),
    Estado: HR_PAYROLL_RUN_STATUS_LABELS[line.status],
    Comisión: formatPdfMoney(line.commissionAmount, line.currency),
    AjusteRetroactivo: formatPdfMoney(
      getLineRetroactiveAdjustmentAmount(line),
      line.currency,
    ),
    Deducciones: formatPdfMoney(getLineDeductionAmount(line), line.currency),
    Neto: formatPdfMoney(line.netAmount, line.currency),
    Comentario: getLineAdjustmentComment(line),
  }));

const buildHrCommissionPeriodEmployeePdfGroup = ({
  entries,
  line,
}: {
  entries: HrCommissionEntryRecord[];
  line: HrPayrollEmployeeLineRecord;
}): HrCommissionPeriodEmployeePdfGroup => {
  const lineEntries = entries.filter((entry) =>
    getEntryMatchesLine(entry, line),
  );

  return {
    Colaborador: getEmployeeName(line),
    Código: getEmployeeCode(line),
    Entradas: String(lineEntries.length || line.entriesCount),
    Estado: HR_PAYROLL_RUN_STATUS_LABELS[line.status],
    Comisión: formatPdfMoney(line.commissionAmount, line.currency),
    AjusteRetroactivo: formatPdfMoney(
      getLineRetroactiveAdjustmentAmount(line),
      line.currency,
    ),
    Deducciones: formatPdfMoney(getLineDeductionAmount(line), line.currency),
    AjusteManual: formatPdfMoney(getLineAdjustmentAmount(line), line.currency),
    Neto: formatPdfMoney(line.netAmount, line.currency),
    Pendiente: formatPdfMoney(getLinePendingAmount(line), line.currency),
    Fórmula: buildLineFormula(line),
    Comentario: getLineAdjustmentComment(line),
    rows: lineEntries.map((entry) => mapDetailEntryRow(entry, line)),
  };
};

export const buildHrCommissionPeriodEmployeeSupportPdfGroup = ({
  employeeLine,
  entries,
}: {
  employeeLine: HrPayrollEmployeeLineRecord;
  entries: HrCommissionEntryRecord[];
}): HrCommissionPeriodEmployeePdfGroup =>
  buildHrCommissionPeriodEmployeePdfGroup({
    entries,
    line: employeeLine,
  });

export const buildHrCommissionPeriodEmployeePdfGroups = ({
  entries,
  employeeLines,
}: {
  entries: HrCommissionEntryRecord[];
  employeeLines: HrPayrollEmployeeLineRecord[];
}): HrCommissionPeriodEmployeePdfGroup[] => {
  const usedEntryIds = new Set<string>();
  const groups = employeeLines.map((line) => {
    const lineEntries = entries.filter((entry) =>
      getEntryMatchesLine(entry, line),
    );
    lineEntries.forEach((entry) => usedEntryIds.add(entry.id));
    return buildHrCommissionPeriodEmployeePdfGroup({ entries, line });
  });

  entries
    .filter((entry) => !usedEntryIds.has(entry.id))
    .forEach((entry) => {
      groups.push({
        Colaborador:
          entry.employeeNameSnapshot ||
          entry.employeeCode ||
          entry.employeeId ||
          'N/A',
        Código: entry.employeeCode || entry.employeeId || 'N/A',
        Entradas: '1',
        Estado: 'Sin línea',
        Comisión: formatPdfMoney(entry.commissionAmount, entry.currency),
        AjusteRetroactivo: '-',
        Deducciones: '-',
        AjusteManual: '-',
        Neto: formatPdfMoney(entry.commissionAmount, entry.currency),
        Pendiente: '-',
        Fórmula: buildEntryFormula(entry, Boolean(entry.isRetroactive)),
        Comentario: '-',
        rows: [mapDetailEntryRow(entry)],
      });
    });

  return groups.sort((left, right) =>
    left.Colaborador.localeCompare(right.Colaborador),
  );
};

export const exportHrCommissionPeriodsWorkbook = async ({
  employeeLines,
  payments,
  periods,
  selectedPeriod,
}: {
  employeeLines: HrPayrollEmployeeLineRecord[];
  payments: HrEmployeePaymentRecord[];
  periods: HrCommissionPeriodRecord[];
  selectedPeriod: HrCommissionPeriodRecord | null;
}) => {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const selectedPeriodLabel =
    selectedPeriod?.label || selectedPeriod?.periodKey || selectedPeriod?.id;

  configureSheet({
    columns: PERIOD_COLUMNS,
    currencyColumns: ['AjusteRetroactivo', 'Deducciones', 'Total'],
    numberColumns: ['Colaboradores', 'Comisiones', 'Retroactivas'],
    rows: buildHrCommissionPeriodExportRows(periods),
    sheet: workbook.addWorksheet('Cortes'),
    title: 'Cortes de comisiones RRHH',
  });

  configureSheet({
    columns: LINE_COLUMNS,
    currencyColumns: [
      'Comisión',
      'AjusteRetroactivo',
      'Deducciones',
      'Ajuste',
      'Neto',
    ],
    numberColumns: ['Entradas'],
    rows: selectedPeriod ? buildHrCommissionLineExportRows(employeeLines) : [],
    sheet: workbook.addWorksheet('Colaboradores'),
    title: selectedPeriodLabel
      ? `Detalle de colaboradores - ${selectedPeriodLabel}`
      : 'Detalle de colaboradores',
  });

  configureSheet({
    columns: PAYMENT_COLUMNS,
    currencyColumns: ['Monto'],
    rows: selectedPeriod ? buildHrEmployeePaymentExportRows(payments) : [],
    sheet: workbook.addWorksheet('Pagos'),
    title: selectedPeriodLabel
      ? `Pagos registrados - ${selectedPeriodLabel}`
      : 'Pagos registrados',
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveXlsxFile({
    content: buffer,
    fileName: buildHrCommissionPeriodsFileName(selectedPeriod),
  });
};

export const exportHrCommissionLineSupportWorkbook = async ({
  employeeLineId,
  employeeLines,
  entries,
  payments = [],
  selectedPeriod,
}: {
  employeeLineId: string;
  employeeLines: HrPayrollEmployeeLineRecord[];
  entries: HrCommissionEntryRecord[];
  payments?: HrEmployeePaymentRecord[];
  selectedPeriod: HrCommissionPeriodRecord | null;
}) => {
  if (!selectedPeriod) {
    throw new Error('Selecciona un corte para exportar.');
  }

  const employeeLine = employeeLines.find((line) => line.id === employeeLineId);
  if (!employeeLine) {
    throw new Error('No encontramos la comisión individual seleccionada.');
  }

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const employeeName = getEmployeeName(employeeLine);
  const employeePayments = getLinePayments(payments, employeeLine);

  configureSheet({
    columns: LINE_SUPPORT_SUMMARY_COLUMNS,
    rows: buildHrCommissionLineSupportSummaryRows({
      employeeLine,
      entries,
      selectedPeriod,
    }),
    sheet: workbook.addWorksheet('Resumen'),
    title: `Comisión individual - ${employeeName}`,
  });

  configureSheet({
    columns: LINE_SUPPORT_DETAIL_COLUMNS,
    currencyColumns: [
      'Base',
      'Comisión',
      'Retroactiva',
      'AjusteManual',
      'Deducción',
      'Total',
    ],
    rows: buildHrCommissionLineSupportDetailRows({
      employeeLine,
      entries,
    }),
    sheet: workbook.addWorksheet('Entradas'),
    title: `Entradas comisionables - ${employeeName}`,
  });

  configureSheet({
    columns: PAYMENT_COLUMNS,
    currencyColumns: ['Monto'],
    rows: buildHrEmployeePaymentExportRows(employeePayments),
    sheet: workbook.addWorksheet('Pagos'),
    title: `Pagos registrados - ${employeeName}`,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveXlsxFile({
    content: buffer,
    fileName: buildHrCommissionLineSupportFileName({
      employeeLine,
      selectedPeriod,
    }),
  });
};

const exportHrCommissionPeriodGeneralPdf = async ({
  employeeLines,
  payments,
  selectedPeriod,
}: {
  employeeLines: HrPayrollEmployeeLineRecord[];
  payments: HrEmployeePaymentRecord[];
  selectedPeriod: HrCommissionPeriodRecord;
}) => {
  const doc = await createPdfDocument('general');
  const periodLabel = getPeriodLabel(selectedPeriod);
  const rows = buildHrCommissionPeriodGeneralPdfRows(employeeLines);

  addPdfHeader(
    doc,
    'Corte de comisiones RRHH',
    `Resumen general - ${periodLabel}`,
  );
  addSummaryTable(
    doc,
    [
      ['Desde', formatHrPeriodDate(selectedPeriod, 'start')],
      ['Hasta', formatHrPeriodDate(selectedPeriod, 'end')],
      ['Estado', HR_COMMISSION_PERIOD_STATUS_LABELS[selectedPeriod.status]],
      ['Colaboradores', String(selectedPeriod.employeesCount)],
      ['Comisiones', String(selectedPeriod.entriesCount)],
      [
        'Ajustes retroactivos',
        formatPdfMoney(
          selectedPeriod.retroactiveAdjustmentAmount ?? 0,
          selectedPeriod.currency,
        ),
      ],
      [
        'Total corte',
        formatPdfMoney(
          getPeriodPayableAmount(selectedPeriod),
          selectedPeriod.currency,
        ),
      ],
    ],
    28,
  );
  doc.autoTable({
    body: rows.map((row) => [
      row.Colaborador,
      row.Código,
      row.Entradas,
      row.Estado,
      row.Comisión,
      row.AjusteRetroactivo,
      row.Deducciones,
      row.Comentario,
      row.Neto,
    ]),
    head: [
      [
        'Colaborador',
        'Código',
        'Entradas',
        'Estado',
        'Comisión',
        'Retroactiva',
        'Deducciones',
        'Comentario',
        'Neto',
      ],
    ],
    headStyles: { fillColor: [31, 41, 55], textColor: 255 },
    margin: { left: 14, right: 14 },
    startY: (doc.lastAutoTable?.finalY ?? 46) + 8,
    styles: { cellPadding: 2, fontSize: 7 },
    theme: 'striped',
  });
  addPaymentsPdfTable(doc, payments, (doc.lastAutoTable?.finalY ?? 46) + 10);
  addPdfFooter(doc);
  doc.save(
    buildHrCommissionPeriodsPdfFileName({
      mode: 'general',
      selectedPeriod,
    }),
  );
};

const buildEmployeeDetailTableBody = (
  group: HrCommissionPeriodEmployeePdfGroup,
): string[][] => {
  if (!group.rows.length) {
    return [
      [
        '-',
        '-',
        'Sin entradas detalladas enlazadas a esta comisión.',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
      ],
    ];
  }

  return group.rows.map((row) => [
    row.Fecha,
    row.Factura,
    row.Servicio,
    row.Base,
    row.Porcentaje,
    row.Regla,
    row.Comisión,
    row.Retroactiva,
    row.AjusteManual,
    row.Deducción,
    row.Total,
    row.CorteOriginal,
  ]);
};

const addEmployeeDetailPdfTable = (
  doc: Awaited<ReturnType<typeof createPdfDocument>>,
  group: HrCommissionPeriodEmployeePdfGroup,
  startY: number,
): number => {
  doc.autoTable({
    body: buildEmployeeDetailTableBody(group),
    head: [
      [
        'Fecha',
        'Factura',
        'Servicio',
        'Base',
        'Tasa',
        'Regla',
        'Comisión',
        'Retro.',
        'Ajuste',
        'Deduc.',
        'Total',
        'Origen',
      ],
    ],
    headStyles: { fillColor: [31, 41, 55], textColor: 255 },
    margin: { left: 14, right: 14 },
    startY,
    styles: { cellPadding: 1.7, fontSize: 6.3 },
    theme: 'striped',
  });

  return (doc.lastAutoTable?.finalY ?? startY) + 10;
};

const addEmployeeSupportBlock = (
  doc: Awaited<ReturnType<typeof createPdfDocument>>,
  group: HrCommissionPeriodEmployeePdfGroup,
  startY: number,
): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  let safeStartY = startY;
  if (safeStartY > pageHeight - 60) {
    doc.addPage();
    safeStartY = 16;
  }

  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(`${group.Colaborador} (${group.Código})`, 14, safeStartY);
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text(
    `Estado: ${group.Estado} | Entradas: ${group.Entradas} | Comisión: ${group.Comisión} | Neto: ${group.Neto} | Pendiente: ${group.Pendiente}`,
    14,
    safeStartY + 5,
  );

  const formulaLines = doc.splitTextToSize(`Fórmula: ${group.Fórmula}`, 252);
  doc.text(formulaLines, 14, safeStartY + 10);
  let tableStartY = safeStartY + 10 + formulaLines.length * 4;

  if (group.Comentario !== '-') {
    const commentLines = doc.splitTextToSize(
      `Comentario: ${group.Comentario}`,
      252,
    );
    doc.text(commentLines, 14, tableStartY + 2);
    tableStartY += commentLines.length * 4 + 2;
  }

  return addEmployeeDetailPdfTable(doc, group, tableStartY + 4);
};

const exportHrCommissionPeriodDetailPdf = async ({
  employeeLines,
  entries,
  payments,
  selectedPeriod,
}: {
  employeeLines: HrPayrollEmployeeLineRecord[];
  entries: HrCommissionEntryRecord[];
  payments: HrEmployeePaymentRecord[];
  selectedPeriod: HrCommissionPeriodRecord;
}) => {
  const doc = await createPdfDocument('detail');
  const periodLabel = getPeriodLabel(selectedPeriod);
  const groups = buildHrCommissionPeriodEmployeePdfGroups({
    employeeLines,
    entries,
  });
  let nextY = 28;

  addPdfHeader(
    doc,
    'Detalle auditable de comisiones',
    `Corte completo - ${periodLabel}`,
  );
  addSummaryTable(
    doc,
    [
      ['Desde', formatHrPeriodDate(selectedPeriod, 'start')],
      ['Hasta', formatHrPeriodDate(selectedPeriod, 'end')],
      ['Estado', HR_COMMISSION_PERIOD_STATUS_LABELS[selectedPeriod.status]],
      ['Colaboradores', String(groups.length)],
      ['Comisiones', String(entries.length || selectedPeriod.entriesCount)],
      [
        'Base comisionable',
        formatPdfMoney(
          entries.reduce((sum, entry) => sum + entry.baseAmount, 0),
          selectedPeriod.currency,
        ),
      ],
      [
        'Ajustes retroactivos',
        formatPdfMoney(
          selectedPeriod.retroactiveAdjustmentAmount ?? 0,
          selectedPeriod.currency,
        ),
      ],
      [
        'Total corte',
        formatPdfMoney(
          getPeriodPayableAmount(selectedPeriod),
          selectedPeriod.currency,
        ),
      ],
      [
        'Criterio',
        'Base x tasa por entrada; retroactivas, ajustes y deducciones separados.',
      ],
    ],
    nextY,
  );
  nextY = (doc.lastAutoTable?.finalY ?? nextY) + 8;

  groups.forEach((group) => {
    nextY = addEmployeeSupportBlock(doc, group, nextY);
  });

  addPaymentsPdfTable(doc, payments, nextY);
  addPdfFooter(doc);
  doc.save(
    buildHrCommissionPeriodsPdfFileName({
      mode: 'detail',
      selectedPeriod,
    }),
  );
};

const exportHrCommissionPeriodEmployeePdf = async ({
  employeeLineId,
  employeeLines,
  entries,
  payments,
  selectedPeriod,
}: {
  employeeLineId: string;
  employeeLines: HrPayrollEmployeeLineRecord[];
  entries: HrCommissionEntryRecord[];
  payments: HrEmployeePaymentRecord[];
  selectedPeriod: HrCommissionPeriodRecord;
}) => {
  const employeeLine = employeeLines.find((line) => line.id === employeeLineId);
  if (!employeeLine) {
    throw new Error('No encontramos la comisión individual seleccionada.');
  }

  const doc = await createPdfDocument('employee');
  const periodLabel = getPeriodLabel(selectedPeriod);
  const group = buildHrCommissionPeriodEmployeeSupportPdfGroup({
    employeeLine,
    entries,
  });
  const employeePayments = payments.filter(
    (payment) =>
      payment.payrollLineId === employeeLine.id ||
      payment.employeeId === employeeLine.employeeId,
  );

  addPdfHeader(
    doc,
    'Comisión individual',
    `${group.Colaborador} - ${periodLabel}`,
  );
  addSummaryTable(
    doc,
    [
      ['Colaborador', group.Colaborador],
      ['Código', group.Código],
      ['Corte', periodLabel],
      [
        'Rango',
        `${formatHrPeriodDate(selectedPeriod, 'start')} - ${formatHrPeriodDate(
          selectedPeriod,
          'end',
        )}`,
      ],
      [
        'Estado del corte',
        HR_COMMISSION_PERIOD_STATUS_LABELS[selectedPeriod.status],
      ],
      ['Estado de la comisión', group.Estado],
      ['Entradas', group.Entradas],
      ['Comisión normal', group.Comisión],
      ['Retroactiva', group.AjusteRetroactivo],
      ['Deducciones', group.Deducciones],
      ['Ajuste manual', group.AjusteManual],
      ['Neto a pagar', group.Neto],
      ['Pendiente', group.Pendiente],
      ['Fórmula', group.Fórmula],
    ],
    28,
  );

  let nextY = (doc.lastAutoTable?.finalY ?? 46) + 8;
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text('Entradas comisionables', 14, nextY);
  nextY = addEmployeeDetailPdfTable(doc, group, nextY + 5);
  addPaymentsPdfTable(doc, employeePayments, nextY);
  addPdfFooter(doc);
  doc.save(
    buildHrCommissionPeriodsPdfFileName({
      employeeName: group.Colaborador,
      mode: 'employee',
      selectedPeriod,
    }),
  );
};

export const exportHrCommissionPeriodsPdf = async ({
  employeeLineId,
  employeeLines,
  entries,
  mode,
  payments = [],
  selectedPeriod,
}: {
  employeeLineId?: string;
  employeeLines: HrPayrollEmployeeLineRecord[];
  entries: HrCommissionEntryRecord[];
  mode: HrCommissionPeriodsPdfMode;
  payments?: HrEmployeePaymentRecord[];
  selectedPeriod: HrCommissionPeriodRecord | null;
}) => {
  if (!selectedPeriod) {
    throw new Error('Selecciona un corte para exportar.');
  }

  if (mode === 'general') {
    await exportHrCommissionPeriodGeneralPdf({
      employeeLines,
      payments,
      selectedPeriod,
    });
    return;
  }

  if (mode === 'employee') {
    if (!employeeLineId) {
      throw new Error('Selecciona una comisión individual para exportar.');
    }
    await exportHrCommissionPeriodEmployeePdf({
      employeeLineId,
      employeeLines,
      entries,
      payments,
      selectedPeriod,
    });
    return;
  }

  await exportHrCommissionPeriodDetailPdf({
    employeeLines,
    entries,
    payments,
    selectedPeriod,
  });
};
