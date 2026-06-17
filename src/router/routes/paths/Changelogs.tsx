import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import {
  loadChangelogListRoute,
  loadChangelogManageRoute,
} from '@/modules/controlPanel/public';
import RoutesName from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';

const ChangelogList = lazy(loadChangelogListRoute);
const ChangelogManage = lazy(loadChangelogManageRoute);

const { CHANGELOG_LIST, CHANGELOG_MANAGE } = RoutesName.CHANGELOG_TERM;

const Routes: AppRoute[] = [
  {
    path: CHANGELOG_LIST,
    element: <ChangelogList />,
  },
  {
    path: CHANGELOG_MANAGE,
    element: <ChangelogManage />,
  },
];

export default Routes;
