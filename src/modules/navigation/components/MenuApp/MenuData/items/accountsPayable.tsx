import type { MenuItem } from '@/types/menu';
import { icons } from '@/constants/icons/icons';
import ROUTES_NAME from '@/router/routes/routesName';

const { ACCOUNT_PAYABLE_LIST } = ROUTES_NAME.ACCOUNT_PAYABLE;

const ChevronRight = icons.arrows.chevronRight;
const ChevronLeft = icons.arrows.chevronLeft;

const paths: MenuItem[] = [
  {
    title: 'Cuentas por Pagar',
    icon: icons.finances.fileInvoiceDollar,
    submenuIconOpen: ChevronLeft,
    submenuIconClose: ChevronRight,
    group: 'accounting',
    submenu: [
      {
        title: 'Listado',
        route: ACCOUNT_PAYABLE_LIST,
        icon: icons.menu.unSelected.list,
        group: 'accountsPayableList',
      },
    ],
  },
];

export default paths;
