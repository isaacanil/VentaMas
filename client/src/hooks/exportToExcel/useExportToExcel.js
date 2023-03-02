import ExcelJS from 'exceljs';

const exportToExcel = (data, sheetName, fileName) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  const columns = Object.keys(data[0]);
  worksheet.columns = columns.map((column) => ({ header: column, key: column }));

  data.forEach((item) => {
    worksheet.addRow(item);
  });

  workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  });
};

export default exportToExcel;
