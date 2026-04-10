import type { MenuItem } from '@/types/menu';
import { faBuildingColumns } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { icons } from '@/constants/icons/icons';
import ROUTES_NAME from '@/router/routes/routesName';

const { CASH_RECONCILIATION_LIST } = ROUTES_NAME.CASH_RECONCILIATION_TERM;
const { TREASURY_BANK_ACCOUNTS } = ROUTES_NAME.TREASURY_TERM;

const treasury: MenuItem[] = [
  {
    title: 'Bancos y cajas',
    icon: <FontAwesomeIcon icon={faBuildingColumns} />,
    route: TREASURY_BANK_ACCOUNTS,
    group: 'treasury',
  },
  {
    title: 'Cuadre de caja',
    icon: icons.menu.unSelected.cashReconciliation,
    route: CASH_RECONCILIATION_LIST,
    group: 'treasury',
  },
];

export default treasury;
