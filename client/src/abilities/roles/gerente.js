import { AbilityBuilder, createMongoAbility, PureAbility } from '@casl/ability';

export function defineAbilitiesForManager() {
 const { can, rules } = new AbilityBuilder(PureAbility);

  return rules;
  
}

