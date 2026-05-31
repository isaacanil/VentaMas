import { signInWithCustomToken } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

import {
  buildSessionInfo,
  getStoredSession,
} from '@/firebase/Auth/fbAuthV2/sessionClient';

import {
  getAiBusinessSeedingTargetAuth,
  getAiBusinessSeedingTargetFunctions,
  isAiBusinessSeedingCurrentEnvironment,
} from './aiBusinessSeedingTargetFirebase';

import type { AiBusinessSeedingEnvironmentId } from '../utils/environment';

const TARGET_SESSION_KEY_PREFIX = 'aiBusinessSeedingTargetSession';
const SESSION_EXPIRY_GRACE_MS = 30_000;

interface ClientLoginRequest {
  username: string;
  password?: string;
  sessionInfo?: unknown;
}

interface ClientLoginResponse {
  ok?: boolean;
  message?: string;
  sessionToken?: string;
  sessionExpiresAt?: number;
  firebaseCustomToken?: string;
  userId?: string;
  user?: {
    id?: string;
    name?: string;
    displayName?: string;
    realName?: string;
  };
  session?: {
    id?: string;
  };
}

export interface AiBusinessSeedingTargetSession {
  environmentId: AiBusinessSeedingEnvironmentId;
  sessionToken: string;
  sessionExpiresAt: number | null;
  sessionId: string | null;
  userId: string | null;
  username: string | null;
  displayName: string | null;
}

const getLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage || null;
  } catch {
    return null;
  }
};

const getSessionStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage || null;
  } catch {
    return null;
  }
};

const getAvailableStorages = (): Storage[] => {
  const storages = [getLocalStorage(), getSessionStorage()].filter(
    (storage): storage is Storage => Boolean(storage),
  );
  return storages.filter(
    (storage, index) =>
      storages.findIndex((item) => item === storage) === index,
  );
};

const getTargetSessionKey = (environmentId: AiBusinessSeedingEnvironmentId) =>
  `${TARGET_SESSION_KEY_PREFIX}:${environmentId}`;

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

export const isAiBusinessSeedingTargetSessionValid = (
  session: AiBusinessSeedingTargetSession | null,
): session is AiBusinessSeedingTargetSession => {
  if (!session?.sessionToken) return false;
  if (!session.sessionExpiresAt) return true;
  return session.sessionExpiresAt > Date.now() + SESSION_EXPIRY_GRACE_MS;
};

export const getAiBusinessSeedingTargetSession = (
  environmentId: AiBusinessSeedingEnvironmentId,
): AiBusinessSeedingTargetSession | null => {
  if (isAiBusinessSeedingCurrentEnvironment(environmentId)) {
    const currentSession = getStoredSession();
    if (!currentSession.sessionToken) return null;
    return {
      environmentId,
      sessionToken: currentSession.sessionToken,
      sessionExpiresAt: currentSession.sessionExpiresAt,
      sessionId: currentSession.sessionId,
      userId: null,
      username: null,
      displayName: null,
    };
  }

  const storages = getAvailableStorages();
  if (storages.length === 0) return null;

  const sessionKey = getTargetSessionKey(environmentId);
  for (const storage of storages) {
    try {
      const rawSession = storage.getItem(sessionKey);
      if (!rawSession) continue;

      const parsed = JSON.parse(
        rawSession,
      ) as AiBusinessSeedingTargetSession | null;
      if (!isAiBusinessSeedingTargetSessionValid(parsed)) {
        storage.removeItem(sessionKey);
        continue;
      }

      const persistentStorage = getLocalStorage();
      if (persistentStorage && persistentStorage !== storage) {
        persistentStorage.setItem(sessionKey, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      storage.removeItem(sessionKey);
    }
  }

  return null;
};

export const storeAiBusinessSeedingTargetSession = (
  session: AiBusinessSeedingTargetSession,
): void => {
  if (isAiBusinessSeedingCurrentEnvironment(session.environmentId)) return;

  const storage = getLocalStorage() || getSessionStorage();
  if (!storage) return;
  storage.setItem(
    getTargetSessionKey(session.environmentId),
    JSON.stringify(session),
  );
};

export const clearAiBusinessSeedingTargetSession = (
  environmentId: AiBusinessSeedingEnvironmentId,
): void => {
  const sessionKey = getTargetSessionKey(environmentId);
  getAvailableStorages().forEach((storage) => storage.removeItem(sessionKey));
};

export const hasActiveAiBusinessSeedingTargetAuthSession = async (
  environmentId: AiBusinessSeedingEnvironmentId,
  session: AiBusinessSeedingTargetSession | null,
): Promise<boolean> => {
  if (!isAiBusinessSeedingTargetSessionValid(session)) return false;
  if (isAiBusinessSeedingCurrentEnvironment(environmentId)) return true;

  const targetAuth = getAiBusinessSeedingTargetAuth(environmentId);
  const authWithReady = targetAuth as typeof targetAuth & {
    authStateReady?: () => Promise<void>;
  };
  await authWithReady.authStateReady?.();

  return Boolean(
    targetAuth.currentUser &&
    (!session.userId || targetAuth.currentUser.uid === session.userId),
  );
};

export const getAiBusinessSeedingExecutionSessionToken = (
  environmentId: AiBusinessSeedingEnvironmentId,
): string | null =>
  getAiBusinessSeedingTargetSession(environmentId)?.sessionToken || null;

export const loginAiBusinessSeedingTarget = async ({
  environmentId,
  username,
  password,
}: {
  environmentId: AiBusinessSeedingEnvironmentId;
  username: string;
  password?: string;
}): Promise<AiBusinessSeedingTargetSession> => {
  const targetFunctions = getAiBusinessSeedingTargetFunctions(environmentId);
  const targetAuth = getAiBusinessSeedingTargetAuth(environmentId);
  const clientLogin = httpsCallable<ClientLoginRequest, ClientLoginResponse>(
    targetFunctions,
    'clientLogin',
  );
  const response = await clientLogin({
    username,
    password,
    sessionInfo: buildSessionInfo({
      metadata: {
        requestSource: 'ai-business-seeding-target-login',
        targetEnvironment: environmentId,
      },
    }),
  });

  const payload = response?.data || {};
  const sessionToken = readString(payload.sessionToken);
  const firebaseCustomToken = readString(payload.firebaseCustomToken);
  const userId = readString(payload.userId || payload.user?.id);

  if (!payload.ok || !sessionToken || !firebaseCustomToken) {
    throw new Error(payload.message || 'No se pudo conectar el destino.');
  }

  await signInWithCustomToken(targetAuth, firebaseCustomToken);

  const session: AiBusinessSeedingTargetSession = {
    environmentId,
    sessionToken,
    sessionExpiresAt:
      typeof payload.sessionExpiresAt === 'number'
        ? payload.sessionExpiresAt
        : null,
    sessionId: readString(payload.session?.id) || sessionToken,
    userId,
    username: readString(payload.user?.name),
    displayName:
      readString(payload.user?.displayName) ||
      readString(payload.user?.realName) ||
      readString(payload.user?.name),
  };

  storeAiBusinessSeedingTargetSession(session);
  return session;
};
