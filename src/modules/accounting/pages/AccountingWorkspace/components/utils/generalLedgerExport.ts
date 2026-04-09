import {
  addReportHeader,
  applyProfessionalStyling,
  formatCurrencyColumns,
} from '@/hooks/exportToExcel/exportConfig';

import {
  formatAccountingPeriod,
  type GeneralLedgerSnapshot,
} from '../../utils/accountingWorkspace';

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

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleDateString('es-DO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const exportGeneralLedgerWorkbook = async ({
  accountCode,
  accountName,
  periodKey,
  snapshot,
}: {
  accountCode: string;
  accountName: string;
  periodKey: string | null;
  snapshot: GeneralLedgerSnapshot;
}) => {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();

  const periodLabel = periodKey ? formatAccountingPeriod(periodKey) : 'Todos los periodos';
  const sheetTitle = `Libro mayor - ${accountCode} · ${accountName} - ${periodLabel}`;

  const sheet = workbook.addWorksheet('Libro mayor');
  sheet.columns = [
    { header: 'Fecha', key: 'Fecha', width: 14 },
    { header: 'Referencia', key: 'Referencia', width: 30 },
    { header: 'Origen', key: 'Origen', width: 24 },
    { header: 'Descripcion', key: 'Descripcion', width: 36 },
    { header: 'Debito', key: 'Debito', width: 16 },
    { header: 'Credito', key: 'Credito', width: 16 },
    { header: 'Saldo', key: 'Saldo', width: 16 },
  ];

  for (const entry of snapshot.entries) {
    const origin = [entry.moduleLabel, entry.sourceLabel].filter(Boolean).join(' · ');
    const description = [entry.title, entry.lineDescription ?? entry.description]
      .filter(Boolean)
      .join(' — ');
    sheet.addRow({
      Fecha: formatDate(entry.entryDate),
      Referencia: entry.reference,
      Origen: origin,
      Descripcion: description,
      Debito: entry.debit || 0,
      Credito: entry.credit || 0,
      Saldo: entry.runningBalance,
    });
  }

  applyProfessionalStyling(sheet, snapshot.entries.length);
  addReportHeader(sheet, sheetTitle);

  const headerRow = sheet.getRow(4);
  headerRow.height = 35;
  headerRow.font = { bold: true, color: { argb: 'FF333333' }, size: 12 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  formatCurrencyColumns(
    sheet,
    ['Fecha', 'Referencia', 'Origen', 'Descripcion', 'Debito', 'Credito', 'Saldo'],
    ['Debito', 'Credito', 'Saldo'],
  );

  const fileName = `libro_mayor_${accountCode.replace(/[^a-zA-Z0-9]/g, '_')}_${periodKey ?? 'todos'}.xlsx`;
  await downloadWorkbook(workbook, fileName);
};
