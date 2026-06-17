import { beforeAll, describe, expect, it } from 'vitest';

import changelogRoutes from '@/router/routes/paths/Changelogs';
import devRoutes from '@/router/routes/paths/Dev';
import inventoryRoutes from '@/router/routes/paths/Inventory';
import labRoutes from '@/router/routes/paths/Lab';
import settingRoutes from '@/router/routes/paths/Setting';
import { getRouteMeta, registerRoutes } from '@/router/routes/routeVisibility';
import type { MenuItem } from '@/types/menu';

import developerMenuItems from './items/developer';
import inventoryMenuItems from './items/inventory';

const getMenuItemLabel = (item: MenuItem) =>
  String(item.title ?? item.label ?? item.route ?? item.action ?? '<sin titulo>');

const collectMenuEntries = (
  items: MenuItem[],
  parentPath = '',
): Array<{ item: MenuItem; menuPath: string }> =>
  items.flatMap((item) => {
    const menuPath = parentPath
      ? `${parentPath} > ${getMenuItemLabel(item)}`
      : getMenuItemLabel(item);

    return [
      { item, menuPath },
      ...collectMenuEntries(item.submenu ?? [], menuPath),
    ];
  });

const collectMenuRouteEntries = (
  items: MenuItem[],
): Array<{ item: MenuItem; menuPath: string; route: string }> =>
  collectMenuEntries(items).flatMap(({ item, menuPath }) =>
    typeof item.route === 'string' ? [{ item, menuPath, route: item.route }] : [],
  );

describe('menu route access metadata', () => {
  beforeAll(() => {
    registerRoutes([
      ...devRoutes,
      ...inventoryRoutes,
      ...labRoutes,
      ...settingRoutes,
      ...changelogRoutes,
    ] as never);
  });

  it('protects every developer menu route with route metadata', () => {
    const developerMenuRoutesMissingAccess = collectMenuRouteEntries(
      developerMenuItems,
    )
      .filter(({ route }) => getRouteMeta(route)?.requiresDevAccess !== true)
      .map(({ menuPath, route }) => `${menuPath} -> ${route}`)
      .sort();

    expect(developerMenuRoutesMissingAccess).toEqual([]);
  });

  it('backs menu items marked as developer-only with route metadata', () => {
    const menuRoutesMissingAccess = collectMenuRouteEntries([
      ...developerMenuItems,
      ...inventoryMenuItems,
    ])
      .filter(({ item }) => item.requiresDevAccess === true)
      .filter(({ route }) => getRouteMeta(route)?.requiresDevAccess !== true)
      .map(({ menuPath, route }) => `${menuPath} -> ${route}`)
      .sort();

    expect(menuRoutesMissingAccess).toEqual([]);
  });

  it('marks developer menu actions without routes as developer-only', () => {
    const developerActionsMissingAccess = collectMenuEntries(developerMenuItems)
      .filter(
        ({ item }) =>
          typeof item.action === 'string' && typeof item.route !== 'string',
      )
      .filter(({ item }) => item.requiresDevAccess !== true)
      .map(({ item, menuPath }) => `${menuPath} -> ${item.action}`)
      .sort();

    expect(developerActionsMissingAccess).toEqual([]);
  });
});
