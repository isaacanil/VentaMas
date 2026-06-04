import ROUTES_NAME from '@/router/routes/routesName';
import FrontendFeatureRouteGate from '@/components/availability/FrontendFeatureRouteGate';
import { CLAIM_BUSINESS_BLOCKED_COPY } from '@/components/availability/FrontendFeatureRouteGate.config';
import { redirectAuthenticatedToDefaultLoader } from '@/router/routes/loaders/accessLoaders';
import { Login } from '@/modules/auth/pages/Login/Login';
import { lazyRoute as lazy } from '@/router/utils/lazyRoute';
import type { AppRoute } from '@/router/types/routeTypes';

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
        blockedView={CLAIM_BUSINESS_BLOCKED_COPY}
      >
        <ClaimBusinessPage />
      </FrontendFeatureRouteGate>
    ),
    isPublic: true,
  },
];

export default Routes;
