import type { MenuItem } from '@/types/menu';
import {
  faBookOpen,
  faChartColumn,
  faClipboard,
  faClipboardCheck,
  faLayerGroup,
  faLock,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { TeamOutlined } from '@/constants/icons/antd';
import { icons } from '@/constants/icons/icons';
import ROUTES_NAME from '@/router/routes/routesName';

import accountsPayable from './accountsPayable';
import accountsReceivable from './accountsReceivable';

const { PURCHASES } = ROUTES_NAME.PURCHASE_TERM;
const { ORDERS } = ROUTES_NAME.ORDER_TERM;

const { EXPENSES_LIST } = ROUTES_NAME.EXPENSES_TERM;
const {
  HR_PAYROLL,
  HR_COMMISSIONS,
  HR_COMMISSION_PERIODS,
} = ROUTES_NAME.HR_PAYROLL_TERM;
const {
  ACCOUNTING_JOURNAL_BOOK,
  ACCOUNTING_GENERAL_LEDGER,
  ACCOUNTING_MANUAL_ENTRIES,
  ACCOUNTING_PERIOD_CLOSE,
  ACCOUNTING_FISCAL_COMPLIANCE,
  ACCOUNTING_MONITOR,
  ACCOUNTING_REPORTS,
} = ROUTES_NAME.ACCOUNTING_TERM;
const {
  GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS,
  GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES,
  GENERAL_CONFIG_EXCHANGE_RATES,
} = ROUTES_NAME.SETTING_TERM;

const ChevronRight = icons.arrows.chevronRight;
const ChevronLeft = icons.arrows.chevronLeft;

const financialManagement: MenuItem[] = [
  {
    title: 'Compras y gastos',
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
      {
        title: 'Gastos del Negocio',
        icon: icons.menu.unSelected.expenses.expenses,
        route: EXPENSES_LIST,
        group: 'purchases',
      },
    ],
  },
  {
    title: 'RRHH y nomina',
    icon: <TeamOutlined />,
    group: 'hrPayroll',
    submenuIconOpen: ChevronLeft,
    submenuIconClose: ChevronRight,
    submenu: [
      {
        title: 'Colaboradores',
        icon: <TeamOutlined />,
        route: HR_PAYROLL,
        group: 'hrPayroll',
      },
      {
        title: 'Comisiones RRHH',
        icon: <TeamOutlined />,
        route: HR_COMMISSIONS,
        group: 'hrPayroll',
      },
      {
        title: 'Cortes y pagos',
        icon: icons.finances.money,
        route: HR_COMMISSION_PERIODS,
        group: 'hrPayroll',
      },
    ],
  },
  {
    title: 'Contabilidad',
    icon: <FontAwesomeIcon icon={faBookOpen} />,
    submenuIconOpen: ChevronLeft,
    submenuIconClose: ChevronRight,
    group: 'financialManagement',
    submenu: [
      ...accountsReceivable,
      ...accountsPayable,
      {
        title: 'Libro diario',
        route: ACCOUNTING_JOURNAL_BOOK,
        icon: icons.menu.unSelected.list,
        group: 'accounting',
      },
      {
        title: 'Libro mayor',
        route: ACCOUNTING_GENERAL_LEDGER,
        icon: icons.menu.unSelected.list,
        group: 'accounting',
      },
      {
        title: 'Asientos manuales',
        route: ACCOUNTING_MANUAL_ENTRIES,
        icon: icons.menu.unSelected.register,
        group: 'accounting',
      },
      {
        title: 'Catálogo de cuentas',
        route: GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS,
        icon: <FontAwesomeIcon icon={faBookOpen} />,
        group: 'accounting',
      },
      {
        title: 'Reportes',
        route: ACCOUNTING_REPORTS,
        icon: <FontAwesomeIcon icon={faChartColumn} />,
        group: 'accounting',
      },
      {
        title: 'Cumplimiento fiscal',
        route: ACCOUNTING_FISCAL_COMPLIANCE,
        icon: <FontAwesomeIcon icon={faClipboardCheck} />,
        group: 'accounting',
      },
      {
        title: 'Monitor contable',
        route: ACCOUNTING_MONITOR,
        icon: <FontAwesomeIcon icon={faClipboard} />,
        group: 'accounting',
      },
      {
        title: 'Cierre de periodo',
        route: ACCOUNTING_PERIOD_CLOSE,
        icon: <FontAwesomeIcon icon={faLock} />,
        group: 'accounting',
      },
      {
        title: 'Configuración contable',
        icon: icons.operationModes.setting,
        submenuIconOpen: ChevronLeft,
        submenuIconClose: ChevronRight,
        group: 'accounting',
        submenu: [
          {
            title: 'Reglas de contabilización',
            route: GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES,
            icon: <FontAwesomeIcon icon={faLayerGroup} />,
            group: 'accounting',
          },
          {
            title: 'Tipos de cambio',
            route: GENERAL_CONFIG_EXCHANGE_RATES,
            icon: icons.finances.transfer,
            group: 'accounting',
          },
        ],
      },
    ],
  },
];

export default financialManagement;
