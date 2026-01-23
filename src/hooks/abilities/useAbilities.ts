import { useAbility } from '@casl/react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { AbilityContext } from '@/Context/AbilityContext/context';
import {
  selectAbilities,
  selectAbilitiesLoading,
  selectAbilitiesError,
  selectAbilitiesStatus,
  loadUserAbilities,
} from '@/features/abilities/abilitiesSlice';
import { selectUser } from '@/features/auth/userSlice';

type AbilitiesRootState = Parameters<typeof selectAbilities>[0];
type UserRootState = Parameters<typeof selectUser>[0];

export const useAbilities = () => {
  const abilities = useSelector<AbilitiesRootState, ReturnType<typeof selectAbilities>>(selectAbilities);
  const loading = useSelector<AbilitiesRootState, ReturnType<typeof selectAbilitiesLoading>>(
    selectAbilitiesLoading,
  );
  const error = useSelector<AbilitiesRootState, ReturnType<typeof selectAbilitiesError>>(
    selectAbilitiesError,
  );

  return { abilities, loading, error };
};

export const useLoadUserAbilities = () => {
  const user = useSelector<UserRootState, ReturnType<typeof selectUser>>(selectUser);
  const abilities = useSelector<AbilitiesRootState, ReturnType<typeof selectAbilities>>(selectAbilities);
  const loading = useSelector<AbilitiesRootState, ReturnType<typeof selectAbilitiesLoading>>(
    selectAbilitiesLoading,
  );
  const dispatch = useDispatch();

  useEffect(() => {
    // Only load if user exists, has businessID, and abilities haven't been loaded yet
    // This prevents infinite loops by checking if abilities are already loaded
    if (user?.businessID && !loading && (!abilities || abilities.length === 0)) {
      dispatch(loadUserAbilities(user));
    }
  }, [user?.businessID, dispatch, loading, abilities?.length, user, abilities]);
};

export function useUserAccess() {
  const abilities = useAbility(AbilityContext);
  const loading = useSelector<AbilitiesRootState, ReturnType<typeof selectAbilitiesLoading>>(
    selectAbilitiesLoading,
  );
  const status = useSelector<AbilitiesRootState, ReturnType<typeof selectAbilitiesStatus>>(
    selectAbilitiesStatus,
  );
  const user = useSelector<UserRootState, ReturnType<typeof selectUser>>(selectUser);

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
