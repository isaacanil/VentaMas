const DEFAULT_FISCAL_ROLLOUT = Object.freeze({
  domainV2Enabled: false,
  sequenceEngineV2Enabled: false,
  reportingEnabled: false,
  monthlyComplianceEnabled: false,
  electronicModelEnabled: false,
  electronicTransportEnabled: false,
  taxationEnabled: true,
});

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : null;

const toBoolean = (value, fallback = false) =>
  typeof value === 'boolean' ? value : fallback;

const resolveFiscalNode = (businessDoc) => {
  const root = asRecord(businessDoc);
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

export const resolveBusinessFiscalRollout = (businessDoc) => {
  const fiscalNode = resolveFiscalNode(businessDoc);

  return {
    domainV2Enabled: toBoolean(
      fiscalNode?.domainV2Enabled,
      DEFAULT_FISCAL_ROLLOUT.domainV2Enabled,
    ),
    sequenceEngineV2Enabled: toBoolean(
      fiscalNode?.sequenceEngineV2Enabled,
      DEFAULT_FISCAL_ROLLOUT.sequenceEngineV2Enabled,
    ),
    reportingEnabled: toBoolean(
      fiscalNode?.reportingEnabled,
      DEFAULT_FISCAL_ROLLOUT.reportingEnabled,
    ),
    monthlyComplianceEnabled: toBoolean(
      fiscalNode?.monthlyComplianceEnabled,
      DEFAULT_FISCAL_ROLLOUT.monthlyComplianceEnabled,
    ),
    electronicModelEnabled: toBoolean(
      fiscalNode?.electronicModelEnabled,
      DEFAULT_FISCAL_ROLLOUT.electronicModelEnabled,
    ),
    electronicTransportEnabled: toBoolean(
      fiscalNode?.electronicTransportEnabled,
      DEFAULT_FISCAL_ROLLOUT.electronicTransportEnabled,
    ),
    taxationEnabled: toBoolean(
      fiscalNode?.taxationEnabled,
      DEFAULT_FISCAL_ROLLOUT.taxationEnabled,
    ),
  };
};

export const DEFAULT_BUSINESS_FISCAL_ROLLOUT = DEFAULT_FISCAL_ROLLOUT;
