import { icons } from '../../../../../constants/icons/icons';
import ROUTES_NAME from '@/router/routes/routesName';

const {
  RECEIVABLE_PAYMENT_RECEIPTS,
  ACCOUNT_RECEIVABLE_LIST,
  ACCOUNT_RECEIVABLE_AUDIT,
} =
  ROUTES_NAME.ACCOUNT_RECEIVABLE;

const ChevronRight = icons.arrows.chevronRight;
const ChevronLeft = icons.arrows.chevronLeft;

const paths = [
  {
    title: 'Cuentas por Cobrar',
    icon: icons.finances.fileInvoiceDollar,
    submenuIconOpen: ChevronLeft,
    submenuIconClose: ChevronRight,
    group: 'financialManagement',
    submenu: [
      {
        title: 'Listado',
        route: ACCOUNT_RECEIVABLE_LIST,
        icon: icons.menu.unSelected.list,
        group: 'accountsReceivableList',
      },
      {
        title: 'Auditoría',
        route: ACCOUNT_RECEIVABLE_AUDIT,
        icon: icons.menu.unSelected.accountsReceivable,
        group: 'accountsReceivableAudit',
      },
      {
        title: 'Recibos de pagos',
        route: RECEIVABLE_PAYMENT_RECEIPTS,
        icon: icons.menu.unSelected.register,
        group: 'accountsReceivableReceipts',
      },
    ],
  },
];

export default paths;
