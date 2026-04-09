import { lazyRoute as lazy } from '@/router/utils/lazyRoute';
import type { AppRoute } from '@/router/routes/routes';

const Lab = lazy(() =>
  import('@/Lab').then((module) => ({ default: module.Lab })),
);

const Routes: AppRoute[] = [
  {
    path: '/lab',
    element: <Lab />,
  },
];
export default Routes;
