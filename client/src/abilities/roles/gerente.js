import { AbilityBuilder, createMongoAbility, PureAbility } from '@casl/ability';

export function defineAbilitiesForManager() {
 const { can, rules } = new AbilityBuilder(PureAbility);
  can('manage', 'Bill');
  can('manage', 'Product');
  can(['read', 'create', 'update'], 'Client');
  can(['read', 'create', 'update'], 'Provider');
  can(['read', 'create', 'update'], 'Category');
  can('manage', 'CashCount');
  can('manage', 'User');
  can('manage', 'Business');

  return rules;
  
}

