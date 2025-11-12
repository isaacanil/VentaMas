import { AbilityBuilder, PureAbility } from '@casl/ability';

export function defineAbilitiesForAdmin() {
  const { can, cannot, rules } = new AbilityBuilder(PureAbility);
  can('manage', 'all'); // el dueño puede manejar todo
  cannot('developerAccess', 'all');
  can('access', '/users');
  can('access', '/users/list');
  can('access', '/users/session-logs');
  return rules;
}
