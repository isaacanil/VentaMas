import type { MenuItem } from '@/types/menu';
import { icons } from '@/constants/icons/icons';
import ROUTES_NAME from '@/router/routes/routesName';

const { CLIENTS, SUPPLIERS } = ROUTES_NAME.CONTACT_TERM;

const ChevronRight = icons.arrows.chevronRight;
const ChevronLeft = icons.arrows.chevronLeft;

const contacts: MenuItem[] = [
  {
    title: 'Contacto',
    icon: icons.menu.unSelected.contacts,
    submenuIconOpen: ChevronLeft,
    submenuIconClose: ChevronRight,
    path: false,
    group: 'contacts',
    submenu: [
      {
        title: 'Clientes',
        route: CLIENTS,
        icon: icons.users.client,
        group: 'clients',
      },
      {
        title: 'Proveedores',
        route: SUPPLIERS,
        icon: icons.users.provider,
        group: 'suppliers',
      },
    ],
  },
];

export default contacts;
