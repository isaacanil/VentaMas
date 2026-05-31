export const DEFAULT_FIREBASE_AI_MODEL = 'gemini-2.5-flash';
export const DEFAULT_FIREBASE_AI_LOCATION = 'us-central1';

export interface FirebaseAiRuntimeConfig {
  location: string;
  model: string;
}

interface FirebaseAiRuntimeConfigValues {
  envLocation?: unknown;
  envModel?: unknown;
  remoteLocation?: unknown;
  remoteModel?: unknown;
}

export const cleanAiConfigString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const readPositiveInteger = (
  value: unknown,
  fallback: number,
): number => {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

export const resolveFirebaseAiRuntimeConfigValues = ({
  envLocation,
  envModel,
  remoteLocation,
  remoteModel,
}: FirebaseAiRuntimeConfigValues): FirebaseAiRuntimeConfig => ({
  location:
    cleanAiConfigString(remoteLocation) ??
    cleanAiConfigString(envLocation) ??
    DEFAULT_FIREBASE_AI_LOCATION,
  model:
    cleanAiConfigString(remoteModel) ??
    cleanAiConfigString(envModel) ??
    DEFAULT_FIREBASE_AI_MODEL,
});
