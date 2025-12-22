import { faTicket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { icons } from '@/constants/icons/icons';
import ROUTES_NAME from '@/router/routes/routesName';

const { SALES, BILLS, PREORDERS } = ROUTES_NAME.SALES_TERM;

const sales = [
  {
    title: 'Venta',
    icon: icons.menu.unSelected.sale,
    route: SALES,
    group: 'sales',
  },
  {
    title: 'Pre-ventas',
    icon: <FontAwesomeIcon icon={faTicket} />,
    route: PREORDERS,
    group: 'sales',
    key: 'preorders',
    condition: ({ billingMode }) => billingMode === 'deferred',
  },
  {
    title: 'Facturas',
    icon: icons.menu.unSelected.register,
    route: BILLS,
    group: 'sales',
    // tag: {
    //     color: '#ff9900',
    //     text: 'Mantenimiento'G
    // }
  },
];

export default sales;
