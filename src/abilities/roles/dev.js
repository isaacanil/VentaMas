import { AbilityBuilder, PureAbility } from '@casl/ability';

export function defineAbilitiesForDev() {
  const { can, cannot, rules } = new AbilityBuilder(PureAbility);
  can('developerAccess', 'all'); // acceso total para el desarrollador
  can('manage', 'all'); // el dev puede manejar todo
  return rules;
}
