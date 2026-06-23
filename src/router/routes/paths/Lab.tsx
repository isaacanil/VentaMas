import { lazyRoute as lazy } from '@/router/utils/lazyRoute';
import { Outlet } from 'react-router-dom';

import { ROUTE_STATUS } from '@/router/routes/routeMeta';
import ROUTES_NAME from '@/router/routes/routesName';
import type { AppRoute } from '@/router/types/routeTypes';

const { LAB, HEROUI, HEROUI_CUSTOM } = ROUTES_NAME.LAB_TERM;
const LAB_CHILD_PATH_PREFIX = `${LAB}/`;

const buildLabRoutes = (): AppRoute[] => {
  const printPaginationLabSegment = 'print-pagination';
  const Lab = () => <Outlet />;
  const HeroUiPlayground = lazy(async () => {
    const { loadHeroUiPlaygroundRoute } = await import('@/modules/dev/public');
    return loadHeroUiPlaygroundRoute();
  });
  const CustomHeroUiPlayground = lazy(async () => {
    const { loadCustomHeroUiPlaygroundRoute } = await import(
      '@/modules/dev/public'
    );
    return loadCustomHeroUiPlaygroundRoute();
  });
  const PrintPaginationLab = lazy(async () => {
    const { loadPrintPaginationLabRoute } = await import('@/modules/dev/public');
    return loadPrintPaginationLabRoute();
  });

  return [
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
        {
          path: printPaginationLabSegment,
          element: <PrintPaginationLab />,
          devOnly: true,
          requiresDevAccess: true,
          hideInMenu: true,
          status: ROUTE_STATUS.WIP,
        },
      ],
    },
  ];
};

const Routes: AppRoute[] =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_ROUTES === 'true'
    ? buildLabRoutes()
    : [];

export default Routes;
