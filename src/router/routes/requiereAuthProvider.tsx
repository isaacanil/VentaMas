import { ErrorBoundary } from '@/modules/app/public';
import { RequireAuth } from '@/modules/auth/public';
import { mergeRouteHandleMeta } from '@/router/routes/routeHandle';

import { isValidElement, type ReactElement, type ReactNode } from 'react';

interface GuardedRoute {
  element?: ReactNode | null;
  isPublic?: boolean;
  handle?: unknown;
}

/**
 * Envuelve un componente en RequireAuth para protección de rutas
 * @param {JSX.Element} children - El componente a proteger
 * @returns {JSX.Element} Componente protegido
 */
const validateRouteAccess = (children: ReactElement): ReactElement => {
  return (
    <ErrorBoundary>
      <RequireAuth>{children}</RequireAuth>
    </ErrorBoundary>
  );
};

/**
 * Procesa un objeto de ruta para determinar si debe ser protegido o público
 * @param {Object} route - Objeto de ruta
 * @returns {Object} Ruta procesada con elemento protegido/público según corresponda
 */
export const processRoute = <TRoute extends GuardedRoute>(
  route: TRoute,
): TRoute => {
  const { element, isPublic = false } = route;
  const handle = mergeRouteHandleMeta(route);
  if (!isValidElement(element)) {
    return {
      ...route,
      ...(handle ? { handle } : {}),
    };
  }

  const protectedElement = isPublic ? (
    <ErrorBoundary>{element}</ErrorBoundary>
  ) : (
    validateRouteAccess(element)
  );

  return {
    ...route,
    ...(handle ? { handle } : {}),
    element: protectedElement,
  };
};

export default validateRouteAccess;
