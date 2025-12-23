import { icons } from '@/constants/icons/icons';
import ROUTES_NAME from '@/router/routes/routesName';

const { UTILITY_REPORT } = ROUTES_NAME.UTILITY_TERM;

const utility = [
  {
    title: 'Utilidad',
    icon: icons.menu.unSelected.sale,
    route: UTILITY_REPORT,
    group: 'utility',
  },
];

export default utility;
