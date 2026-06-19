export const GISYS_FACT_PROVIDER_ID = 'gisys_fact';
export const GISYS_FACT_DEFAULT_TOKEN_ENV = 'GISYS_FACT_CLIENT_TOKEN';
export const GISYS_FACT_DEFAULT_TIMEOUT_MS = 90000;

const CONFIG_NODE_KEYS = [
  'gisysFact',
  'gisysFACT',
  'gisys',
  'gisysapi',
  'electronicProvider',
  'electronicTaxReceipts',
];

const VALID_MODES = new Set(['shadow', 'pilot', 'required']);

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : null;

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toPositiveInteger = (value, fallback) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0
    ? Math.round(numeric)
    : fallback;
};

const toBoolean = (value, fallback = false) =>
  typeof value === 'boolean' ? value : fallback;

const hasOwn = (value, key) =>
  Object.prototype.hasOwnProperty.call(value || {}, key);

const normalizeMode = (value) => {
  const normalized = toCleanString(value)?.toLowerCase();
  return VALID_MODES.has(normalized) ? normalized : 'pilot';
};

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

const resolveConfigNode = (fiscalNode) => {
  for (const key of CONFIG_NODE_KEYS) {
    const candidate = asRecord(fiscalNode?.[key]);
    if (candidate) return candidate;
  }
  return {};
};

export const resolveGisysFactConfig = (businessDoc, platformDoc = {}) => {
  const fiscalNode = resolveFiscalNode(businessDoc);
  const providerNode = resolveConfigNode(fiscalNode);
  const platformNode = asRecord(platformDoc) || {};
  const platformOwnsElectronicModel = hasOwn(
    platformNode,
    'electronicModelEnabled',
  );

  const baseUrl =
    toCleanString(platformNode.baseUrl) ||
    toCleanString(process.env.GISYS_FACT_BASE_URL) ||
    toCleanString(providerNode.baseUrl) ||
    toCleanString(providerNode.apiBaseUrl);
  const integrationInstanceCode =
    toCleanString(platformNode.integrationInstanceCode) ||
    toCleanString(platformNode.instanceCode) ||
    toCleanString(process.env.GISYS_FACT_INTEGRATION_INSTANCE_CODE) ||
    toCleanString(providerNode.integrationInstanceCode) ||
    toCleanString(providerNode.instanceCode);
  const taxpayerCode =
    toCleanString(providerNode.taxpayerCode) ||
    toCleanString(providerNode.taxpayer) ||
    toCleanString(process.env.GISYS_FACT_TAXPAYER_CODE);
  const tokenEnvName =
    toCleanString(process.env.GISYS_FACT_TOKEN_ENV_NAME) ||
    GISYS_FACT_DEFAULT_TOKEN_ENV;
  const issuePath =
    toCleanString(platformNode.issuePath) ||
    toCleanString(providerNode.issuePath) ||
    toCleanString(process.env.GISYS_FACT_ISSUE_PATH);
  const mode = normalizeMode(
    platformNode.mode || process.env.GISYS_FACT_MODE || providerNode.mode,
  );
  const electronicModelEnabled = platformOwnsElectronicModel
    ? toBoolean(platformNode.electronicModelEnabled)
    : toBoolean(fiscalNode?.electronicModelEnabled);
  const electronicTransportEnabled =
    electronicModelEnabled &&
    (platformOwnsElectronicModel
      ? mode !== 'shadow'
      : toBoolean(fiscalNode?.electronicTransportEnabled));

  return {
    providerId: GISYS_FACT_PROVIDER_ID,
    enabled: platformNode.enabled !== false && providerNode.enabled !== false,
    mode,
    electronicModelEnabled,
    electronicTransportEnabled,
    baseUrl,
    integrationInstanceCode,
    taxpayerCode,
    tokenEnvName,
    issuePath,
    timeoutMs: toPositiveInteger(
      platformNode.timeoutMs ??
        process.env.GISYS_FACT_TIMEOUT_MS ??
        providerNode.timeoutMs,
      GISYS_FACT_DEFAULT_TIMEOUT_MS,
    ),
  };
};

export const getGisysFactConfigIssues = (config, options = {}) => {
  const requireTransport = options.requireTransport !== false;
  const issues = [];
  if (!config?.enabled) issues.push('provider-disabled');
  if (requireTransport && !config?.baseUrl) issues.push('missing-base-url');
  if (!config?.integrationInstanceCode) {
    issues.push('missing-integration-instance-code');
  }
  if (!config?.taxpayerCode) issues.push('missing-taxpayer-code');
  return issues;
};

export const resolveGisysFactToken = (config) => {
  const envName = config?.tokenEnvName || GISYS_FACT_DEFAULT_TOKEN_ENV;
  return toCleanString(process.env[envName]);
};
