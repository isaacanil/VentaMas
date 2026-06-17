import { createBaseAbilityForUser } from './baseAbility';

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

  const ability = createBaseAbilityForUser(user);
  if (capabilities.length === 0) return true;
  if (!ability) return false;

  if (mode === 'all') {
    return capabilities.every((capability) => ability.can(capability, 'all'));
  }

  return capabilities.some((capability) => ability.can(capability, 'all'));
};

