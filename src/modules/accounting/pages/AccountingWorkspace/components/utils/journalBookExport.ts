import {
  addReportHeader,
  applyProfessionalStyling,
  formatCurrencyColumns,
} from '@/hooks/exportToExcel/exportConfig';

import type { AccountingLedgerRecord } from '../../utils/accountingWorkspace';

type JournalBookExportRow = {
  Fecha: string;
  Periodo: string;
  Modulo: string;
  Origen: string;
  Referencia: string;
  Descripcion: string;
  Monto: number;
  Estado: string;
  Tipo: string;
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

const sanitizeFileNamePart = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/_+/g, '_') || 'todos';

const formatDate = (value: Date | null): string => {
  if (!value) return '';

  return value.toLocaleDateString('es-DO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const buildJournalBookExportFileName = ({
  moduleFilter,
  dateFrom,
  dateTo,
}: {
  moduleFilter: string;
  dateFrom?: string;
  dateTo?: string;
}): string => {
  const modulePart =
    moduleFilter && moduleFilter !== 'all'
      ? sanitizeFileNamePart(moduleFilter)
      : 'todos';
  const fromPart = sanitizeFileNamePart(dateFrom || 'inicio');
  const toPart = sanitizeFileNamePart(dateTo || 'actual');

  return `libro_diario_${modulePart}_${fromPart}_${toPart}.xlsx`;
};

export const buildJournalBookExportRows = (
  records: AccountingLedgerRecord[],
): JournalBookExportRow[] =>
  records.map((record) => ({
    Fecha: formatDate(record.entryDate),
    Periodo: record.periodKey ?? '',
    Modulo: record.moduleLabel,
    Origen: record.sourceLabel,
    Referencia: record.reference,
    Descripcion: `${record.title}${record.description ? ` — ${record.description}` : ''}`,
    Monto: record.amount,
    Estado: record.statusLabel,
    Tipo: record.sourceKind === 'manual' ? 'Manual' : 'Automatico',
  }));

export const exportJournalBookWorkbook = async ({
  dateFrom,
  dateTo,
  moduleFilter,
  records,
}: {
  dateFrom?: string;
  dateTo?: string;
  moduleFilter: string;
  records: AccountingLedgerRecord[];
}) => {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Libro diario');
  const rows = buildJournalBookExportRows(records);

  worksheet.columns = [
    { header: 'Fecha', key: 'Fecha', width: 14 },
    { header: 'Periodo', key: 'Periodo', width: 12 },
    { header: 'Modulo', key: 'Modulo', width: 20 },
    { header: 'Origen', key: 'Origen', width: 22 },
    { header: 'Referencia', key: 'Referencia', width: 28 },
    { header: 'Descripcion', key: 'Descripcion', width: 42 },
    { header: 'Monto', key: 'Monto', width: 16 },
    { header: 'Estado', key: 'Estado', width: 14 },
    { header: 'Tipo', key: 'Tipo', width: 14 },
  ];

  rows.forEach((row) => worksheet.addRow(row));

  const titleParts = ['Libro diario'];
  if (moduleFilter && moduleFilter !== 'all') {
    titleParts.push(`Modulo ${moduleFilter}`);
  }
  if (dateFrom || dateTo) {
    titleParts.push(`Rango ${dateFrom || 'inicio'} a ${dateTo || 'actual'}`);
  }

  applyProfessionalStyling(worksheet, rows.length);
  addReportHeader(worksheet, titleParts.join(' - '));

  const headerRow = worksheet.getRow(4);
  headerRow.height = 35;
  headerRow.font = {
    bold: true,
    color: { argb: 'FF333333' },
    size: 12,
  };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF5F5F5' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  formatCurrencyColumns(
    worksheet,
    [
      'Fecha',
      'Periodo',
      'Modulo',
      'Origen',
      'Referencia',
      'Descripcion',
      'Monto',
      'Estado',
      'Tipo',
    ],
    ['Monto'],
  );

  await downloadWorkbook(
    workbook,
    buildJournalBookExportFileName({
      moduleFilter,
      dateFrom,
      dateTo,
    }),
  );
};
