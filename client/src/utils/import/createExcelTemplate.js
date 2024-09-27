import ExcelJS from 'exceljs';

export const createExcelTemplate = async (headers, fileName) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plantilla');

    worksheet.addRow(headers);

    worksheet.columns.forEach((column) => {
      column.width = Math.max(...column.values.map(val => val.toString().length)) + 2;
    });

    // En lugar de usar file-saver, puedes hacer esto directamente:
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    // Crear un enlace temporal para descargar el archivo
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    // Limpiar el DOM
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    console.log(`Archivo de plantilla creado: ${fileName}`);
  } catch (error) {
    console.error('Error al crear la plantilla:', error);
    throw error;
  }
};
