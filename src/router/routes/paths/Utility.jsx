import { lazy } from 'react';

import ROUTES_NAME from '@/router/routes/routesName';

const Utility = lazy(() =>
  import('@/views/pages/Utility/Utility').then((module) => ({
    default: module.Utility,
  })),
);

const { UTILITY_REPORT } = ROUTES_NAME.UTILITY_TERM;

const Routes = [{ path: UTILITY_REPORT, element: <Utility /> }];

export default Routes;
