import { AbilityBuilder, PureAbility } from '@casl/ability';

export function defineAbilitiesForDev() {
  const { can, rules } = new AbilityBuilder(PureAbility);
  can('developerAccess', 'all'); // acceso total para el desarrollador
  can('manage', 'all'); // el dev puede manejar todo
  can('access', '/users');
  can('access', '/users/list');
  can('access', '/users/session-logs');
  return rules;
}
