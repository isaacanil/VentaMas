import { RequireAuth } from '../views/component/RequireAuth';
import { ErrorBoundary } from '../views/pages/ErrorElement/ErrorBoundary';

import type { ReactElement } from 'react';

interface GuardedRoute {
  element: ReactElement;
  isPublic?: boolean;
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

  const protectedElement = isPublic ? (
    <ErrorBoundary>{element}</ErrorBoundary>
  ) : (
    validateRouteAccess(element)
  );

  return {
    ...route,
    element: protectedElement,
  };
};

export default validateRouteAccess;
