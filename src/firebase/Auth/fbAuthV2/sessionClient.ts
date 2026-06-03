const TOKEN_KEY = 'sessionToken';
const EXPIRES_KEY = 'sessionExpires';
const SESSION_ID_KEY = 'sessionId';
const DEVICE_ID_KEY = 'sessionDeviceId';
const PRESENCE_CONNECTION_KEY_PREFIX = 'presenceConnectionId';

let logoutInProgress = false;
let lastLogoutAt = 0;

type SessionInfoMetadata = {
  timezone?: string | null;
  language?: string | null;
  requestSource?: string;
  requestedAt?: number;
  refreshSource?: string;
  lastActivityMs?: number;
  [key: string]: unknown;
};

export type SessionInfo = {
  deviceId: string | null;
  deviceLabel: string;
  userAgent: string | null;
  platform: string | null;
  metadata: SessionInfoMetadata;
};

type SessionInfoOverrides = Partial<Omit<SessionInfo, 'metadata'>> & {
  metadata?: Partial<SessionInfoMetadata>;
};

type StoredSession = {
  sessionToken: string | null;
  sessionExpiresAt: number | null;
  sessionId: string | null;
  deviceId: string | null;
};

type StoreSessionInput = {
  sessionToken?: string | null;
  sessionExpiresAt?: number | null;
  sessionId?: string | null;
};

export const setLogoutInProgress = (value: boolean): void => {
  logoutInProgress = value;
  if (value) {
    lastLogoutAt = Date.now();
  }
};

export const isLogoutInProgress = (): boolean => logoutInProgress;
export const getLastLogoutAt = (): number => lastLogoutAt;

const safeLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage || null;
  } catch {
    return null;
  }
};

const safeStorageGetItem = (storage: Storage, key: string): string | null => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageSetItem = (
  storage: Storage,
  key: string,
  value: string,
): void => {
  try {
    storage.setItem(key, value);
  } catch {
    // Storage may be blocked by browser privacy settings.
  }
};

const safeStorageRemoveItem = (storage: Storage, key: string): void => {
  try {
    storage.removeItem(key);
  } catch {
    // Storage may be blocked by browser privacy settings.
  }
};

const generateClientId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `device_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

const generatePresenceConnectionSuffix = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

export const ensureDeviceId = (): string | null => {
  const storage = safeLocalStorage();
  if (!storage) return null;
  let deviceId = safeStorageGetItem(storage, DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateClientId();
    safeStorageSetItem(storage, DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

export const getOrCreatePresenceConnectionId = (
  uid: string | null | undefined,
  customSessionId?: string | null,
): string | null => {
  const resolvedUid = typeof uid === 'string' ? uid.trim() : '';
  if (!resolvedUid) return null;

  const fallbackBase = ensureDeviceId() || resolvedUid;
  const baseId =
    typeof customSessionId === 'string' && customSessionId.trim()
      ? customSessionId.trim()
      : fallbackBase;

  if (typeof window === 'undefined') {
    return `${baseId}-${Date.now()}`;
  }

  try {
    const storage = window.sessionStorage;
    const scopedSessionKey =
      typeof customSessionId === 'string' && customSessionId.trim()
        ? customSessionId.trim()
        : 'no-session';
    const storageKey = `${PRESENCE_CONNECTION_KEY_PREFIX}:${resolvedUid}:${scopedSessionKey}`;

    let storedId = storage?.getItem(storageKey);
    if (!storedId) {
      storedId = `${baseId}-${generatePresenceConnectionSuffix()}`;
      storage?.setItem(storageKey, storedId);
    }
    return storedId;
  } catch {
    return `${baseId}-${Date.now()}`;
  }
};

const detectDeviceLabel = (): string => {
  if (typeof navigator === 'undefined') return 'unknown-device';
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string; brands?: Array<{ brand?: string }> };
  };
  const platform = nav.userAgentData?.platform || navigator.platform || 'web';
  const brand = nav.userAgentData?.brands?.[0]?.brand;
  const language = navigator.language || navigator.languages?.[0];
  const parts = [platform, brand, language].filter(Boolean);
  return parts.join(' • ') || 'web-client';
};

export const buildSessionInfo = (
  overrides: SessionInfoOverrides = {},
): SessionInfo => {
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
}: StoreSessionInput): void => {
  const storage = safeLocalStorage();
  if (!storage) return;
  if (sessionToken) safeStorageSetItem(storage, TOKEN_KEY, sessionToken);
  if (sessionExpiresAt)
    safeStorageSetItem(storage, EXPIRES_KEY, sessionExpiresAt.toString());
  if (sessionId) safeStorageSetItem(storage, SESSION_ID_KEY, sessionId);
};

export const getStoredSession = (): StoredSession => {
  const storage = safeLocalStorage();
  if (!storage) {
    return {
      sessionToken: null,
      sessionExpiresAt: null,
      sessionId: null,
      deviceId: null,
    };
  }
  const sessionExpires = safeStorageGetItem(storage, EXPIRES_KEY);
  return {
    sessionToken: safeStorageGetItem(storage, TOKEN_KEY),
    sessionExpiresAt: sessionExpires ? Number(sessionExpires) : null,
    sessionId: safeStorageGetItem(storage, SESSION_ID_KEY),
    deviceId: safeStorageGetItem(storage, DEVICE_ID_KEY),
  };
};

export const clearStoredSession = (): void => {
  const storage = safeLocalStorage();
  if (!storage) return;
  safeStorageRemoveItem(storage, TOKEN_KEY);
  safeStorageRemoveItem(storage, EXPIRES_KEY);
  safeStorageRemoveItem(storage, SESSION_ID_KEY);
};



