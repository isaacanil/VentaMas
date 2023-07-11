import { faCartShopping, faReceipt } from '@fortawesome/free-solid-svg-icons'
import { CompraImg, InventarioImg, RegistroImg, VentaImg } from '../../../assets/index'
import ROUTES_NAME from '../../../routes/routesName'
import findRouteByName from '../../templates/MenuApp/findRouteByName'
import { icons } from '../../../constants/icons/icons'

const {BILLS, SALES} = ROUTES_NAME.SALES_TERM
const {INVENTORY_ITEMS} = ROUTES_NAME.INVENTORY_TERM
const {PURCHASES} = ROUTES_NAME.PURCHASE_TERM
const {CASH_RECONCILIATION_LIST} = ROUTES_NAME.CASH_RECONCILIATION_TERM


const {inventory, purchase, register, sale, cashReconciliation} = icons.menu.unSelected
export const getCardData = () => {
  return[
  {
    id: 1,
    title: 'Ventas',
    icon: sale,
    route: findRouteByName(SALES)
  },
  {
    id: 2,
    title: 'Compras',
    icon: purchase,
    route: findRouteByName(PURCHASES)
  },
  {
    id: 3,
    title: 'Facturas',
    icon: register,
    route: findRouteByName(BILLS)
  },
  {
    id: 4,
    title: 'Inventario',
    icon: inventory,
    route: findRouteByName(INVENTORY_ITEMS)
  },
  {
    id: 5,
    title: 'Cuadre de Caja',
    icon: cashReconciliation,
    route: findRouteByName(CASH_RECONCILIATION_LIST)

  }
]}
