import { createBaseAbilityForUser } from './baseAbility';

export const hasBusinessSettingsManageAccess = (user: unknown): boolean => {
  const ability = createBaseAbilityForUser(user);
  if (!ability) return false;

  return (
    ability.can('manage', 'Business') || ability.can('manage', 'business-settings')
  );
};
