import type { MenuItem } from '@/types/menu';
import {
  BugOutlined,
  ToolOutlined,
  TeamOutlined,
  ApartmentOutlined,
  ProfileOutlined,
} from '@ant-design/icons';

import { icons } from '@/constants/icons/icons';
import ROUTES_NAME from '@/router/routes/routesName';

// Developer section grouped with multiple useful entries and a submenu for specific tools.
const dev = ROUTES_NAME.DEV_VIEW_TERM;

const ChevronRight = icons.arrows.chevronRight;
const ChevronLeft = icons.arrows.chevronLeft;

const developer: MenuItem[] = [
  // Label-like parent to group dev shortcuts in the sidebar grid
  {
    title: 'Desarrollador',
    icon: <BugOutlined />,
    group: 'developer',
    groupType: 'collapsible',
    submenuIconOpen: ChevronLeft,
    submenuIconClose: ChevronRight,
    submenu: [
      {
        title: 'Panel Desarrollador',
        action: 'openDeveloperModal',
        icon: <BugOutlined />,
        group: 'core',
      },
      {
        title: 'Switch Business',
        route: dev.SWITCH_BUSINESS,
        icon: <ApartmentOutlined />,
        group: 'core',
      },
      {
        title: 'Negocios',
        route: dev.BUSINESSES,
        icon: <ApartmentOutlined />,
        group: 'core',
      },
      {
        title: 'Todos los usuarios',
        route: dev.ALL_USERS,
        icon: <TeamOutlined />,
        group: 'usuarios',
      },
      {
        title: 'Changelogs (Gestionar)',
        route: dev.CHANGELOG_MANAGE,
        icon: <ProfileOutlined />,
        group: 'changelogs',
      },
      {
        title: 'Changelogs (Crear)',
        route: dev.CHANGELOG_CREATE,
        icon: <ProfileOutlined />,
        group: 'changelogs',
      },
      {
        title: 'Config App',
        route: dev.APP_CONFIG.ROOT,
        icon: <ToolOutlined />,
        group: 'config',
      },
      //   { title: 'Migración Inventario', route: dev.INVENTORY_MIGRATION, icon: <RocketOutlined />, group: 'tools' },
      {
        title: 'Análisis de comprobantes',
        route: dev.FISCAL_RECEIPTS_AUDIT,
        icon: <BugOutlined />,
        group: 'tools',
      },
      {
        title: 'Soporte Invoice V2',
        route: dev.INVOICE_V2_RECOVERY,
        icon: <BugOutlined />,
        group: 'tools',
      },
      {
        title: 'Facturas Serie B',
        route: dev.B_SERIES_INVOICES,
        icon: <BugOutlined />,
        group: 'tools',
      },
      {
        title: 'Pruebas',
        route: dev.PRUEBA,
        icon: <BugOutlined />,
        group: 'tools',
      },
    ],
  },
];

export default developer;
