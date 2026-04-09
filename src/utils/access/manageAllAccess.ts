import { PureAbility } from '@casl/ability';

import { defineAbilitiesFor } from '@/abilities';

/**
 * Access check for privileged users whose CASL rules include full management.
 * Today this maps to admin, owner and dev.
 */
export const hasManageAllAccess = (user: unknown): boolean => {
  if (!user || typeof user !== 'object') return false;

  const rules = defineAbilitiesFor(user);
  const ability = new PureAbility(rules);

  return ability.can('manage', 'all');
};

