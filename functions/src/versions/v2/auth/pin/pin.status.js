import { Timestamp } from '../../../../core/config/firebase.js';
import { ALLOWED_MODULES, EXPIRATION_HOURS } from './pin.constants.js';

export const normalizeModules = (modules) => {
  if (!Array.isArray(modules)) return [];
  const unique = new Set(
    modules
      .map((m) => (typeof m === 'string' ? m.trim() : ''))
      .filter((m) => m && ALLOWED_MODULES.has(m))
  );
  return Array.from(unique);
};

export const toIsoString = (value) => {
  if (!value) return null;
  try {
    if (value instanceof Timestamp) {
      return value.toDate().toISOString();
    }
    if (value?.toDate) {
      return value.toDate().toISOString();
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return new Date(value).toISOString();
  } catch (error) {
    return null;
  }
};

export const calcExpiration = (originTimestamp = Timestamp.now()) => {
  const base = originTimestamp instanceof Timestamp ? originTimestamp : Timestamp.now();
  const expiresMs = base.toMillis() + EXPIRATION_HOURS * 60 * 60 * 1000;
  return Timestamp.fromMillis(expiresMs);
};

export const buildModuleStatus = (moduleKey, payload, nowMillis) => {
  if (!payload) return null;
  const expiresAtMillis = payload.expiresAt?.toMillis?.() ?? payload.expiresAt ?? 0;
  const isExpired = expiresAtMillis > 0 && expiresAtMillis < nowMillis;
  const isActive = Boolean(payload.isActive) && !isExpired;
  const status = isActive ? 'active' : isExpired ? 'expired' : 'inactive';

  return {
    module: moduleKey,
    status,
    isActive,
    isExpired,
    createdAt: toIsoString(payload.createdAt),
    updatedAt: toIsoString(payload.updatedAt),
    expiresAt: toIsoString(payload.expiresAt),
    deactivatedAt: toIsoString(payload.deactivatedAt),
    lastGeneratedAt: toIsoString(payload.lastGeneratedAt || payload.createdAt),
    createdBy: payload.createdBy || null,
    lastGeneratedBy: payload.lastGeneratedBy || null,
    schema: 'v2',
  };
};

export const buildLegacyStatus = (legacyPin, nowMillis) => {
  if (!legacyPin?.pin) return null;
  const modules = Array.isArray(legacyPin.modules) && legacyPin.modules.length
    ? legacyPin.modules
    : ['invoices'];
  const expiresAtMillis = legacyPin.expiresAt?.toMillis?.() ?? legacyPin.expiresAt ?? 0;
  const isExpired = expiresAtMillis > 0 && expiresAtMillis < nowMillis;
  const isActive = Boolean(legacyPin.isActive) && !isExpired;
  const status = isActive ? 'active' : isExpired ? 'expired' : 'inactive';

  const moduleStatuses = modules.reduce((acc, module) => {
    acc[module] = {
      module,
      status,
      isActive,
      isExpired,
      createdAt: toIsoString(legacyPin.createdAt),
      updatedAt: toIsoString(legacyPin.updatedAt || legacyPin.createdAt),
      expiresAt: toIsoString(legacyPin.expiresAt),
      deactivatedAt: toIsoString(legacyPin.deactivatedAt),
      schema: 'legacy',
      createdBy: legacyPin.createdBy || null,
      lastGeneratedBy: legacyPin.createdBy || null,
    };
    return acc;
  }, {});

  return {
    moduleDetails: moduleStatuses,
    summary: {
      schema: 'legacy',
      hasPin: true,
      isActive,
      isExpired,
      modules,
      activeModules: isActive ? modules : [],
      createdAt: toIsoString(legacyPin.createdAt),
      expiresAt: toIsoString(legacyPin.expiresAt),
      createdBy: legacyPin.createdBy || null,
      updatedAt: toIsoString(legacyPin.updatedAt || legacyPin.createdAt),
    },
  };
};

export const summarizeModules = (modulesMap) => {
  const nowMillis = Date.now();
  const entries = Object.entries(modulesMap || {});
  if (!entries.length) {
    return {
      moduleDetails: {},
      summary: {
        schema: 'v2',
        hasPin: false,
        isActive: false,
        isExpired: false,
        modules: [],
        activeModules: [],
        createdAt: null,
        expiresAt: null,
        updatedAt: null,
      },
    };
  }

  const moduleDetails = {};
  let anyActive = false;
  let allExpired = true;
  let earliestExpiration = null;
  let latestCreation = null;

  for (const [moduleKey, payload] of entries) {
    const status = buildModuleStatus(moduleKey, payload, nowMillis);
    if (!status) continue;
    moduleDetails[moduleKey] = status;
    if (status.isActive) anyActive = true;
    if (!status.isExpired) allExpired = false;

    if (status.expiresAt) {
      if (!earliestExpiration || status.expiresAt < earliestExpiration) {
        earliestExpiration = status.expiresAt;
      }
    }
    if (status.createdAt) {
      if (!latestCreation || status.createdAt > latestCreation) {
        latestCreation = status.createdAt;
      }
    }
  }

  const modulesList = Object.keys(moduleDetails);
  const activeModules = modulesList.filter((m) => moduleDetails[m].isActive);

  return {
    moduleDetails,
    summary: {
      schema: 'v2',
      hasPin: modulesList.length > 0,
      isActive: anyActive,
      isExpired: modulesList.length > 0 ? allExpired : false,
      modules: modulesList,
      activeModules,
      createdAt: latestCreation,
      expiresAt: earliestExpiration,
      updatedAt: latestCreation,
    },
  };
};

export const formatStatusResponse = (moduleStatus, createdBy) => {
  if (!moduleStatus) {
    return {
      hasPin: false,
      isActive: false,
      isExpired: false,
      createdAt: null,
      expiresAt: null,
      modules: [],
      activeModules: [],
      moduleDetails: {},
      schema: 'v2',
      createdBy: createdBy || null,
      updatedAt: null,
    };
  }

  const { moduleDetails, summary } = moduleStatus;
  return {
    hasPin: summary.hasPin,
    isActive: summary.isActive,
    isExpired: summary.isExpired,
    createdAt: summary.createdAt,
    expiresAt: summary.expiresAt,
    modules: summary.modules,
    activeModules: summary.activeModules,
    moduleDetails,
    schema: summary.schema,
    createdBy: summary.createdBy || createdBy || null,
    updatedAt: summary.updatedAt,
  };
};
