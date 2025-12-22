import { createExcelTemplate } from '../createExcelTemplate';
import { readExcelFile } from '../excelReader';
import { mapData } from '../mapData';
import { processMappedData } from '../processMappedData';

import { createSelectedHeaders } from './filterEssentialHeaders';
import { productHeaderMappings } from './headerMappings';
import { transformConfig } from './transformFunctions';

export const importProductData = async (file, language = 'en') => {
  if (!file) {
    console.error('No file selected.');
    return;
  }
  try {
    // Pasar el archivo directamente a readExcelFile
    const data = await readExcelFile(file);

    const headerMapping = productHeaderMappings;

    const dataMapped = mapData({
      data,
      headerMapping,
      transformConfig,
      language,
    });

    const transformedData = processMappedData({
      dataMapped,
      transformConfig,
    });

    return transformedData;
  } catch (error) {
    console.error('Error al importar datos de productos:', error);
    throw error;
  }
};
// Función específica para generar una plantilla de productos en Excel
export const createProductTemplate = async (
  language = 'es',
  optionalFields = [],
) => {
  try {
    const headers = createSelectedHeaders(
      productHeaderMappings,
      language,
      optionalFields,
    );

    const fileName = `Plantilla_Productos_${language}.xlsx`;
    await createExcelTemplate(headers, fileName);
  } catch (error) {
    console.error('Error al crear la plantilla de productos:', error);
    throw error;
  }
};
