import { describe, expect, it } from 'vitest';

import { PRODUCT_ITEM_TYPE_OPTIONS } from '@/domain/products/productDefaults';

import { opcionesItemType } from './InventoryFilterAndSortMetadata';

describe('InventoryFilterAndSortMetadata', () => {
  it('derives item type filter values from the product domain contract', () => {
    expect(opcionesItemType.map((option) => option.valor)).toEqual([
      'todos',
      ...PRODUCT_ITEM_TYPE_OPTIONS.map((option) => option.value),
    ]);
    expect(opcionesItemType).toEqual([
      { valor: 'todos', etiqueta: 'Todos' },
      { valor: 'product', etiqueta: 'Productos' },
      { valor: 'service', etiqueta: 'Servicios' },
      { valor: 'combo', etiqueta: 'Combos' },
    ]);
  });
});
