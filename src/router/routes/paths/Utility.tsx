import { lazy } from 'react';

import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/routes/routes';

const Utility = lazy(() =>
  import('@/views/pages/Utility/Utility').then((module) => ({
    default: module.Utility,
  })),
);

const { UTILITY_REPORT } = ROUTES_NAME.UTILITY_TERM;

const Routes: AppRoute[] = [{ path: UTILITY_REPORT, element: <Utility /> }];

export default Routes;

