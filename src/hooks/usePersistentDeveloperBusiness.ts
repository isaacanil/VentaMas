import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  returnToOriginalBusiness,
  selectIsTemporaryMode,
  selectOriginalBusinessId,
  selectUser,
  switchToBusiness,
} from '@/features/auth/userSlice';
import { fbGetDeveloperBusinessImpersonationStatus } from '@/firebase/Auth/fbAuthV2/fbSwitchDeveloperBusiness';
import type { UserIdentity } from '@/types/users';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';

const STATUS_POLL_INTERVAL_MS = 60_000;

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const usePersistentDeveloperBusiness = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserIdentity | null;
  const isTemporaryMode = useSelector(selectIsTemporaryMode);
  const originalBusinessId = useSelector(selectOriginalBusinessId);

  const isDeveloperUser = hasDeveloperAccess(user);
  const currentBusinessId = user?.businessID ?? null;

  useEffect(() => {
    if (!isDeveloperUser || !currentBusinessId) return;

    let cancelled = false;

    const syncWithServer = async () => {
      try {
        const status = await fbGetDeveloperBusinessImpersonationStatus();
        if (cancelled) return;

        const isActive = status.active === true;
        const overrideBusinessId = toCleanString(status.overrideBusinessId);
        const serverOriginalBusinessId = toCleanString(status.originalBusinessId);

        if (
          isActive &&
          overrideBusinessId &&
          serverOriginalBusinessId &&
          currentBusinessId === serverOriginalBusinessId &&
          currentBusinessId !== overrideBusinessId
        ) {
          dispatch(switchToBusiness(overrideBusinessId));
          return;
        }

        if (
          !isActive &&
          isTemporaryMode &&
          originalBusinessId &&
          currentBusinessId === originalBusinessId
        ) {
          dispatch(returnToOriginalBusiness());
        }
      } catch {
        // Keep UI responsive even if callable fails temporarily.
      }
    };

    void syncWithServer();
    const intervalId = window.setInterval(() => {
      void syncWithServer();
    }, STATUS_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    dispatch,
    isDeveloperUser,
    currentBusinessId,
    isTemporaryMode,
    originalBusinessId,
  ]);
};

export default usePersistentDeveloperBusiness;
