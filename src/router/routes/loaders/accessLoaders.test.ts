import { beforeEach, describe, expect, it, vi } from 'vitest';

import { protectedRouteLoader } from './accessLoaders';
import devRoutes from '../paths/Dev';
import { registerRoutes } from '../routeVisibility';
import ROUTES_NAME from '../routesName';

let mockState: {
  user: {
    authReady: boolean;
    user: Record<string, unknown> | null;
  };
};

vi.mock('@/app/store', () => ({
  store: {
    getState: () => mockState,
    dispatch: vi.fn(),
  },
}));

const createLoaderArgs = (pathname: string) =>
  ({
    request: new Request(`https://ventamas.test${pathname}`),
    params: {},
    context: {},
  }) as never;

describe('protectedRouteLoader', () => {
  beforeEach(() => {
    registerRoutes(devRoutes);
    mockState = {
      user: {
        authReady: true,
        user: {
          id: 'user-1',
          role: 'cashier',
          businessID: 'business-1',
          businessId: 'business-1',
          activeBusinessId: 'business-1',
          activeRole: 'cashier',
        },
      },
    };
  });

  it('redirects non-dev users away from routes requiring developer access', () => {
    const result = protectedRouteLoader(
      createLoaderArgs(ROUTES_NAME.DEV_VIEW_TERM.PRICE_LIST_AUDIT),
    );

    expect(result).toEqual(
      expect.objectContaining({
        status: 302,
      }),
    );
    expect((result as Response).headers.get('Location')).toBe(
      ROUTES_NAME.BASIC_TERM.HOME,
    );
  });

  it('redirects non-dev users away from subscription maintenance plans', () => {
    const result = protectedRouteLoader(
      createLoaderArgs(
        ROUTES_NAME.DEV_VIEW_TERM.SUBSCRIPTION_MAINTENANCE_PLANS,
      ),
    );

    expect(result).toEqual(
      expect.objectContaining({
        status: 302,
      }),
    );
    expect((result as Response).headers.get('Location')).toBe(
      ROUTES_NAME.BASIC_TERM.HOME,
    );
  });

  it('allows developer users through routes requiring developer access', () => {
    mockState.user.user = {
      ...mockState.user.user,
      platformRoles: { dev: true },
      role: 'dev',
      activeRole: 'dev',
    };

    const result = protectedRouteLoader(
      createLoaderArgs(ROUTES_NAME.DEV_VIEW_TERM.PRICE_LIST_AUDIT),
    );

    expect(result).toBeNull();
  });
});
