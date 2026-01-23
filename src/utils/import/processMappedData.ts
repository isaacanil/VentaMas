// processMappedData.js
import type {
  MappedData,
  MappedRecord,
  ProcessMappedDataParams,
  TransformConfig,
} from './types';

export const processMappedData = ({
  dataMapped,
  transformConfig,
}: ProcessMappedDataParams): MappedData => {
  // Crear un mapa de transformaciones estándar
  const normalizedTransformConfig: TransformConfig = transformConfig ?? [];
  const transformMap = normalizedTransformConfig.reduce(
    (acc, { field, transform, source }) => {
      if (typeof transform === 'function') {
        acc[field] = { transforms: acc[field]?.transforms || [], source };
        acc[field].transforms.push(transform);
      }
      return acc;
    },
    {} as Record<
      string,
      { transforms: Array<(value: unknown, row: MappedRecord) => unknown>; source?: string }
    >,
  );

  return dataMapped.map((item) => {
    const transformedItem = { ...item };

    Object.entries(transformMap).forEach(([field, { transforms, source }]) => {
      let value;

      if (source) {
        value = getNestedValue(item, source);
      } else {
        value = getNestedValue(item, field);
      }

      // Solo aplica trim si el valor es una cadena
      if (typeof value === 'string') {
        value = value.trim();
      }

      // Aplicar transformaciones secuencialmente
      try {
        value = transforms.reduce((val, fn) => fn(val, item), value);
      } catch (error) {
        console.error(`Error transforming value for ${field}:`, error);
        // Puedes decidir cómo manejar los errores aquí
      }

      // Asignar el valor transformado de vuelta al objeto
      setNestedValue(transformedItem, field, value);
    });

    return transformedItem;
  });
};

// Helper function to safely get nested values
function getNestedValue(obj: MappedRecord, path: string) {
  return path
    .split('.')
    .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

// Helper function to safely set nested values
function setNestedValue(obj: MappedRecord, path: string, value: unknown) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    current[key] = current[key] || {};
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}
