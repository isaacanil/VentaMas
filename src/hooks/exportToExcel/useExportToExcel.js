const exportToExcel = async (
  data,
  sheetName,
  fileName,
  onBeforeExport = null,
) => {
  try {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    const columns = Object.keys(data[0]);
    worksheet.columns = columns.map((column) => ({
      header: column,
      key: column,
    }));

    data.forEach((item) => {
      worksheet.addRow(item);
    });

    // Si se proporciona un callback, ejecutarlo para modificar la hoja antes de exportar
    if (onBeforeExport && typeof onBeforeExport === 'function') {
      onBeforeExport(worksheet, data, columns);
    }

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();

    // Limpiar el URL después de un pequeño delay
    setTimeout(() => URL.revokeObjectURL(url), 100);

    return { success: true };
  } catch (error) {
    console.error('❌ Error al exportar Excel:', error);
    throw error;
  }
};

export default exportToExcel;
