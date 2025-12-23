import {
  faClipboard,
  faClipboardCheck,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { icons } from '@/constants/icons/icons';
import ROUTES_NAME from '@/router/routes/routesName';

import accountsReceivable from './accountsReceivable';
import creditNote from './creditNote';

const { PURCHASES } = ROUTES_NAME.PURCHASE_TERM;
const { ORDERS } = ROUTES_NAME.ORDER_TERM;

const { EXPENSES_LIST } = ROUTES_NAME.EXPENSES_TERM;
const { CASH_RECONCILIATION_LIST } = ROUTES_NAME.CASH_RECONCILIATION_TERM;

const ChevronRight = icons.arrows.chevronRight;
const ChevronLeft = icons.arrows.chevronLeft;

const financialManagement = [
  {
    title: 'Compras y Pedidos',
    icon: icons.menu.unSelected.purchase,
    submenuIconOpen: ChevronLeft,
    submenuIconClose: ChevronRight,
    group: 'inventory',
    submenu: [
      {
        title: 'Pedidos',
        icon: <FontAwesomeIcon icon={faClipboard} />,
        route: ORDERS,
        group: 'purchases',
      },
      {
        title: 'Compras',
        route: PURCHASES,
        icon: <FontAwesomeIcon icon={faClipboardCheck} />,
        group: 'purchases',
      },
    ],
  },
  ...creditNote,
  ...accountsReceivable,
  {
    title: 'Gastos del Negocio',
    icon: icons.menu.unSelected.expenses.expenses,
    submenuIconOpen: ChevronLeft,
    submenuIconClose: ChevronRight,
    group: 'financialManagement',
    route: EXPENSES_LIST,
  },
  {
    title: 'Cuadre de caja',
    icon: icons.menu.unSelected.cashReconciliation,
    route: CASH_RECONCILIATION_LIST,
    group: 'financialManagement',
  },
];

export default financialManagement;
