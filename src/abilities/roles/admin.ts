import { AbilityBuilder, PureAbility } from '@casl/ability';

export function defineAbilitiesForAdmin(_user?: any) {
  const { can, cannot, rules } = new AbilityBuilder(PureAbility as any) as any;
  can('manage', 'all'); // el administrador puede manejar todo
  can('access', 'all'); // acceso a todas las rutas
  cannot('developerAccess', 'all');
  can('access', '/users');
  can('access', '/users/list');
  can('access', '/users/session-logs');
  can('access', '/users/activity');
  return rules;
}
