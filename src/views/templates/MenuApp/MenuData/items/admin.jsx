import { icons } from '../../../../../constants/icons/icons';
import ROUTES_NAME from '../../../../../routes/routesName';

const { SETTING, USERS, USERS_LIST, USERS_SESSION_LOGS } =
  ROUTES_NAME.SETTING_TERM;
const { AUTHORIZATIONS_LIST } = ROUTES_NAME.AUTHORIZATIONS_TERM;

const admin = [
  {
    title: 'Usuarios',
    icon: icons.settings.users,
    route: `${USERS}/${USERS_LIST}`,
    group: 'security',
    key: 'users',
  },
  {
    title: 'Revisión de sesiones de usuarios',
    icon: icons.system.sessionManager,
    route: `${USERS}/${USERS_SESSION_LOGS}`,
    group: 'security',
    key: 'user-session-logs',
  },
  {
    title: 'Autorizaciones',
    icon: icons.menu.unSelected.settings,
    route: AUTHORIZATIONS_LIST,
    group: 'security',
    key: 'authorizations',
    condition: ({ authorizationFlowEnabled }) =>
      authorizationFlowEnabled === true,
  },
  {
    title: 'Configuración',
    icon: icons.menu.unSelected.settings,
    route: SETTING,
    group: 'security',
  },
];

export default admin;
