import { AbilityBuilder, PureAbility } from '@casl/ability';

export function defineAbilitiesForOwner(_user?: any) {
  const { can, cannot, rules } = new AbilityBuilder(PureAbility as any) as any;
  can('manage', 'all'); // el dueño puede manejar todo
  can('access', 'all'); // acceso a todas las rutas
  cannot('developerAccess', 'all');
  cannot('access', '/users');
  cannot('access', '/users/list');
  cannot('access', '/users/session-logs');
  cannot('access', '/users/activity');
  return rules;
}
