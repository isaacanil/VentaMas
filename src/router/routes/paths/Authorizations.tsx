import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import { ROUTE_STATUS } from '@/router/routes/routeMeta';
import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/routes/routes';

const AuthorizationsManager = lazy(() =>
  import('@/modules/authorizations/pages/Authorizations/AuthorizationsManager').then(
    (module) => ({ default: module.AuthorizationsManager }),
  ),
);

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
