import {
  GISYS_FACT_DEFAULT_TOKEN_ENV,
  getGisysFactConfigIssues,
  resolveGisysFactConfig,
} from '../config/gisysFact.config.js';

const VALID_MODES = new Set(['shadow', 'pilot', 'required']);

export const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const toBoolean = (value) => value === true;

const normalizeMode = (value, fallback = 'pilot') => {
  const normalized = toCleanString(value)?.toLowerCase();
  return VALID_MODES.has(normalized) ? normalized : fallback;
};

const normalizeTimeoutMs = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 5000 && numeric <= 120000
    ? Math.round(numeric)
    : 20000;
};

export const buildGisysFactConfigSummaryFromInput = (data) => {
  const electronicModelEnabled = toBoolean(data?.electronicModelEnabled);
  const electronicTransportEnabled =
    electronicModelEnabled && toBoolean(data?.electronicTransportEnabled);
  const mode = electronicTransportEnabled
    ? normalizeMode(data?.mode, 'pilot')
    : 'shadow';
  const providerConfig = {
    providerId: 'gisys_fact',
    enabled: true,
    mode,
    baseUrl: toCleanString(process.env.GISYS_FACT_BASE_URL),
    integrationInstanceCode: toCleanString(data?.integrationInstanceCode),
    taxpayerCode: toCleanString(data?.taxpayerCode),
    tokenEnvName:
      toCleanString(process.env.GISYS_FACT_TOKEN_ENV_NAME) ||
      GISYS_FACT_DEFAULT_TOKEN_ENV,
    timeoutMs: normalizeTimeoutMs(process.env.GISYS_FACT_TIMEOUT_MS),
  };

  return {
    electronicModelEnabled,
    electronicTransportEnabled,
    providerConfig,
    issues: electronicModelEnabled
      ? getGisysFactConfigIssues(providerConfig, {
          requireTransport: electronicTransportEnabled,
        })
      : [],
  };
};

export const buildBusinessSafeGisysFactProviderConfig = (
  providerConfig,
  options = {},
) => ({
  providerId: providerConfig?.providerId || 'gisys_fact',
  enabled: providerConfig?.enabled !== false,
  mode: providerConfig?.mode || 'shadow',
  integrationInstanceCode: providerConfig?.integrationInstanceCode || null,
  taxpayerCode: providerConfig?.taxpayerCode || null,
  baseUrlConfigured: Boolean(providerConfig?.baseUrl),
  tokenConfiguredAsSecret:
    typeof options.tokenConfigured === 'boolean'
      ? options.tokenConfigured
      : null,
  runtimeManagedByPlatform: true,
});

export const buildGisysFactConfigSummaryFromBusiness = (
  businessDoc,
  platformDoc = {},
) => {
  const providerConfig = resolveGisysFactConfig(businessDoc, platformDoc);
  const electronicModelEnabled = providerConfig.electronicModelEnabled === true;
  const electronicTransportEnabled =
    electronicModelEnabled &&
    providerConfig.electronicTransportEnabled === true;

  return {
    electronicModelEnabled,
    electronicTransportEnabled,
    providerConfig: {
      ...providerConfig,
      mode: electronicTransportEnabled ? providerConfig.mode : 'shadow',
    },
    issues: electronicModelEnabled
      ? getGisysFactConfigIssues(providerConfig, {
          requireTransport: electronicTransportEnabled,
        })
      : [],
  };
};

export const hasElectronicTaxReceiptConfigDraft = (data) =>
  Object.prototype.hasOwnProperty.call(data || {}, 'electronicModelEnabled') ||
  Object.prototype.hasOwnProperty.call(
    data || {},
    'electronicTransportEnabled',
  );
