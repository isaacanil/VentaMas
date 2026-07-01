import { describe, expect, it } from 'vitest';

import {
  convertInventoryBaseQuantityToWeightUnit,
  convertWeightToInventoryBaseQuantity,
  isSupportedWeightUnit,
  resolveWeightUnitToKgFactor,
} from './weightUnits';

describe('weight unit conversion helpers', () => {
  it('converts common weight units to kilograms as inventory base', () => {
    expect(convertWeightToInventoryBaseQuantity({ weight: 2, unit: 'kg' })).toBe(
      2,
    );
    expect(convertWeightToInventoryBaseQuantity({ weight: 2, unit: 'lb' })).toBe(
      0.907185,
    );
    expect(convertWeightToInventoryBaseQuantity({ weight: 16, unit: 'oz' })).toBe(
      0.453592,
    );
    expect(convertWeightToInventoryBaseQuantity({ weight: 500, unit: 'g' })).toBe(
      0.5,
    );
  });

  it('keeps unknown or missing units as one-to-one for legacy compatibility', () => {
    expect(resolveWeightUnitToKgFactor(null)).toBe(1);
    expect(resolveWeightUnitToKgFactor('unidad')).toBe(1);
    expect(
      convertWeightToInventoryBaseQuantity({ weight: '2,5', unit: 'unidad' }),
    ).toBe(2.5);
  });

  it('detects whether a weight unit is supported for new invoice guards', () => {
    expect(isSupportedWeightUnit('kg')).toBe(true);
    expect(isSupportedWeightUnit(' LB ')).toBe(true);
    expect(isSupportedWeightUnit('oz')).toBe(true);
    expect(isSupportedWeightUnit('unidad')).toBe(false);
    expect(isSupportedWeightUnit(null)).toBe(false);
  });

  it('converts base stock back to display unit for stock restrictions', () => {
    expect(
      convertInventoryBaseQuantityToWeightUnit({
        baseQuantity: 2,
        unit: 'lb',
      }),
    ).toBe(4.409245);
  });
});
