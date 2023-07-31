
import ROUTES_NAME from '../../../routes/routesName'
import findRouteByName from '../../templates/MenuApp/findRouteByName'
import { icons } from '../../../constants/icons/icons'
import { inspectUserAccess } from '../../../hooks/abilities/useAbilities'

const { BILLS, SALES } = ROUTES_NAME.SALES_TERM
const { INVENTORY_ITEMS } = ROUTES_NAME.INVENTORY_TERM
const { PURCHASES } = ROUTES_NAME.PURCHASE_TERM
const { CASH_RECONCILIATION_LIST } = ROUTES_NAME.CASH_RECONCILIATION_TERM
const { MANAGE_BUSINESS } = ROUTES_NAME.DEV_VIEW_TERM


const { inventory, purchase, register, sale, cashReconciliation } = icons.menu.unSelected
export const getCardData = (user) => {
  const { abilities } = inspectUserAccess();

  function* generateData() {
    yield {
      id: 1,
      title: 'Ventas',
      icon: sale,
      route: SALES
    };
    yield {
      id: 2,
      title: 'Compras',
      icon: purchase,
      route: PURCHASES
    };
    yield {
      id: 3,
      title: 'Facturas',
      icon: register,
      route: BILLS
    };
    yield {
      id: 4,
      title: 'Inventario',
      icon: inventory,
      route: INVENTORY_ITEMS
    };
    yield {
      id: 5,
      title: 'Cuadre de Caja',
      icon: cashReconciliation,
      route: CASH_RECONCILIATION_LIST
    };

    if (abilities?.can('developerAccess', 'all')) {
      yield {
        id: 'Gestionar Negocios',
        title: 'Gestionar Negocios',
        icon: icons.operationModes.add,
        route: MANAGE_BUSINESS
      };
    }
  }

  return Array.from(generateData());
}
