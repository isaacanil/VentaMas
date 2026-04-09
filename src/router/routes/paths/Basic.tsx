import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import ROUTES_NAME from '@/router/routes/routesName';
import { redirectAuthenticatedToDefaultLoader } from '@/router/routes/loaders/accessLoaders';
import { DeveloperHub } from '@/modules/home/pages/DeveloperHub/DeveloperHub';
import { Home } from '@/modules/home/pages/Home/Home';
import type { AppRoute } from '@/router/routes/routes';

const CheckoutRedirect = lazy(() =>
  import('@/modules/checkout/pages/CheckoutRedirect/CheckoutRedirect').then((module) => ({
    default: module.default,
  })),
);

const Welcome = lazy(() =>
  import('@/modules/welcome/pages/Welcome/Welcome').then((module) => ({
    default: module.Welcome,
  })),
);

const WelcomeV2 = lazy(() =>
  import('@/modules/welcome/pages/WelcomeV2/WelcomeV2').then((module) => ({
    default: module.WelcomeV2,
  })),
);

const { BASIC_TERM } = ROUTES_NAME;
const { HOME, WELCOME, DEVELOPER_HUB } = BASIC_TERM;

const Routes: AppRoute[] = [
  {
    path: WELCOME,
    element: <Welcome />,
    isPublic: true,
    loader: redirectAuthenticatedToDefaultLoader,
  },
  {
    path: BASIC_TERM.WELCOME_V2,
    element: <WelcomeV2 />,
    isPublic: true,
    loader: redirectAuthenticatedToDefaultLoader,
  },
  {
    path: HOME,
    element: <Home />,
    title: 'Dashboard - Ventamax',
    metaDescription:
      'Resumen de estadísticas, accesos rápidos y actividades recientes en Ventamax POS.',
  },
  {
    path: DEVELOPER_HUB,
    element: <DeveloperHub />,
    requiresDevAccess: true,
    title: 'Developer Hub - Ventamax',
    metaDescription:
      'Herramientas internas para desarrolladores y mantenimiento de plataforma.',
  },
  {
    path: BASIC_TERM.CHECKOUT_PROXY,
    element: <CheckoutRedirect />,
    isPublic: true,
  },
];

export default Routes;
