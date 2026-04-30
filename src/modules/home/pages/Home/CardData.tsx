import {
  faBookOpen,
  faBuildingColumns,
  faChartColumn,
  faClipboardCheck,
  faLock,
  faTicket,
  faWarehouse,
  faShieldAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { developerShortcuts } from '@/constants/devtools/developerShortcuts';
import { icons } from '@/constants/icons/icons';
import ROUTES_NAME from '@/router/routes/routesName';
import type { MenuItem } from '@/types/menu';
import type { UserIdentity } from '@/types/users';
import { hasAuthorizationApproveAccess } from '@/utils/access/authorizationAccess';
import { useBusinessFeatureEnabled } from '@/hooks/useBusinessFeatureEnabled';
import { useFilterMenuItemsByAccess } from '@/utils/menuAccess';

type ShortcutFeature = 'accounting' | 'treasury';

interface MenuCardItem extends MenuItem {
  id: number;
  category: string;
  requiresFeatures?: ShortcutFeature[];
  requiresAuthorizationApproveAccess?: boolean;
}

const createMenuItems = <T extends MenuItem>(items: T[]): MenuCardItem[] =>
  items.map((item, index) => ({
    ...item,
    id: index + 1,
  })) as MenuCardItem[];

const {
  UTILITY_TERM,
  SETTING_TERM,
  AUTHORIZATIONS_TERM,
  ACCOUNTING_TERM,
  ACCOUNT_PAYABLE,
  TREASURY_TERM,
} = ROUTES_NAME;
const { UTILITY_REPORT } = UTILITY_TERM;
const { USERS, USERS_LIST, USERS_SESSION_LOGS, SETTING } = SETTING_TERM;
const { AUTHORIZATIONS_LIST } = AUTHORIZATIONS_TERM;
const {
  ACCOUNTING_JOURNAL_BOOK,
  ACCOUNTING_GENERAL_LEDGER,
  ACCOUNTING_MANUAL_ENTRIES,
  ACCOUNTING_REPORTS,
  ACCOUNTING_FISCAL_COMPLIANCE,
  ACCOUNTING_PERIOD_CLOSE,
} = ACCOUNTING_TERM;
const { ACCOUNT_PAYABLE_LIST } = ACCOUNT_PAYABLE;
const { TREASURY_BANK_ACCOUNTS } = TREASURY_TERM;

const menuItems = createMenuItems([
  {
    title: 'Venta',
    icon: icons.menu.unSelected.sale,
    route: ROUTES_NAME.SALES_TERM.SALES,
    category: 'Ventas',
  },
  {
    title: 'Facturas',
    icon: icons.menu.unSelected.register,
    route: ROUTES_NAME.SALES_TERM.BILLS,
    category: 'Ventas',
  },
  {
    title: 'Productos',
    icon: icons.menu.unSelected.inventory,
    route: ROUTES_NAME.INVENTORY_TERM.INVENTORY_ITEMS,
    category: 'Inventario',
  },
  {
    title: 'Preventas',
    icon: <FontAwesomeIcon icon={faTicket} />,
    route: ROUTES_NAME.SALES_TERM.PREORDERS,
    category: 'Ventas',
  },
  {
    title: 'Compras',
    icon: icons.menu.unSelected.purchase,
    route: ROUTES_NAME.PURCHASE_TERM.PURCHASES,
    category: 'Compras y gastos',
  },
  {
    title: 'Ordenes',
    icon: icons.menu.unSelected.order,
    route: ROUTES_NAME.ORDER_TERM.ORDERS,
    category: 'Compras y gastos',
  },
  {
    title: 'BackOrders',
    icon: icons.menu.unSelected.order,
    route: ROUTES_NAME.PURCHASE_TERM.BACKORDERS,
    category: 'Inventario',
  },
  {
    title: 'Cuentas por Cobrar',
    icon: icons.menu.unSelected.accountsReceivable,
    route: ROUTES_NAME.ACCOUNT_RECEIVABLE.ACCOUNT_RECEIVABLE_LIST,
    category: 'Contabilidad',
    requiresFeatures: ['accounting'],
  },
  {
    title: 'Cuentas por Pagar',
    icon: icons.finances.fileInvoiceDollar,
    route: ACCOUNT_PAYABLE_LIST,
    category: 'Contabilidad',
    requiresFeatures: ['accounting'],
  },
  {
    title: 'Gastos',
    icon: icons.menu.unSelected.expenses.list,
    route: ROUTES_NAME.EXPENSES_TERM.EXPENSES_LIST,
    category: 'Compras y gastos',
  },
  {
    title: 'Libro Diario',
    icon: icons.menu.unSelected.list,
    route: ACCOUNTING_JOURNAL_BOOK,
    category: 'Contabilidad',
    requiresFeatures: ['accounting'],
  },
  {
    title: 'Libro Mayor',
    icon: <FontAwesomeIcon icon={faBookOpen} />,
    route: ACCOUNTING_GENERAL_LEDGER,
    category: 'Contabilidad',
    requiresFeatures: ['accounting'],
  },
  {
    title: 'Asientos Manuales',
    icon: icons.menu.unSelected.register,
    route: ACCOUNTING_MANUAL_ENTRIES,
    category: 'Contabilidad',
    requiresFeatures: ['accounting'],
  },
  {
    title: 'Reportes Contables',
    icon: <FontAwesomeIcon icon={faChartColumn} />,
    route: ACCOUNTING_REPORTS,
    category: 'Contabilidad',
    requiresFeatures: ['accounting'],
  },
  {
    title: 'Cumplimiento Fiscal',
    icon: <FontAwesomeIcon icon={faClipboardCheck} />,
    route: ACCOUNTING_FISCAL_COMPLIANCE,
    category: 'Contabilidad',
    requiresFeatures: ['accounting'],
  },
  {
    title: 'Cierre de Periodo',
    icon: <FontAwesomeIcon icon={faLock} />,
    route: ACCOUNTING_PERIOD_CLOSE,
    category: 'Contabilidad',
    requiresFeatures: ['accounting'],
  },
  {
    title: 'Notas de Crédito',
    icon: icons.finances.fileInvoiceDollar,
    route: ROUTES_NAME.CREDIT_NOTE_TERM.CREDIT_NOTE_LIST,
    category: 'Contabilidad',
  },
  {
    title: 'Control Inventario',
    icon: icons.menu.unSelected.inventory,
    route: ROUTES_NAME.INVENTORY_TERM.INVENTORY_CONTROL,
    category: 'Inventario',
  },
  {
    title: 'Resumen Inventario',
    icon: icons.menu.unSelected.inventory,
    route: ROUTES_NAME.INVENTORY_TERM.INVENTORY_SUMMARY,
    category: 'Inventario',
  },
  {
    title: 'Almacenes',
    icon: <FontAwesomeIcon icon={faWarehouse} />,
    route: ROUTES_NAME.INVENTORY_TERM.WAREHOUSES,
    category: 'Inventario',
  },
  {
    title: 'Movimientos',
    icon: icons.menu.unSelected.inventory,
    route: ROUTES_NAME.INVENTORY_TERM.INVENTORY_MOVEMENTS,
    category: 'Inventario',
  },
  {
    title: 'Clientes',
    icon: icons.users.client,
    route: ROUTES_NAME.CONTACT_TERM.CLIENTS,
    category: 'Contactos',
  },
  {
    title: 'Proveedores',
    icon: icons.users.provider,
    route: ROUTES_NAME.CONTACT_TERM.SUPPLIERS,
    category: 'Contactos',
  },
  {
    title: 'Cuadre de Caja',
    icon: icons.menu.unSelected.cashReconciliation,
    route: ROUTES_NAME.CASH_RECONCILIATION_TERM.CASH_RECONCILIATION_LIST,
    category: 'Tesorería',
    requiresFeatures: ['treasury'],
  },
  {
    title: 'Bancos y cajas',
    icon: <FontAwesomeIcon icon={faBuildingColumns} />,
    route: TREASURY_BANK_ACCOUNTS,
    category: 'Tesorería',
    requiresFeatures: ['accounting', 'treasury'],
  },
  {
    title: 'Autorizaciones',
    icon: <FontAwesomeIcon icon={faShieldAlt} />,
    route: AUTHORIZATIONS_LIST,
    category: 'Administración',
    requiresAuthorizationApproveAccess: true,
  },
  {
    title: 'Utilidad',
    icon: icons.menu.unSelected.sale,
    route: UTILITY_REPORT,
    category: 'Tesorería',
  },
  {
    title: 'Usuarios',
    icon: icons.settings.users,
    route: `${USERS}/${USERS_LIST}`,
    category: 'Administración',
    requiresAuthorizationApproveAccess: true,
  },
  {
    title: 'Revisión de sesiones de usuarios',
    icon: icons.system.sessionManager,
    route: `${USERS}/${USERS_SESSION_LOGS}`,
    category: 'Administración',
    requiresAuthorizationApproveAccess: true,
  },
  {
    title: 'Configuración',
    icon: icons.menu.unSelected.settings,
    route: SETTING,
    category: 'Administración',
    requiresAuthorizationApproveAccess: true,
  },
]);

const developerItems = createMenuItems(developerShortcuts);

export const useMenuCardData = (user?: UserIdentity | null) => {
  const accountingEnabled = useBusinessFeatureEnabled('accounting');
  const treasuryEnabled = useBusinessFeatureEnabled('treasury');
  const filteredItems = useFilterMenuItemsByAccess(menuItems);
  return filteredItems.filter((item): item is MenuCardItem => {
    if (item.requiresFeatures?.includes('accounting') && !accountingEnabled) {
      return false;
    }
    if (item.requiresFeatures?.includes('treasury') && !treasuryEnabled) {
      return false;
    }
    if (item.requiresAuthorizationApproveAccess) {
      return hasAuthorizationApproveAccess(user);
    }
    return true;
  });
};

export const useDeveloperFeaturesData = () => {
  // We return all items here. Access control is handled by the parent component
  // using abilities.can('developerAccess', 'all'). This prevents race conditions.
  return developerItems;
};
