import { AbilityBuilder, createMongoAbility, PureAbility } from '@casl/ability';

export function defineAbilitiesForBuyer(user) {
  const { can, rules } = new AbilityBuilder(PureAbility);
  can('manage', 'Order'); // el comprador puede hacer pedidos
  can('manage', 'Purchase'); // y también puede hacer compras
  can('manage', 'Product'); // puede ver los productos
  can('manage', 'Client'); // 
  can('manage', 'Provider'); // 
  can('manage', 'Category'); //
  can('manage', 'Inventory'); //
  return rules;
}
