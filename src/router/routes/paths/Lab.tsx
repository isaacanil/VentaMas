import { lazyRoute as lazy } from '@/router/utils/lazyRoute';
import type { AppRoute } from '@/router/routes/routes';

const Lab = lazy(() =>
  import('@/Lab').then((module) => ({ default: module.Lab })),
);
const HeroUiPlayground = lazy(
  () => import('@/modules/dev/pages/DevTools/HeroUiPlayground/HeroUiPlayground'),
);

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
    ],
  },
];
export default Routes;
