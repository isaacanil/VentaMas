import type { Timestamp } from 'firebase/firestore';

import { fbGetAppVersion } from '@/firebase/app/fbGetAppVersion';

export interface ClientBuildInfo {
  clientBuildId?: string;
  clientAppVersion?: string;
}

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toVersionTimestamp = (value: unknown): Timestamp | null => {
  if (
    value &&
    typeof value === 'object' &&
    typeof (value as { seconds?: unknown }).seconds === 'number'
  ) {
    return value as Timestamp;
  }
  return null;
};

const formatVersionLabel = (value: unknown): string | undefined => {
  const timestamp = toVersionTimestamp(value);
  if (!timestamp) return undefined;

  return new Date(timestamp.seconds * 1000).toISOString();
};

const STATIC_BUILD_INFO: ClientBuildInfo = {
  ...(toCleanString(__APP_BUILD_ID__) ? { clientBuildId: __APP_BUILD_ID__ } : {}),
  ...(toCleanString(__APP_BUILD_TIME__)
    ? { clientAppVersion: __APP_BUILD_TIME__ }
    : {}),
};

let cachedBuildInfoPromise: Promise<ClientBuildInfo> | null = null;

export const getClientBuildInfo = async (): Promise<ClientBuildInfo> => {
  if (cachedBuildInfoPromise) {
    return cachedBuildInfoPromise;
  }

  cachedBuildInfoPromise = (async () => {
    try {
      if (STATIC_BUILD_INFO.clientBuildId && STATIC_BUILD_INFO.clientAppVersion) {
        return STATIC_BUILD_INFO;
      }

      const appVersion = await fbGetAppVersion();
      if (!appVersion) return STATIC_BUILD_INFO;

      const clientBuildId =
        STATIC_BUILD_INFO.clientBuildId ||
        toCleanString(appVersion.lastChangelog) ||
        undefined;
      const clientAppVersion =
        STATIC_BUILD_INFO.clientAppVersion || formatVersionLabel(appVersion.version);

      return {
        ...(clientBuildId ? { clientBuildId } : {}),
        ...(clientAppVersion ? { clientAppVersion } : {}),
      };
    } catch (error) {
      console.warn('[getClientBuildInfo] failed to resolve app version', error);
      return STATIC_BUILD_INFO;
    }
  })();

  return cachedBuildInfoPromise;
};
