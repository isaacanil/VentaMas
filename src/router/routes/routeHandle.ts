import type { RouteStatus } from './routeMeta';

import type { RouteRequiredCapabilitiesMode } from '@/utils/access/routeCapabilities';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export interface AppRouteMetaFields {
  title?: string;
  metaDescription?: string;
  hideInMenu?: boolean;
  status?: RouteStatus;
  requiresDevAccess?: boolean;
  requiresManageAllAccess?: boolean;
  requiredCapabilities?: string[];
  requiredCapabilitiesMode?: RouteRequiredCapabilitiesMode;
}

export interface AppRouteHandle {
  routeMeta?: AppRouteMetaFields;
  // `handle` en React Router suele extenderse con metadata propia por feature
  // (breadcrumbs, analytics, flags UI, etc.), por eso aquí sí mantenemos apertura.
  [key: string]: unknown;
}

type RouteMetaCarrier = Partial<AppRouteMetaFields> & {
  handle?: unknown;
};

const pickDefinedRouteMeta = (route: RouteMetaCarrier): AppRouteMetaFields => {
  const next: AppRouteMetaFields = {};

  if (typeof route.title === 'string') next.title = route.title;
  if (typeof route.metaDescription === 'string') {
    next.metaDescription = route.metaDescription;
  }
  if (typeof route.hideInMenu === 'boolean') next.hideInMenu = route.hideInMenu;
  if (typeof route.status === 'string') next.status = route.status;
  if (typeof route.requiresDevAccess === 'boolean') {
    next.requiresDevAccess = route.requiresDevAccess;
  }
  if (typeof route.requiresManageAllAccess === 'boolean') {
    next.requiresManageAllAccess = route.requiresManageAllAccess;
  }
  if (Array.isArray(route.requiredCapabilities)) {
    next.requiredCapabilities = route.requiredCapabilities;
  }
  if (
    route.requiredCapabilitiesMode === 'all' ||
    route.requiredCapabilitiesMode === 'any'
  ) {
    next.requiredCapabilitiesMode = route.requiredCapabilitiesMode;
  }

  return next;
};

export const getRouteMetaFromHandle = (
  handle: unknown,
): AppRouteMetaFields | null => {
  if (!isRecord(handle)) return null;
  const routeMeta = handle.routeMeta;
  if (!isRecord(routeMeta)) return null;
  return routeMeta as AppRouteMetaFields;
};

export const mergeRouteHandleMeta = (route: RouteMetaCarrier): AppRouteHandle | undefined => {
  const existingHandle = isRecord(route.handle)
    ? ({ ...route.handle } as AppRouteHandle)
    : undefined;
  const existingRouteMeta = getRouteMetaFromHandle(existingHandle) ?? undefined;
  const flatRouteMeta = pickDefinedRouteMeta(route);
  const mergedRouteMeta = {
    ...(existingRouteMeta || {}),
    ...flatRouteMeta,
  };

  const hasMergedRouteMeta = Object.keys(mergedRouteMeta).length > 0;
  if (!existingHandle && !hasMergedRouteMeta) {
    return undefined;
  }

  if (!hasMergedRouteMeta) {
    return existingHandle;
  }

  return {
    ...(existingHandle || {}),
    routeMeta: mergedRouteMeta,
  };
};

export const getResolvedRouteMeta = <TRoute extends RouteMetaCarrier>(
  route: TRoute | null | undefined,
): TRoute | undefined => {
  if (!route) return undefined;
  const handleMeta = getRouteMetaFromHandle(route.handle);
  if (!handleMeta) return route;

  return {
    ...route,
    ...handleMeta,
  };
};
