import { createContext } from 'react';

import { ability } from '@/abilities/abilityInstance';

// Centralized Ability context to avoid relying on @casl/react exporting one
export const AbilityContext = createContext(ability);
