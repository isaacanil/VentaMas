import { describe, expect, it } from 'vitest';

import {
  buildSaleUnitMovementSnapshot,
  resolveInventoryBaseQuantity,
  resolveSaleUnitConversionFactor,
} from './saleUnitQuantity.util.js';

describe('saleUnitQuantity.util', () => {
  it('uses amountToBuy as base quantity when no sale unit is selected', () => {
    expect(resolveInventoryBaseQuantity({ amountToBuy: 3 })).toBe(3);
  });

  it('multiplies sale quantity by selected unit conversion factor', () => {
    expect(
      resolveInventoryBaseQuantity({
        amountToBuy: 2,
        selectedSaleUnit: {
          id: 'box-12',
          unitName: 'Caja',
          quantity: 12,
        },
      }),
    ).toBe(24);
  });

  it('uses unit quantity before total for structured sale unit amounts', () => {
    expect(
      resolveInventoryBaseQuantity({
        amountToBuy: { unit: 1, total: 12 },
        baseQuantity: 12,
        selectedSaleUnit: {
          id: 'box-12',
          unitName: 'Caja',
          quantity: 12,
        },
      }),
    ).toBe(12);
  });

  it('prefers explicit conversionFactorToBase over legacy quantity', () => {
    expect(
      resolveSaleUnitConversionFactor({
        selectedSaleUnit: {
          quantity: 6,
          conversionFactorToBase: 8,
        },
      }),
    ).toBe(8);
  });

  it('uses weight as base quantity for weighted products', () => {
    expect(
      resolveInventoryBaseQuantity({
        amountToBuy: 1,
        selectedSaleUnit: {
          quantity: 12,
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
      resolveInventoryBaseQuantity({
        amountToBuy: 1,
        weightDetail: {
          isSoldByWeight: true,
          weight: 2,
          weightUnit: 'lb',
        },
      }),
    ).toBe(0.907185);
  });

  it('builds movement metadata for audits', () => {
    expect(
      buildSaleUnitMovementSnapshot({
        amountToBuy: 2,
        selectedSaleUnit: {
          id: 'pack-6',
          unitName: 'Paquete',
          barcode: 'PK6',
          quantity: 6,
          pricing: {
            currency: 'DOP',
            price: 150,
            listPrice: 150,
            tax: 18,
          },
        },
      }),
    ).toEqual({
      saleUnitId: 'pack-6',
      saleUnitName: 'Paquete',
      barcode: 'PK6',
      saleQuantity: 2,
      conversionFactorToBase: 6,
      pricing: {
        currency: 'DOP',
        price: 150,
        listPrice: 150,
        tax: 18,
      },
    });
  });

  it('supports legacy saleUnit payloads when selectedSaleUnit is missing', () => {
    expect(
      resolveInventoryBaseQuantity({
        amountToBuy: 3,
        saleUnit: {
          id: 'legacy-box',
          quantity: 4,
        },
      }),
    ).toBe(12);
  });
});
