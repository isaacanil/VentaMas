import { jsx as _jsx } from "react/jsx-runtime";

import { RequireAuth } from '../views/component/RequireAuth';
import { ErrorBoundary } from '../views/pages/ErrorElement/ErrorBoundary';
/**
 * Envuelve un componente en RequireAuth para protección de rutas
 * @param {JSX.Element} children - El componente a proteger
 * @returns {JSX.Element} Componente protegido
 */
const validateRouteAccess = (children) => {
    return (_jsx(ErrorBoundary, { children: _jsx(RequireAuth, { children: children }) }));
};
/**
 * Procesa un objeto de ruta para determinar si debe ser protegido o público
 * @param {Object} route - Objeto de ruta
 * @returns {Object} Ruta procesada con elemento protegido/público según corresponda
 */
export const processRoute = (route) => {
    const { element, isPublic = false } = route;
    const protectedElement = isPublic
        ? _jsx(ErrorBoundary, { children: element })
        : validateRouteAccess(element);
    return {
        ...route,
        element: protectedElement,
    };
};
export default validateRouteAccess;
