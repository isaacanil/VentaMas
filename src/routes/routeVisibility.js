import { ROUTE_STATUS } from './routeMeta';

// Índice path -> meta (se llena vía registerRoutes para evitar ciclos de import)
const routeIndex = new Map();
let indexed = false;

const indexRoutesRecursive = (list) => {
  list.forEach(r => {
    if (r.path) routeIndex.set(r.path, r);
    if (r.children) indexRoutesRecursive(r.children);
  });
};

export const registerRoutes = (routesArray) => {
  if (!indexed && Array.isArray(routesArray)) {
    indexRoutesRecursive(routesArray);
    indexed = true;
  }
};

/**
 * Devuelve true si un path debe ocultarse en los menús.
 * Reglas:
 *  - status === HIDDEN
 *  - status === DISABLED (no debería existir pero por seguridad)
 *  - meta hideInMenu: true (en definición del menú o la ruta)
 */
export const isHiddenInMenu = (path, menuItem) => {
  const route = routeIndex.get(path);
  if (!route) return false; // Si no encontramos ruta no la ocultamos por defecto
  const status = route.status;
  if (status === ROUTE_STATUS.HIDDEN || status === ROUTE_STATUS.DISABLED) return true;
  return route.hideInMenu || menuItem?.hideInMenu || false;
};

export const getRouteMeta = (path) => routeIndex.get(path);

export default isHiddenInMenu;