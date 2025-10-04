import ROUTES_NAME from '../../../routes/routesName';
import { icons } from '../../../constants/icons/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTicket, faWarehouse, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { filterMenuItemsByAccess, hasDeveloperAccess } from '../../../utils/menuAccess';
import { developerShortcuts } from '../../../constants/devtools/developerShortcuts.jsx';

const createMenuItems = (items) => items.map((item, index) => ({ ...item, id: index + 1 }));

const menuItems = createMenuItems([
  { title: 'Venta', icon: icons.menu.unSelected.sale, route: ROUTES_NAME.SALES_TERM.SALES, category: 'Ventas' },
  { title: 'Facturas', icon: icons.menu.unSelected.register, route: ROUTES_NAME.SALES_TERM.BILLS, category: 'Ventas' },
  { title: 'Productos', icon: icons.menu.unSelected.inventory, route: ROUTES_NAME.INVENTORY_TERM.INVENTORY_ITEMS, category: 'Inventario' },
  { title: 'Preventas', icon: <FontAwesomeIcon icon={faTicket} />, route: ROUTES_NAME.SALES_TERM.PREORDERS, category: 'Ventas' },
  { title: 'Compras', icon: icons.menu.unSelected.purchase, route: ROUTES_NAME.PURCHASE_TERM.PURCHASES, category: 'Operaciones' },
  { title: 'Ordenes', icon: icons.menu.unSelected.order, route: ROUTES_NAME.ORDER_TERM.ORDERS, category: 'Operaciones' },
  { title: 'BackOrders', icon: icons.menu.unSelected.order, route: ROUTES_NAME.PURCHASE_TERM.BACKORDERS, category: 'Inventario' },
  { title: 'Cuentas por Cobrar', icon: icons.menu.unSelected.accountsReceivable, route: ROUTES_NAME.ACCOUNT_RECEIVABLE.ACCOUNT_RECEIVABLE_LIST, category: 'Finanzas' },
  { title: 'Notas de Crédito', icon: icons.finances.fileInvoiceDollar, route: ROUTES_NAME.CREDIT_NOTE_TERM.CREDIT_NOTE_LIST, category: 'Finanzas' },
  { title: 'Control Inventario', icon: icons.menu.unSelected.inventory, route: ROUTES_NAME.INVENTORY_TERM.INVENTORY_CONTROL, category: 'Inventario' },
  { title: 'Resumen Inventario', icon: icons.menu.unSelected.inventory, route: ROUTES_NAME.INVENTORY_TERM.INVENTORY_SUMMARY, category: 'Inventario' },
  { title: 'Almacenes', icon: <FontAwesomeIcon icon={faWarehouse} />, route: ROUTES_NAME.INVENTORY_TERM.WAREHOUSES, category: 'Inventario' },
  { title: 'Movimientos', icon: icons.menu.unSelected.inventory, route: ROUTES_NAME.INVENTORY_TERM.INVENTORY_MOVEMENTS, category: 'Inventario' },
  { title: 'Clientes', icon: icons.users.client, route: ROUTES_NAME.CONTACT_TERM.CLIENTS, category: 'Contactos' },
  { title: 'Proveedores', icon: icons.users.provider, route: ROUTES_NAME.CONTACT_TERM.SUPPLIERS, category: 'Contactos' },
  { title: 'Cuadre de Caja', icon: icons.menu.unSelected.cashReconciliation, route: ROUTES_NAME.CASH_RECONCILIATION_TERM.CASH_RECONCILIATION_LIST, category: 'Finanzas' },
  { title: 'Autorizaciones', icon: <FontAwesomeIcon icon={faShieldAlt} />, route: ROUTES_NAME.AUTHORIZATIONS_TERM.AUTHORIZATIONS_LIST, category: 'Administración', roles: ['admin', 'owner', 'dev', 'manager'] },
]);

const developerItems = createMenuItems(developerShortcuts);

export const getMenuCardData = (user) => {
  return filterMenuItemsByAccess(menuItems).filter(item => {
    // Si el item tiene roles definidos, verificar que el usuario tenga uno de esos roles
    if (item.roles && Array.isArray(item.roles)) {
      return item.roles.includes(user?.role);
    }
    return true;
  });
};

export const getDeveloperFeaturesData = () => {
  return hasDeveloperAccess() ? developerItems : [];
};
