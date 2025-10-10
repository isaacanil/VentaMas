import * as exceljs from 'exceljs';
import { useState } from 'react';

import { processTsvFile } from '../code/excelUtils';
import { REQUIRED_HEADERS } from '../code/updateProductsConfig';

// Hook personalizado para procesar archivos
const useFileProcessing = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Función para leer un archivo como ArrayBuffer (Promise)
    const readFileAsArrayBuffer = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsArrayBuffer(file);
        });
    };

    // Función para leer un archivo como texto (Promise)
    const readFileAsText = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsText(file);
        });
    };

    // Procesar archivos Excel
    const processExcelFile = async (file) => {
        try {
            // Leer el archivo como ArrayBuffer
            const content = await readFileAsArrayBuffer(file);

            // Cargar el libro de trabajo
            const workbook = await new exceljs.Workbook().xlsx.load(content);

            // Obtener la primera hoja
            const worksheet = workbook.getWorksheet(1);
            if (!worksheet) {
                throw new Error('No se encontró ninguna hoja en el archivo Excel');
            }

            // Extraer datos como formato TSV
            let textContent = "";

            // Obtener encabezados de la primera fila
            const headers = [];
            worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell) => {
                headers.push(cell.value ? cell.value.toString().trim() : "");            });

            // Verificar que tenemos los encabezados mínimos necesarios
            for (const header of REQUIRED_HEADERS) {
                if (!headers.includes(header)) {
                    throw new Error(`El archivo Excel no contiene la columna requerida: ${header}`);
                }
            }

            // Construir primera línea con encabezados
            textContent += headers.join('\t') + '\n';

            // Extraer filas
            let rowsExtracted = 0;
            for (let i = 2; i <= worksheet.rowCount; i++) {
                const row = worksheet.getRow(i);
                if (row.cellCount === 0) continue; // Saltar filas vacías

                const rowValues = [];
                // Asegurarse de que todas las celdas posibles tengan un valor
                for (let j = 1; j <= headers.length; j++) {
                    const cell = row.getCell(j);
                    // Manejar diferentes tipos de celdas
                    if (cell.value === null || cell.value === undefined) {
                        rowValues.push("");
                    } else if (typeof cell.value === 'object' && cell.value.text) {
                        // Para celdas con formato enriquecido (RichText)
                        rowValues.push(cell.value.text.toString().trim());
                    } else if (typeof cell.value === 'object' && cell.value.result !== undefined) {
                        // Para celdas con fórmulas
                        rowValues.push(cell.value.result !== null ? cell.value.result.toString().trim() : "");
                    } else {
                        // Para valores normales
                        rowValues.push(cell.value.toString().trim());
                    }
                }

                // Agregar fila si tiene algún valor no vacío
                if (rowValues.some(val => val)) {
                    textContent += rowValues.join('\t') + '\n';
                    rowsExtracted++;
                }            }

            return textContent;
        } catch (err) {
            console.error('Error processing Excel file:', err);
            throw err;
        }
    };

    // Función principal para procesar archivos
    const processFile = async (file) => {
        if (!file) return null;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const fileName = file.name.toLowerCase();
            let importedProducts = [];

            // Determinar el tipo de archivo y procesarlo adecuadamente
            if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                // Procesar archivo Excel
                const textContent = await processExcelFile(file);
                importedProducts = processTsvFile(textContent);
            } else if (fileName.endsWith('.tsv') || fileName.endsWith('.txt') || fileName.endsWith('.csv')) {
                // Procesar archivo de texto
                const content = await readFileAsText(file);
                importedProducts = processTsvFile(content);
            } else {
                throw new Error('Formato de archivo no soportado. Por favor sube un archivo TSV, CSV o Excel.');
            }

            // Verificar que se importaron productos
            if (!importedProducts || importedProducts.length === 0) {
                throw new Error('No se pudieron importar productos del archivo. Verifica el formato.');            }

            setIsLoading(false);
            return importedProducts;
        } catch (err) {
            console.error('Error en processFile:', err);
            setError(err.message);
            setIsLoading(false);
            return null;
        }
    };

    return {
        processFile,
        isLoading,
        error,
        setError
    };
};

export default useFileProcessing;