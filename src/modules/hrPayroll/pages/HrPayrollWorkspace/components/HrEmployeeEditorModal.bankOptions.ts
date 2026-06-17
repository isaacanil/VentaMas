import {
  normalizeBankInstitutionName,
  type BankInstitutionCatalogEntry,
} from '@/domain/banking/bankInstitutionCatalog';

export interface HrDepositBankOption {
  label: string;
  value: string;
}

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed.length ? trimmed : null;
};

export const buildHrDepositBankOptions = (
  bankInstitutionCatalog: readonly BankInstitutionCatalogEntry[],
  currentBankName?: string | null,
): HrDepositBankOption[] => {
  const catalogOptions = bankInstitutionCatalog.map((institution) => ({
    label: institution.name,
    value: institution.name,
  }));
  const currentValue = toCleanString(currentBankName);

  if (!currentValue) {
    return catalogOptions;
  }

  const hasCurrentValue = catalogOptions.some(
    (option) =>
      normalizeBankInstitutionName(option.value) ===
      normalizeBankInstitutionName(currentValue),
  );

  return hasCurrentValue
    ? catalogOptions
    : [
        {
          label: `${currentValue} (guardado)`,
          value: currentValue,
        },
        ...catalogOptions,
      ];
};

export const resolveHrDepositBankSelection = (
  options: readonly HrDepositBankOption[],
  currentBankName?: string | null,
): string | null => {
  const currentValue = toCleanString(currentBankName);

  if (!currentValue) {
    return null;
  }

  const exactOption = options.find((option) => option.value === currentValue);
  if (exactOption) {
    return exactOption.value;
  }

  const normalizedCurrentValue = normalizeBankInstitutionName(currentValue);
  const normalizedOption = options.find(
    (option) =>
      normalizeBankInstitutionName(option.value) === normalizedCurrentValue,
  );

  return normalizedOption?.value ?? currentValue;
};
