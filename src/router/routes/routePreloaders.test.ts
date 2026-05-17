import { describe, expect, it } from 'vitest';

import { routePreloaders } from './routePreloaders';
import ROUTES_NAME from './routesName';

describe('routePreloaders', () => {
  it('registers accounting workspace routes for menu prefetching', () => {
    const accountingRoutes = Object.values(ROUTES_NAME.ACCOUNTING_TERM);

    accountingRoutes.forEach((route) => {
      expect(routePreloaders[route]).toEqual(expect.any(Function));
    });
  });
});
