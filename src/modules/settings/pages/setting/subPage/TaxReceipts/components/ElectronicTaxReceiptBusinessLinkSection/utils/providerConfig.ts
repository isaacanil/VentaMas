import type {
  ElectronicTaxReceiptMode,
} from '@/firebase/electronicTaxReceipts/fbUpdateElectronicTaxReceiptConfig';

export type BusinessFiscalConfig = {
  features?: {
    fiscal?: {
      electronicModelEnabled?: boolean;
      electronicTransportEnabled?: boolean;
      gisysFact?: Record<string, unknown>;
      gisys?: Record<string, unknown>;
      gisysapi?: Record<string, unknown>;
      electronicTaxReceipts?: Record<string, unknown>;
    };
  };
  fiscal?: Record<string, unknown>;
  [key: string]: unknown;
};

export type ElectronicTaxReceiptBusinessLinkFormValues = {
  electronicModelEnabled: boolean;
  mode: ElectronicTaxReceiptMode;
  integrationInstanceCode: string;
  taxpayerCode: string;
};

export const DEFAULT_ELECTRONIC_TAX_RECEIPT_BUSINESS_LINK_VALUES: ElectronicTaxReceiptBusinessLinkFormValues =
  {
    electronicModelEnabled: false,
    mode: 'shadow',
    integrationInstanceCode: '',
    taxpayerCode: '',
  };

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const pickRecord = (...values: unknown[]): Record<string, unknown> => {
  for (const value of values) {
    const record = asRecord(value);
    if (Object.keys(record).length > 0) return record;
  }
  return {};
};

const asString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export const resolveElectronicTaxReceiptProviderNode = (
  business?: BusinessFiscalConfig | null,
): Record<string, unknown> => {
  const fiscalNode = pickRecord(business?.features?.fiscal, business?.fiscal);
  return pickRecord(
    fiscalNode.gisysFact,
    fiscalNode.gisys,
    fiscalNode.gisysapi,
    fiscalNode.electronicTaxReceipts,
  );
};

export const resolveElectronicTaxReceiptBusinessLinkValues = (
  business?: BusinessFiscalConfig | null,
): ElectronicTaxReceiptBusinessLinkFormValues => {
  const fiscalNode = asRecord(business?.features?.fiscal);
  const providerNode = resolveElectronicTaxReceiptProviderNode(business);
  const transportEnabled = fiscalNode.electronicTransportEnabled === true;
  const storedMode = asString(providerNode.mode);

  return {
    electronicModelEnabled: fiscalNode.electronicModelEnabled === true,
    mode: (transportEnabled
      ? storedMode || 'pilot'
      : 'shadow') as ElectronicTaxReceiptMode,
    integrationInstanceCode: asString(
      providerNode.integrationInstanceCode || providerNode.instanceCode,
    ),
    taxpayerCode: asString(providerNode.taxpayerCode || providerNode.taxpayer),
  };
};

export const buildElectronicTaxReceiptBusinessLinkFingerprint = (
  values: ElectronicTaxReceiptBusinessLinkFormValues,
) =>
  JSON.stringify({
    electronicModelEnabled: values.electronicModelEnabled,
    mode: values.mode,
    integrationInstanceCode: values.integrationInstanceCode,
    taxpayerCode: values.taxpayerCode,
  });

export const shouldSendElectronicTaxReceipts = (
  values: Pick<
    ElectronicTaxReceiptBusinessLinkFormValues,
    'electronicModelEnabled' | 'mode'
  >,
) => values.electronicModelEnabled && values.mode !== 'shadow';
