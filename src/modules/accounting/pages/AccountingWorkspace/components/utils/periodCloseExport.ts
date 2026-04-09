import {
  addReportHeader,
  applyProfessionalStyling,
  formatCurrencyColumns,
} from '@/hooks/exportToExcel/exportConfig';

import type { AccountingPeriodClosure } from '../../utils/accountingWorkspace';

type PeriodOption = {
  amount: number;
  entries: number;
  label: string;
  periodKey: string;
  status: 'closed' | 'open';
};

type PeriodStatusExportRow = {
  Periodo: string;
  Estado: string;
  Movimientos: number;
  Acumulado: number;
};

type PeriodClosureExportRow = {
  Periodo: string;
  Estado: string;
  Usuario: string;
  CerradoEl: string;
  Nota: string;
};

const downloadWorkbook = async (
  workbook: { xlsx: { writeBuffer: () => Promise<ArrayBuffer> } },
  fileName: string,
) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof (value as { toMillis?: () => number }).toMillis === 'function') {
    const millis = (value as { toMillis: () => number }).toMillis();
    return Number.isFinite(millis) ? new Date(millis) : null;
  }
  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateTime = (value: unknown): string => {
  const date = toDate(value);
  if (!date) return '';

  return date.toLocaleString('es-DO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const buildPeriodCloseExportFileName = (): string =>
  'cierres_contables.xlsx';

export const buildPeriodStatusExportRows = (
  periods: PeriodOption[],
): PeriodStatusExportRow[] =>
  periods.map((period) => ({
    Periodo: period.label,
    Estado: period.status === 'closed' ? 'Cerrado' : 'Abierto',
    Movimientos: period.entries,
    Acumulado: period.amount,
  }));

export const buildPeriodClosureExportRows = (
  closures: AccountingPeriodClosure[],
  periods: PeriodOption[],
): PeriodClosureExportRow[] =>
  closures.map((closure) => ({
    Periodo:
      periods.find((period) => period.periodKey === closure.periodKey)?.label ??
      closure.periodKey,
    Estado: 'Cerrado',
    Usuario: closure.closedBy ?? 'Sistema',
    CerradoEl: formatDateTime(closure.closedAt),
    Nota: closure.note ?? 'Sin observacion',
  }));

export const exportPeriodCloseWorkbook = async ({
  closures,
  periods,
}: {
  closures: AccountingPeriodClosure[];
  periods: PeriodOption[];
}) => {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();

  const periodRows = buildPeriodStatusExportRows(periods);
  const periodSheet = workbook.addWorksheet('Periodos');
  periodSheet.columns = [
    { header: 'Periodo', key: 'Periodo', width: 24 },
    { header: 'Estado', key: 'Estado', width: 14 },
    { header: 'Movimientos', key: 'Movimientos', width: 16 },
    { header: 'Acumulado', key: 'Acumulado', width: 18 },
  ];
  periodRows.forEach((row) => periodSheet.addRow(row));
  applyProfessionalStyling(periodSheet, periodRows.length);
  addReportHeader(periodSheet, 'Estado de periodos contables');
  formatCurrencyColumns(
    periodSheet,
    ['Periodo', 'Estado', 'Movimientos', 'Acumulado'],
    ['Acumulado'],
  );

  const closureRows = buildPeriodClosureExportRows(closures, periods);
  const closureSheet = workbook.addWorksheet('Historial');
  closureSheet.columns = [
    { header: 'Periodo', key: 'Periodo', width: 24 },
    { header: 'Estado', key: 'Estado', width: 14 },
    { header: 'Usuario', key: 'Usuario', width: 24 },
    { header: 'CerradoEl', key: 'CerradoEl', width: 22 },
    { header: 'Nota', key: 'Nota', width: 40 },
  ];
  closureRows.forEach((row) => closureSheet.addRow(row));
  applyProfessionalStyling(closureSheet, closureRows.length);
  addReportHeader(closureSheet, 'Historial de cierres contables');
  formatCurrencyColumns(
    closureSheet,
    ['Periodo', 'Estado', 'Usuario', 'CerradoEl', 'Nota'],
    [],
  );

  await downloadWorkbook(workbook, buildPeriodCloseExportFileName());
};
