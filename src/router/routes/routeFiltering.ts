import { ROUTE_STATUS } from '@/router/routes/routeMeta';
import type { AppRoute } from '@/router/types/routeTypes';

const shouldIncludeRoute = (route: AppRoute): boolean => {
  const isDevBuild = import.meta.env.DEV;
  const forceEnableDev = import.meta.env.VITE_ENABLE_DEV_ROUTES === 'true';
  const status = route.status || ROUTE_STATUS.STABLE;

  if (status === ROUTE_STATUS.DISABLED) return false;

  const currentEnv = import.meta.env.MODE;
  const envList = route.onlyEnvs || route.enabledEnvs;

  if (envList && Array.isArray(envList) && envList.length > 0) {
    if (!envList.includes(currentEnv)) return false;
  }

  if (route.hideInProd && currentEnv === 'production') return false;
  if (route.devOnly && !(isDevBuild || forceEnableDev)) return false;

  return true;
};

export const filterRoutes = (routes: AppRoute[]): AppRoute[] => {
  return routes.filter(shouldIncludeRoute).map((route) => {
    if (route.children) {
      return {
        ...route,
        children: filterRoutes(route.children),
      };
    }

    return route;
  });
};
