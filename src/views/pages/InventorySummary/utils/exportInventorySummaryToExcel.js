import dayjs from 'dayjs'
import * as exceljs from 'exceljs'
import { saveAs } from 'file-saver'

/**
 * Export Inventory Summary rows to an Excel file using exceljs.
 *
 * Columns: Producto | SKU | Categoría | Unidades | Costo unitario | Valor inventario | Precio lista unitario | Valor inventario (precio lista)
 * - Unidades: cantidad (puede ser negativa si así viene de datos)
 * - Valor inventario: max(cantidad, 0) * costo unitario (igual que en la versión previa en HTML)
 *
 * @param {Array<{name:string, sku?:string, category?:string, quantity:number, unitCost:number, unitListPrice?:number}>} rows
 * @param {Object} [options]
 * @param {string} [options.filenamePrefix="inventario_resumen"]
 */
export async function exportInventorySummaryToExcel(rows, { filenamePrefix = 'inventario_resumen' } = {}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('No hay datos para exportar')
  }

  const workbook = new exceljs.Workbook()
  const sheet = workbook.addWorksheet('Resumen Inventario')

  sheet.columns = [
    { header: 'Producto', key: 'name', width: 40 },
    { header: 'SKU', key: 'sku', width: 18 },
    { header: 'Categoría', key: 'category', width: 24 },
    { header: 'Unidades', key: 'units', width: 12 },
    { header: 'Costo unitario', key: 'unitCost', width: 16 },
    { header: 'Valor inventario', key: 'inventoryValue', width: 18 },
    { header: 'Precio lista unitario', key: 'unitListPrice', width: 18 },
    { header: 'Valor inventario (precio lista)', key: 'inventoryValueListPrice', width: 26 }
  ]

  for (const it of rows) {
    const qty = Number(it?.quantity) || 0
    const unitCost = Number(it?.unitCost) || 0
    const unitListPrice = Number(it?.unitListPrice) || 0
    const value = (qty > 0 ? qty : 0) * unitCost
    const valueListPrice = (qty > 0 ? qty : 0) * unitListPrice
    sheet.addRow({
      name: it?.name ?? 'Producto',
      sku: it?.sku ?? '',
      category: it?.category ?? 'Sin categoría',
      units: qty,
      unitCost,
      inventoryValue: value,
      unitListPrice,
      inventoryValueListPrice: valueListPrice
    })
  }

  // Totals row with formulas
  const startRow = 2
  const endRow = sheet.rowCount
  const totalsRow = sheet.addRow({})
  const totalsRowNumber = totalsRow.number
  // Label
  totalsRow.getCell('name').value = 'TOTAL'
  // Formulas
  totalsRow.getCell('units').value = { formula: `SUM(D${startRow}:D${endRow})` }
  totalsRow.getCell('inventoryValue').value = { formula: `SUM(F${startRow}:F${endRow})` }
  totalsRow.getCell('inventoryValueListPrice').value = { formula: `SUM(H${startRow}:H${endRow})` }
  // Weighted averages for unit cost and unit list price
  totalsRow.getCell('unitCost').value = { formula: `IF(D${totalsRowNumber}>0,F${totalsRowNumber}/D${totalsRowNumber},0)` }
  totalsRow.getCell('unitListPrice').value = { formula: `IF(D${totalsRowNumber}>0,H${totalsRowNumber}/D${totalsRowNumber},0)` }

  // Style for totals row
  totalsRow.font = { bold: true }
  totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }

  // Header style
  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }

  // Number formats (keep consistent with existing exports in the app)
  sheet.getColumn('units').numFmt = '#,##0'
  sheet.getColumn('unitCost').numFmt = '$#,##0.00'
  sheet.getColumn('inventoryValue').numFmt = '$#,##0.00'
  sheet.getColumn('unitListPrice').numFmt = '$#,##0.00'
  sheet.getColumn('inventoryValueListPrice').numFmt = '$#,##0.00'

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `${filenamePrefix}_${dayjs().format('YYYY-MM-DD')}.xlsx`)
}

export default exportInventorySummaryToExcel
