import ROUTES_NAME from '@/router/routes/routesName';
import FrontendFeatureRouteGate from '@/components/availability/FrontendFeatureRouteGate';
import { redirectAuthenticatedToDefaultLoader } from '@/router/routes/loaders/accessLoaders';
import { Login } from '@/modules/auth/pages/Login/Login';
import { lazyRoute as lazy } from '@/router/utils/lazyRoute';
import type { AppRoute } from '@/router/routes/routes';

const ClaimBusinessPage = lazy(() =>
  import('@/modules/auth/pages/ClaimBusinessPage/ClaimBusinessPage').then(
    (module) => ({ default: module.ClaimBusinessPage }),
  ),
);
const SignUpPage = lazy(() =>
  import('@/modules/auth/pages/SignUp/SignUp').then((module) => ({
    default: module.SignUp,
  })),
);

const { LOGIN, SIGNUP, CLAIM_BUSINESS } = ROUTES_NAME.AUTH_TERM;
const Routes: AppRoute[] = [
  {
    path: LOGIN,
    element: <Login />,
    isPublic: true,
    loader: redirectAuthenticatedToDefaultLoader,
  },
  {
    path: SIGNUP,
    element: (
      <FrontendFeatureRouteGate feature="userRegistration">
        <SignUpPage />
      </FrontendFeatureRouteGate>
    ),
    isPublic: true,
    loader: redirectAuthenticatedToDefaultLoader,
  },
  {
    path: CLAIM_BUSINESS,
    element: (
      <FrontendFeatureRouteGate
        feature="businessCreation"
        blockedView={{
          eyebrow: 'Reclamo pausado',
          title: 'El reclamo de propiedad no está disponible en producción.',
          description:
            'Este flujo todavía está en preparación y por ahora solo está habilitado en staging y localhost.',
          primaryTo: '/login',
          primaryLabel: 'Ir a iniciar sesión',
          secondaryTo: '/',
          secondaryLabel: 'Volver al inicio',
        }}
      >
        <ClaimBusinessPage />
      </FrontendFeatureRouteGate>
    ),
    isPublic: true,
  },
];

export default Routes;
