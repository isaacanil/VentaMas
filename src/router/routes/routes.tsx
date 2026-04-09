import accountReceivable from '@/router/routes/paths/AccountReceivable';
import accountsPayable from '@/router/routes/paths/AccountsPayable';
import accounting from '@/router/routes/paths/Accounting';
import auth from '@/router/routes/paths/Auth';
import authorizations from '@/router/routes/paths/Authorizations';
import basic from '@/router/routes/paths/Basic';
import cashReconciliation from '@/router/routes/paths/CashReconciliztion';
import changelogs from '@/router/routes/paths/Changelogs';
import contacts from '@/router/routes/paths/Contact';
import creditNote from '@/router/routes/paths/CreditNote';
import dev from '@/router/routes/paths/Dev'; // Contiene rutas sólo para desarrollo (marcadas con devOnly)
import expenses from '@/router/routes/paths/Expenses';
import insurance from '@/router/routes/paths/Insurance';
import inventory from '@/router/routes/paths/Inventory';
import lab from '@/router/routes/paths/Lab';
import orders from '@/router/routes/paths/Orders';
import purchases from '@/router/routes/paths/Purchases';
import sales from '@/router/routes/paths/Sales';
import settings from '@/router/routes/paths/Setting';
import utility from '@/router/routes/paths/Utility';
import { processRoute } from '@/router/routes/requiereAuthProvider';
import type { AppRouteHandle } from '@/router/routes/routeHandle';
import { ROUTE_STATUS } from '@/router/routes/routeMeta';
import { registerRoutes as registerRoutesIndex } from '@/router/routes/routeVisibility';
import { NotFound } from '@/modules/app/pages/NotFound/NotFound';

import type { RouteStatus } from '@/router/routes/routeMeta';
import type { RouteRequiredCapabilitiesMode } from '@/utils/access/routeCapabilities';
import type { RouteObject } from 'react-router';

type AppRouteCustomFields = {
  children?: AppRoute[];
  title?: string;
  metaDescription?: string;
  isPublic?: boolean;
  hideInProd?: boolean;
  devOnly?: boolean;
  hideInMenu?: boolean;
  status?: RouteStatus;
  onlyEnvs?: string[];
  enabledEnvs?: string[];
  requiresDevAccess?: boolean;
  requiresManageAllAccess?: boolean;
  requiredCapabilities?: string[];
  requiredCapabilitiesMode?: RouteRequiredCapabilitiesMode;
  handle?: AppRouteHandle;
  name?: string;
};

export type AppRoute = Omit<RouteObject, 'children' | 'handle'> &
  AppRouteCustomFields & {
    children?: AppRoute[];
    handle?: AppRouteHandle;
  };

const registerRoutes = registerRoutesIndex as (routes: AppRoute[]) => void;

const ROUTE_ID_NAMESPACE = 'routes';

const sanitizeRouteIdSegment = (value: string): string => {
  const normalized = value
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\*/g, 'splat')
    .replace(/:([a-zA-Z0-9_]+)/g, '$1')
    .replace(/[^a-zA-Z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || 'root';
};

const resolveRouteIdSegment = (route: AppRoute, routeIndex: number): string => {
  if (route.index) return `index_${routeIndex + 1}`;
  if (typeof route.path === 'string' && route.path.length > 0) {
    return sanitizeRouteIdSegment(route.path);
  }
  return `route_${routeIndex + 1}`;
};

const ensureRouteId = (
  route: AppRoute,
  parentRouteId: string,
  routeIndex: number,
  usedRouteIds: Set<string>,
): AppRoute => {
  if (typeof route.id === 'string' && route.id.trim().length > 0) {
    const explicitId = route.id.trim();
    if (!usedRouteIds.has(explicitId)) {
      usedRouteIds.add(explicitId);
      return route.id === explicitId ? route : { ...route, id: explicitId };
    }

    let collisionIndex = routeIndex + 1;
    let nextId = `${explicitId}_${collisionIndex}`;
    while (usedRouteIds.has(nextId)) {
      collisionIndex += 1;
      nextId = `${explicitId}_${collisionIndex}`;
    }
    usedRouteIds.add(nextId);
    return {
      ...route,
      id: nextId,
    };
  }

  const baseId = `${parentRouteId}.${resolveRouteIdSegment(route, routeIndex)}`;
  let nextId = baseId;
  if (usedRouteIds.has(nextId)) {
    let collisionIndex = routeIndex + 1;
    nextId = `${baseId}_${collisionIndex}`;
    while (usedRouteIds.has(nextId)) {
      collisionIndex += 1;
      nextId = `${baseId}_${collisionIndex}`;
    }
  }
  usedRouteIds.add(nextId);

  return {
    ...route,
    id: nextId,
  };
};

// Procesa recursivamente las rutas y sus hijos para aplicar la protección
const processRoutes = (
  routes: AppRoute[],
  parentRouteId = ROUTE_ID_NAMESPACE,
  usedRouteIds = new Set<string>(),
): AppRoute[] => {
  return routes.map((route, routeIndex) => {
    const routeWithId = ensureRouteId(
      route,
      parentRouteId,
      routeIndex,
      usedRouteIds,
    );
    // Procesa la ruta actual
    const processedRoute = processRoute(routeWithId);

    // Si tiene hijos, procesa cada uno de ellos
    if (processedRoute.children && processedRoute.children.length > 0) {
      const nextParentRouteId =
        typeof processedRoute.id === 'string' && processedRoute.id.length > 0
          ? processedRoute.id
          : parentRouteId;
      return {
        ...processedRoute,
        children: processRoutes(
          processedRoute.children,
          nextParentRouteId,
          usedRouteIds,
        ),
      };
    }

    return processedRoute;
  });
};

/**
 * Determina si una ruta (y sus hijos) deben incluirse según flags/env.
 * Reglas actuales:
 *  - route.devOnly === true se incluye sólo si:
 *       - import.meta.env.DEV es true, o
 *       - VITE_ENABLE_DEV_ROUTES === 'true' (permite habilitar en staging)
 *  - route.hideInProd === true se excluye únicamente cuando MODE === 'production'
 *  - route.onlyEnvs = ['development','staging'] alternativa a enabledEnvs
 *  - route.enabledEnvs (legacy) sigue funcionando
 */
const shouldIncludeRoute = (route: AppRoute): boolean => {
  const isDevBuild = import.meta.env.DEV;
  const forceEnableDev = import.meta.env.VITE_ENABLE_DEV_ROUTES === 'true';

  const status = route.status || ROUTE_STATUS.STABLE;

  // Excluir totalmente disabled
  if (status === ROUTE_STATUS.DISABLED) return false;

  const currentEnv = import.meta.env.MODE;

  // Soporte para onlyEnvs (nuevo) y enabledEnvs (anterior)
  const envList = route.onlyEnvs || route.enabledEnvs;
  if (envList && Array.isArray(envList) && envList.length > 0) {
    if (!envList.includes(currentEnv)) return false;
  }

  // Ocultar en producción si se pide explícitamente
  if (route.hideInProd && currentEnv === 'production') return false;

  // Rutas marcadas devOnly siguen la lógica anterior
  if (route.devOnly && !(isDevBuild || forceEnableDev)) return false;

  // Actualmente BETA / WIP no afectan visibilidad por sí solos; se mantienen sólo como metadatos.

  return true;
};

/**
 * Filtra recursivamente rutas según shouldIncludeRoute.
 */
const filterRoutes = (routes: AppRoute[]): AppRoute[] => {
  return routes.filter(shouldIncludeRoute).map((r) => {
    if (r.children) {
      const children = filterRoutes(r.children);
      return { ...r, children };
    }
    return r;
  });
};

// Lista de rutas sin procesar antes del filtrado por entorno
const baseRawRoutes = [
  ...(basic as AppRoute[]),
  ...(auth as AppRoute[]),
  ...(inventory as AppRoute[]),
  ...(contacts as AppRoute[]),
  ...(settings as AppRoute[]),
  ...(sales as AppRoute[]),
  ...(orders as AppRoute[]),
  ...(purchases as AppRoute[]),
  ...(lab as AppRoute[]),
  ...(cashReconciliation as AppRoute[]),
  ...(expenses as AppRoute[]),
  ...accounting,
  ...(dev as AppRoute[]), // devOnly marcadas dentro del archivo
  ...(changelogs as AppRoute[]),
  ...(utility as AppRoute[]),
  ...accountsPayable,
  ...accountReceivable,
  ...(insurance as AppRoute[]),
  ...(creditNote as AppRoute[]),
  ...(authorizations as AppRoute[]),
  {
    path: '*',
    element: <NotFound />,
    title: 'Página no encontrada',
    metaDescription: 'Lo sentimos, la página que estás buscando no existe.',
    isPublic: true, // NotFound debería ser accesible públicamente
  },
] satisfies AppRoute[];

// Aplica filtrado dinámico
const rawRoutes = filterRoutes(baseRawRoutes);

// Exporta las rutas procesadas
export const routes = processRoutes(rawRoutes);
// Registrar para visibilidad en menús (evita ciclo: se hace después de construirlas)
registerRoutes(routes);
