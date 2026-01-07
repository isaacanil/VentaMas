// @ts-nocheck
import { routes } from '@/router/routes/routes';

function findRouteByName(name) {
  function findRoute(routes) {
    for (const route of routes) {
      if (route.name === name) {
        return route;
      } else if (route.children) {
        const foundRoute = findRoute(route.children);
        if (foundRoute) return foundRoute;
      }
    }
    return null;
  }
  return findRoute(routes);
}

export default findRouteByName;
