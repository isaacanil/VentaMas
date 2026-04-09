import { PureAbility } from '@casl/ability';

import { defineAbilitiesFor } from '@/abilities';

export type RouteRequiredCapabilitiesMode = 'any' | 'all';

export const hasRequiredCapabilitiesAccess = ({
  user,
  requiredCapabilities,
  mode = 'any',
}: {
  user: unknown;
  requiredCapabilities?: string[] | null;
  mode?: RouteRequiredCapabilitiesMode;
}): boolean => {
  const capabilities = Array.isArray(requiredCapabilities)
    ? requiredCapabilities.filter(
        (value): value is string => typeof value === 'string' && value.trim().length > 0,
      )
    : [];

  if (capabilities.length === 0) return true;
  if (!user || typeof user !== 'object') return false;

  const ability = new PureAbility(defineAbilitiesFor(user));
  if (mode === 'all') {
    return capabilities.every((capability) => ability.can(capability, 'all'));
  }

  return capabilities.some((capability) => ability.can(capability, 'all'));
};

