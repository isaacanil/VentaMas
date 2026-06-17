import { normalizeHeaderKey } from './normalizeHeaderKey';
import { coerceMappedValue, setNestedValue } from './mappedRecord';
import type {
  HeaderAliases,
  MappedData,
  MappedRecord,
  MapDataParams,
} from './types';

const resolveNormalizedHeader = (
  value: unknown,
  language: string,
  headerAliases?: HeaderAliases,
) => {
  const normalized = normalizeHeaderKey(value);
  if (!normalized) return '';
  const alias = headerAliases?.[language]?.[normalized];
  if (!alias) return normalized;

  return normalizeHeaderKey(alias) || normalized;
};

export const mapData = ({
  data,
  headerMapping,
  headerAliases,
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
      const normalizedHeader = resolveNormalizedHeader(
        headerKey,
        language,
        headerAliases,
      );
      const mappedKey = normalizedMapping[normalizedHeader];
      if (!mappedKey) return;

      let value: unknown = rawValue;
      // Solo aplica trim si el valor es una cadena
      if (typeof value === 'string') {
        value = value.trim();
      }

      // Asignar el valor al campo mapeado
      setNestedValue(mappedItem, mappedKey, coerceMappedValue(value));
    });

    return mappedItem;
  });
};
