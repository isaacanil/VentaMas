import { useMemo } from 'react';
import {
  Navigate,
  Outlet,
  matchPath,
  useLocation,
} from 'react-router-dom';
import styled from 'styled-components';

import { useUserAccess } from '@/hooks/abilities/useAbilities';
import ROUTES_NAME from '@/router/routes/routesName';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import { PageShell } from '@/components/layout/PageShell';

const {
  SETTING_TERM: {
    USERS,
    USERS_LIST,
    USERS_SESSION_LOGS,
    USERS_ACTIVITY,
    USERS_ACTIVITY_DETAIL,
  },
  BASIC_TERM: { HOME },
} = ROUTES_NAME;

type AbilityLike = {
  can: (action: string, subject: string) => boolean;
};

interface ManagedRoute {
  path: string;
  allowed: boolean;
  match: (path: string) => boolean;
}

export const UsersLandingRedirect = () => {
  const { abilities, loading } = useUserAccess() as {
    abilities?: AbilityLike;
    loading: boolean;
  };

  if (loading) {
    return null;
  }

  if (!abilities) {
    return <Navigate to={HOME} replace />;
  }

  const usersRoute = `${USERS}/${USERS_LIST}`;
  const sessionLogsRoute = `${USERS}/${USERS_SESSION_LOGS}`;
  const userActivityRoute = `${USERS}/${USERS_ACTIVITY}`;
  const candidates = [usersRoute, sessionLogsRoute, userActivityRoute];
  const targetRoute =
    candidates.find((route) => abilities.can('access', route)) || HOME;

  return <Navigate to={targetRoute} replace />;
};

export const UserAdmin = () => {
  const location = useLocation();
  const { abilities, loading } = useUserAccess() as {
    abilities: AbilityLike;
    loading: boolean;
  };
  const usersRoute = `${USERS}/${USERS_LIST}`;
  const sessionLogsRoute = `${USERS}/${USERS_SESSION_LOGS}`;
  const userActivityRoute = `${USERS}/${USERS_ACTIVITY}`;
  const userActivityPattern = `${USERS}/${USERS_ACTIVITY_DETAIL}`;
  const canAccessUserList = abilities.can('access', usersRoute);
  const canAccessSessionLogs = abilities.can('access', sessionLogsRoute);
  const canAccessUserActivity = abilities.can('access', userActivityRoute);
  const canAccessUsers =
    canAccessUserList || canAccessSessionLogs || canAccessUserActivity;
  const managedRoutes = useMemo<ManagedRoute[]>(
    () => [
      {
        path: usersRoute,
        allowed: canAccessUserList,
        match: (path) => path === usersRoute,
      },
      {
        path: sessionLogsRoute,
        allowed: canAccessSessionLogs,
        match: (path) => path === sessionLogsRoute,
      },
      {
        path: userActivityPattern,
        allowed: canAccessUserActivity,
        match: (path) =>
          Boolean(matchPath({ path: userActivityPattern, end: true }, path)),
      },
    ],
    [
      canAccessSessionLogs,
      canAccessUserActivity,
      canAccessUserList,
      sessionLogsRoute,
      userActivityPattern,
      usersRoute,
    ],
  );

  const normalizePath = (path: string) => {
    if (!path) return path;
    return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  };

  const normalizedPath = normalizePath(location.pathname);
  const currentRoute = managedRoutes.find(({ match }) => match(normalizedPath));
  const fallbackManagedRoute = managedRoutes.find(({ allowed }) => allowed);
  const deniedRouteRedirectTarget =
    !loading && canAccessUsers && currentRoute && !currentRoute.allowed
      ? (fallbackManagedRoute?.path ?? HOME)
      : null;

  const sectionName = useMemo(() => {
    const normalizedPath =
      location.pathname.length > 1 && location.pathname.endsWith('/')
        ? location.pathname.slice(0, -1)
        : location.pathname;

    if (normalizedPath === sessionLogsRoute) {
      return 'Sesiones de usuarios';
    }
    if (normalizedPath === usersRoute) {
      return 'Lista de Usuarios';
    }
    if (
      matchPath({ path: userActivityPattern, end: true }, normalizedPath) ||
      normalizedPath.startsWith(userActivityRoute)
    ) {
      return 'Actividad de usuario';
    }
    return 'Usuarios';
  }, [
    location.pathname,
    sessionLogsRoute,
    userActivityPattern,
    userActivityRoute,
    usersRoute,
  ]);

  if (!loading && !canAccessUsers) {
    return <Navigate to={HOME} replace />;
  }

  if (deniedRouteRedirectTarget) {
    return <Navigate to={deniedRouteRedirectTarget} replace />;
  }

  return (
    <Container>
      <MenuApp sectionName={sectionName} />
      <PageBody>
        <Content>
          <Outlet />
        </Content>
      </PageBody>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const PageBody = styled(PageShell)`
  padding: 1rem;
  background-color: ${({ theme }) => theme?.palette?.background?.light || '#f8f9fa'};
  overflow-y: auto;
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
`;
