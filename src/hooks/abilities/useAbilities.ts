import { useAbility } from '@casl/react';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { AbilityContext } from '@/Context/AbilityContext/context';
import {
  selectAbilities,
  selectAbilitiesLoading,
  selectAbilitiesError,
  selectAbilitiesStatus,
  loadUserAbilities,
  clearAbilities,
} from '@/features/abilities/abilitiesSlice';
import { selectUser } from '@/features/auth/userSlice';

type AbilitiesRootState = Parameters<typeof selectAbilities>[0];
type UserRootState = Parameters<typeof selectUser>[0];

export const useAbilities = () => {
  const abilities = useSelector<
    AbilitiesRootState,
    ReturnType<typeof selectAbilities>
  >(selectAbilities);
  const loading = useSelector<
    AbilitiesRootState,
    ReturnType<typeof selectAbilitiesLoading>
  >(selectAbilitiesLoading);
  const error = useSelector<
    AbilitiesRootState,
    ReturnType<typeof selectAbilitiesError>
  >(selectAbilitiesError);

  return { abilities, loading, error };
};

export const useLoadUserAbilities = () => {
  const user = useSelector<UserRootState, ReturnType<typeof selectUser>>(
    selectUser,
  );
  const loading = useSelector<
    AbilitiesRootState,
    ReturnType<typeof selectAbilitiesLoading>
  >(selectAbilitiesLoading);
  const dispatch = useDispatch();
  const lastRequestedSessionKeyRef = useRef<string | null>(null);

  const userId =
    typeof (user as { uid?: unknown } | null)?.uid === 'string'
      ? (user as { uid: string }).uid
      : typeof (user as { id?: unknown } | null)?.id === 'string'
        ? ((user as { id: string }).id as string)
        : null;
  const businessId =
    typeof (user as { businessID?: unknown } | null)?.businessID === 'string'
      ? (user as { businessID: string }).businessID
      : typeof (user as { businessId?: unknown } | null)?.businessId === 'string'
        ? (user as { businessId: string }).businessId
        : null;
  const role =
    typeof (user as { activeRole?: unknown } | null)?.activeRole === 'string'
      ? (user as { activeRole: string }).activeRole
      : typeof (user as { role?: unknown } | null)?.role === 'string'
        ? (user as { role: string }).role
        : null;

  const sessionAbilitiesKey =
    userId && businessId ? `${userId}|${businessId}|${role || ''}` : null;

  useEffect(() => {
    if (!sessionAbilitiesKey) {
      lastRequestedSessionKeyRef.current = null;
      dispatch(clearAbilities());
      return;
    }

    if (loading) return;
    if (lastRequestedSessionKeyRef.current === sessionAbilitiesKey) return;

    lastRequestedSessionKeyRef.current = sessionAbilitiesKey;
    dispatch(loadUserAbilities(user));
  }, [sessionAbilitiesKey, dispatch, loading, user]);
};

export function useUserAccess() {
  const abilities = useAbility(AbilityContext);
  const loading = useSelector<
    AbilitiesRootState,
    ReturnType<typeof selectAbilitiesLoading>
  >(selectAbilitiesLoading);
  const status = useSelector<
    AbilitiesRootState,
    ReturnType<typeof selectAbilitiesStatus>
  >(selectAbilitiesStatus);
  const user = useSelector<UserRootState, ReturnType<typeof selectUser>>(
    selectUser,
  );

  // Consider loading if:
  // 1. Explicit loading from Redux
  // 2. Status is idle but we have a user with businessID (waiting to fetch)
  // 3. Status is explicitly loading
  // 4. We have a user but no rules yet (implies not fully loaded/synced)
  const isEffectiveLoading =
    loading ||
    status === 'loading' ||
    (status === 'idle' && !!user?.businessID) ||
    (!!user && (!abilities?.rules || abilities.rules.length === 0));

  return { abilities, loading: isEffectiveLoading };
}
