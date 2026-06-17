import { lazyRoute as lazy } from '@/router/utils/lazyRoute';
import { Outlet } from 'react-router-dom';

import {
  loadCustomHeroUiPlaygroundRoute,
  loadHeroUiPlaygroundRoute,
} from '@/modules/dev/public';
import { ROUTE_STATUS } from '@/router/routes/routeMeta';
import type { AppRoute } from '@/router/types/routeTypes';

const Lab = () => <Outlet />;
const HeroUiPlayground = lazy(loadHeroUiPlaygroundRoute);
const CustomHeroUiPlayground = lazy(loadCustomHeroUiPlaygroundRoute);

const Routes: AppRoute[] = [
  {
    path: '/lab',
    element: <Lab />,
    devOnly: true,
    requiresDevAccess: true,
    hideInMenu: true,
    status: ROUTE_STATUS.WIP,
    children: [
      {
        path: 'heroui',
        element: <HeroUiPlayground />,
        devOnly: true,
        requiresDevAccess: true,
        hideInMenu: true,
        status: ROUTE_STATUS.WIP,
      },
      {
        path: 'heroui/custom',
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
