import { BugOutlined } from '@ant-design/icons';

import ROUTES_NAME from '../../routes/routesName';
import { icons } from '../icons/icons';

export const developerShortcuts = [
  { id: 'dev-console', title: 'Panel Desarrollador', icon: <BugOutlined />, action: 'openDeveloperModal', category: 'Herramientas' },
  { id: 'fiscal-audit', title: 'Análisis de comprobantes', icon: <BugOutlined />, route: ROUTES_NAME.DEV_VIEW_TERM.FISCAL_RECEIPTS_AUDIT, category: 'Comprobantes Fiscal' },
  { id: 'b-series-invoices', title: 'Facturas Serie B', icon: <BugOutlined />, route: ROUTES_NAME.DEV_VIEW_TERM.B_SERIES_INVOICES, category: 'Comprobantes Fiscal' },
  { id: 'test-playground', title: 'Pruebas', icon: <BugOutlined />, route: ROUTES_NAME.DEV_VIEW_TERM.PRUEBA, category: 'Herramientas' },
  { id: 'switch-business', title: 'Cambiar Negocio', icon: icons.operationModes.add, route: ROUTES_NAME.DEV_VIEW_TERM.SWITCH_BUSINESS, category: 'Negocio' },
  { id: 'manage-businesses', title: 'Gestionar Negocios', icon: icons.operationModes.add, route: ROUTES_NAME.DEV_VIEW_TERM.BUSINESSES, category: 'Negocio' },
  { id: 'all-users', title: 'Todos los usuarios', icon: icons.operationModes.add, route: ROUTES_NAME.DEV_VIEW_TERM.ALL_USERS, category: 'Usuarios' },
  { id: 'changelog-manage', title: 'Gestionar Actualización', icon: icons.operationModes.add, route: ROUTES_NAME.DEV_VIEW_TERM.CHANGELOG_MANAGE, category: 'Changelogs' },
  { id: 'changelog-create', title: 'Documentar Actualización', icon: icons.operationModes.add, route: ROUTES_NAME.DEV_VIEW_TERM.CHANGELOG_CREATE, category: 'Changelogs' },
  { id: 'app-config', title: 'Configuración de App', icon: icons.menu.selected.settings, route: ROUTES_NAME.DEV_VIEW_TERM.APP_CONFIG.ROOT, category: 'Configuración' },
];
