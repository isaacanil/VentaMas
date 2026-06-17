import { beforeAll, describe, expect, it } from 'vitest';

import changelogRoutes from './paths/Changelogs';
import devRoutes from './paths/Dev';
import inventoryRoutes from './paths/Inventory';
import labRoutes from './paths/Lab';
import settingRoutes from './paths/Setting';
import { ROUTE_STATUS } from './routeMeta';
import {
  getRouteMeta,
  isHiddenInMenu,
  registerRoutes,
} from './routeVisibility';
import ROUTES_NAME from './routesName';

import type { AppRoute } from '@/router/types/routeTypes';

const switchBusinessRoute = settingRoutes.find(
  (route) => route.path === ROUTES_NAME.DEV_VIEW_TERM.SWITCH_BUSINESS,
);
const productStudioRoute = inventoryRoutes.find(
  (route) => route.path === ROUTES_NAME.INVENTORY_TERM.PRODUCT_STUDIO,
);
const changelogManageRoute = changelogRoutes.find(
  (route) => route.path === ROUTES_NAME.CHANGELOG_TERM.CHANGELOG_MANAGE,
);

const joinRoutePath = (parentPath: string, routePath?: string) => {
  if (!routePath) return parentPath;
  if (routePath.startsWith('/')) return routePath;
  if (!parentPath || parentPath === '/') return `/${routePath}`;
  return `${parentPath.replace(/\/$/, '')}/${routePath}`;
};

const collectDevOnlyRoutes = (
  routes: AppRoute[],
  parentPath = '',
): Array<{ path: string; route: AppRoute }> =>
  routes.flatMap((route) => {
    const path = joinRoutePath(parentPath, route.path);
    const routeEntry = route.devOnly ? [{ path, route }] : [];
    return [
      ...routeEntry,
      ...collectDevOnlyRoutes(route.children ?? [], path),
    ];
  });

describe('routeVisibility', () => {
  beforeAll(() => {
    expect(switchBusinessRoute).toBeDefined();
    expect(productStudioRoute).toBeDefined();
    expect(changelogManageRoute).toBeDefined();

    registerRoutes([
      { path: '/hidden', status: ROUTE_STATUS.HIDDEN },
      { path: '/disabled', status: ROUTE_STATUS.DISABLED },
      { path: '/visible', status: ROUTE_STATUS.STABLE },
      { path: '/ventas', status: ROUTE_STATUS.STABLE },
      {
        path: '/inventario/:productId',
        handle: {
          routeMeta: {
            title: 'Detalle del producto',
            hideInMenu: true,
            status: ROUTE_STATUS.STABLE,
          },
        },
      },
      switchBusinessRoute,
      productStudioRoute,
      changelogManageRoute,
      ...devRoutes,
      ...inventoryRoutes,
      ...labRoutes,
      ...settingRoutes,
      ...changelogRoutes,
    ] as never);
  });

  it('hides routes marked as hidden or disabled', () => {
    expect(isHiddenInMenu('/hidden')).toBe(true);
    expect(isHiddenInMenu('/disabled')).toBe(true);
    expect(isHiddenInMenu('/visible')).toBe(false);
  });

  it('respects explicit menu overrides for otherwise visible routes', () => {
    expect(isHiddenInMenu('/ventas', { hideInMenu: true })).toBe(true);
  });

  it('resolves route metadata from matched registered routes', () => {
    const routeMeta = getRouteMeta('/inventario/prod-1');

    expect(routeMeta).toEqual(
      expect.objectContaining({
        title: 'Detalle del producto',
        hideInMenu: true,
        status: ROUTE_STATUS.STABLE,
      }),
    );
  });

  it('marks switch business as requiring dev access', () => {
    expect(getRouteMeta(ROUTES_NAME.DEV_VIEW_TERM.SWITCH_BUSINESS)).toEqual(
      expect.objectContaining({
        requiresDevAccess: true,
      }),
    );
  });

  it('marks developer-owned utility routes as requiring dev access', () => {
    expect(getRouteMeta(ROUTES_NAME.INVENTORY_TERM.PRODUCT_STUDIO)).toEqual(
      expect.objectContaining({
        requiresDevAccess: true,
      }),
    );
    expect(getRouteMeta(ROUTES_NAME.CHANGELOG_TERM.CHANGELOG_MANAGE)).toEqual(
      expect.objectContaining({
        requiresDevAccess: true,
      }),
    );
  });

  it('requires dev access metadata for every dev-only route', () => {
    const devOnlyRoutesMissingAccess = collectDevOnlyRoutes([
      ...devRoutes,
      ...labRoutes,
    ])
      .filter(({ route }) => route.requiresDevAccess !== true)
      .map(({ path }) => path)
      .sort();

    expect(devOnlyRoutesMissingAccess).toEqual([]);
  });
});
