import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { ability } from '../../abilities/abilityInstance';
import { selectAbilities } from '../../features/abilities/abilitiesSlice';

import { AbilityContext } from './context';

export const AbilityProvider = ({ children }) => {
  const rules = useSelector(selectAbilities);

  useEffect(() => {
    if (rules) {
      ability.update(rules);
    } else {
      ability.update([]);
    }
  }, [rules]);

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
};
