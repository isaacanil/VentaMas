import { saveAs } from 'file-saver';
import type { Worksheet } from 'exceljs';
import type { UserOptions } from 'jspdf-autotable';

import {
  addReportHeader,
  applyProfessionalStyling,
  formatCurrencyColumns,
  formatNumberColumns,
} from '@/hooks/exportToExcel/exportConfig';
import {
  formatHrDate,
  formatHrPeriodDate,
  formatHrMoney,
  HR_COMMISSION_PERIOD_STATUS_LABELS,
  HR_PAYMENT_METHOD_LABELS,
  HR_PAYROLL_RUN_STATUS_LABELS,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type {
  HrCommissionEntryRecord,
  HrCommissionPeriodRecord,
  HrEmployeePaymentRecord,
  HrEmployeePaymentStatus,
  HrPayrollEmployeeLineRecord,
} from '@/types/hrPayroll';

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
  Deducciones: number;
  Entradas: number;
  Estado: string;
  Método: string;
  Moneda: string;
  Neto: number;
  PagadoEl: string;
};

type HrEmployeePaymentExportRow = {
  CuentaCaja: string;
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

export type HrCommissionPeriodsPdfMode = 'detail' | 'general';

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
  Cliente: string;
  Comisión: string;
  Factura: string;
  Neto: string;
  Porcentaje: string;
  Servicio: string;
};

export type HrCommissionPeriodEmployeePdfGroup = {
  AjusteRetroactivo: string;
  Código: string;
  Colaborador: string;
  Comisión: string;
  Comentario: string;
  Entradas: string;
  Neto: string;
  rows: HrCommissionPeriodDetailPdfRow[];
};

const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const PAYMENT_STATUS_LABELS: Record<HrEmployeePaymentStatus, string> = {
  confirmed: 'Confirmado',
  voided: 'Anulado',
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
  'PagadoEl',
  'Comentario',
];

const PAYMENT_COLUMNS = [
  'Colaborador',
  'Código',
  'Fecha',
  'Método',
  'CuentaCaja',
  'Monto',
  'Moneda',
  'Referencia',
  'Estado',
  'Usuario',
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

const getPaymentAccountReference = (
  payment: HrEmployeePaymentRecord,
): string =>
  payment.bankAccountId ||
  payment.cashAccountId ||
  payment.cashCountId ||
  '-';

const getPeriodLabel = (period: HrCommissionPeriodRecord | null): string =>
  period?.label || period?.periodKey || period?.id || 'Corte seleccionado';

const formatPaymentMethod = (
  method?: HrEmployeePaymentRecord['paymentMethod'] | null,
): string => (method ? HR_PAYMENT_METHOD_LABELS[method] : '-');

const getPeriodPayableAmount = (period: HrCommissionPeriodRecord): number =>
  period.netAmount ?? period.totalPayableAmount ?? period.totalCommissionAmount;

const getLineDeductionAmount = (line: HrPayrollEmployeeLineRecord): number =>
  line.deductionsAmount ||
  Math.max(0, (line.grossAmount || line.commissionAmount) - line.netAmount);

const getLineAdjustmentAmount = (line: HrPayrollEmployeeLineRecord): number =>
  line.manualAdjustmentAmount ?? 0;

const getLineRetroactiveAdjustmentAmount = (
  line: HrPayrollEmployeeLineRecord,
): number => line.retroactiveAdjustmentAmount ?? 0;

const getLineAdjustmentComment = (line: HrPayrollEmployeeLineRecord): string =>
  line.manualAdjustmentComment || '-';

const formatPdfMoney = (amount: number, currency = 'DOP'): string =>
  formatHrMoney(Number(amount || 0), currency);

const formatRate = (entry: HrCommissionEntryRecord): string => {
  if (entry.rateType === 'percentage') {
    return `${new Intl.NumberFormat('es-DO', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(Number(entry.rateValue || 0))}%`;
  }
  return formatPdfMoney(entry.rateValue, entry.currency);
};

const sanitizeFileNamePart = (value: string): string => {
  const cleanValue = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleanValue || 'corte';
};

const createPdfDocument = async (mode: HrCommissionPeriodsPdfMode) => {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  return new jsPDF({
    orientation: mode === 'detail' ? 'landscape' : 'portrait',
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
      getPaymentReference(payment),
      PAYMENT_STATUS_LABELS[payment.status],
      formatPdfMoney(payment.amount, payment.currency),
    ]),
    head: [
      [
        'Colaborador',
        'Código',
        'Fecha',
        'Método',
        'Cuenta/Caja',
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
): HrCommissionPeriodDetailPdfRow => ({
  Factura: entry.invoiceNumber || entry.invoiceId || '-',
  Cliente: entry.customerNameSnapshot || entry.customerId || '-',
  Servicio: entry.serviceName || entry.invoiceItemId || '-',
  Neto: formatPdfMoney(entry.baseAmount, entry.currency),
  Porcentaje: formatRate(entry),
  Comisión: formatPdfMoney(entry.commissionAmount, entry.currency),
});

const configureSheet = <T extends Record<string, unknown>>({
  columns,
  currencyColumns,
  numberColumns = [],
  rows,
  sheet,
  title,
}: {
  columns: string[];
  currencyColumns: string[];
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
  mode,
  selectedPeriod,
}: {
  mode: HrCommissionPeriodsPdfMode;
  selectedPeriod: HrCommissionPeriodRecord | null;
}): string => {
  const periodPart = sanitizeFileNamePart(getPeriodLabel(selectedPeriod));
  return `corte_comisiones_rrhh_${mode}_${periodPart}.pdf`;
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
    CuentaCaja: getPaymentAccountReference(payment),
    Monto: payment.amount,
    Moneda: payment.currency,
    Referencia: getPaymentReference(payment),
    Estado: PAYMENT_STATUS_LABELS[payment.status],
    Usuario: payment.createdBy || '-',
  }));

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
    return {
      Colaborador: getEmployeeName(line),
      Código: getEmployeeCode(line),
      Entradas: String(lineEntries.length || line.entriesCount),
      Comisión: formatPdfMoney(line.commissionAmount, line.currency),
      AjusteRetroactivo: formatPdfMoney(
        getLineRetroactiveAdjustmentAmount(line),
        line.currency,
      ),
      Neto: formatPdfMoney(line.netAmount, line.currency),
      Comentario: getLineAdjustmentComment(line),
      rows: lineEntries.map(mapDetailEntryRow),
    };
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
        Comisión: formatPdfMoney(entry.commissionAmount, entry.currency),
        AjusteRetroactivo: '-',
        Neto: formatPdfMoney(entry.commissionAmount, entry.currency),
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
  saveAs(
    new Blob([buffer], { type: XLSX_MIME_TYPE }),
    buildHrCommissionPeriodsFileName(selectedPeriod),
  );
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
  addPaymentsPdfTable(
    doc,
    payments,
    (doc.lastAutoTable?.finalY ?? 46) + 10,
  );
  addPdfFooter(doc);
  doc.save(
    buildHrCommissionPeriodsPdfFileName({
      mode: 'general',
      selectedPeriod,
    }),
  );
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
    'Corte de comisiones RRHH',
    `Detalle por empleado - ${periodLabel}`,
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
    nextY,
  );
  nextY = (doc.lastAutoTable?.finalY ?? nextY) + 8;

  groups.forEach((group, index) => {
    if (index > 0 && nextY > 170) {
      doc.addPage();
      nextY = 16;
    }

    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(`${group.Colaborador} (${group.Código})`, 14, nextY);
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text(
      `Entradas: ${group.Entradas} | Comisión: ${group.Comisión} | Retroactiva: ${group.AjusteRetroactivo} | Neto: ${group.Neto}`,
      14,
      nextY + 5,
    );
    if (group.Comentario !== '-') {
      doc.text(`Comentario: ${group.Comentario}`, 14, nextY + 10);
    }

    doc.autoTable({
      body: group.rows.map((row) => [
        row.Factura,
        row.Cliente,
        row.Servicio,
        row.Neto,
        row.Porcentaje,
        row.Comisión,
      ]),
      head: [
        ['Número factura', 'Cliente', 'Servicio', 'Neto', '%', 'Comisión'],
      ],
      headStyles: { fillColor: [31, 41, 55], textColor: 255 },
      margin: { left: 14, right: 14 },
      startY: nextY + (group.Comentario !== '-' ? 13 : 8),
      styles: { cellPadding: 2, fontSize: 7 },
      theme: 'striped',
    });
    nextY = (doc.lastAutoTable?.finalY ?? nextY) + 10;
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

export const exportHrCommissionPeriodsPdf = async ({
  employeeLines,
  entries,
  mode,
  payments = [],
  selectedPeriod,
}: {
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

  await exportHrCommissionPeriodDetailPdf({
    employeeLines,
    entries,
    payments,
    selectedPeriod,
  });
};
