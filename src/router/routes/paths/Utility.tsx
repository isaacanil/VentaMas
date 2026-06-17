import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import { loadUtilityReportRoute } from '@/modules/utility/public';
import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';

const Utility = lazy(loadUtilityReportRoute);

const { UTILITY_REPORT } = ROUTES_NAME.UTILITY_TERM;

const Routes: AppRoute[] = [{ path: UTILITY_REPORT, element: <Utility /> }];

export default Routes;
