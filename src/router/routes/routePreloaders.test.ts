import { renderHook } from '@testing-library/react';
import { matchRoutes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  developerShortcuts,
  loadInventoryMigrationToolRoute,
  loadProductFormV2TestBenchRoute,
  loadSyncDiagnosticsRoute,
} from '@/modules/dev/public';
import {
  loadInventoryItemsRoute,
  loadInventoryMovementsRoute,
  loadInventorySessionsListRoute,
  loadInventorySummaryRoute,
  loadWarehouseRoute,
} from '@/modules/inventory/public';
import { loadCashReconciliationListRoute } from '@/modules/cashReconciliation/public';
import {
  loadHrCommissionPeriodsRoute,
  loadHrCommissionsRoute,
  loadHrPayrollWorkspaceRoute,
} from '@/modules/hrPayroll/public';
import { useMenuData } from '@/modules/navigation/public';
import {
  loadBackOrdersRoute,
  loadOrdersRoute,
  loadPurchasesRoute,
} from '@/modules/orderAndPurchase/public';
import type { MenuItem } from '@/types/menu';
import { routePreloaders } from './routePreloaders';
import { routes } from './routes';
import ROUTES_NAME from './routesName';

const { useBusinessFeatureEnabledMock, useFilterMenuItemsByAccessMock } =
  vi.hoisted(() => ({
    useBusinessFeatureEnabledMock: vi.fn(),
    useFilterMenuItemsByAccessMock: vi.fn(),
  }));

vi.mock('@/hooks/useBusinessFeatureEnabled', () => ({
  useBusinessFeatureEnabled: (...args: unknown[]) =>
    useBusinessFeatureEnabledMock(...args),
}));

vi.mock('@/modules/navigation/utils/menuAccess', () => ({
  useFilterMenuItemsByAccess: (...args: unknown[]) =>
    useFilterMenuItemsByAccessMock(...args),
}));

type MenuRoute = {
  route: string;
  titlePath: string;
};

// Legacy/external menu routes without preloaders must be listed here with a reason.
const MENU_ROUTE_PRELOADER_EXCEPTIONS: Record<string, string> = {};

// Non-mounted route preloaders must be listed here with a reason.
const ROUTE_PRELOADER_MOUNT_EXCEPTIONS: Record<string, string> = {};

const getMenuItemTitle = (item: MenuItem): string => {
  if (typeof item.title === 'string' && item.title.trim()) {
    return item.title;
  }

  if (typeof item.label === 'string' && item.label.trim()) {
    return item.label;
  }

  return item.route ?? item.key ?? 'untitled menu item';
};

const collectMenuRoutes = (
  items: MenuItem[],
  parentTitles: string[] = [],
): MenuRoute[] =>
  items.flatMap((item) => {
    const titlePath = [...parentTitles, getMenuItemTitle(item)];
    const currentRoute = item.route
      ? [
          {
            route: item.route,
            titlePath: titlePath.join(' > '),
          },
        ]
      : [];
    const submenuRoutes = Array.isArray(item.submenu)
      ? collectMenuRoutes(item.submenu, titlePath)
      : [];

    return [...currentRoute, ...submenuRoutes];
  });

const getRoutePathname = (route: string): string =>
  route.split(/[?#]/)[0].replace(/\/+$/, '') || '/';

const isMountedRoute = (route: string): boolean =>
  Boolean(
    matchRoutes(
      routes as Parameters<typeof matchRoutes>[0],
      getRoutePathname(route),
    )?.some((match) => match.route.path !== '*'),
  );

describe('routePreloaders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBusinessFeatureEnabledMock.mockReturnValue(true);
    useFilterMenuItemsByAccessMock.mockImplementation(
      (items: MenuItem[]) => items,
    );
  });

  it('registers accounting workspace routes for menu prefetching', () => {
    const accountingRoutes = Object.values(ROUTES_NAME.ACCOUNTING_TERM);

    accountingRoutes.forEach((route) => {
      expect(routePreloaders[route]).toEqual(expect.any(Function));
    });
  });

  it('registers HR payroll routes for menu prefetching', () => {
    const hrPreloaders = {
      [ROUTES_NAME.HR_PAYROLL_TERM.HR_PAYROLL]: loadHrPayrollWorkspaceRoute,
      [ROUTES_NAME.HR_PAYROLL_TERM.HR_EMPLOYEES]: loadHrPayrollWorkspaceRoute,
      [ROUTES_NAME.HR_PAYROLL_TERM.HR_COMMISSIONS]: loadHrCommissionsRoute,
      [ROUTES_NAME.HR_PAYROLL_TERM.HR_COMMISSION_PERIODS]:
        loadHrCommissionPeriodsRoute,
      [ROUTES_NAME.HR_PAYROLL_TERM.HR_COMMISSION_PERIOD_DETAIL]:
        loadHrCommissionPeriodsRoute,
    };

    expect(routePreloaders).toMatchObject(hrPreloaders);
  });

  it('registers Inventory menu routes through public route loaders', () => {
    const inventoryPreloaders = {
      [ROUTES_NAME.INVENTORY_TERM.INVENTORY_ITEMS]: loadInventoryItemsRoute,
      [ROUTES_NAME.INVENTORY_TERM.INVENTORY_CONTROL]:
        loadInventorySessionsListRoute,
      [ROUTES_NAME.INVENTORY_TERM.INVENTORY_SUMMARY]: loadInventorySummaryRoute,
      [ROUTES_NAME.INVENTORY_TERM.WAREHOUSES]: loadWarehouseRoute,
      [ROUTES_NAME.INVENTORY_TERM.INVENTORY_MOVEMENTS]:
        loadInventoryMovementsRoute,
    };

    expect(routePreloaders).toMatchObject(inventoryPreloaders);
  });

  it('registers order and purchase routes through public route loaders', () => {
    const orderAndPurchasePreloaders = {
      [ROUTES_NAME.PURCHASE_TERM.PURCHASES]: loadPurchasesRoute,
      [ROUTES_NAME.ORDER_TERM.ORDERS]: loadOrdersRoute,
      [ROUTES_NAME.PURCHASE_TERM.BACKORDERS]: loadBackOrdersRoute,
    };

    expect(routePreloaders).toMatchObject(orderAndPurchasePreloaders);
  });

  it('registers accounts payable route for menu prefetching', () => {
    expect(
      routePreloaders[ROUTES_NAME.ACCOUNT_PAYABLE.ACCOUNT_PAYABLE_LIST],
    ).toEqual(expect.any(Function));
  });

  it('registers Cash Reconciliation through its public route loader', () => {
    expect(
      routePreloaders[
        ROUTES_NAME.CASH_RECONCILIATION_TERM.CASH_RECONCILIATION_LIST
      ],
    ).toBe(loadCashReconciliationListRoute);
  });

  it('registers visible accounting settings routes for menu prefetching', () => {
    const accountingSettingsRoutes = [
      ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS,
      ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES,
      ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_EXCHANGE_RATES,
    ];

    accountingSettingsRoutes.forEach((route) => {
      expect(routePreloaders[route]).toEqual(expect.any(Function));
    });
  });

  it('registers accounting pilot audit route for developer prefetching', () => {
    expect(
      routePreloaders[ROUTES_NAME.DEV_VIEW_TERM.ACCOUNTING_PILOT_AUDIT],
    ).toEqual(expect.any(Function));
  });

  it('registers mounted hidden dev routes through public route loaders', () => {
    const hiddenMountedDevPreloaders = {
      [ROUTES_NAME.DEV_VIEW_TERM.INVENTORY_MIGRATION]:
        loadInventoryMigrationToolRoute,
      [ROUTES_NAME.DEV_VIEW_TERM.SYNC_DIAGNOSTICS]: loadSyncDiagnosticsRoute,
      [ROUTES_NAME.DEV_VIEW_TERM.PRODUCT_FORM_V2_TEST]:
        loadProductFormV2TestBenchRoute,
    };

    expect(routePreloaders).toMatchObject(hiddenMountedDevPreloaders);
  });

  it('registers every developer shortcut route for prefetching', () => {
    const routesWithoutPreloaders = developerShortcuts
      .filter(({ route }) => !routePreloaders[route])
      .map(({ title, route }) => `${title} (${route})`);

    expect(routesWithoutPreloaders).toEqual([]);
  });

  it('registers only active subscription maintenance routes for developer prefetching', () => {
    const activeSubscriptionMaintenanceRoutes = [
      ROUTES_NAME.DEV_VIEW_TERM.SUBSCRIPTION_MAINTENANCE,
      ROUTES_NAME.DEV_VIEW_TERM.SUBSCRIPTION_MAINTENANCE_PLANS,
    ];

    activeSubscriptionMaintenanceRoutes.forEach((route) => {
      expect(routePreloaders[route]).toEqual(expect.any(Function));
    });

    expect(Object.keys(routePreloaders)).not.toEqual(
      expect.arrayContaining([
        '/dev/tools/subscription-maintenance/resumen',
        '/dev/tools/subscription-maintenance/simulaciones',
        '/dev/tools/subscription-maintenance/herramientas',
      ]),
    );
  });

  it('registers every visible menu route for menu prefetching', () => {
    const { result } = renderHook(() => useMenuData());
    const menuRoutes = collectMenuRoutes(result.current);
    const routesWithoutPreloaders = menuRoutes
      .filter(
        ({ route }) =>
          !routePreloaders[route] && !MENU_ROUTE_PRELOADER_EXCEPTIONS[route],
      )
      .map(({ route, titlePath }) => `${titlePath} (${route})`);

    expect(menuRoutes.length).toBeGreaterThan(0);
    expect(routesWithoutPreloaders).toEqual([]);
  });

  it('keeps menu route preloader exceptions explicit and current', () => {
    const { result } = renderHook(() => useMenuData());
    const menuRoutes = collectMenuRoutes(result.current);
    const menuRouteSet = new Set(menuRoutes.map(({ route }) => route));
    const staleOrUndocumentedExceptions = Object.entries(
      MENU_ROUTE_PRELOADER_EXCEPTIONS,
    )
      .filter(
        ([route, reason]) =>
          !reason.trim() || !menuRouteSet.has(route) || routePreloaders[route],
      )
      .map(([route, reason]) => `${route}: ${reason}`);

    expect(staleOrUndocumentedExceptions).toEqual([]);
  });

  it('registers preloaders only for mounted routes', () => {
    const unmountedPreloaders = Object.keys(routePreloaders)
      .filter(
        (route) =>
          !isMountedRoute(route) && !ROUTE_PRELOADER_MOUNT_EXCEPTIONS[route],
      )
      .sort();

    expect(unmountedPreloaders).toEqual([]);
  });

  it('keeps route preloader mount exceptions explicit and current', () => {
    const staleOrUndocumentedExceptions = Object.entries(
      ROUTE_PRELOADER_MOUNT_EXCEPTIONS,
    )
      .filter(
        ([route, reason]) =>
          !reason.trim() || !routePreloaders[route] || isMountedRoute(route),
      )
      .map(([route, reason]) => `${route}: ${reason}`);

    expect(staleOrUndocumentedExceptions).toEqual([]);
  });
});
