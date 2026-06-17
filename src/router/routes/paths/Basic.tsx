import { lazyRoute as lazy } from '@/router/utils/lazyRoute';

import { loadCheckoutRedirectRoute } from '@/modules/checkout/public';
import { loadDeveloperHubRoute, loadHomeRoute } from '@/modules/home/public';
import { loadWelcomeRoute, loadWelcomeV2Route } from '@/modules/welcome/public';
import ROUTES_NAME from '@/router/routes/routesName';
import { redirectAuthenticatedToDefaultLoader } from '@/router/routes/loaders/accessLoaders';
import type { AppRoute } from '@/router/types/routeTypes';

const CheckoutRedirect = lazy(loadCheckoutRedirectRoute);
const DeveloperHub = lazy(loadDeveloperHubRoute);
const Home = lazy(loadHomeRoute);
const Welcome = lazy(loadWelcomeRoute);
const WelcomeV2 = lazy(loadWelcomeV2Route);

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
