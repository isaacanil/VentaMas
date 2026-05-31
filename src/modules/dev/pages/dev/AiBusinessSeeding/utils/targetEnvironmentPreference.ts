import { auth } from '@/firebase/firebaseconfig';
import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';

import {
  getAiBusinessSeedingEnvironmentById,
  type AiBusinessSeedingEnvironmentId,
} from './environment';

const TARGET_ENVIRONMENT_PREFERENCE_KEY_PREFIX =
  'aiBusinessSeedingTargetEnvironment';

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage || null;
  } catch {
    return null;
  }
};

const getPreferenceOwnerKey = (): string => {
  const currentUserId = auth.currentUser?.uid;
  if (currentUserId) return currentUserId;

  const session = getStoredSession();
  return session.sessionId || session.deviceId || 'anonymous';
};

const getPreferenceKey = () =>
  `${TARGET_ENVIRONMENT_PREFERENCE_KEY_PREFIX}:${getPreferenceOwnerKey()}`;

export const getStoredAiBusinessSeedingTargetEnvironmentId = (
  fallbackEnvironmentId: AiBusinessSeedingEnvironmentId,
): AiBusinessSeedingEnvironmentId => {
  const storage = getStorage();
  if (!storage) return fallbackEnvironmentId;

  const storedEnvironmentId = storage.getItem(getPreferenceKey());
  if (!storedEnvironmentId) return fallbackEnvironmentId;

  return getAiBusinessSeedingEnvironmentById(
    storedEnvironmentId as AiBusinessSeedingEnvironmentId,
  ).id;
};

export const storeAiBusinessSeedingTargetEnvironmentId = (
  environmentId: AiBusinessSeedingEnvironmentId,
): void => {
  const storage = getStorage();
  if (!storage) return;

  storage.setItem(getPreferenceKey(), environmentId);
};
