import { beforeAll, describe, expect, it } from 'vitest';

import basicRoutes from './paths/Basic';
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

const developerHubRoute = basicRoutes.find(
  (route) => route.path === ROUTES_NAME.BASIC_TERM.DEVELOPER_HUB,
);
const switchBusinessRoute = settingRoutes.find(
  (route) => route.path === ROUTES_NAME.DEV_VIEW_TERM.SWITCH_BUSINESS,
);
const productStudioRoute = inventoryRoutes.find(
  (route) => route.path === ROUTES_NAME.INVENTORY_TERM.PRODUCT_STUDIO,
);
const changelogManageRoute = changelogRoutes.find(
  (route) => route.path === ROUTES_NAME.CHANGELOG_TERM.CHANGELOG_MANAGE,
);

const hostingVisibleDevRoutes = [
  ROUTES_NAME.DEV_VIEW_TERM.AI_BUSINESS_SEEDING,
  ROUTES_NAME.DEV_VIEW_TERM.B_SERIES_INVOICES,
  ROUTES_NAME.DEV_VIEW_TERM.BUSINESSES,
  ROUTES_NAME.DEV_VIEW_TERM.ELECTRONIC_TAX_RECEIPT_PROVIDER,
  ROUTES_NAME.DEV_VIEW_TERM.ERROR_REPORTS,
  ROUTES_NAME.DEV_VIEW_TERM.ERROR_SCREEN_PREVIEW,
  ROUTES_NAME.DEV_VIEW_TERM.FISCAL_RECEIPTS_AUDIT,
  ROUTES_NAME.DEV_VIEW_TERM.INVOICE_V2_RECOVERY,
  ROUTES_NAME.DEV_VIEW_TERM.SUBSCRIPTION_MAINTENANCE,
  ROUTES_NAME.DEV_VIEW_TERM.SUBSCRIPTION_MAINTENANCE_PLANS,
].sort();

const allowedDuplicateRoutePaths = new Set([
  '/account/subscription',
  '/settings/modules',
]);

const joinRoutePath = (parentPath: string, routePath?: string) => {
  if (!routePath) return parentPath;
  if (routePath.startsWith('/')) return routePath;
  if (!parentPath || parentPath === '/') return `/${routePath}`;
  return `${parentPath.replace(/\/$/, '')}/${routePath}`;
};

const isMountableMetadataRoute = (route: AppRoute) =>
  route.index !== true && route.path !== '*';

const collectMountableRoutes = (
  routes: AppRoute[],
  parentPath = '',
): Array<{ path: string; route: AppRoute }> =>
  routes.flatMap((route) => {
    const path = joinRoutePath(parentPath, route.path);
    const routeEntry = isMountableMetadataRoute(route) ? [{ path, route }] : [];
    return [
      ...routeEntry,
      ...collectMountableRoutes(route.children ?? [], path),
    ];
  });

const findDuplicateRoutePaths = (routes: AppRoute[]) => {
  const seenRoutes = new Map<string, number>();

  for (const { path } of collectMountableRoutes(routes)) {
    seenRoutes.set(path, (seenRoutes.get(path) ?? 0) + 1);
  }

  return Array.from(seenRoutes.entries())
    .filter(([, count]) => count > 1)
    .map(([path]) => path)
    .sort();
};

describe('routeVisibility', () => {
  beforeAll(() => {
    expect(developerHubRoute).toBeDefined();
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
      ...basicRoutes,
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
        status: ROUTE_STATUS.BETA,
      }),
    );
  });

  it('marks developer-owned routes outside Dev.tsx as beta dev routes', () => {
    expect(getRouteMeta(ROUTES_NAME.BASIC_TERM.DEVELOPER_HUB)).toEqual(
      expect.objectContaining({
        requiresDevAccess: true,
        status: ROUTE_STATUS.BETA,
      }),
    );
    expect(getRouteMeta(ROUTES_NAME.INVENTORY_TERM.PRODUCT_STUDIO)).toEqual(
      expect.objectContaining({
        requiresDevAccess: true,
        status: ROUTE_STATUS.BETA,
      }),
    );
    expect(getRouteMeta(ROUTES_NAME.CHANGELOG_TERM.CHANGELOG_MANAGE)).toEqual(
      expect.objectContaining({
        requiresDevAccess: true,
        status: ROUTE_STATUS.BETA,
      }),
    );
  });

  it('requires dev access metadata for every dev or lab route', () => {
    const devLabRoutesMissingAccess = collectMountableRoutes([
      ...devRoutes,
      ...labRoutes,
    ])
      .filter(({ route }) => route.requiresDevAccess !== true)
      .map(({ path }) => path)
      .sort();

    expect(devLabRoutesMissingAccess).toEqual([]);
  });

  it('requires explicit status metadata for every dev or lab route', () => {
    const devLabRoutesMissingStatus = collectMountableRoutes([
      ...devRoutes,
      ...labRoutes,
    ])
      .filter(({ route }) => route.status === undefined)
      .map(({ path }) => path)
      .sort();

    expect(devLabRoutesMissingStatus).toEqual([]);
  });

  it('keeps dev routes without devOnly explicitly allowlisted', () => {
    const devRoutesWithoutDevOnly = collectMountableRoutes(devRoutes)
      .filter(({ route }) => route.devOnly !== true)
      .map(({ path }) => path)
      .sort();

    expect(devRoutesWithoutDevOnly).toEqual(hostingVisibleDevRoutes);
  });

  it('keeps route paths unique across registered route groups', () => {
    const duplicateRoutePaths = findDuplicateRoutePaths([
      ...basicRoutes,
      ...devRoutes,
      ...inventoryRoutes,
      ...labRoutes,
      ...settingRoutes,
      ...changelogRoutes,
    ]);
    const unapprovedDuplicateRoutePaths = duplicateRoutePaths.filter(
      (path) => !allowedDuplicateRoutePaths.has(path),
    );
    const staleAllowedDuplicateRoutePaths = [
      ...allowedDuplicateRoutePaths,
    ].filter((path) => !duplicateRoutePaths.includes(path));

    expect({
      staleAllowedDuplicateRoutePaths,
      unapprovedDuplicateRoutePaths,
    }).toEqual({
      staleAllowedDuplicateRoutePaths: [],
      unapprovedDuplicateRoutePaths: [],
    });
  });
});
