import { AbilityBuilder, PureAbility } from '@casl/ability';

export function defineAbilitiesForOwner() {
  const { can, cannot, rules } = new AbilityBuilder(PureAbility);
  can('manage', 'all'); // el dueño puede manejar todo
  cannot('developerAccess', 'all');
  cannot('access', '/users');
  cannot('access', '/users/list');
  cannot('access', '/users/session-logs');
  return rules;
}
