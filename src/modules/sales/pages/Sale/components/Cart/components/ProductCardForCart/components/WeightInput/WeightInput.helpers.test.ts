import { describe, expect, it } from 'vitest';

import {
  exceedsRestrictedWeightStock,
  parseWeightInputValue,
  resolveCommittedWeightValue,
  resolveMaxWeightForStock,
} from './WeightInput.helpers';

describe('WeightInput helpers', () => {
  it('parsea pesos decimales con punto o coma', () => {
    expect(parseWeightInputValue('1.25')).toBe(1.25);
    expect(parseWeightInputValue('1,25')).toBe(1.25);
    expect(parseWeightInputValue('')).toBeNull();
  });

  it('solo limita el peso cuando la venta sin stock esta restringida', () => {
    expect(
      exceedsRestrictedWeightStock({
        restrictSaleWithoutStock: false,
        stock: 5,
        weight: 5.001,
      }),
    ).toBe(false);
    expect(
      exceedsRestrictedWeightStock({
        restrictSaleWithoutStock: true,
        stock: 5,
        weight: 5,
      }),
    ).toBe(false);
    expect(
      exceedsRestrictedWeightStock({
        restrictSaleWithoutStock: true,
        stock: 5,
        weight: 5.001,
      }),
    ).toBe(true);
  });

  it('ignora stock invalido para no bloquear productos sin stock confiable', () => {
    expect(
      resolveMaxWeightForStock({
        restrictSaleWithoutStock: true,
        stock: Number.NaN,
      }),
    ).toBeNull();
  });

  it('confirma peso en blur usando 1 cuando el usuario deja el campo vacio', () => {
    expect(resolveCommittedWeightValue({ value: '' })).toBe(1);
    expect(resolveCommittedWeightValue({ value: '2,5' })).toBe(2.5);
  });

  it('ajusta el peso confirmado al stock maximo si aplica restriccion', () => {
    expect(
      resolveCommittedWeightValue({
        restrictSaleWithoutStock: true,
        stock: 3,
        value: '5',
      }),
    ).toBe(3);
  });

  it('convierte stock base a la unidad de peso antes de limitar', () => {
    expect(
      resolveMaxWeightForStock({
        restrictSaleWithoutStock: true,
        stock: 2,
        weightUnit: 'lb',
      }),
    ).toBe(4.409245);
    expect(
      exceedsRestrictedWeightStock({
        restrictSaleWithoutStock: true,
        stock: 2,
        weight: 4,
        weightUnit: 'lb',
      }),
    ).toBe(false);
    expect(
      resolveCommittedWeightValue({
        restrictSaleWithoutStock: true,
        stock: 2,
        value: '5',
        weightUnit: 'lb',
      }),
    ).toBe(4.409245);
  });
});
