// excelReader.js
import { normalizeHeaderKey } from './normalizeHeaderKey';
import type {
  ExcelCellValue,
  ExcelInputFile,
  RawData,
  ReadExcelOptions,
} from './types';

const resolveCellValue = (cell: unknown): ExcelCellValue => {
  if (cell === null || cell === undefined) return cell as ExcelCellValue;
  if (typeof cell !== 'object') return cell as ExcelCellValue;
  if (cell instanceof Date) return cell;
  const cellRecord = cell as Record<string, unknown>;
  if (typeof cellRecord.text === 'string') return cellRecord.text;
  if ('result' in cellRecord) return cellRecord.result as ExcelCellValue;
  if (Array.isArray(cellRecord.richText)) {
    return (cellRecord.richText as Array<{ text?: string }>)
      .map((item) => item.text ?? '')
      .join('');
  }
  return cell as ExcelCellValue;
};

const trimCellValue = (value: ExcelCellValue): ExcelCellValue =>
  typeof value === 'string' ? value.trim() : value;

const isEmptyCellValue = (value: ExcelCellValue): boolean =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '');

const getRowValues = (row: { values: unknown }): ExcelCellValue[] => {
  const rawValues = row.values;
  const valuesArray = Array.isArray(rawValues)
    ? rawValues
    : rawValues && typeof rawValues === 'object'
      ? Object.values(rawValues as Record<string, unknown>)
      : [];
  return valuesArray.slice(1).map(resolveCellValue).map(trimCellValue);
};

export const readExcelFile = async (
  file: ExcelInputFile,
  options: ReadExcelOptions = {},
): Promise<RawData> => {
  try {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();

    // Obtener el nombre del archivo para determinar el tipo
    const fileName = file instanceof File ? file.name : '';
    const isXlsFile = fileName.toLowerCase().endsWith('.xls');
    const isXlsxFile = fileName.toLowerCase().endsWith('.xlsx');

    console.log('📁 Archivo detectado:', { fileName, isXlsFile, isXlsxFile });

    // Verificar compatibilidad con archivos .xls
    if (isXlsFile) {
      throw new Error(
        '❌ Los archivos .xls (Excel 97-2003) no son compatibles.\n\n💡 Soluciones:\n1. Convierte el archivo a formato .xlsx\n2. Guarda como CSV desde Excel\n3. Usa LibreOffice para convertir a .xlsx',
      );
    }

    // Cargar el archivo Excel
    if (file instanceof ArrayBuffer) {
      await workbook.xlsx.load(file);
    } else if (file instanceof Blob) {
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
    } else {
      await workbook.xlsx.load(file);
    }

    console.log('📊 Hojas encontradas:', workbook.worksheets.length);

    const worksheet = workbook.worksheets[0];

    // Verificar que el worksheet existe
    if (!worksheet) {
      throw new Error(
        '❌ No se encontró ninguna hoja de trabajo en el archivo Excel.\n\n💡 Verifica que:\n1. El archivo no esté vacío\n2. El archivo no esté corrupto\n3. Tengas al menos una hoja con datos',
      );
    }

    console.log('📋 Procesando hoja:', worksheet.name || 'Hoja sin nombre');

    // Verificar que la hoja tiene filas
    if (worksheet.rowCount === 0) {
      throw new Error(
        '❌ La hoja de Excel está vacía. Agrega datos antes de importar.',
      );
    }

    const { expectedHeaders = [], minHeaderMatches = 2 } = options;
    const normalizedExpectedHeaders = expectedHeaders
      .map(normalizeHeaderKey)
      .filter(Boolean);
    const expectedHeaderSet = new Set(normalizedExpectedHeaders);

    let headers: ExcelCellValue[] | null = null;
    let headerRowNumber: number | null = null;
    let firstNonEmptyRowValues: ExcelCellValue[] | null = null;
    let firstNonEmptyRowNumber: number | null = null;

    const getHeaderMatchCount = (rowValues: ExcelCellValue[]) => {
      if (!expectedHeaderSet.size) return 0;
      return rowValues
        .map(normalizeHeaderKey)
        .filter(Boolean)
        .reduce(
          (count, value) => (expectedHeaderSet.has(value) ? count + 1 : count),
          0,
        );
    };

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const rowValues = getRowValues(row);
      const hasValues = rowValues.some((value) => !isEmptyCellValue(value));

      if (hasValues && !firstNonEmptyRowValues) {
        firstNonEmptyRowValues = rowValues;
        firstNonEmptyRowNumber = rowNumber;
      }

      if (headerRowNumber !== null || !expectedHeaderSet.size) {
        return;
      }

      const matchCount = getHeaderMatchCount(rowValues);
      if (matchCount >= minHeaderMatches) {
        headers = rowValues;
        headerRowNumber = rowNumber;
      }
    });

    if (!headers && firstNonEmptyRowValues) {
      headers = firstNonEmptyRowValues;
      headerRowNumber = firstNonEmptyRowNumber;
    }

    const rows: RawData = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (!headers || headers.length === 0) return;
      if (headerRowNumber !== null && rowNumber <= headerRowNumber) return;

      const rowValues = getRowValues(row);
      const rowObject: Record<string, ExcelCellValue> = {};
      headers.forEach((key, index) => {
        const headerKey =
          typeof key === 'string'
            ? key.trim()
            : typeof key === 'number'
              ? String(key)
              : '';
        if (!headerKey) return; // ignora encabezados vacíos
        rowObject[headerKey] = rowValues[index];
      });
      rows.push(rowObject);
    });

    if (!headers || headers.length === 0) {
      throw new Error(
        '❌ No se encontraron encabezados en la hoja. Asegúrate de que la primera fila tenga nombres de columna.',
      );
    }

    console.log(
      '✅ Filas procesadas:',
      rows.length + 1,
      '(incluyendo encabezados)',
    );

    if (rows.length === 0) {
      throw new Error(
        '❌ No se encontraron datos para procesar. Verifica que la hoja tenga al menos una fila de datos además de los encabezados.',
      );
    }

    return rows;
  } catch (error: unknown) {
    console.error('❌ Error leyendo archivo Excel:', error);

    // Mejorar el mensaje de error según el tipo de error
    if (error instanceof Error && error.message.includes('Zip')) {
      throw new Error(
        '❌ El archivo parece estar corrupto o no es un archivo Excel válido.\n\n💡 Intenta:\n1. Abrir el archivo en Excel y guardarlo nuevamente\n2. Verificar que el archivo no esté dañado',
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`❌ Error al leer el archivo Excel: ${errorMessage}`);
  }
};
