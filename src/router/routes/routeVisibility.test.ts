import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROUTE_STATUS } from './routeMeta';

describe('routeVisibility', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('hides routes marked as hidden or disabled', async () => {
    const { isHiddenInMenu, registerRoutes } = await import('./routeVisibility');

    registerRoutes([
      { path: '/hidden', status: ROUTE_STATUS.HIDDEN },
      { path: '/disabled', status: ROUTE_STATUS.DISABLED },
      { path: '/visible', status: ROUTE_STATUS.STABLE },
    ] as never);

    expect(isHiddenInMenu('/hidden')).toBe(true);
    expect(isHiddenInMenu('/disabled')).toBe(true);
    expect(isHiddenInMenu('/visible')).toBe(false);
  });

  it('respects explicit menu overrides for otherwise visible routes', async () => {
    const { isHiddenInMenu, registerRoutes } = await import('./routeVisibility');

    registerRoutes([
      { path: '/ventas', status: ROUTE_STATUS.STABLE },
    ] as never);

    expect(isHiddenInMenu('/ventas', { hideInMenu: true })).toBe(true);
  });

  it('resolves route metadata from matched registered routes', async () => {
    const { getRouteMeta, registerRoutes } = await import('./routeVisibility');

    registerRoutes([
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
    ] as never);

    const routeMeta = getRouteMeta('/inventario/prod-1');

    expect(routeMeta).toEqual(
      expect.objectContaining({
        title: 'Detalle del producto',
        hideInMenu: true,
        status: ROUTE_STATUS.STABLE,
      }),
    );
  });
});
