import { describe, expect, it } from 'vitest';

import {
  getRouteMetaFromHandle,
  mergeRouteHandleMeta,
} from './routeHandle';

describe('routeHandle', () => {
  it('ignores non-record handles and routeMeta arrays', () => {
    expect(getRouteMetaFromHandle(null)).toBeNull();
    expect(getRouteMetaFromHandle([])).toBeNull();
    expect(getRouteMetaFromHandle({ routeMeta: [] })).toBeNull();
  });

  it('reads route metadata from record handles', () => {
    expect(
      getRouteMetaFromHandle({
        routeMeta: {
          title: 'Inventario',
          hideInMenu: true,
        },
      }),
    ).toEqual({
      title: 'Inventario',
      hideInMenu: true,
    });
  });

  it('merges flat route metadata over existing handle routeMeta', () => {
    expect(
      mergeRouteHandleMeta({
        title: 'Nuevo titulo',
        handle: {
          analyticsId: 'inventory',
          routeMeta: {
            title: 'Anterior',
            metaDescription: 'Descripcion',
          },
        },
      }),
    ).toEqual({
      analyticsId: 'inventory',
      routeMeta: {
        title: 'Nuevo titulo',
        metaDescription: 'Descripcion',
      },
    });
  });
});
