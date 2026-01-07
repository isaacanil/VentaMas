// @ts-nocheck
// ---------------------------  EXCEL EXPORT UTIL  ---------------------------
// Colores corporativos elegantes
const CORPORATE_COLORS = {
  headerBg: 'FFF5F5F5', // Gris claro elegante
  headerText: 'FF333333', // Gris oscuro para el texto
  totalsBg: 'FFEEEEEE', // Gris muy claro para totales
  totalsText: 'FF333333', // Gris oscuro
  alternateRow: 'FFFAFAFA', // Gris muy muy claro
  border: 'FFCCCCCC', // Gris medio para bordes
};

/* ------------------------------------------------------------------------- *
 *  UTILIDADES GENERALES                                                     *
 * ------------------------------------------------------------------------- */

// Convierte un número de columna (1-based) a letra(s) de Excel (A, …, AA…)
const getColumnLetter = (num) => {
  let letter = '';
  while (num > 0) {
    const mod = (num - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    num = Math.floor((num - 1) / 26);
  }
  return letter;
};

// ----- helpers para anchos dinámicos --------------------------------------
const calculateDynamicWidth = (data, header = '') => {
  let maxLen = header?.length ?? 0;
  data.forEach((v) => {
    maxLen = Math.max(maxLen, String(v).length);
  });
  return maxLen + getDynamicPadding(data);
};
const getDynamicPadding = (data) => {
  const hasNumbers = data.some((v) => typeof v === 'number');
  const hasLongText = data.some((v) => String(v).length > 20);
  if (hasNumbers) return 4;
  if (hasLongText) return 2;
  return 3;
};
const getMinimumWidth = (data) => {
  if (data.every((v) => String(v).length <= 5)) return 6;
  if (data.some((v) => typeof v === 'number')) return 10;
  return 8;
};
const getMaximumWidth = (data) => {
  const hasVeryLong = data.some((v) => String(v).length > 50);
  const hasNumbers = data.some((v) => typeof v === 'number');
  const avgLen = data.reduce((s, v) => s + String(v).length, 0) / data.length;
  if (hasVeryLong) return 60;
  if (hasNumbers) return 18;
  if (avgLen > 30) return 40;
  if (avgLen > 15) return 25;
  return 20;
};

/* ------------------------------------------------------------------------- *
 *  ESTILO PROFESIONAL + AUTO-WIDTH                                          *
 * ------------------------------------------------------------------------- */
export const applyProfessionalStyling = (worksheet, dataRowCount) => {
  /* 1. HEADER */
  const headerRow = worksheet.getRow(1);
  headerRow.height = 35;
  headerRow.font = {
    bold: true,
    color: { argb: CORPORATE_COLORS.headerText },
    size: 12,
  };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: CORPORATE_COLORS.headerBg },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'medium', color: { argb: CORPORATE_COLORS.border } },
      left: { style: 'thin', color: { argb: CORPORATE_COLORS.border } },
      bottom: { style: 'medium', color: { argb: CORPORATE_COLORS.border } },
      right: { style: 'thin', color: { argb: CORPORATE_COLORS.border } },
    };
  });

  /* 2. FILAS ALTERNAS + BORDES */
  for (let r = 2; r <= dataRowCount + 1; r++) {
    const row = worksheet.getRow(r);
    if (r % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: CORPORATE_COLORS.alternateRow },
      };
    }
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: CORPORATE_COLORS.border } },
        left: { style: 'thin', color: { argb: CORPORATE_COLORS.border } },
        bottom: { style: 'thin', color: { argb: CORPORATE_COLORS.border } },
        right: { style: 'thin', color: { argb: CORPORATE_COLORS.border } },
      };
    });
  }

  /* 3. AUTO-ANCHO 100 % DINÁMICO */
  worksheet.columns.forEach((column, idx) => {
    const colIdx = idx + 1;
    const header = column.header ?? '';
    const values = [];

    worksheet.getColumn(colIdx).eachCell({ includeEmpty: false }, (c) => {
      if (c.text) values.push(c.text);
    });

    column.width = values.length
      ? Math.max(
          getMinimumWidth(values),
          Math.min(
            calculateDynamicWidth(values, header),
            getMaximumWidth(values),
          ),
        )
      : 12; // Vacía
  });

  /* 4. FREEZE + FILTER */
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.autoFilter = {
    from: 'A1',
    to: `${getColumnLetter(worksheet.columns.length)}1`,
  };
};

/* ------------------------------------------------------------------------- *
 *  FORMATOS (moneda, número)                                                *
 * ------------------------------------------------------------------------- */
export const formatCurrencyColumns = (ws, columns, currencyCols) => {
  currencyCols.forEach((name) => {
    const idx = columns.indexOf(name) + 1;
    if (idx > 0) {
      const col = ws.getColumn(idx);
      col.numFmt = '$#,##0.00';
      col.alignment = { horizontal: 'right' };
    }
  });
};

export const formatNumberColumns = (ws, columns, numberCols) => {
  numberCols.forEach((name) => {
    const idx = columns.indexOf(name) + 1;
    if (idx > 0) {
      const col = ws.getColumn(idx);
      col.numFmt = '#,##0';
      col.alignment = { horizontal: 'right' };
    }
  });
};

/* ------------------------------------------------------------------------- *
 *  TOTALES                                                                  *
 * ------------------------------------------------------------------------- */
export const addTotalsRow = (
  ws,
  data,
  columns,
  sumCols,
  label = 'TOTALES',
  bgColor = CORPORATE_COLORS.totalsBg,
) => {
  const totalsRow = {};
  let labelPlaced = false;

  columns.forEach((col) => {
    if (sumCols.includes(col)) {
      totalsRow[col] = data.reduce(
        (acc, item) => acc + (Number(item[col]) || 0),
        0,
      );
    } else if (!labelPlaced && /Fecha|Cliente|Nombre Cliente/i.test(col)) {
      totalsRow[col] = label;
      labelPlaced = true;
    } else {
      totalsRow[col] = '';
    }
  });

  ws.addRow({});
  const rowNum = ws.addRow(totalsRow).number;
  const row = ws.getRow(rowNum);

  row.font = {
    bold: true,
    color: { argb: CORPORATE_COLORS.totalsText },
    size: 11,
  };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
  row.height = 30;
  row.eachCell((c) => {
    c.border = {
      top: { style: 'medium', color: { argb: CORPORATE_COLORS.border } },
      left: { style: 'thin', color: { argb: CORPORATE_COLORS.border } },
      bottom: { style: 'medium', color: { argb: CORPORATE_COLORS.border } },
      right: { style: 'thin', color: { argb: CORPORATE_COLORS.border } },
    };
  });
};

/* ------------------------------------------------------------------------- *
 *  CALLBACKS DE EXPORTACIÓN                                                 *
 * ------------------------------------------------------------------------- */
export const getBillExportCallback = (type) => {
  switch (type) {
    case 'Resumen':
      return (ws, data, cols) => {
        applyProfessionalStyling(ws, data.length);
        formatCurrencyColumns(ws, cols, [
          'Total ITBIS',
          'Pagado',
          'Delivery',
          'Cambio',
          'Total',
        ]);
        formatNumberColumns(ws, cols, ['Cantidad de Productos']);
        addTotalsRow(ws, data, cols, [
          'Cantidad de Productos',
          'Total ITBIS',
          'Pagado',
          'Delivery',
          'Cambio',
          'Total',
        ]);
      };
    case 'Detailed':
      return (ws, data, cols) => {
        applyProfessionalStyling(ws, data.length);
        formatCurrencyColumns(ws, cols, ['Precio', 'Total']);
        formatNumberColumns(ws, cols, ['Cantidad Facturada']);
        addTotalsRow(ws, data, cols, ['Precio', 'Cantidad Facturada', 'Total']);
      };
    default:
      return null;
  }
};

export const createTotalsCallback =
  (sumCols, label = 'TOTALES', bg = CORPORATE_COLORS.totalsBg) =>
  (ws, data, cols) =>
    addTotalsRow(ws, data, cols, sumCols, label, bg);

/* ------------------------------------------------------------------------- *
 *  HEADER DEL REPORTE                                                       *
 * ------------------------------------------------------------------------- */
export const addReportHeader = (ws, title, company = 'VentaMax') => {
  ws.spliceRows(1, 0, [], [], []);
  const totalCols = ws.columns.length;
  const lastCol = getColumnLetter(totalCols);

  // Fila 1 – título
  const tRow = ws.getRow(1);
  tRow.getCell(1).value = title;
  tRow.font = {
    bold: true,
    size: 16,
    color: { argb: CORPORATE_COLORS.headerText },
  };
  tRow.alignment = { horizontal: 'center', vertical: 'middle' };
  tRow.height = 40;
  ws.mergeCells(`A1:${lastCol}1`);

  // Fila 2 – empresa y fecha
  const iRow = ws.getRow(2);
  iRow.getCell(1).value = company;
  iRow.getCell(1).font = {
    bold: true,
    size: 11,
    color: { argb: CORPORATE_COLORS.totalsText },
  };
  iRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

  const midIdx = Math.ceil(totalCols / 2);
  const midLet = getColumnLetter(midIdx);
  iRow.getCell(midIdx).value =
    `Generado: ${new Date().toLocaleDateString('es-DO')}`;
  iRow.getCell(midIdx).font = {
    size: 11,
    color: { argb: CORPORATE_COLORS.totalsText },
  };
  iRow.getCell(midIdx).alignment = { horizontal: 'right', vertical: 'middle' };

  if (midIdx > 2) ws.mergeCells(`A2:${getColumnLetter(midIdx - 1)}2`);
  if (totalCols > midIdx) ws.mergeCells(`${midLet}2:${lastCol}2`);
  iRow.height = 25;

  // Ajustar autofiltro y freeze: header real está ahora en fila 4
  ws.autoFilter = { from: 'A4', to: `${lastCol}4` };
  ws.views = [{ state: 'frozen', ySplit: 4 }];
};

/* ------------------------------------------------------------------------- *
 *  CALLBACK PROFESIONAL COMPLETO                                            *
 * ------------------------------------------------------------------------- */
export const createProfessionalReportCallback = (type, title) => {
  const base = getBillExportCallback(type);
  return (ws, data, cols) => {
    addReportHeader(ws, title);
    if (base) {
      base(ws, data, cols); // ya aplica styling, formatos, totales
      // Re-estilizar fila de encabezados que quedó en 4
      const head = ws.getRow(4);
      head.height = 35;
      head.font = {
        bold: true,
        color: { argb: CORPORATE_COLORS.headerText },
        size: 12,
      };
      head.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: CORPORATE_COLORS.headerBg },
      };
      head.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  };
};

/* ------------------------------------------------------------------------- *
 *  CALLBACK ESPECÍFICO PARA NOTAS DE CRÉDITO                               *
 * ------------------------------------------------------------------------- */
export const getCreditNoteExportCallback = (type) => {
  switch (type) {
    case 'Resumen':
      return (ws, data, cols) => {
        applyProfessionalStyling(ws, data.length);
        formatCurrencyColumns(ws, cols, ['Monto Total']);
        formatNumberColumns(ws, cols, ['Cantidad Items']);
        addTotalsRow(ws, data, cols, ['Cantidad Items', 'Monto Total']);
      };
    case 'Detailed':
      return (ws, data, cols) => {
        applyProfessionalStyling(ws, data.length);
        formatCurrencyColumns(ws, cols, [
          'Precio Unitario',
          'Total Item',
          'Total NC',
        ]);
        formatNumberColumns(ws, cols, ['Cantidad']);
        addTotalsRow(ws, data, cols, [
          'Cantidad',
          'Precio Unitario',
          'Total Item',
          'Total NC',
        ]);
      };
    default:
      return null;
  }
};

export const createProfessionalCreditNoteReportCallback = (type, title) => {
  const base = getCreditNoteExportCallback(type);
  return (ws, data, cols) => {
    addReportHeader(ws, title);
    if (base) {
      base(ws, data, cols); // ya aplica styling, formatos, totales
      // Re-estilizar fila de encabezados que quedó en 4
      const head = ws.getRow(4);
      head.height = 35;
      head.font = {
        bold: true,
        color: { argb: CORPORATE_COLORS.headerText },
        size: 12,
      };
      head.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: CORPORATE_COLORS.headerBg },
      };
      head.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  };
};
