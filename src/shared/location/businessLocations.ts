import {
  DOMINICAN_MUNICIPALITY_OPTIONS,
  DOMINICAN_PROVINCE_OPTIONS,
} from './dominicanLocationCodes';

export type BusinessCountryCode = 'do' | 've';
export type BusinessCountryPhoneCode = 'DO' | 'VE';
export type BusinessMunicipalityInputMode = 'none' | 'select' | 'text';

export interface BusinessLocationOption {
  label: string;
  value: string;
}

export interface BusinessCountryLocationConfig {
  code: BusinessCountryCode;
  name: string;
  phoneCountryCode: BusinessCountryPhoneCode;
  subdivisionLabel: string;
  subdivisions: readonly BusinessLocationOption[];
  municipalityLabel?: string;
  municipalityInputMode?: BusinessMunicipalityInputMode;
}

export const DEFAULT_BUSINESS_COUNTRY_CODE: BusinessCountryCode = 'do';

const toOptions = (
  names: readonly string[],
): readonly BusinessLocationOption[] =>
  names.map((name) => ({ label: name, value: name }));

const VENEZUELAN_STATES = toOptions([
  'Distrito Capital',
  'Amazonas',
  'Anzoátegui',
  'Apure',
  'Aragua',
  'Barinas',
  'Bolívar',
  'Carabobo',
  'Cojedes',
  'Delta Amacuro',
  'Dependencias Federales',
  'Falcón',
  'Guárico',
  'La Guaira',
  'Lara',
  'Mérida',
  'Miranda',
  'Monagas',
  'Nueva Esparta',
  'Portuguesa',
  'Sucre',
  'Táchira',
  'Trujillo',
  'Yaracuy',
  'Zulia',
]);

export const BUSINESS_LOCATION_COUNTRIES = [
  {
    code: 'do',
    name: 'República Dominicana',
    phoneCountryCode: 'DO',
    subdivisionLabel: 'Provincia',
    subdivisions: DOMINICAN_PROVINCE_OPTIONS,
    municipalityLabel: 'Municipio',
    municipalityInputMode: 'select',
  },
  {
    code: 've',
    name: 'Venezuela',
    phoneCountryCode: 'VE',
    subdivisionLabel: 'Estado',
    subdivisions: VENEZUELAN_STATES,
    municipalityLabel: 'Municipio',
    municipalityInputMode: 'text',
  },
] as const satisfies readonly BusinessCountryLocationConfig[];

const CONFIG_BY_COUNTRY = new Map<
  BusinessCountryCode,
  BusinessCountryLocationConfig
>(BUSINESS_LOCATION_COUNTRIES.map((country) => [country.code, country]));

const COUNTRY_ALIASES = new Map<string, BusinessCountryCode>([
  ['do', 'do'],
  ['dom', 'do'],
  ['rd', 'do'],
  ['republica dominicana', 'do'],
  ['república dominicana', 'do'],
  ['dominican republic', 'do'],
  ['ve', 've'],
  ['ven', 've'],
  ['venezuela', 've'],
]);

const normalizeLookupKey = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const normalizeBusinessCountryCode = (
  value: unknown,
): BusinessCountryCode => {
  const normalized = normalizeLookupKey(value);
  return COUNTRY_ALIASES.get(normalized) ?? DEFAULT_BUSINESS_COUNTRY_CODE;
};

export const getBusinessLocationConfig = (
  country: unknown,
): BusinessCountryLocationConfig =>
  CONFIG_BY_COUNTRY.get(normalizeBusinessCountryCode(country)) ??
  CONFIG_BY_COUNTRY.get(DEFAULT_BUSINESS_COUNTRY_CODE)!;

export const getBusinessCountryOptions = (): BusinessLocationOption[] =>
  BUSINESS_LOCATION_COUNTRIES.map((country) => ({
    label: country.name,
    value: country.code,
  }));

export const getBusinessCountryFormOptions = (): Array<{
  id: BusinessCountryCode;
  name: string;
}> =>
  BUSINESS_LOCATION_COUNTRIES.map((country) => ({
    id: country.code,
    name: country.name,
  }));

export const getBusinessSubdivisionLabel = (country: unknown): string =>
  getBusinessLocationConfig(country).subdivisionLabel;

export const getBusinessSubdivisionOptions = (
  country: unknown,
): BusinessLocationOption[] => [
  ...getBusinessLocationConfig(country).subdivisions,
];

export const getBusinessMunicipalityOptions = (
  country: unknown,
  subdivision: unknown,
): BusinessLocationOption[] => {
  if (getBusinessMunicipalityInputMode(country) !== 'select') return [];
  if (normalizeBusinessCountryCode(country) !== 'do') return [];

  const provinceCode = getDominicanProvinceCode(subdivision);
  if (!provinceCode) return [];

  return DOMINICAN_MUNICIPALITY_OPTIONS.filter(
    (option) => option.provinceCode === provinceCode,
  ).map(({ label, value }) => ({ label, value }));
};

export const getBusinessMunicipalityInputMode = (
  country: unknown,
): BusinessMunicipalityInputMode =>
  getBusinessLocationConfig(country).municipalityInputMode ?? 'none';

export const getBusinessMunicipalityLabel = (country: unknown): string =>
  getBusinessLocationConfig(country).municipalityLabel ?? 'Municipio';

export const getBusinessCountryPhoneCode = (
  country: unknown,
): BusinessCountryPhoneCode =>
  getBusinessLocationConfig(country).phoneCountryCode;

export const getCanonicalBusinessSubdivision = (
  country: unknown,
  value: unknown,
): string | null => {
  const normalizedValue = normalizeLookupKey(value);
  if (!normalizedValue) return null;

  const subdivision = getBusinessLocationConfig(country).subdivisions.find(
    (option) =>
      normalizeLookupKey(option.value) === normalizedValue ||
      normalizeLookupKey(option.label) === normalizedValue,
  );

  return subdivision?.value ?? null;
};

export const isBusinessSubdivisionValueSupported = (
  country: unknown,
  value: unknown,
): boolean => {
  if (!String(value ?? '').trim()) return true;
  return Boolean(getCanonicalBusinessSubdivision(country, value));
};

export const normalizeBusinessSubdivisionForStorage = (
  country: unknown,
  value: unknown,
): string => {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) return '';
  return getCanonicalBusinessSubdivision(country, rawValue) ?? rawValue;
};

export const getDominicanProvinceCode = (value: unknown): string | null => {
  const canonicalProvince = getCanonicalBusinessSubdivision('do', value);
  if (!canonicalProvince) return null;

  return (
    DOMINICAN_PROVINCE_OPTIONS.find(
      (option) => option.value === canonicalProvince,
    )?.code ?? null
  );
};

export const getCanonicalBusinessMunicipality = (
  country: unknown,
  subdivision: unknown,
  value: unknown,
): string | null => {
  if (normalizeBusinessCountryCode(country) !== 'do') return null;

  const rawValue = String(value ?? '').trim();
  if (!rawValue) return null;

  const provinceCode = getDominicanProvinceCode(subdivision);
  const candidates = provinceCode
    ? DOMINICAN_MUNICIPALITY_OPTIONS.filter(
        (option) => option.provinceCode === provinceCode,
      )
    : DOMINICAN_MUNICIPALITY_OPTIONS;
  const normalizedValue = normalizeLookupKey(rawValue);

  const municipality = candidates.find(
    (option) =>
      option.value === rawValue ||
      normalizeLookupKey(option.label) === normalizedValue,
  );

  return municipality?.value ?? null;
};

export const isBusinessMunicipalityValueSupported = (
  country: unknown,
  subdivision: unknown,
  value: unknown,
): boolean => {
  if (!String(value ?? '').trim()) return true;
  if (normalizeBusinessCountryCode(country) !== 'do') return true;
  return Boolean(getCanonicalBusinessMunicipality(country, subdivision, value));
};

export const normalizeBusinessMunicipalityForStorage = (
  country: unknown,
  subdivision: unknown,
  value: unknown,
): string => {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) return '';
  return (
    getCanonicalBusinessMunicipality(country, subdivision, rawValue) ?? rawValue
  );
};
