import { matchRoutes } from 'react-router';
import { ROUTE_STATUS } from './routeMeta';
import { getResolvedRouteMeta } from './routeHandle';

import type { AppRoute } from './routes';

interface MenuItemMeta {
  hideInMenu?: boolean;
}

// Índice path -> meta (se llena vía registerRoutes para evitar ciclos de import)
const routeIndex = new Map<string, AppRoute>();
let indexed = false;
let registeredRoutes: AppRoute[] = [];

const normalizePathname = (path: string): string => {
  if (!path) return path;
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
};

const indexRoutesRecursive = (list: AppRoute[]): void => {
  list.forEach((route) => {
    if (route.path) {
      routeIndex.set(route.path, route);
    }
    if (route.children?.length) {
      indexRoutesRecursive(route.children);
    }
  });
};

export const registerRoutes = (routesArray: AppRoute[]): void => {
  if (!indexed && Array.isArray(routesArray) && routesArray.length > 0) {
    registeredRoutes = routesArray;
    indexRoutesRecursive(routesArray);
    indexed = true;
  }
};

const resolveRegisteredRouteMatch = (pathname: string): AppRoute | undefined => {
  if (!registeredRoutes.length) return undefined;
  const matches = matchRoutes(registeredRoutes, normalizePathname(pathname));
  if (!matches?.length) return undefined;
  const lastMatch = matches[matches.length - 1];
  return lastMatch?.route as AppRoute | undefined;
};

/**
 * Devuelve true si un path debe ocultarse en los menús.
 * Reglas:
 *  - status === HIDDEN
 *  - status === DISABLED (no debería existir pero por seguridad)
 *  - meta hideInMenu: true (en definición del menú o la ruta)
 */
export const isHiddenInMenu = (
  path: string,
  menuItem?: MenuItemMeta,
): boolean => {
  const route = getResolvedRouteMeta(routeIndex.get(path));
  if (!route) return false; // Si no encontramos ruta no la ocultamos por defecto
  const status = route.status;
  if (status === ROUTE_STATUS.HIDDEN || status === ROUTE_STATUS.DISABLED)
    return true;
  return Boolean(route.hideInMenu || menuItem?.hideInMenu);
};

export const getRouteMeta = (path: string): AppRoute | undefined =>
  getResolvedRouteMeta(routeIndex.get(path)) ??
  getResolvedRouteMeta(resolveRegisteredRouteMatch(path));

export default isHiddenInMenu;
