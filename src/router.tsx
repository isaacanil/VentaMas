import { Spin } from 'antd';
import { lazy, memo, Suspense, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { createBrowserRouter, Outlet, useLocation, useNavigate, useNavigation } from 'react-router';
import styled from 'styled-components';

import { ViewportContainer } from './components/layout/ViewportContainer/ViewportContainer';
import { selectUser } from './features/auth/userSlice';
import { useAutomaticLogin } from './firebase/Auth/fbAuthV2/fbSignIn/checkSession';
import { routes } from './routes/routes';
import SEO from './Seo/Seo';
import { SessionManager } from './views/templates/system/SessionManager';

// Tipo básico para User (ajustar según la estructura real)
interface User {
  uid?: string;
  role?: string;
  businessID?: string;
  [key: string]: unknown;
}

type UserState = User | null | false;

const GlobalListeners = lazy(() => import('./router/GlobalListeners'));
const DeveloperSessionHelper = lazy(
  () =>
    import('./components/devtools/DeveloperSessionHelper').then((module) => ({
      default: module.DeveloperSessionHelper,
    })),
);
const ModalManager = lazy(() =>
  import('./views/component/modals/ModalManager').then((module) => ({
    default: module.ModalManager,
  })),
);
const NotificationCenter = lazy(() => import('./views/templates/NotificationCenter/NotificationCenter'));

const RoutePendingBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 2000;
  background: linear-gradient(90deg, transparent, #667eea, transparent);
  background-size: 200% 100%;
  animation: routePending 1.2s linear infinite;

  @keyframes routePending {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const RouteSuspenseFallback = () => (
  <div
    style={{
      width: '100%',
      minHeight: '40vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Spin size="large" tip="Cargando..." />
  </div>
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
      <Suspense fallback={null}>
        <DeveloperSessionHelper />
      </Suspense>
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

const RootElement = () => {
  const { status: bootStatus, error: bootError } = useAutomaticLogin();
  const user = useSelector(selectUser) as UserState;
  const location = useLocation();
  const navigate = useNavigate();

  const isChecking = bootStatus === 'checking';
  const isPublicRoute =
    location.pathname === '/' || location.pathname === '/login';
  const shouldRedirectToHome =
    !isChecking && bootStatus === 'ready' && user && isPublicRoute;
  const shouldAttachListeners = !isChecking && user;

  useEffect(() => {
    if (shouldRedirectToHome) {
      void navigate('/home', { replace: true });
    }
  }, [shouldRedirectToHome, navigate]);

  const blockContent = isChecking && !user;

  return (
    <>
      <SessionManager status={bootStatus} error={bootError as Error | null} />
      {shouldAttachListeners ? (
        <Suspense fallback={null}>
          <GlobalListeners user={user} />
        </Suspense>
      ) : null}
      <AppLayout blockContent={blockContent} />
    </>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootElement />,
    children: routes.map(route => ({
      ...route,
      element: route.element,
      children: route.children ? route.children.map(child => ({
        ...child,
        element: child.element
      })) : undefined
    }))
  }
]);
