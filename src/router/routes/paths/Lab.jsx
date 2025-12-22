import { lazy } from 'react';

const Lab = lazy(() =>
  import('@/Lab').then((module) => ({ default: module.Lab })),
);

const routes = [
  {
    path: '/lab',
    element: <Lab />,
  },
];
export default routes;
