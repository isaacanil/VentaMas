import dayjs from 'dayjs'
import * as exceljs from 'exceljs'
import { saveAs } from 'file-saver'

/**
 * Export inventory grouped data to Excel
 * @param {Array} groups - groups produced by InventoryControl (each with _children)
 * @param {Object} options - extra options
 * @param {Object} meta - countsMeta map
 * @param {Object} counts - current counts map
 */
export async function exportInventoryToExcel(
  groups,
  {
    filename = 'inventario',
    onlyDifferences = false, // exportar solo filas con diferencia != 0 (excluye totales sin diff)
    addSummarySheet = true,  // genera hoja 'Resumen'
    includeBatchKey = false // por defecto no exportamos la Batch Key porque no es relevante para usuario final
  } = {},
  meta = {},
  counts = {},
  sessionInfo = {}
) {
  if (!Array.isArray(groups) || groups.length === 0) {
    throw new Error('No hay datos de inventario para exportar')
  }
  const workbook = new exceljs.Workbook()
  const sheet = workbook.addWorksheet('Inventario')

  const baseColumns = [
    { header: 'Producto', key: 'productName', width: 40 },
    { header: 'Tipo Fila', key: 'rowType', width: 12 },
    // Batch Key opcional
    ...(includeBatchKey ? [{ header: 'Batch Key', key: 'batchKey', width: 25 }] : []),
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
  ]
  sheet.columns = baseColumns

  const globalStats = {
    products: 0,
    rows: 0,
    rowsWithDiff: 0,
    stockSistema: 0,
    conteoReal: 0,
    diferencia: 0,
    rowsWithManualExp: 0,
    positiveDiff: 0,
    negativeDiff: 0
  }

  for (const g of groups) {
    let productHasAnyRow = false
    for (const child of (g._children || [])) {
      // Salvaguarda: si algún proceso previo agregó un pseudo-child de totales, lo ignoramos.
      if (child?.type === 'total' || child?.rowType === 'TOTAL') continue
      const key = child.key
      const stockSistema = Number(child.stock ?? 0)
      const conteoReal = Number(counts[key] ?? child.real ?? child.stock ?? 0)
      const diferencia = conteoReal - stockSistema
      const m = meta[key] || {}
      const manualExpirationDate = m.manualExpirationDate || null
      const hasManual = manualExpirationDate != null
      if (onlyDifferences && diferencia === 0) continue
      const row = {
        productName: g.productName,
        rowType: child.type === 'noexp' ? 'SIN VENC.' : 'LOTE',
        ...(includeBatchKey ? { batchKey: key } : {}),
        batchNumberId: child.batchNumberId || '',
        expirationDate: formatDate(child.expirationDate),
        stockSistema,
        conteoReal,
        diferencia,
        locations: (child.locations || []).map(l => `${l.location}(${l.quantity})`).join('; '),
        hasManualExp: hasManual ? 'Sí' : 'No',
        manualExpirationDate: hasManual ? formatDate(manualExpirationDate) : '',
        updatedByName: m.updatedByName || '',
        updatedAt: m.updatedAt ? formatDateTime(m.updatedAt) : ''
      }
      sheet.addRow(row)
      productHasAnyRow = true
      // acumular
      globalStats.rows++
      globalStats.stockSistema += stockSistema
      globalStats.conteoReal += conteoReal
      globalStats.diferencia += diferencia
      if (diferencia !== 0) globalStats.rowsWithDiff++
      if (hasManual) globalStats.rowsWithManualExp++
      if (diferencia > 0) globalStats.positiveDiff++
      else if (diferencia < 0) globalStats.negativeDiff++
    }
    if (productHasAnyRow) {
      // Solo contabilizamos el producto; no agregamos fila TOTAL ni separador en blanco
      globalStats.products++
    }
  }

  // Styling headers
  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }

  // Number formats & conditional coloring
  const diffColIndex = sheet.columns.findIndex(c => c.key === 'diferencia') + 1
  ;['stockSistema','conteoReal','diferencia'].forEach(col => {
    const c = sheet.getColumn(col)
    c.numFmt = '#,##0'
  })
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const diffCell = row.getCell(diffColIndex)
    const val = Number(diffCell.value || 0)
    if (val > 0) diffCell.font = { color: { argb: 'FF065F46' } }
    else if (val < 0) diffCell.font = { color: { argb: 'FFB91C1C' } }
  })

  if (addSummarySheet) {
    const summary = workbook.addWorksheet('Resumen')
    summary.columns = [
      { header: 'Métrica', key: 'metric', width: 32 },
      { header: 'Valor', key: 'value', width: 20 }
    ]
    const push = (metric, value) => summary.addRow({ metric, value })
    push('Fecha Exportación', dayjs().format('YYYY-MM-DD HH:mm'))
    if (sessionInfo?.name) push('Sesión', sessionInfo.name)
    if (sessionInfo?.id) push('Session ID', sessionInfo.id)
    push('Productos con filas', globalStats.products)
    push('Filas (detalle)', globalStats.rows)
    push('Filas con diferencia', globalStats.rowsWithDiff)
    push('Stock Sistema (suma)', globalStats.stockSistema)
    push('Conteo Real (suma)', globalStats.conteoReal)
    push('Diferencia Total', globalStats.diferencia)
    push('Filas con fecha manual', globalStats.rowsWithManualExp)
    push('Dif. Positivas (filas)', globalStats.positiveDiff)
    push('Dif. Negativas (filas)', globalStats.negativeDiff)

    summary.getRow(1).font = { bold: true }
    summary.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `${filename}_${onlyDifferences ? 'differences_' : ''}${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`)
}

function formatDate(d) {
  if (!d) return ''
  try {
    let date
    if (d instanceof Date) date = d
    else if (d?.toDate) date = d.toDate()
    else if (typeof d === 'object' && typeof d.seconds === 'number') date = new Date(d.seconds * 1000)
    else date = new Date(d)
    if (isNaN(date.getTime())) return ''
    return dayjs(date).format('YYYY-MM-DD')
  } catch { return '' }
}

function formatDateTime(d) {
  if (!d) return ''
  try {
    let date
    if (d instanceof Date) date = d
    else if (d?.toDate) date = d.toDate()
    else if (typeof d === 'object' && typeof d.seconds === 'number') date = new Date(d.seconds * 1000)
    else date = new Date(d)
    if (isNaN(date.getTime())) return ''
    return dayjs(date).format('YYYY-MM-DD HH:mm')
  } catch { return '' }
}
