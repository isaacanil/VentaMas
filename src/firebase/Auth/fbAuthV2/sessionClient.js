const TOKEN_KEY = 'sessionToken';
const EXPIRES_KEY = 'sessionExpires';
const SESSION_ID_KEY = 'sessionId';
const DEVICE_ID_KEY = 'sessionDeviceId';

let logoutInProgress = false;
let lastLogoutAt = 0;

export const setLogoutInProgress = (value) => {
  logoutInProgress = value;
  if (value) {
    lastLogoutAt = Date.now();
  }
};

export const isLogoutInProgress = () => logoutInProgress;
export const getLastLogoutAt = () => lastLogoutAt;

const safeLocalStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
};

const generateClientId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `device_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

export const ensureDeviceId = () => {
  const storage = safeLocalStorage();
  if (!storage) return null;
  let deviceId = storage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateClientId();
    storage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

const detectDeviceLabel = () => {
  if (typeof navigator === 'undefined') return 'unknown-device';
  const platform =
    navigator.userAgentData?.platform || navigator.platform || 'web';
  const brand = navigator.userAgentData?.brands?.[0]?.brand;
  const language = navigator.language || navigator.languages?.[0];
  const parts = [platform, brand, language].filter(Boolean);
  return parts.join(' • ') || 'web-client';
};

export const buildSessionInfo = (overrides = {}) => {
  const deviceId = ensureDeviceId();
  const baseInfo = {
    deviceId,
    deviceLabel: detectDeviceLabel(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    platform: typeof navigator !== 'undefined' ? navigator.platform : null,
    metadata: {
      timezone:
        typeof Intl !== 'undefined'
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : null,
      language:
        typeof navigator !== 'undefined' ? navigator.language || null : null,
      ...overrides.metadata,
    },
  };

  return {
    ...baseInfo,
    ...overrides,
    metadata: {
      ...baseInfo.metadata,
      ...overrides.metadata,
    },
  };
};

export const storeSessionLocally = ({
  sessionToken,
  sessionExpiresAt,
  sessionId,
}) => {
  const storage = safeLocalStorage();
  if (!storage) return;
  if (sessionToken) storage.setItem(TOKEN_KEY, sessionToken);
  if (sessionExpiresAt)
    storage.setItem(EXPIRES_KEY, sessionExpiresAt.toString());
  if (sessionId) storage.setItem(SESSION_ID_KEY, sessionId);
};

export const getStoredSession = () => {
  const storage = safeLocalStorage();
  if (!storage) {
    return {
      sessionToken: null,
      sessionExpiresAt: null,
      sessionId: null,
      deviceId: null,
    };
  }
  return {
    sessionToken: storage.getItem(TOKEN_KEY),
    sessionExpiresAt: storage.getItem(EXPIRES_KEY),
    sessionId: storage.getItem(SESSION_ID_KEY),
    deviceId: storage.getItem(DEVICE_ID_KEY),
  };
};

export const clearStoredSession = () => {
  const storage = safeLocalStorage();
  if (!storage) return;
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(EXPIRES_KEY);
  storage.removeItem(SESSION_ID_KEY);
};
