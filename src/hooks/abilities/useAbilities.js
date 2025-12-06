import { useAbility } from '@casl/react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { AbilityContext } from '../../Context/AbilityContext/context';
import {
  selectAbilities,
  selectAbilitiesLoading,
  selectAbilitiesError,
  loadUserAbilities,
} from '../../features/abilities/abilitiesSlice';
import { selectUser } from '../../features/auth/userSlice';

export const useAbilities = () => {
  const abilities = useSelector(selectAbilities);
  const loading = useSelector(selectAbilitiesLoading);
  const error = useSelector(selectAbilitiesError);

  return { abilities, loading, error };
};

export const useLoadUserAbilities = () => {
  const user = useSelector(selectUser);
  const abilities = useSelector(selectAbilities);
  const loading = useSelector(selectAbilitiesLoading);
  const dispatch = useDispatch();

  useEffect(() => {
    // Only load if user exists, has businessID, and abilities haven't been loaded yet
    // This prevents infinite loops by checking if abilities are already loaded
    if (user?.businessID && !loading && (!abilities || abilities.length === 0)) {
      dispatch(loadUserAbilities(user));
    }
  }, [user?.businessID, dispatch, loading, abilities?.length]);
};

export function useUserAccess() {
  const abilities = useAbility(AbilityContext);
  const loading = useSelector(selectAbilitiesLoading);

  return { abilities, loading };
}
