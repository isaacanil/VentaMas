// excelReader.js
import ExcelJS from 'exceljs';

export const readExcelFile = async (file) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file);

  const worksheet = workbook.worksheets[0];
  const jsonData = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const rowValues = row.values.slice(1); // Elimina el primer elemento que es el número de fila
    if (rowNumber === 1) {
      jsonData.push(rowValues);
    } else {
      const rowObject = {};
      jsonData[0].forEach((key, index) => {
        rowObject[key] = rowValues[index];
      });
      jsonData.push(rowObject);
    }
  });

  jsonData.shift(); // Elimina la primera fila (encabezados)
  return jsonData;
};
