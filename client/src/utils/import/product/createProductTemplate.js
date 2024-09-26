import { createExcelTemplate } from '../excelUtils/createExcelTemplate';
import { productHeaderMappings } from './headerMappings';

// Función específica para generar una plantilla de productos en Excel
export const createProductTemplate = async (language = 'es') => {
  try {
    const headers = Object.keys(productHeaderMappings[language]);
    const fileName = `Plantilla_Productos_${language}.xlsx`;
    await createExcelTemplate(headers, fileName);
  } catch (error) {
    console.error('Error al crear la plantilla de productos:', error);
    throw error;
  }
};
