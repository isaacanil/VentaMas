// @ts-nocheck
import { DateTime } from 'luxon';

import { buildTransactionRows } from './transactionRows';

const trendLabels = {
  up: 'Al alza',
  down: 'A la baja',
  flat: 'Sin cambios',
};

const buildWorksheet = (sheet, rows) => {
  sheet.columns = [
    { header: 'Fecha', key: 'dateLabel', width: 18 },
    { header: 'Ventas Totales', key: 'totalSales', width: 18 },
    { header: 'Costo Total', key: 'totalCost', width: 16 },
    { header: 'ITBIS', key: 'taxes', width: 12 },
    { header: 'Ganancia Neta', key: 'netProfit', width: 16 },
    { header: 'Tendencia', key: 'trend', width: 14 },
  ];

  rows.forEach((row) => {
    sheet.addRow({
      dateLabel: row.dateLabel,
      totalSales: row.totalSales,
      totalCost: row.totalCost,
      taxes: row.taxes,
      netProfit: row.netProfit,
      trend: trendLabels[row.trend] ?? row.trend,
    });
  });

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  ['totalSales', 'totalCost', 'taxes', 'netProfit'].forEach((key) => {
    sheet.getColumn(key).numFmt = '"RD$"#,##0.00';
  });

  sheet.getColumn('dateLabel').alignment = { vertical: 'middle' };
  sheet.getColumn('trend').alignment = { vertical: 'middle' };
};

export const exportTransactionsExcel = async (dailyMetrics) => {
  const rows = buildTransactionRows(dailyMetrics);
  if (!rows.length) {
    return;
  }

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Detalle transacciones');

  buildWorksheet(sheet, rows);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const timestamp = DateTime.local().toFormat('yyyyLLdd-HHmm');
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `detalle-transacciones-${timestamp}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
