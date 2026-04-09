import { asRecord, normalizeLimitValue, toBoolean } from './billingCommon.util.js';

const MODULE_KEYS = new Set([
  'sales',
  'preorders',
  'inventory',
  'orders',
  'purchases',
  'expenses',
  'cashReconciliation',
  'accountsReceivable',
  'creditNote',
  'utility',
  'authorizations',
  'taxReceipt',
  'insurance',
]);

const LEGACY_FEATURE_TO_MODULE_KEY = {
  accountsReceivable: 'accountsReceivable',
  insuranceModule: 'insurance',
  authorizationsPinFlow: 'authorizations',
};

const LEGACY_FEATURE_TO_ADDON_KEY = {
  advancedReports: 'advancedReports',
  salesAnalyticsPanel: 'salesAnalyticsPanel',
  apiAccess: 'api',
  aiInsights: 'ai',
};

const LEGACY_CAPABILITY_TO_MODULE_KEY = {
  authorizationsPinFlow: 'authorizations',
};

const LEGACY_CAPABILITY_TO_ADDON_KEY = {
  advancedReports: 'advancedReports',
  salesAnalyticsPanel: 'salesAnalyticsPanel',
};

const LEGACY_MODULE_ACCESS_TO_ADDON_KEY = {
  api: 'api',
  ai: 'ai',
};

const setBooleanIfPresent = (target, key, value) => {
  if (typeof value === 'boolean') {
    target[key] = value;
    return;
  }

  if (typeof value === 'string') {
    const normalized = toBoolean(value, null);
    if (typeof normalized === 'boolean') {
      target[key] = normalized;
    }
  }
};

const applyKeyMap = (target, source, keyMap) => {
  Object.entries(keyMap).forEach(([sourceKey, targetKey]) => {
    setBooleanIfPresent(target, targetKey, source[sourceKey]);
  });
};

const applyModuleAccessToModules = (target, source) => {
  Object.keys(source).forEach((key) => {
    if (!MODULE_KEYS.has(key)) return;
    setBooleanIfPresent(target, key, source[key]);
  });
};

const resolveMultiBusinessAccess = ({
  limits,
  legacyCapabilities,
  legacyModuleAccess,
}) => {
  const maxBusinesses = normalizeLimitValue(asRecord(limits).maxBusinesses);
  if (typeof maxBusinesses === 'number') {
    return maxBusinesses < 0 || maxBusinesses > 1;
  }

  const fromLegacyModule = toBoolean(legacyModuleAccess.multiBusiness, null);
  if (typeof fromLegacyModule === 'boolean') {
    return fromLegacyModule;
  }

  const fromLegacyCapability = toBoolean(legacyCapabilities.multiBusiness, null);
  if (typeof fromLegacyCapability === 'boolean') {
    return fromLegacyCapability;
  }

  return null;
};

export const normalizePlanEntitlements = (source = {}) => {
  const root = asRecord(source);
  const legacyFeatures = asRecord(root.features);
  const legacyModuleAccess = asRecord(root.moduleAccess);
  const legacyCapabilities = asRecord(root.capabilities);

  const modules = {
    ...asRecord(root.modules),
  };
  const addons = {
    ...asRecord(root.addons),
  };

  applyModuleAccessToModules(modules, legacyModuleAccess);
  applyKeyMap(modules, legacyFeatures, LEGACY_FEATURE_TO_MODULE_KEY);
  applyKeyMap(modules, legacyCapabilities, LEGACY_CAPABILITY_TO_MODULE_KEY);
  applyKeyMap(addons, legacyFeatures, LEGACY_FEATURE_TO_ADDON_KEY);
  applyKeyMap(addons, legacyCapabilities, LEGACY_CAPABILITY_TO_ADDON_KEY);
  applyKeyMap(addons, legacyModuleAccess, LEGACY_MODULE_ACCESS_TO_ADDON_KEY);

  const features = {
    ...legacyFeatures,
  };
  Object.entries(LEGACY_FEATURE_TO_MODULE_KEY).forEach(
    ([legacyKey, canonicalKey]) => {
      setBooleanIfPresent(features, legacyKey, modules[canonicalKey]);
    },
  );
  Object.entries(LEGACY_FEATURE_TO_ADDON_KEY).forEach(
    ([legacyKey, canonicalKey]) => {
      setBooleanIfPresent(features, legacyKey, addons[canonicalKey]);
    },
  );
  setBooleanIfPresent(features, 'authorizationsPinFlow', modules.authorizations);

  const moduleAccess = {
    ...legacyModuleAccess,
    ...modules,
  };
  Object.entries(LEGACY_MODULE_ACCESS_TO_ADDON_KEY).forEach(
    ([legacyKey, canonicalKey]) => {
      setBooleanIfPresent(moduleAccess, legacyKey, addons[canonicalKey]);
    },
  );
  const multiBusiness = resolveMultiBusinessAccess({
    limits: root.limits,
    legacyCapabilities,
    legacyModuleAccess,
  });
  if (typeof multiBusiness === 'boolean') {
    moduleAccess.multiBusiness = multiBusiness;
  }

  return {
    modules,
    addons,
    features,
    moduleAccess,
  };
};
