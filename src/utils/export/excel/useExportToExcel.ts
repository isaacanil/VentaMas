import type { Worksheet } from 'exceljs';

import { saveXlsxFile } from '@/utils/export/xlsx';

type ExportToExcelCallback<T extends Record<string, unknown>> = (
  worksheet: Worksheet,
  data: T[],
  columns: Array<keyof T & string>,
) => void;

const exportToExcel = async <T extends Record<string, unknown>>(
  data: T[],
  sheetName: string,
  fileName: string,
  onBeforeExport: ExportToExcelCallback<T> | null = null,
): Promise<{ success: true }> => {
  try {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    const columns = Object.keys(data[0] ?? {}) as Array<keyof T & string>;
    worksheet.columns = columns.map((column) => ({
      header: column,
      key: column,
    }));

    data.forEach((item) => {
      worksheet.addRow(item);
    });

    // Si se proporciona un callback, ejecutarlo para modificar la hoja antes de exportar
    if (onBeforeExport) {
      onBeforeExport(worksheet, data, columns);
    }

    const buffer = await workbook.xlsx.writeBuffer();

    saveXlsxFile({
      content: buffer,
      fileName,
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Error al exportar Excel:', error);
    throw error;
  }
};

export default exportToExcel;
