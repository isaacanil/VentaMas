import React from 'react'

import { RequireAuth } from '../views/component/RequireAuth';
import { ErrorBoundary } from '../views/pages/ErrorElement/ErrorBoundary'

/**
 * Envuelve un componente en RequireAuth para protección de rutas
 * @param {JSX.Element} children - El componente a proteger
 * @returns {JSX.Element} Componente protegido
 */
const validateRouteAccess = (children) => {
  return (
    <ErrorBoundary>
      <RequireAuth>
        {children}
      </RequireAuth>
    </ErrorBoundary>
  )
}

/**
 * Procesa un objeto de ruta para determinar si debe ser protegido o público
 * @param {Object} route - Objeto de ruta
 * @returns {Object} Ruta procesada con elemento protegido/público según corresponda
 */
export const processRoute = (route) => {
  const { element, isPublic = false, ...restProps } = route;
  
  // Si la ruta es pública, devuelve el elemento sin RequireAuth
  if (isPublic) {
    return {
      ...restProps,
      element: <ErrorBoundary>{element}</ErrorBoundary>
    };
  }
  
  // Si no, envuelve el elemento con RequireAuth
  return {
    ...restProps,
    element: validateRouteAccess(element)
  };
}

export default validateRouteAccess
