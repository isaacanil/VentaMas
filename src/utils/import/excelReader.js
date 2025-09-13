// excelReader.js
import ExcelJS from 'exceljs';

export const readExcelFile = async (file) => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Obtener el nombre del archivo para determinar el tipo
    const fileName = file.name || '';
    const isXlsFile = fileName.toLowerCase().endsWith('.xls');
    const isXlsxFile = fileName.toLowerCase().endsWith('.xlsx');
    
    console.log('📁 Archivo detectado:', { fileName, isXlsFile, isXlsxFile });
    
    // Verificar compatibilidad con archivos .xls
    if (isXlsFile) {
      throw new Error('❌ Los archivos .xls (Excel 97-2003) no son compatibles.\n\n💡 Soluciones:\n1. Convierte el archivo a formato .xlsx\n2. Guarda como CSV desde Excel\n3. Usa LibreOffice para convertir a .xlsx');
    }
    
    // Cargar el archivo Excel
    if (file instanceof ArrayBuffer) {
      await workbook.xlsx.load(file);
    } else if (file instanceof File || file instanceof Blob) {
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
    } else {
      // Asumir que es un ArrayBuffer
      await workbook.xlsx.load(file);
    }

    console.log('📊 Hojas encontradas:', workbook.worksheets.length);
    
    const worksheet = workbook.worksheets[0];
    
    // Verificar que el worksheet existe
    if (!worksheet) {
      throw new Error('❌ No se encontró ninguna hoja de trabajo en el archivo Excel.\n\n💡 Verifica que:\n1. El archivo no esté vacío\n2. El archivo no esté corrupto\n3. Tengas al menos una hoja con datos');
    }
    
    console.log('📋 Procesando hoja:', worksheet.name || 'Hoja sin nombre');
    
    // Verificar que la hoja tiene filas
    if (worksheet.rowCount === 0) {
      throw new Error('❌ La hoja de Excel está vacía. Agrega datos antes de importar.');
    }
    
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

    console.log('✅ Filas procesadas:', jsonData.length + 1, '(incluyendo encabezados)');
    
    if (jsonData.length === 0) {
      throw new Error('❌ No se encontraron datos para procesar. Verifica que la hoja tenga al menos una fila de datos además de los encabezados.');
    }
    
    jsonData.shift(); // Elimina la primera fila (encabezados)
    return jsonData;
  } catch (error) {
    console.error('❌ Error leyendo archivo Excel:', error);
    
    // Mejorar el mensaje de error según el tipo de error
    if (error.message.includes('Zip')) {
      throw new Error('❌ El archivo parece estar corrupto o no es un archivo Excel válido.\n\n💡 Intenta:\n1. Abrir el archivo en Excel y guardarlo nuevamente\n2. Verificar que el archivo no esté dañado');
    }
    
    throw new Error(`❌ Error al leer el archivo Excel: ${error.message}`);
  }
};
