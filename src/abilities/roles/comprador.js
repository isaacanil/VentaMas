import { AbilityBuilder, PureAbility } from '@casl/ability';

import routesName from '../../routes/routesName';

export function defineAbilitiesForBuyer() {
  const { can, rules } = new AbilityBuilder(PureAbility);
  const { PURCHASE_TERM } = routesName;
  const { BACKORDERS } = PURCHASE_TERM;
  can('manage', 'Order'); // el comprador puede hacer pedidos
  can('manage', 'Purchase'); // y también puede hacer compras
  can('manage', 'Product'); // puede ver los productos  can('manage', 'Client'); // 
  can('manage', 'Provider'); // 
  can('manage', 'Category'); //
  can('manage', 'Inventory'); //
  // Permitir ver usuarios pero no gestionarlos
  can('read', 'User');
  // Acceso a pantalla de BackOrders
  can('access', BACKORDERS);
  return rules;
}
