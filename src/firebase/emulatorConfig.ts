const TRUE_ENV_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_ENV_VALUES = new Set(['0', 'false', 'no', 'off']);
const LOCAL_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
]);

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseBooleanEnv = (value: unknown): boolean | null => {
  const normalized = normalizeString(value)?.toLowerCase();
  if (!normalized) return null;
  if (TRUE_ENV_VALUES.has(normalized)) return true;
  if (FALSE_ENV_VALUES.has(normalized)) return false;
  return null;
};

const parsePortEnv = (value: unknown, fallback: number): number => {
  const normalized = normalizeString(value);
  if (!normalized) return fallback;
  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const getBrowserHostname = (): string | null => {
  if (typeof window === 'undefined') return null;
  return normalizeString(window.location?.hostname);
};

export const getFirebaseEmulatorHost = (): string =>
  normalizeString(import.meta.env.VITE_FIREBASE_EMULATOR_HOST) || '127.0.0.1';

export const getFirestoreEmulatorPort = (): number =>
  parsePortEnv(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT, 8081);

export const getFunctionsEmulatorPort = (): number =>
  parsePortEnv(import.meta.env.VITE_FUNCTIONS_EMULATOR_PORT, 5001);

export const getAuthEmulatorPort = (): number =>
  parsePortEnv(import.meta.env.VITE_AUTH_EMULATOR_PORT, 9099);

export const shouldUseFirebaseEmulators = (): boolean => {
  const explicitOptIn = parseBooleanEnv(import.meta.env.VITE_USE_EMULATORS);
  if (explicitOptIn !== null) {
    return explicitOptIn;
  }

  if (!import.meta.env.DEV) {
    return false;
  }

  const hostname = getBrowserHostname();
  return hostname !== null && LOCAL_HOSTNAMES.has(hostname);
};

export const getFunctionsEmulatorBaseUrl = (): string | null => {
  const projectId = normalizeString(import.meta.env.VITE_FIREBASE_PROJECT_ID);
  if (!projectId) return null;

  const region =
    normalizeString(import.meta.env.VITE_FIREBASE_REGION) || 'us-central1';

  return `http://${getFirebaseEmulatorHost()}:${getFunctionsEmulatorPort()}/${projectId}/${region}`;
};

export const getFirebaseEmulatorSummary = (): string =>
  `auth=http://${getFirebaseEmulatorHost()}:${getAuthEmulatorPort()} functions=http://${getFirebaseEmulatorHost()}:${getFunctionsEmulatorPort()} firestore=${getFirebaseEmulatorHost()}:${getFirestoreEmulatorPort()}`;
