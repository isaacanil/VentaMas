import { lazyRoute as lazy } from '@/router/utils/lazyRoute';
import { Outlet } from 'react-router-dom';

import {
  loadCustomHeroUiPlaygroundRoute,
  loadHeroUiPlaygroundRoute,
} from '@/modules/dev/public';
import { ROUTE_STATUS } from '@/router/routes/routeMeta';
import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';

const Lab = () => <Outlet />;
const HeroUiPlayground = lazy(loadHeroUiPlaygroundRoute);
const CustomHeroUiPlayground = lazy(loadCustomHeroUiPlaygroundRoute);
const { LAB, HEROUI, HEROUI_CUSTOM } = ROUTES_NAME.LAB_TERM;
const LAB_CHILD_PATH_PREFIX = `${LAB}/`;

const Routes: AppRoute[] = [
  {
    path: LAB,
    element: <Lab />,
    devOnly: true,
    requiresDevAccess: true,
    hideInMenu: true,
    status: ROUTE_STATUS.WIP,
    children: [
      {
        path: HEROUI.replace(LAB_CHILD_PATH_PREFIX, ''),
        element: <HeroUiPlayground />,
        devOnly: true,
        requiresDevAccess: true,
        hideInMenu: true,
        status: ROUTE_STATUS.WIP,
      },
      {
        path: HEROUI_CUSTOM.replace(LAB_CHILD_PATH_PREFIX, ''),
        element: <CustomHeroUiPlayground />,
        devOnly: true,
        requiresDevAccess: true,
        hideInMenu: true,
        status: ROUTE_STATUS.WIP,
      },
    ],
  },
];
export default Routes;
