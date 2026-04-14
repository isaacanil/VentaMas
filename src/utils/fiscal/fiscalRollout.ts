type UnknownRecord = Record<string, unknown>;

export type BusinessFiscalRollout = {
  domainV2Enabled: boolean;
  sequenceEngineV2Enabled: boolean;
  reportingEnabled: boolean;
  monthlyComplianceEnabled: boolean;
  electronicModelEnabled: boolean;
  electronicTransportEnabled: boolean;
  taxationEnabled: boolean;
};

export type TaxationPolicySource = 'legacy-tax-receipt' | 'business-fiscal';

export const DEFAULT_BUSINESS_FISCAL_ROLLOUT: BusinessFiscalRollout =
  Object.freeze({
    domainV2Enabled: false,
    sequenceEngineV2Enabled: false,
    reportingEnabled: false,
    monthlyComplianceEnabled: false,
    electronicModelEnabled: false,
    electronicTransportEnabled: false,
    taxationEnabled: true,
  });

const asRecord = (value: unknown): UnknownRecord | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;

const toBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback;

const resolveFiscalNode = (
  business: UnknownRecord | null | undefined,
): UnknownRecord | null => {
  const root = asRecord(business);
  if (!root) return null;

  const features = asRecord(root.features);
  const businessNode = asRecord(root.business);
  const nestedFeatures = asRecord(businessNode?.features);

  return (
    asRecord(features?.fiscal) ??
    asRecord(root.fiscal) ??
    asRecord(nestedFeatures?.fiscal) ??
    asRecord(businessNode?.fiscal) ??
    null
  );
};

export const resolveBusinessFiscalRollout = (
  business: UnknownRecord | null | undefined,
): BusinessFiscalRollout => {
  const fiscalNode = resolveFiscalNode(business);

  return {
    domainV2Enabled: toBoolean(
      fiscalNode?.domainV2Enabled,
      DEFAULT_BUSINESS_FISCAL_ROLLOUT.domainV2Enabled,
    ),
    sequenceEngineV2Enabled: toBoolean(
      fiscalNode?.sequenceEngineV2Enabled,
      DEFAULT_BUSINESS_FISCAL_ROLLOUT.sequenceEngineV2Enabled,
    ),
    reportingEnabled: toBoolean(
      fiscalNode?.reportingEnabled,
      DEFAULT_BUSINESS_FISCAL_ROLLOUT.reportingEnabled,
    ),
    monthlyComplianceEnabled: toBoolean(
      fiscalNode?.monthlyComplianceEnabled,
      DEFAULT_BUSINESS_FISCAL_ROLLOUT.monthlyComplianceEnabled,
    ),
    electronicModelEnabled: toBoolean(
      fiscalNode?.electronicModelEnabled,
      DEFAULT_BUSINESS_FISCAL_ROLLOUT.electronicModelEnabled,
    ),
    electronicTransportEnabled: toBoolean(
      fiscalNode?.electronicTransportEnabled,
      DEFAULT_BUSINESS_FISCAL_ROLLOUT.electronicTransportEnabled,
    ),
    taxationEnabled: toBoolean(
      fiscalNode?.taxationEnabled,
      DEFAULT_BUSINESS_FISCAL_ROLLOUT.taxationEnabled,
    ),
  };
};

export const resolveBusinessFiscalTaxationPolicy = ({
  business,
  taxReceiptEnabled,
}: {
  business: UnknownRecord | null | undefined;
  taxReceiptEnabled?: boolean | null;
}): {
  documentaryEnabled: boolean;
  taxationEnabled: boolean;
  source: TaxationPolicySource;
  rollout: BusinessFiscalRollout;
} => {
  const rollout = resolveBusinessFiscalRollout(business);
  const documentaryEnabled = Boolean(taxReceiptEnabled);
  const useBusinessFiscalPolicy = rollout.domainV2Enabled;

  return {
    documentaryEnabled,
    taxationEnabled: useBusinessFiscalPolicy
      ? rollout.taxationEnabled
      : documentaryEnabled,
    source: useBusinessFiscalPolicy
      ? 'business-fiscal'
      : 'legacy-tax-receipt',
    rollout,
  };
};

export const shouldUseBackendFiscalSequence = (
  business: UnknownRecord | null | undefined,
): boolean => resolveBusinessFiscalRollout(business).sequenceEngineV2Enabled;
