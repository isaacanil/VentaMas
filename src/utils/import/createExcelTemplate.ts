import { saveXlsxFile } from '@/utils/export/xlsx';

export const createExcelTemplate = async (
  headers: string[],
  fileName: string,
): Promise<void> => {
  try {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plantilla');

    worksheet.addRow(headers);

    if (!worksheet.columns || worksheet.columns.length === 0) {
      console.error('No se han agregado columnas al archivo.');
      console.error(`Columnas: ${worksheet.columns}`);
      return;
    }

    worksheet.columns.forEach((column) => {
      column.width =
        Math.max(...column.values.map((val) => val.toString().length)) + 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveXlsxFile({
      content: buffer,
      fileName,
    });
  } catch (error) {
    console.error('Error al crear la plantilla:', error);
    throw error;
  }
};
