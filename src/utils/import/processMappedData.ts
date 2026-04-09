// processMappedData.js
import type {
  MappedData,
  MappedRecord,
  MappedValue,
  ProcessMappedDataParams,
  TransformConfig,
} from './types';

const isMappedRecord = (value: unknown): value is MappedRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const coerceMappedValue = (value: unknown): MappedValue => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  if (isMappedRecord(value)) return value;
  return String(value);
};

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
      {
        transforms: Array<(value: unknown, row: MappedRecord) => unknown>;
        source?: string;
      }
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
      setNestedValue(transformedItem, field, coerceMappedValue(value));
    });

    return transformedItem;
  });
};

// Helper function to safely get nested values
function getNestedValue(obj: MappedRecord, path: string): MappedValue | undefined {
  return path
    .split('.')
    .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

// Helper function to safely set nested values
function setNestedValue(obj: MappedRecord, path: string, value: MappedValue) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const existing = current[key];
    if (!isMappedRecord(existing)) {
      current[key] = {};
    }
    current = current[key] as MappedRecord;
  }

  current[keys[keys.length - 1]] = value;
}
