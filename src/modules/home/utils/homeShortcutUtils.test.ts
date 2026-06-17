import { describe, expect, it } from 'vitest';

import {
  CATEGORY_ORDER,
  isFeatureCardData,
  isRoutableFeatureCardData,
  normalizeFeatureCardData,
  normalizeRoutableFeatureCardData,
  normalizeSearch,
  uniqueShortcutsByRoute,
} from './homeShortcutUtils';

describe('homeShortcutUtils', () => {
  it('keeps the shared home shortcut category order', () => {
    expect(CATEGORY_ORDER).toEqual({
      Ventas: 10,
      Inventario: 20,
      Contabilidad: 30,
      'Compras y gastos': 40,
      'RRHH y nomina': 50,
      Contactos: 60,
      Tesorería: 70,
      Administración: 80,
    });
  });

  it('normalizes shortcut search text without accents or surrounding spaces', () => {
    expect(normalizeSearch('  Tesorería Y Nómina  ')).toBe(
      'tesoreria y nomina',
    );
  });

  it('guards general FeatureCardData without requiring a route', () => {
    const card = {
      category: 'Administración',
      title: 'Abrir modal',
    };

    expect(isFeatureCardData(card)).toBe(true);
    expect(isRoutableFeatureCardData(card)).toBe(false);
    expect(
      normalizeFeatureCardData([card, null, { title: 'Sin categoría' }]),
    ).toEqual([card]);
  });

  it('guards routable FeatureCardData with a non-empty route', () => {
    const routable = {
      category: 'Ventas',
      route: '/sales',
      title: 'Venta',
    };

    expect(isRoutableFeatureCardData(routable)).toBe(true);
    expect(
      normalizeRoutableFeatureCardData([
        routable,
        { category: 'Ventas', route: '', title: 'Vacío' },
        { category: 'Ventas', route: '   ', title: 'Espacios' },
      ]),
    ).toEqual([routable]);
  });

  it('deduplicates by exact route and keeps the first shortcut', () => {
    const first = { route: '/sales', title: 'Venta' };
    const duplicate = { route: '/sales', title: 'Venta duplicada' };
    const queryRoute = { route: '/sales?draft=1', title: 'Venta draft' };

    expect(
      uniqueShortcutsByRoute([
        first,
        duplicate,
        queryRoute,
        { route: '', title: 'Sin ruta' },
        { title: 'Sin propiedad route' },
      ]),
    ).toEqual([first, queryRoute]);
  });
});
