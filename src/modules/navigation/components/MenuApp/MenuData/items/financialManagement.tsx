import type { MenuItem } from '@/types/menu';
import {
  faBookOpen,
  faChartColumn,
  faClipboard,
  faClipboardCheck,
  faLock,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { icons } from '@/constants/icons/icons';
import ROUTES_NAME from '@/router/routes/routesName';

import accountsPayable from './accountsPayable';
import accountsReceivable from './accountsReceivable';
import creditNote from './creditNote';

const { PURCHASES } = ROUTES_NAME.PURCHASE_TERM;
const { ORDERS } = ROUTES_NAME.ORDER_TERM;

const { EXPENSES_LIST } = ROUTES_NAME.EXPENSES_TERM;
const { CASH_RECONCILIATION_LIST } = ROUTES_NAME.CASH_RECONCILIATION_TERM;
const {
  ACCOUNTING_JOURNAL_BOOK,
  ACCOUNTING_GENERAL_LEDGER,
  ACCOUNTING_MANUAL_ENTRIES,
  ACCOUNTING_PERIOD_CLOSE,
  ACCOUNTING_REPORTS,
} = ROUTES_NAME.ACCOUNTING_TERM;

const ChevronRight = icons.arrows.chevronRight;
const ChevronLeft = icons.arrows.chevronLeft;

const financialManagement: MenuItem[] = [
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
  ...accountsPayable,
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
  {
    title: 'Contabilidad',
    icon: <FontAwesomeIcon icon={faBookOpen} />,
    submenuIconOpen: ChevronLeft,
    submenuIconClose: ChevronRight,
    group: 'financialManagement',
    submenu: [
      {
        title: 'Libro diario',
        route: ACCOUNTING_JOURNAL_BOOK,
        icon: icons.menu.unSelected.list,
        group: 'accountingJournalBook',
      },
      {
        title: 'Libro mayor',
        route: ACCOUNTING_GENERAL_LEDGER,
        icon: icons.menu.unSelected.list,
        group: 'accountingGeneralLedger',
      },
      {
        title: 'Asientos manuales',
        route: ACCOUNTING_MANUAL_ENTRIES,
        icon: icons.menu.unSelected.register,
        group: 'accountingManualEntries',
      },
      {
        title: 'Reportes',
        route: ACCOUNTING_REPORTS,
        icon: <FontAwesomeIcon icon={faChartColumn} />,
        group: 'accountingReports',
      },
      {
        title: 'Cierre de periodo',
        route: ACCOUNTING_PERIOD_CLOSE,
        icon: <FontAwesomeIcon icon={faLock} />,
        group: 'accountingPeriodClose',
      },
    ],
  },
];

export default financialManagement;
