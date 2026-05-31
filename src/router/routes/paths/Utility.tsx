import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';

const Utility = lazy(() =>
  import('@/modules/utility/pages/Utility/Utility').then((module) => ({
    default: module.Utility,
  })),
);

const { UTILITY_REPORT } = ROUTES_NAME.UTILITY_TERM;

const Routes: AppRoute[] = [{ path: UTILITY_REPORT, element: <Utility /> }];

export default Routes;
