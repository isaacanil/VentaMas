import { AbilityBuilder, createMongoAbility, PureAbility } from '@casl/ability';
import { getActionsAndSubjects } from '../actions';

export function defineAbilitiesForAdmin() {
  const { can, cannot, rules } = new AbilityBuilder(PureAbility);
  can('manage', 'all'); // el dueño puede manejar todo
  return rules;
}
