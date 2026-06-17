import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import { loadAuthorizationsManagerRoute } from '@/modules/authorizations/public';
import { ROUTE_STATUS } from '@/router/routes/routeMeta';
import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';

const AuthorizationsManager = lazy(loadAuthorizationsManagerRoute);

const { AUTHORIZATIONS_LIST } = ROUTES_NAME.AUTHORIZATIONS_TERM;

const Routes: AppRoute[] = [
  {
    path: AUTHORIZATIONS_LIST,
    element: <AuthorizationsManager />,
    requiredCapabilities: [
      'authorizationPinSelfGenerate',
      'authorizationApprove',
      'authorizationRequestsView',
    ],
    requiredCapabilitiesMode: 'any',
    title: 'Autorizaciones',
    metaDescription:
      'Gestión de solicitudes de autorización y PINs de seguridad.',
    status: ROUTE_STATUS.WIP,
  },
];

export default Routes;
