import { DateTime } from 'luxon';

import { saveXlsxFile } from '@/utils/export/xlsx';
import { formatDateTime as formatInventoryDateTime } from '@/modules/inventory/utils/dates';
import type {
  CountsMap,
  CountsMetaMap,
  ExportInventoryOptions,
  ExportSessionInfo,
  InventoryGroup,
} from '@/utils/inventory/types';

const EXCEL_DATE_FORMAT = 'yyyy-LL-dd';
const EXCEL_DATE_TIME_FORMAT = 'yyyy-LL-dd HH:mm';

type InventoryExportStats = {
  products: number;
  rows: number;
  rowsWithDiff: number;
  stockSistema: number;
  conteoReal: number;
  diferencia: number;
  rowsWithManualExp: number;
  positiveDiff: number;
  negativeDiff: number;
};

const createInventoryExportStats = (): InventoryExportStats => ({
  products: 0,
  rows: 0,
  rowsWithDiff: 0,
  stockSistema: 0,
  conteoReal: 0,
  diferencia: 0,
  rowsWithManualExp: 0,
  positiveDiff: 0,
  negativeDiff: 0,
});

const recordInventoryExportRow = (
  stats: InventoryExportStats,
  {
    conteoReal,
    diferencia,
    hasManual,
    stockSistema,
  }: {
    conteoReal: number;
    diferencia: number;
    hasManual: boolean;
    stockSistema: number;
  },
) => {
  stats.rows += 1;
  stats.stockSistema += stockSistema;
  stats.conteoReal += conteoReal;
  stats.diferencia += diferencia;

  if (diferencia !== 0) stats.rowsWithDiff += 1;
  if (diferencia > 0) stats.positiveDiff += 1;
  if (diferencia < 0) stats.negativeDiff += 1;
  if (hasManual) stats.rowsWithManualExp += 1;
};

/**
 * Export inventory grouped data to Excel
 * @param {Array} groups - groups produced by InventoryControl (each with _children)
 * @param {Object} options - extra options
 * @param {Object} meta - countsMeta map
 * @param {Object} counts - current counts map
 */
export async function exportInventoryToExcel(
  groups: InventoryGroup[],
  {
    filename = 'inventario',
    onlyDifferences = false, // exportar solo filas con diferencia != 0 (excluye totales sin diff)
    addSummarySheet = true, // genera hoja 'Resumen'
    includeBatchKey = false, // por defecto no exportamos la Batch Key porque no es relevante para usuario final
  }: ExportInventoryOptions = {},
  meta: CountsMetaMap = {},
  counts: CountsMap = {},
  sessionInfo: ExportSessionInfo = {},
) {
  if (!Array.isArray(groups) || groups.length === 0) {
    throw new Error('No hay datos de inventario para exportar');
  }
  const exceljs = await import('exceljs');
  const workbook = new exceljs.Workbook();
  const sheet = workbook.addWorksheet('Inventario');

  const baseColumns = [
    { header: 'Producto', key: 'productName', width: 40 },
    { header: 'Tipo Fila', key: 'rowType', width: 12 },
    // Batch Key opcional
    ...(includeBatchKey
      ? [{ header: 'Batch Key', key: 'batchKey', width: 25 }]
      : []),
    { header: 'Lote', key: 'batchNumberId', width: 16 },
    { header: 'Fecha Venc.', key: 'expirationDate', width: 14 },
    { header: 'Stock Sistema', key: 'stockSistema', width: 14 },
    { header: 'Conteo Real', key: 'conteoReal', width: 14 },
    { header: 'Diferencia', key: 'diferencia', width: 12 },
    { header: 'Ubicaciones (qty)', key: 'locations', width: 40 },
    { header: 'Asignada Manual?', key: 'hasManualExp', width: 14 },
    { header: 'Fecha Manual', key: 'manualExpirationDate', width: 14 },
    { header: 'Actualizado Por', key: 'updatedByName', width: 22 },
    { header: 'Actualizado En', key: 'updatedAt', width: 20 },
  ];
  sheet.columns = baseColumns;

  const globalStats = createInventoryExportStats();

  for (const g of groups) {
    let productHasExportedRows = false;

    for (const child of g._children || []) {
      // Salvaguarda: si algún proceso previo agregó un pseudo-child de totales, lo ignoramos.
      const rowType =
        typeof child?.rowType === 'string' ? child.rowType.toLowerCase() : '';
      if (rowType === 'total') continue;
      const key = child.key;
      const stockSistema = Number(child.stock ?? 0);
      const conteoReal = Number(counts[key] ?? child.real ?? child.stock ?? 0);
      const diferencia = conteoReal - stockSistema;
      const m = meta[key] || {};
      const manualExpirationDate = m.manualExpirationDate || null;
      const hasManual = manualExpirationDate != null;
      if (onlyDifferences && diferencia === 0) continue;
      const row = {
        productName: g.productName,
        rowType: child.type === 'noexp' ? 'SIN VENC.' : 'LOTE',
        ...(includeBatchKey ? { batchKey: key } : {}),
        batchNumberId: child.batchNumberId || '',
        expirationDate: child.expirationDate
          ? formatInventoryDateTime(child.expirationDate, EXCEL_DATE_FORMAT)
          : '',
        stockSistema,
        conteoReal,
        diferencia,
        locations: (child.locations || [])
          .map((l) => {
            const label = l.locationLabel || '';
            const display = label || 'Ubicación sin nombre';
            return `${display}(${l.quantity})`;
          })
          .join('; '),
        hasManualExp: hasManual ? 'Sí' : 'No',
        manualExpirationDate:
          hasManual && manualExpirationDate
            ? formatInventoryDateTime(manualExpirationDate, EXCEL_DATE_FORMAT)
            : '',
        updatedByName: m.updatedByName || '',
        updatedAt: m.updatedAt
          ? formatInventoryDateTime(m.updatedAt, EXCEL_DATE_TIME_FORMAT)
          : '',
      };
      sheet.addRow(row);
      recordInventoryExportRow(globalStats, {
        conteoReal,
        diferencia,
        hasManual,
        stockSistema,
      });
      productHasExportedRows = true;
    }

    if (productHasExportedRows) {
      globalStats.products += 1;
    }
  }

  if (addSummarySheet) {
    const summary = workbook.addWorksheet('Resumen');
    summary.columns = [
      { header: 'Métrica', key: 'metric', width: 32 },
      { header: 'Valor', key: 'value', width: 20 },
    ];
    const push = (metric: string, value: string | number) =>
      summary.addRow({ metric, value });
    push(
      'Fecha Exportación',
      formatInventoryDateTime(DateTime.local(), EXCEL_DATE_TIME_FORMAT),
    );
    if (sessionInfo?.name) push('Sesión', sessionInfo.name);
    if (sessionInfo?.id) push('Session ID', sessionInfo.id);
    push('Productos con filas', globalStats.products);
    push('Filas (detalle)', globalStats.rows);
    push('Filas con diferencia', globalStats.rowsWithDiff);
    push('Stock Sistema (suma)', globalStats.stockSistema);
    push('Conteo Real (suma)', globalStats.conteoReal);
    push('Diferencia Total', globalStats.diferencia);
    push('Filas con fecha manual', globalStats.rowsWithManualExp);
    push('Dif. Positivas (filas)', globalStats.positiveDiff);
    push('Dif. Negativas (filas)', globalStats.negativeDiff);

    summary.getRow(1).font = { bold: true };
    summary.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  saveXlsxFile({
    content: buffer,
    fileName: `${filename}_${onlyDifferences ? 'differences_' : ''}${DateTime.local().toFormat('yyyy-LL-dd_HH-mm')}.xlsx`,
  });
}
