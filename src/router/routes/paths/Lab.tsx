import { lazyRoute as lazy } from '@/router/utils/lazyRoute';
import { Outlet } from 'react-router-dom';

import {
  loadCustomHeroUiPlaygroundRoute,
  loadHeroUiPlaygroundRoute,
} from '@/modules/dev/public';
import type { AppRoute } from '@/router/types/routeTypes';

const Lab = () => <Outlet />;
const HeroUiPlayground = lazy(loadHeroUiPlaygroundRoute);
const CustomHeroUiPlayground = lazy(loadCustomHeroUiPlaygroundRoute);

const Routes: AppRoute[] = [
  {
    path: '/lab',
    element: <Lab />,
    devOnly: true,
    hideInMenu: true,
    children: [
      {
        path: 'heroui',
        element: <HeroUiPlayground />,
        devOnly: true,
        hideInMenu: true,
      },
      {
        path: 'heroui/custom',
        element: <CustomHeroUiPlayground />,
        devOnly: true,
        hideInMenu: true,
      },
    ],
  },
];
export default Routes;
