import { AbilityBuilder, PureAbility } from '@casl/ability';

export function defineAbilitiesForDev() {
  const { can, rules } = new AbilityBuilder(PureAbility);
  can('developerAccess', 'all'); // acceso total para el desarrollador
  can('manage', 'all'); // el dev puede manejar todo
  can('access', 'all'); // acceso a todas las rutas
  can('access', '/users');
  can('access', '/users/list');
  can('access', '/users/session-logs');
  can('access', '/users/activity');
  return rules;
}
