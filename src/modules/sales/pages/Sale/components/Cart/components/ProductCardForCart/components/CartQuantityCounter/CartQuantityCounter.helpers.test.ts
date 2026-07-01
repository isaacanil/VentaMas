import { describe, expect, it } from 'vitest';

import {
  exceedsRestrictedStock,
  normalizeCounterAmount,
  parseCounterInputValue,
  resolveMaxCounterAmountForStock,
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

  it('permite decimales solo cuando la presentacion es fraccionable', () => {
    expect(parseCounterInputValue('0.5')).toBe(0);
    expect(parseCounterInputValue('0.5', true)).toBe(0.5);
    expect(parseCounterInputValue('0,5', true)).toBe(0.5);
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

  it('detecta exceso de stock usando cantidad base cuando hay presentacion', () => {
    expect(
      exceedsRestrictedStock({
        value: 1,
        stock: 5,
        restrictSaleWithoutStock: true,
        saleUnitConversionFactor: 12,
      }),
    ).toBe(true);

    expect(
      exceedsRestrictedStock({
        value: 2,
        stock: 24,
        restrictSaleWithoutStock: true,
        saleUnitConversionFactor: 12,
      }),
    ).toBe(false);

    expect(
      resolveMaxCounterAmountForStock({
        stock: 25,
        saleUnitConversionFactor: 12,
      }),
    ).toBe(2);
  });

  it('conserva maximos fraccionables segun el stock base disponible', () => {
    expect(
      resolveMaxCounterAmountForStock({
        stock: 6,
        saleUnitConversionFactor: 12,
        allowFractional: true,
      }),
    ).toBe(0.5);

    expect(
      exceedsRestrictedStock({
        value: 0.5,
        stock: 6,
        restrictSaleWithoutStock: true,
        saleUnitConversionFactor: 12,
      }),
    ).toBe(false);
  });
});
