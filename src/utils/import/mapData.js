import { normalizeHeaderKey } from './normalizeHeaderKey';

// mapData.js
const HEADER_ALIASES = {
  es: {
    codigo: 'codigo de barras',
    'codigo de barra': 'codigo de barras',
  },
};

const resolveNormalizedHeader = (value, language) => {
  const normalized = normalizeHeaderKey(value);
  if (!normalized) return '';
  return HEADER_ALIASES[language]?.[normalized] ?? normalized;
};

export const mapData = ({ data, headerMapping, language = 'es' }) => {
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
    {},
  );

  return data.map((item) => {
    const mappedItem = {};
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
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    current[key] = current[key] || {};
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}
