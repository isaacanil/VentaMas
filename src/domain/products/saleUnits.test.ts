import { describe, expect, it } from 'vitest';

import {
  normalizeSaleUnitForCart,
  resolveProductBaseQuantity,
  resolveSaleUnitConversionFactor,
  resolveSaleUnitLabel,
} from './saleUnits';

describe('sale unit helpers', () => {
  it('uses a default conversion factor of one when no sale unit is selected', () => {
    expect(resolveSaleUnitConversionFactor(null)).toBe(1);
    expect(
      resolveProductBaseQuantity({
        amountToBuy: 3,
        selectedSaleUnit: null,
      }),
    ).toBe(3);
  });

  it('converts sale presentation quantities into base inventory quantity', () => {
    expect(
      resolveProductBaseQuantity({
        amountToBuy: 2,
        selectedSaleUnit: {
          id: 'box-12',
          unitName: 'Caja',
          quantity: 12,
          pricing: {
            price: 500,
          },
        },
      }),
    ).toBe(24);
  });

  it('prefers explicit conversionFactorToBase over legacy quantity', () => {
    const unit = normalizeSaleUnitForCart(
      {
        id: 'pack',
        unitName: 'Paquete',
        quantity: 6,
        conversionFactorToBase: 8,
        pricing: {
          price: 300,
        },
      },
      325,
    );

    expect(unit.quantity).toBe(8);
    expect(unit.conversionFactorToBase).toBe(8);
    expect(unit.pricing.price).toBe(325);
    expect(resolveSaleUnitLabel(unit)).toBe('Paquete x 8');
  });

  it('uses weight as base quantity for weighted products', () => {
    expect(
      resolveProductBaseQuantity({
        amountToBuy: 1,
        selectedSaleUnit: {
          id: 'box-12',
          unitName: 'Caja',
          quantity: 12,
          pricing: {
            price: 500,
          },
        },
        weightDetail: {
          isSoldByWeight: true,
          weight: 2.5,
        },
      }),
    ).toBe(2.5);
  });

  it('converts weighted product quantities to inventory base kilograms', () => {
    expect(
      resolveProductBaseQuantity({
        amountToBuy: 1,
        weightDetail: {
          isSoldByWeight: true,
          weight: 2,
          weightUnit: 'lb',
        },
      }),
    ).toBe(0.907185);
  });
});
