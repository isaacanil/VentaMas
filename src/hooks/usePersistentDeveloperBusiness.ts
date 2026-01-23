import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  selectIsTemporaryMode,
  selectOriginalBusinessId,
  selectUser,
  switchToBusiness,
} from '@/features/auth/userSlice';
import type { UserIdentity } from '@/types/users';

const STORAGE_KEY = 'vmx_dev_business_override';

type StoredSession = {
  originalBusinessId: string;
  overrideBusinessId: string;
  updatedAt?: number;
};

type StorageData = Record<string, StoredSession>;

const getStorage = (): StorageData => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as StorageData;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const setStorage = (data: StorageData) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  if (!data || Object.keys(data).length === 0) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore write errors (storage quota, etc.)
  }
};

const getStoredSession = (userId?: string | null) => {
  if (!userId) return null;
  const data = getStorage();
  const session = data[userId];
  if (!session || typeof session !== 'object') {
    return null;
  }
  return session;
};

const persistSession = (
  userId: string | null | undefined,
  session: Omit<StoredSession, 'updatedAt'> | null | undefined,
) => {
  if (!userId || !session) return;
  const data = getStorage();
  data[userId] = {
    ...session,
    updatedAt: Date.now(),
  };
  setStorage(data);
};

const clearSession = (userId?: string | null) => {
  if (!userId) return;
  const data = getStorage();
  if (!data[userId]) {
    return;
  }
  delete data[userId];
  setStorage(data);
};

export const usePersistentDeveloperBusiness = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserIdentity | null;
  const isTemporaryMode = useSelector(selectIsTemporaryMode);
  const originalBusinessId = useSelector(selectOriginalBusinessId);

  const userId = user?.uid ?? user?.id ?? null;
  const currentBusinessId = user?.businessID ?? null;

  // Persistir cambios cuando se activa o desactiva el modo temporal
  useEffect(() => {
    if (!userId || !currentBusinessId) {
      return;
    }

    if (
      isTemporaryMode &&
      originalBusinessId &&
      currentBusinessId !== originalBusinessId
    ) {
      persistSession(userId, {
        originalBusinessId,
        overrideBusinessId: currentBusinessId,
      });
      return;
    }

    if (!isTemporaryMode) {
      clearSession(userId);
    }
  }, [userId, currentBusinessId, isTemporaryMode, originalBusinessId]);

  // Rehidratar o restaurar el negocio temporal si existe una sesión guardada
  useEffect(() => {
    if (!userId || !currentBusinessId) {
      return;
    }

    const storedSession = getStoredSession(userId);
    if (!storedSession) {
      return;
    }

    const { originalBusinessId: storedOriginal, overrideBusinessId } =
      storedSession;

    if (!storedOriginal || !overrideBusinessId) {
      clearSession(userId);
      return;
    }

    const effectiveOriginalBusinessId = isTemporaryMode
      ? originalBusinessId
      : currentBusinessId;

    if (!effectiveOriginalBusinessId) {
      return;
    }

    if (storedOriginal !== effectiveOriginalBusinessId) {
      clearSession(userId);
      return;
    }

    if (
      currentBusinessId === storedOriginal &&
      currentBusinessId !== overrideBusinessId
    ) {
      dispatch(switchToBusiness(overrideBusinessId));
    }
  }, [
    dispatch,
    userId,
    currentBusinessId,
    isTemporaryMode,
    originalBusinessId,
  ]);
};

export default usePersistentDeveloperBusiness;
