
import ROUTES_NAME from '../../../routes/routesName'
import { icons } from '../../../constants/icons/icons'
import { userAccess } from '../../../hooks/abilities/useAbilities'

export const getMenuCardData = () => {
  const { abilities } = userAccess();
  const routes = [
    { id: 1, title: 'Ventas', icon: icons.menu.unSelected.sale, route: ROUTES_NAME.SALES_TERM.SALES },
    { id: 2, title: 'Facturas', icon: icons.menu.unSelected.register, route: ROUTES_NAME.SALES_TERM.BILLS },
    { id: 3, title: 'Compras', icon: icons.menu.unSelected.purchase, route: ROUTES_NAME.PURCHASE_TERM.PURCHASES },
    { id: 4, title: 'Inventario', icon: icons.menu.unSelected.inventory, route: ROUTES_NAME.INVENTORY_TERM.INVENTORY_ITEMS },
    { id: 5, title: 'Cuadre de Caja', icon: icons.menu.unSelected.cashReconciliation, route: ROUTES_NAME.CASH_RECONCILIATION_TERM.CASH_RECONCILIATION_LIST },
  ];
  const filteredRoutes = routes.filter((item) => abilities.can('access', item.route));
  return filteredRoutes;
};

export const getDeveloperFeaturesData = () => {
  const { abilities } = userAccess();
  if (abilities?.can('developerAccess', 'all')) {
    return [
      { id: 6, title: 'Gestionar Negocios', icon: icons.operationModes.add, route: ROUTES_NAME.DEV_VIEW_TERM.MANAGE_BUSINESS },
      { id: 7, title: 'Gestionar Actualización', icon: icons.operationModes.add, route: ROUTES_NAME.DEV_VIEW_TERM.CHANGELOG_MANAGE },
      { id: 8, title: 'Documentar Actualización', icon: icons.operationModes.add, route: ROUTES_NAME.DEV_VIEW_TERM.CHANGELOG_CREATE },
      { id: 9, title: 'Todos los usuarios', icon: icons.operationModes.add, route: ROUTES_NAME.DEV_VIEW_TERM.ALL_USERS }
    ];
  }
  return []; // Retornar un array vacío si el usuario no tiene acceso a características de desarrollador
};
