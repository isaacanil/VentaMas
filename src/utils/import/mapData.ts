import { normalizeHeaderKey } from './normalizeHeaderKey';
import type {
  HeaderAliases,
  MappedData,
  MappedRecord,
  MapDataParams,
} from './types';

// mapData.js
const HEADER_ALIASES: HeaderAliases = {
  es: {
    codigo: 'codigo de barras',
    'codigo de barra': 'codigo de barras',
  },
};

const resolveNormalizedHeader = (value: unknown, language: string) => {
  const normalized = normalizeHeaderKey(value);
  if (!normalized) return '';
  return HEADER_ALIASES[language]?.[normalized] ?? normalized;
};

export const mapData = ({
  data,
  headerMapping,
  language = 'es',
}: MapDataParams): MappedData => {
  if (!headerMapping?.[language]) return [];

  const languageMapping = headerMapping[language];
  const normalizedMapping = Object.entries(languageMapping).reduce(
    (acc, [headerKey, mappedKey]) => {
      const normalizedHeader = normalizeHeaderKey(headerKey);
      if (normalizedHeader) {
        acc[normalizedHeader] = mappedKey;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  return data.map((item) => {
    const mappedItem: MappedRecord = {};
    Object.entries(item).forEach(([headerKey, rawValue]) => {
      const normalizedHeader = resolveNormalizedHeader(headerKey, language);
      const mappedKey = normalizedMapping[normalizedHeader];
      if (!mappedKey) return;

      let value = rawValue;
      // Solo aplica trim si el valor es una cadena
      if (typeof value === 'string') {
        value = value.trim();
      }

      // Asignar el valor al campo mapeado
      setNestedValue(mappedItem, mappedKey, value);
    });

    return mappedItem;
  });
};

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
