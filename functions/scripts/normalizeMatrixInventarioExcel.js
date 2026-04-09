/*
  Script: normalizeMatrixInventarioExcel.js

  Purpose:
    Normaliza el Excel "Matriz Inventario Ventamax.xlsx" para que calce con
    la plantilla/importador de productos existente (headers en ES).
    - Renombra headers (fila 1) a los esperados
    - Convierte valores incompatibles (ej: Impuesto "si/no" -> 18/0)
    - Escribe un archivo NUEVO (no sobreescribe el original)

  Uso (PowerShell):
    node functions/scripts/normalizeMatrixInventarioExcel.js --in "C:\\Users\\jonat\\Downloads\\Matriz Inventario Ventamax.xlsx" --out "C:\\Users\\jonat\\Downloads\\Matriz Inventario Ventamax_normalizado.xlsx"

  Notas:
    - Esto evita meter alias/compatibilidad extra en el código productivo.
*/

import ExcelJS from 'exceljs';
import process from 'process';

const getFlag = (args, name) => {
  const idx = args.findIndex((item) => item === name);
  if (idx !== -1) return args[idx + 1] || null;
  const withEq = args.find((item) => item.startsWith(`${name}=`));
  if (withEq) return withEq.split('=').slice(1).join('=') || null;
  return null;
};

const toCleanString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const parseCurrency = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const raw = typeof value === 'string' ? value : String(value);
  const cleaned = raw
    .replace(/[$€£¥₩₹₽]/g, '')
    .replace(/\s/g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toInt = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : fallback;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
};

const parseTax = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const s = typeof value === 'string' ? value.trim().toLowerCase() : null;
  if (s) {
    if (['sí', 'si', 'yes', 'true', '1'].includes(s)) return 18;
    if (['no', 'false', '0', 'exento', 'exenta'].includes(s)) return 0;
    // soporta "18%" / "0.18"
    const num = Number(String(s).replace('%', '').replace(',', '.'));
    if (Number.isFinite(num)) return num > 0 && num < 1 ? num * 100 : num;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 0 && value < 1 ? value * 100 : value;
  }
  return 0;
};

const args = process.argv.slice(2);
const inPath = getFlag(args, '--in');
const outPath = getFlag(args, '--out');

if (!inPath || !outPath) {
  console.error(
    'Usage:\n' +
      '  node functions/scripts/normalizeMatrixInventarioExcel.js --in "<in.xlsx>" --out "<out.xlsx>"',
  );
  process.exit(1);
}

const run = async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(inPath);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error('No worksheets found');

  // Mapear headers de la matriz -> headers oficiales del importador (ES)
  const HEADER_RENAMES = new Map([
    ['Nombre del producto', 'Nombre'],
    ['Facturable', 'Es Visible'],
    ['Inventariable', 'Rastreo de Inventario'],
    ['Codigo de barras', 'Código de Barras'],
    ['Precio de lista', 'Precio de Lista'],
    ['Precio mínimo', 'Precio Mínimo'],
    ['Precio medio', 'Precio Promedio'],
    ['Contenido neto', 'Contenido Neto'],
    // los demás ya coinciden: Categoría, Tamaño, Stock, Impuesto, Costo
  ]);

  const headerRow = ws.getRow(1);
  const headerValues = headerRow.values.slice(1);
  const normalizedHeaders = [];

  for (let i = 0; i < headerValues.length; i += 1) {
    const original = toCleanString(headerValues[i]);
    const renamed = HEADER_RENAMES.get(original) || original;
    normalizedHeaders.push(renamed);
    headerRow.getCell(i + 1).value = renamed;
  }
  headerRow.commit?.();

  const findCol = (label) => {
    const idx = normalizedHeaders.findIndex((h) => toCleanString(h) === label);
    return idx === -1 ? null : idx + 1; // 1-based
  };

  const colTax = findCol('Impuesto');
  const colStock = findCol('Stock');
  const colCost = findCol('Costo');
  const colList = findCol('Precio de Lista');
  const colMin = findCol('Precio Mínimo');
  const colAvg = findCol('Precio Promedio');

  let taxFixed = 0;
  let stockFixed = 0;
  let priceFixed = 0;

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    if (colTax) {
      const cell = row.getCell(colTax);
      const next = parseTax(cell.value);
      if (cell.value !== next) {
        cell.value = next;
        taxFixed += 1;
      }
    }

    if (colStock) {
      const cell = row.getCell(colStock);
      const next = toInt(cell.value, 0);
      if (cell.value !== next) {
        cell.value = next;
        stockFixed += 1;
      }
    }

    const fixMoney = (col) => {
      if (!col) return;
      const cell = row.getCell(col);
      const next = parseCurrency(cell.value);
      if (cell.value !== next) {
        cell.value = next;
        priceFixed += 1;
      }
    };
    fixMoney(colCost);
    fixMoney(colList);
    fixMoney(colMin);
    fixMoney(colAvg);
  });

  await wb.xlsx.writeFile(outPath);

  console.log('[Normalize] in:', inPath);
  console.log('[Normalize] out:', outPath);
  console.log('[Normalize] headers:', normalizedHeaders);
  console.log('[Normalize] rows:', ws.rowCount);
  console.log('[Normalize] fixed tax cells:', taxFixed);
  console.log('[Normalize] fixed stock cells:', stockFixed);
  console.log('[Normalize] fixed price cells:', priceFixed);
};

run().catch((error) => {
  console.error('[Normalize] Failed:', error);
  process.exit(1);
});

