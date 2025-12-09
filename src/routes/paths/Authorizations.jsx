import { lazy } from 'react';

import { ROUTE_STATUS } from '../routeMeta';
import ROUTES_NAME from '../routesName';

const AuthorizationsManager = lazy(() =>
  import('../../views/pages/Authorizations/AuthorizationsManager').then(
    (module) => ({ default: module.AuthorizationsManager }),
  ),
);

const { AUTHORIZATIONS_LIST } = ROUTES_NAME.AUTHORIZATIONS_TERM;

const Routes = [
  {
    path: AUTHORIZATIONS_LIST,
    element: <AuthorizationsManager />,
    title: 'Autorizaciones',
    metaDescription:
      'Gestión de solicitudes de autorización y PINs de seguridad.',
    status: ROUTE_STATUS.WIP,
  },
];

export default Routes;
