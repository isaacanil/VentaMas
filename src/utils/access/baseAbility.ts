import { PureAbility } from '@casl/ability';

import { defineAbilitiesFor } from '@/abilities';

export const createBaseAbilityForUser = (user: unknown): PureAbility | null => {
  if (!user || typeof user !== 'object') return null;

  return new PureAbility(defineAbilitiesFor(user));
};

export const canBaseAbility = (
  user: unknown,
  action: string,
  subject: string,
): boolean => {
  return createBaseAbilityForUser(user)?.can(action, subject) ?? false;
};
