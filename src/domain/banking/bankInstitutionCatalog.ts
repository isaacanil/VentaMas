export const DEFAULT_BANK_INSTITUTION_COUNTRY_CODE = 'DO' as const;
export const CUSTOM_BANK_INSTITUTION_CODE = 'CUSTOM' as const;

export interface BankInstitutionCatalogEntry {
  id?: string;
  code: string;
  countryCode: string;
  name: string;
  normalizedName?: string | null;
  status?: string | null;
  isSystemBuiltin?: boolean | null;
  source?: string | null;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const normalizeBankInstitutionName = (
  value: string | null | undefined,
) =>
  (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const normalizeBankInstitutionCountryCode = (
  value: string | null | undefined,
) =>
  (toCleanString(value)?.toUpperCase() ??
    DEFAULT_BANK_INSTITUTION_COUNTRY_CODE) as string;

export const normalizeBankInstitutionCode = (
  value: string | null | undefined,
) => {
  const normalizedValue = toCleanString(value);
  if (!normalizedValue) {
    return null;
  }

  return normalizedValue.toUpperCase() === CUSTOM_BANK_INSTITUTION_CODE
    ? CUSTOM_BANK_INSTITUTION_CODE
    : normalizedValue.toLowerCase();
};

export const normalizeBankInstitutionCatalogRecord = (
  id: string,
  value: unknown,
): BankInstitutionCatalogEntry | null => {
  const record = asRecord(value);
  const code = normalizeBankInstitutionCode(record.code);
  const name = toCleanString(record.name);

  if (!code || code === CUSTOM_BANK_INSTITUTION_CODE || !name) {
    return null;
  }

  return {
    id,
    code,
    countryCode: normalizeBankInstitutionCountryCode(record.countryCode),
    name,
    normalizedName:
      toCleanString(record.normalizedName) ?? normalizeBankInstitutionName(name),
    status: toCleanString(record.status)?.toLowerCase() ?? 'active',
    isSystemBuiltin:
      typeof record.isSystemBuiltin === 'boolean'
        ? record.isSystemBuiltin
        : null,
    source: toCleanString(record.source),
  };
};

export const sortBankInstitutionCatalog = (
  entries: readonly BankInstitutionCatalogEntry[],
): BankInstitutionCatalogEntry[] =>
  [...entries].sort((left, right) =>
    left.name.localeCompare(right.name, 'es', { sensitivity: 'base' }),
  );

export const resolveBankInstitution = (
  catalog: readonly BankInstitutionCatalogEntry[],
  countryCode: string | null | undefined,
  bankCode: string | null | undefined,
): BankInstitutionCatalogEntry | null => {
  const normalizedBankCode = normalizeBankInstitutionCode(bankCode);
  if (
    !normalizedBankCode ||
    normalizedBankCode === CUSTOM_BANK_INSTITUTION_CODE
  ) {
    return null;
  }

  return (
    catalog.find(
      (institution) =>
        institution.countryCode ===
          normalizeBankInstitutionCountryCode(countryCode) &&
        institution.code === normalizedBankCode,
    ) ?? null
  );
};

export const findBankInstitutionByName = (
  catalog: readonly BankInstitutionCatalogEntry[],
  institutionName: string | null | undefined,
  countryCode: string | null | undefined = DEFAULT_BANK_INSTITUTION_COUNTRY_CODE,
): BankInstitutionCatalogEntry | null => {
  const normalizedInstitutionName = normalizeBankInstitutionName(institutionName);
  if (!normalizedInstitutionName) {
    return null;
  }

  return (
    catalog.find(
      (institution) =>
        institution.countryCode ===
          normalizeBankInstitutionCountryCode(countryCode) &&
        normalizeBankInstitutionName(institution.name) ===
          normalizedInstitutionName,
    ) ?? null
  );
};
