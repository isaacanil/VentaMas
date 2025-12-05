import { useAbility } from '@casl/react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  selectAbilities,
  selectAbilitiesLoading,
  selectAbilitiesError,
  loadUserAbilities,
} from '../../features/abilities/abilitiesSlice';
import { selectUser } from '../../features/auth/userSlice';
import { AbilityContext } from '../../Context/AbilityContext/context';

export const useAbilities = () => {
  const abilities = useSelector(selectAbilities);
  const loading = useSelector(selectAbilitiesLoading);
  const error = useSelector(selectAbilitiesError);

  return { abilities, loading, error };
};

export const useLoadUserAbilities = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  useEffect(() => {
    if (user?.businessID) {
      dispatch(loadUserAbilities(user));
    }
  }, [user, dispatch]);
};

export function userAccess() {
  const abilities = useAbility(AbilityContext);
  const loading = useSelector(selectAbilitiesLoading);

  return { abilities, loading };
}
