import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import {
  loadCustomHeroUiPlaygroundRoute,
  loadHeroUiPlaygroundRoute,
} from '@/modules/dev/public';
import type { AppRoute } from '@/router/types/routeTypes';

const Lab = lazy(() =>
  import('@/Lab').then((module) => ({ default: module.Lab })),
);
const HeroUiPlayground = lazy(loadHeroUiPlaygroundRoute);
const CustomHeroUiPlayground = lazy(loadCustomHeroUiPlaygroundRoute);

const Routes: AppRoute[] = [
  {
    path: '/lab',
    element: <Lab />,
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
