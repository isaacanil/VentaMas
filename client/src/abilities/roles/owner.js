import { AbilityBuilder, createMongoAbility, PureAbility } from '@casl/ability';

export function defineAbilitiesForOwner(user) {
  const { can, rules } = new AbilityBuilder(PureAbility);
  can('manage', 'all'); // el dueño puede manejar todo
  cannot('developerAccess', 'all')
  return rules;
}
