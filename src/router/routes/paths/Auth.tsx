import ROUTES_NAME from '@/router/routes/routesName';
import FrontendFeatureRouteGate from '@/router/guards/availability/FrontendFeatureRouteGate';
import { CLAIM_BUSINESS_BLOCKED_COPY } from '@/router/guards/availability/FrontendFeatureRouteGate.config';
import {
  loadClaimBusinessRoute,
  loadLoginRoute,
  loadSignUpRoute,
} from '@/modules/auth/public';
import { redirectAuthenticatedToDefaultLoader } from '@/router/routes/loaders/accessLoaders';
import { lazyRoute as lazy } from '@/router/utils/lazyRoute';
import type { AppRoute } from '@/router/types/routeTypes';

const ClaimBusinessPage = lazy(loadClaimBusinessRoute);
const LoginPage = lazy(loadLoginRoute);
const SignUpPage = lazy(loadSignUpRoute);

const { LOGIN, SIGNUP, CLAIM_BUSINESS } = ROUTES_NAME.AUTH_TERM;
const Routes: AppRoute[] = [
  {
    path: LOGIN,
    element: <LoginPage />,
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
