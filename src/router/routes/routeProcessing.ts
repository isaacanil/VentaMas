import { processRoute } from '@/router/routes/requiereAuthProvider';
import type { AppRoute } from '@/router/types/routeTypes';

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

export const processRoutes = (
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
    const processedRoute = processRoute(routeWithId);

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
