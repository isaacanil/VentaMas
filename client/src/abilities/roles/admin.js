import { AbilityBuilder, PureAbility } from '@casl/ability';

export function defineAbilitiesForAdmin(user) {
  const { can, cannot, rules } = new AbilityBuilder(PureAbility);
  can('manage', 'all'); // el dueño puede manejar todo
  cannot('developerAccess', 'all')
  return rules;
}
