import { useEffect, useMemo } from 'react';
import { Outlet, matchPath, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { useUserAccess } from '../../../../../hooks/abilities/useAbilities';
import ROUTES_NAME from '@/router/routes/routesName';
import { MenuApp } from '../../../../templates/MenuApp/MenuApp';

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

export const UserAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { abilities, loading } = useUserAccess();
  const usersRoute = `${USERS}/${USERS_LIST}`;
  const sessionLogsRoute = `${USERS}/${USERS_SESSION_LOGS}`;
  const userActivityRoute = `${USERS}/${USERS_ACTIVITY}`;
  const userActivityPattern = `${USERS}/${USERS_ACTIVITY_DETAIL}`;
  const canAccessUserList = abilities.can('access', usersRoute);
  const canAccessSessionLogs = abilities.can('access', sessionLogsRoute);
  const canAccessUserActivity = abilities.can('access', userActivityRoute);
  const canAccessUsers =
    canAccessUserList || canAccessSessionLogs || canAccessUserActivity;
  const managedRoutes = useMemo(
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

  useEffect(() => {
    if (!loading && !canAccessUsers) {
      navigate(HOME, { replace: true });
      return;
    }
    if (loading || !canAccessUsers) {
      return;
    }

    const normalizePath = (path) => {
      if (!path) return path;
      return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
    };

    const currentPath = normalizePath(location.pathname);
    const isKnownRoute = managedRoutes.some(({ match }) => match(currentPath));
    const currentRoute = managedRoutes.find(({ match }) =>
      match(currentPath),
    );

    if (!isKnownRoute) {
      const fallback = managedRoutes.find(({ allowed }) => allowed);
      if (fallback && !fallback.match(currentPath)) {
        navigate(fallback.path, { replace: true });
      }
      return;
    }

    if (currentRoute && !currentRoute.allowed) {
      const fallback = managedRoutes.find(({ allowed }) => allowed);
      if (fallback) {
        navigate(fallback.path, { replace: true });
      } else {
        navigate(HOME, { replace: true });
      }
    }
  }, [canAccessUsers, loading, location.pathname, managedRoutes, navigate]);

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
    return null;
  }

  return (
    <Container>
      <MenuApp sectionName={sectionName} />
      <Outlet />
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  height: 100%;
  overflow: hidden;
`;
