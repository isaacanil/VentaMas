import { lazy } from 'react';

import ROUTES_NAME from '../routesName';

const Home = lazy(() =>
  import('../../views/pages/Home/Home').then((module) => ({
    default: module.Home,
  })),
);
const Welcome = lazy(() =>
  import('../../views/pages/Welcome/Welcome').then((module) => ({
    default: module.Welcome,
  })),
);

const { BASIC_TERM } = ROUTES_NAME;
const { HOME, WELCOME } = BASIC_TERM;

const Routes = [
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
