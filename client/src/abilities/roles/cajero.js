import { AbilityBuilder, PureAbility } from '@casl/ability';



export function defineAbilitiesForCashier(user) {
  const { can, rules } = new AbilityBuilder(PureAbility);

  can('manage', 'Bill');
  can('manage', 'Product');
  can(['read', 'create', 'update'], 'Client');
  can(['read', 'create', 'update'], 'Provider');
  can(['read', 'create', 'update'], 'Category');
  can('manage', 'CashCount');

  return rules
}


