export const GISYS_FACT_PROVIDER_ID = 'gisys_fact';
export const GISYS_FACT_DEFAULT_TOKEN_ENV = 'GISYS_FACT_CLIENT_TOKEN';

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

export const resolveGisysFactConfig = (businessDoc) => {
  const fiscalNode = resolveFiscalNode(businessDoc);
  const providerNode = resolveConfigNode(fiscalNode);

  const baseUrl =
    toCleanString(providerNode.baseUrl) ||
    toCleanString(providerNode.apiBaseUrl) ||
    toCleanString(process.env.GISYS_FACT_BASE_URL);
  const integrationInstanceCode =
    toCleanString(providerNode.integrationInstanceCode) ||
    toCleanString(providerNode.instanceCode) ||
    toCleanString(process.env.GISYS_FACT_INTEGRATION_INSTANCE_CODE);
  const taxpayerCode =
    toCleanString(providerNode.taxpayerCode) ||
    toCleanString(providerNode.taxpayer) ||
    toCleanString(process.env.GISYS_FACT_TAXPAYER_CODE);
  const tokenEnvName =
    toCleanString(providerNode.tokenEnvName) ||
    toCleanString(providerNode.clientTokenEnvName) ||
    GISYS_FACT_DEFAULT_TOKEN_ENV;
  const issuePath =
    toCleanString(providerNode.issuePath) ||
    toCleanString(process.env.GISYS_FACT_ISSUE_PATH);
  const dgiiEnvironment =
    toCleanString(providerNode.dgiiEnvironment) ||
    toCleanString(providerNode.environment) ||
    toCleanString(process.env.GISYS_FACT_DGII_ENVIRONMENT);

  return {
    providerId: GISYS_FACT_PROVIDER_ID,
    enabled: providerNode.enabled !== false,
    mode: normalizeMode(providerNode.mode || process.env.GISYS_FACT_MODE),
    baseUrl,
    integrationInstanceCode,
    taxpayerCode,
    tokenEnvName,
    issuePath,
    dgiiEnvironment,
    timeoutMs: toPositiveInteger(
      providerNode.timeoutMs ?? process.env.GISYS_FACT_TIMEOUT_MS,
      20000,
    ),
  };
};

export const getGisysFactConfigIssues = (config) => {
  const issues = [];
  if (!config?.enabled) issues.push('provider-disabled');
  if (!config?.baseUrl) issues.push('missing-base-url');
  if (!config?.integrationInstanceCode) {
    issues.push('missing-integration-instance-code');
  }
  if (!config?.taxpayerCode) issues.push('missing-taxpayer-code');
  if (!config?.tokenEnvName) issues.push('missing-token-env-name');
  return issues;
};

export const resolveGisysFactToken = (config) => {
  const envName = config?.tokenEnvName || GISYS_FACT_DEFAULT_TOKEN_ENV;
  return toCleanString(process.env[envName]);
};
