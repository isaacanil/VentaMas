import { describe, expect, it } from 'vitest';

import { filterGroupedMenuByQuery } from './menuSearch';

import type { GroupedMenuItems } from './menuSearch';

describe('menuSearch', () => {
  it('returns the original grouped menu when the query is blank', () => {
    const menu: GroupedMenuItems = {
      Ventas: [{ route: '/ventas', title: 'Ventas' }],
    };

    expect(filterGroupedMenuByQuery(menu, '   ')).toBe(menu);
  });

  it('filters nested menu items and includes the parent context title', () => {
    const menu: GroupedMenuItems = {
      Ventas: [
        {
          group: 'Ventas',
          submenu: [
            {
              route: '/ventas/facturas',
              title: 'Facturas',
            },
          ],
          title: 'Ventas',
        },
      ],
    };

    expect(filterGroupedMenuByQuery(menu, 'facturas')).toEqual({
      Ventas: [
        {
          group: 'Ventas',
          route: '/ventas/facturas',
          searchContextTitle: 'Ventas',
          title: 'Facturas',
        },
      ],
    });
  });

  it('ignores invalid submenu values through the shared array normalizer', () => {
    const menu: GroupedMenuItems = {
      Administración: [
        {
          submenu: { title: 'No iterable' } as never,
          title: 'Configuración',
        },
      ],
    };

    expect(filterGroupedMenuByQuery(menu, 'configuracion')).toEqual({
      Administración: [
        {
          group: 'Administración',
          submenu: { title: 'No iterable' },
          title: 'Configuración',
        },
      ],
    });
  });
});
