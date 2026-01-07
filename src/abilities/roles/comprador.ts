import { AbilityBuilder, PureAbility } from '@casl/ability';

import routesName from '@/router/routes/routesName';

export function defineAbilitiesForBuyer(_user?: any) {
  const { can, rules } = new AbilityBuilder(PureAbility as any) as any;
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
