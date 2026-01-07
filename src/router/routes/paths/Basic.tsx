import { lazy } from 'react';

import ROUTES_NAME from '@/router/routes/routesName';
import { Home } from '@/views/pages/Home/Home';
import type { AppRoute } from '@/router/routes/routes';

const Welcome = lazy(() =>
  import('@/views/pages/Welcome/Welcome').then((module) => ({
    default: module.Welcome,
  })),
);

const { BASIC_TERM } = ROUTES_NAME;
const { HOME, WELCOME } = BASIC_TERM;

const Routes: AppRoute[] = [
  {
    path: WELCOME,
    element: <Welcome />,
    isPublic: true,
  },
  {
    path: HOME,
    element: <Home />,
    title: 'Dashboard - Ventamax',
    metaDescription:
      'Resumen de estadísticas, accesos rápidos y actividades recientes en Ventamax POS.',
  },
];

export default Routes;

