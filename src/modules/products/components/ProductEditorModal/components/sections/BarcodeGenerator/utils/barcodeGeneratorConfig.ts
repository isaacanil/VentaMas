import type { BarcodeSettings } from '@/domain/barcode/types';

type CompanyPrefixValidationStatus = {
  message: string;
  status: '' | 'error' | 'success';
};

export const isCompanyPrefixConfigValid = (
  companyPrefix: string | null | undefined,
) => !companyPrefix || /^\d{4,7}$/.test(companyPrefix);

export const getBarcodePreferenceDefaults = (
  settings: BarcodeSettings | null | undefined,
) => ({
  autoModeDefault:
    typeof settings?.autoModeDefault === 'boolean'
      ? settings.autoModeDefault
      : true,
  useCompanyPrefixDefault:
    typeof settings?.useCompanyPrefixDefault === 'boolean'
      ? settings.useCompanyPrefixDefault
      : false,
});

export const buildConfigFromCompanyPrefix = (
  baseConfig: BarcodeSettings | null | undefined,
  companyPrefix: string,
): BarcodeSettings => {
  let nextConfig: BarcodeSettings = {
    ...baseConfig,
    companyPrefix,
  };

  if (/^\d+$/.test(companyPrefix)) {
    const companyPrefixLength = companyPrefix.length;
    const itemReferenceLength = 9 - companyPrefixLength;

    if (itemReferenceLength >= 2 && itemReferenceLength <= 5) {
      const maxProducts = Math.pow(10, itemReferenceLength);
      nextConfig = {
        ...nextConfig,
        companyPrefixLength,
        itemReferenceLength,
        maxProducts,
        name: `Empresa ${companyPrefixLength}+${itemReferenceLength}`,
        description: `Configuración automática para ${maxProducts.toLocaleString()} productos`,
      };
    }
  }

  return nextConfig;
};

export const validateItemReference = (
  value: string,
  config: BarcodeSettings | null | undefined,
) => {
  if (!value) return null;
  if (!/^\d+$/.test(value)) return false;
  if (config && value.length !== config.itemReferenceLength) return false;
  return true;
};

export const validateInternalItemReference = (value: string) => {
  if (!value) return null;
  if (!/^\d+$/.test(value)) return false;
  if (value.length !== 9) return false;
  return true;
};

export const getCompanyPrefixValidationStatus = (
  companyPrefix: string,
  companyPrefixConfigValid: boolean,
): CompanyPrefixValidationStatus => {
  if (!companyPrefix) return { status: '', message: '' };

  if (!/^\d+$/.test(companyPrefix)) {
    return {
      status: 'error',
      message: 'Solo se permiten números',
    };
  }

  if (companyPrefix.length < 4) {
    return {
      status: 'error',
      message: `Mínimo 4 dígitos (tienes ${companyPrefix.length})`,
    };
  }

  if (companyPrefix.length > 7) {
    return {
      status: 'error',
      message: `Máximo 7 dígitos (tienes ${companyPrefix.length})`,
    };
  }

  if (companyPrefixConfigValid) {
    return {
      status: 'success',
      message: `✓ Configuración válida (${companyPrefix.length} dígitos)`,
    };
  }

  return { status: '', message: '' };
};
