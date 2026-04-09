// Definición de campos esenciales
import type {
  AvailableHeaders,
  HeaderGroupMap,
  HeaderMapping,
} from '@/utils/import/types';

const essentialFieldsEs = [
  'Categoría',
  'Nombre',
  'Precio de Lista',
  'Costo',
  'Stock',
  'Código de Barras',
];

const essentialFieldsEn = [
  'Category',
  'Name',
  'List Price',
  'Cost',
  'Stock',
  'Barcode',
];

// Agrupaciones de campos opcionales por categoría
const optionalGroupsEs = {
  Identificación: ['Código QR'],
  Precios: ['Precio Promedio', 'Precio Mínimo', 'Impuesto'],
  Características: [
    'Tamaño',
    'Peso',
    'Se Vende por Peso',
    'Unidad de Peso',
    'Contenido Neto',
    'Medición',
    'Principio Activo',
  ],
  Visualización: ['Imagen', 'Es Visible', 'Orden', 'Pie de Página', 'Tipo'],
  Promociones: [
    'Promoción Activa',
    'Inicio de Promoción',
    'Fin de Promoción',
    'Descuento',
  ],
  Inventario: ['Rastreo de Inventario', 'Cantidad a Comprar'],
  Garantía: ['Garantía Activa', 'Cantidad de Garantía', 'Unidad de Garantía'],
};

const optionalGroupsEn = {
  Identification: ['QR Code'],
  Pricing: ['Average Price', 'Minimum Price', 'Tax'],
  Characteristics: [
    'Size',
    'Weight',
    'Is Sold By Weight',
    'Weight Unit',
    'Net Content',
    'Measurement',
    'Active Ingredients',
  ],
  Display: ['Image', 'Is Visible', 'Order', 'Footer', 'Type'],
  Promotions: [
    'Promotion Active',
    'Promotion Start',
    'Promotion End',
    'Discount',
  ],
  Inventory: ['Track Inventory', 'Amount to Buy'],
  Warranty: ['Warranty Status', 'Warranty Quantity', 'Warranty Unit'],
};

const languages: Record<string, string[]> = {
  es: essentialFieldsEs,
  en: essentialFieldsEn,
};

const optionalGroups: Record<string, HeaderGroupMap> = {
  es: optionalGroupsEs,
  en: optionalGroupsEn,
};

export const filterEssentialHeaders = (
  headerMappings: HeaderMapping,
  language = 'es',
): string[] => {
  const headers = headerMappings[language];

  // Seleccionar los campos esenciales según el idioma
  const essentialFields = languages[language];

  // Filtrar solo los campos esenciales
  const filteredHeaders = Object.keys(headers).filter((key) =>
    essentialFields.includes(key),
  );

  return filteredHeaders;
};

// Obtiene todos los campos disponibles clasificados como esenciales y opcionales
export const getAvailableHeaders = (
  headerMappings: HeaderMapping,
  language = 'es',
): AvailableHeaders => {
  const headers = headerMappings[language];
  const essentialFields = languages[language];
  const groups = optionalGroups[language];

  if (!headers) return { essential: [], optionalGroups: {} };

  // Separar campos en esenciales y opcionales agrupados
  const essential = Object.keys(headers).filter((key) =>
    essentialFields.includes(key),
  );

  // Inicializar grupos de campos opcionales
  const optionalGrouped: HeaderGroupMap = {};

  // Asignar campos a sus grupos correspondientes
  Object.entries(groups).forEach(([groupName, fieldList]) => {
    optionalGrouped[groupName] = fieldList.filter((field) =>
      Object.keys(headers).includes(field),
    );
  });

  // Verificar si hay campos en headers que no están en ningún grupo y agregarlos a "Otros"
  const allGroupedFields = Object.values(groups).flat();
  const ungroupedFields = Object.keys(headers).filter(
    (key) => !essentialFields.includes(key) && !allGroupedFields.includes(key),
  );

  if (ungroupedFields.length > 0) {
    const otrosLabel = language === 'es' ? 'Otros' : 'Others';
    optionalGrouped[otrosLabel] = ungroupedFields;
  }

  return { essential, optionalGroups: optionalGrouped };
};

// Función para crear encabezados según selección
export const createSelectedHeaders = (
  headerMappings: HeaderMapping,
  language = 'es',
  optionalSelected: string[] = [],
): string[] => {
  const { essential } = getAvailableHeaders(headerMappings, language);
  return [...essential, ...optionalSelected];
};
