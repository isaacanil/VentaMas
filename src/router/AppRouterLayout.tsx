import { memo, Suspense } from 'react';
import { lazyRoute as lazy } from '@/router/utils/lazyRoute';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation, useNavigation } from 'react-router';
import styled, { keyframes } from 'styled-components';

import { ViewportContainer } from '@/components/layout/ViewportContainer/ViewportContainer';
import { selectAuthReady, selectUser } from '@/features/auth/userSlice';
import { useAutomaticLogin } from '@/firebase/Auth/fbAuthV2/fbSignIn/checkSession';
import { resolveDefaultHomeRoute } from '@/modules/auth/utils/defaultHomeRoute';
import SEO from '@/Seo/Seo';
import { SessionManager } from '@/components/ui/SessionManager';

// Tipo básico para User (ajustar según la estructura real)
export interface User {
  uid?: string;
  role?: string;
  businessID?: string;
  [key: string]: unknown;
}

export type UserState = User | null | false;

const GlobalListeners = lazy(() => import('@/router/GlobalListeners'));
const ModalManager = lazy(() =>
  import('@/components/modals/ModalManager').then((module) => ({
    default: module.ModalManager,
  })),
);
const NotificationCenter = lazy(
  () =>
    import('@/modules/notification/components/NotificationCenter/NotificationCenter'),
);
const ClaimOwnershipModal = lazy(() =>
  import('@/modules/auth/components/ClaimOwnershipModal').then((module) => ({
    default: module.ClaimOwnershipModal,
  })),
);

const RoutePendingBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 2000;
  background: linear-gradient(90deg, transparent, #667eea, transparent);
  background-size: 200% 100%;
  animation: route-pending 1.2s linear infinite;

  @keyframes route-pending {
    0% {
      background-position: 200% 0;
    }

    100% {
      background-position: -200% 0;
    }
  }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const FallbackContainer = styled.div`
  width: 100%;
  min-height: 50vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
`;

const NavSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid rgb(102 126 234 / 10%);
  border-top-color: var(--color-primary, #667eea);
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const FallbackText = styled.span`
  color: var(--color-primary, #667eea);
  font-weight: 600;
  letter-spacing: 1.5px;
  font-size: 0.8rem;
  text-transform: uppercase;
  opacity: 0.8;
`;

const RouteSuspenseFallback = () => (
  <FallbackContainer>
    <NavSpinner />
    <FallbackText>Cargando...</FallbackText>
  </FallbackContainer>
);

const AppLayout = memo(({ blockContent }: { blockContent: boolean }) => {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== 'idle';

  if (blockContent) {
    return null;
  }

  return (
    <ViewportContainer>
      {isNavigating ? <RoutePendingBar /> : null}
      <SEO />
      <Suspense fallback={<RouteSuspenseFallback />}>
        <Outlet />
      </Suspense>
      <Suspense fallback={null}>
        <ModalManager />
      </Suspense>
      <Suspense fallback={null}>
        <NotificationCenter />
      </Suspense>
    </ViewportContainer>
  );
});

AppLayout.displayName = 'AppLayout';

export const RootElement = () => {
  const { status: bootStatus, error: bootError } = useAutomaticLogin();
  const user = useSelector(selectUser) as UserState;
  const authReady = useSelector(selectAuthReady);
  const location = useLocation();

  const isChecking = bootStatus === 'checking';
  const isPublicRoute =
    location.pathname === '/' || location.pathname === '/login';
  const isClaimBusinessRoute = location.pathname === '/claim-business';
  const shouldRedirectToHome =
    !isChecking && bootStatus === 'ready' && user && isPublicRoute;
  const shouldAttachListeners = !isChecking && user;
  const shouldShowClaimOwnershipModal =
    shouldAttachListeners && !isClaimBusinessRoute;
  const defaultHomePath = resolveDefaultHomeRoute(user);

  // Bloquear contenido hasta que la verificación de auth termine (authReady)
  const blockContent = !authReady;

  if (shouldRedirectToHome) {
    return (
      <>
        <SessionManager status={bootStatus} error={bootError as Error | null} />
        <Navigate to={defaultHomePath} replace />
      </>
    );
  }

  return (
    <>
      <SessionManager status={bootStatus} error={bootError as Error | null} />
      {shouldAttachListeners ? (
        <Suspense fallback={null}>
          <GlobalListeners user={user} />
        </Suspense>
      ) : null}
      {shouldShowClaimOwnershipModal ? (
        <Suspense fallback={null}>
          <ClaimOwnershipModal />
        </Suspense>
      ) : null}
      <AppLayout blockContent={blockContent} />
    </>
  );
};
