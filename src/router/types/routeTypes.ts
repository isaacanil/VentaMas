import type { RouteObject } from 'react-router';

import type { AppRouteHandle } from '@/router/routes/routeHandle';
import type { RouteStatus } from '@/router/routes/routeMeta';
import type { RouteRequiredCapabilitiesMode } from '@/utils/access/routeCapabilities';

export type AppRouteCustomFields = {
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
