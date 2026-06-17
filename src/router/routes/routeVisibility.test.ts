import { beforeAll, describe, expect, it } from 'vitest';

import settingRoutes from './paths/Setting';
import { ROUTE_STATUS } from './routeMeta';
import {
  getRouteMeta,
  isHiddenInMenu,
  registerRoutes,
} from './routeVisibility';
import ROUTES_NAME from './routesName';

const switchBusinessRoute = settingRoutes.find(
  (route) => route.path === ROUTES_NAME.DEV_VIEW_TERM.SWITCH_BUSINESS,
);

describe('routeVisibility', () => {
  beforeAll(() => {
    expect(switchBusinessRoute).toBeDefined();

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
});
