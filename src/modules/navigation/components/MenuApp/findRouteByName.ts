import { routes } from '@/router/routes/routes';
import type { AppRoute } from '@/router/routes/routes';

const findRoute = (routesList: AppRoute[], name: string): AppRoute | null => {
  for (const route of routesList) {
    if (route.name === name) {
      return route;
    }
    if (route.children) {
      const foundRoute = findRoute(route.children, name);
      if (foundRoute) return foundRoute;
    }
  }
  return null;
};

const findRouteByName = (name: string): AppRoute | null => {
  return findRoute(routes, name);
};

export default findRouteByName;
