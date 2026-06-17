import type { Worksheet } from 'exceljs';
import type {
  UtilityDailyMetric,
  UtilityTransactionRow,
  UtilityTrend,
} from '@/modules/utility/pages/Utility/types';
import { saveXlsxFile } from '@/utils/export/xlsx';

import { DateTime } from 'luxon';

import { buildTransactionRows } from './transactionRows';

const trendLabels: Record<UtilityTrend, string> = {
  up: 'Al alza',
  down: 'A la baja',
  flat: 'Sin cambios',
};

const buildWorksheet = (
  sheet: Worksheet,
  rows: UtilityTransactionRow[],
): void => {
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

export const exportTransactionsExcel = async (
  dailyMetrics: UtilityDailyMetric[] | null | undefined,
): Promise<void> => {
  const rows = buildTransactionRows(dailyMetrics);
  if (!rows.length) {
    return;
  }

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Detalle transacciones');

  buildWorksheet(sheet, rows);

  const buffer = await workbook.xlsx.writeBuffer();
  const timestamp = DateTime.local().toFormat('yyyyLLdd-HHmm');
  saveXlsxFile({
    content: buffer,
    fileName: `detalle-transacciones-${timestamp}.xlsx`,
  });
};
