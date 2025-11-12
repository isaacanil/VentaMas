import { Spin } from 'antd';
import { useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { userAccess } from '../../../../../hooks/abilities/useAbilities';
import ROUTES_NAME from '../../../../../routes/routesName';
import { MenuApp } from '../../../../templates/MenuApp/MenuApp';

const {
  SETTING_TERM: { USERS, USERS_LIST, USERS_SESSION_LOGS },
  BASIC_TERM: { HOME },
} = ROUTES_NAME;

export const UserAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { abilities, loading } = userAccess();
  const usersRoute = `${USERS}/${USERS_LIST}`;
  const sessionLogsRoute = `${USERS}/${USERS_SESSION_LOGS}`;
  const canAccessUserList = abilities.can('access', usersRoute);
  const canAccessSessionLogs = abilities.can('access', sessionLogsRoute);
  const canAccessUsers = canAccessUserList || canAccessSessionLogs;
  const managedRoutes = useMemo(
    () => [
      { path: usersRoute, allowed: canAccessUserList },
      { path: sessionLogsRoute, allowed: canAccessSessionLogs },
    ],
    [canAccessSessionLogs, canAccessUserList, sessionLogsRoute, usersRoute],
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
    const isKnownRoute = managedRoutes.some(({ path }) => path === currentPath);

    if (!isKnownRoute) {
      const fallback = managedRoutes.find(({ allowed }) => allowed);
      if (fallback && fallback.path !== currentPath) {
        navigate(fallback.path, { replace: true });
      }
      return;
    }

    const currentRoute = managedRoutes.find(({ path }) => path === currentPath);
    if (currentRoute && !currentRoute.allowed) {
      const fallback = managedRoutes.find(({ allowed }) => allowed);
      if (fallback) {
        navigate(fallback.path, { replace: true });
      } else {
        navigate(HOME, { replace: true });
      }
    }
  }, [
    HOME,
    canAccessUsers,
    loading,
    location.pathname,
    managedRoutes,
    navigate,
  ]);

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
    return 'Usuarios';
  }, [location.pathname, sessionLogsRoute, usersRoute]);

  if (loading) {
    return (
      <Container>
        <MenuApp sectionName={sectionName} />
        <LoadingState>
          <Spin tip="Verificando permisos..." />
        </LoadingState>
      </Container>
    );
  }

  if (!canAccessUsers) {
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
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-rows: min-content 1fr;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;
