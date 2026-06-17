import { describe, expect, it } from 'vitest';

import {
  exceedsRestrictedStock,
  normalizeCounterAmount,
  parseCounterInputValue,
} from './CartQuantityCounter.helpers';

describe('CartQuantityCounter helpers', () => {
  it('normaliza la cantidad minima visible', () => {
    expect(normalizeCounterAmount(0)).toBe(1);
    expect(normalizeCounterAmount(3)).toBe(3);
  });

  it('parsea input numerico y descarta valores invalidos', () => {
    expect(parseCounterInputValue('5')).toBe(5);
    expect(parseCounterInputValue('5 unidades')).toBe(5);
    expect(parseCounterInputValue('')).toBeNull();
  });

  it('detecta exceso de stock solo cuando la restriccion esta activa', () => {
    expect(
      exceedsRestrictedStock({
        value: 6,
        stock: 5,
        restrictSaleWithoutStock: true,
      }),
    ).toBe(true);
    expect(
      exceedsRestrictedStock({
        value: 6,
        stock: 5,
        restrictSaleWithoutStock: false,
      }),
    ).toBe(false);
    expect(
      exceedsRestrictedStock({
        value: 6,
        restrictSaleWithoutStock: true,
      }),
    ).toBe(false);
  });
});
