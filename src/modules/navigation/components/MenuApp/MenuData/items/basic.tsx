import type { MenuItem } from '@/types/menu';
import { icons } from '@/constants/icons/icons';
import ROUTES_NAME from '@/router/routes/routesName';

const { HOME } = ROUTES_NAME.BASIC_TERM;

const basic: MenuItem[] = [
  {
    title: 'Inicio',
    icon: icons.menu.unSelected.home,
    route: HOME,
    group: 'basic',
  },
];

export default basic;
