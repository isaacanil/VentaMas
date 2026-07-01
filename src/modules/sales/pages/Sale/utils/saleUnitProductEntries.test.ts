import { describe, expect, it } from 'vitest';

import { buildSaleUnitProductEntries } from './saleUnitProductEntries';
import type { ProductRecord } from '@/types/products';

describe('saleUnitProductEntries', () => {
  it('keeps the base product and adds active sale units as virtual sellable entries', () => {
    const product: ProductRecord = {
      id: 'coffee-1',
      name: 'Cafe Santo Domingo',
      stock: 24,
      saleUnits: [
        {
          id: 'box-12',
          unitName: 'Caja',
          quantity: 12,
          pricing: { price: 900 },
        },
        {
          id: 'pack-6',
          unitName: 'Paquete',
          conversionFactorToBase: 6,
          pricing: { price: 480 },
        },
      ],
    };

    const entries = buildSaleUnitProductEntries(product, {
      stockAvailabilityByProductId: {
        'coffee-1': {
          maxPhysicalStockQuantity: 24,
          stockCount: 1,
          totalPhysicalStockQuantity: 24,
        },
      },
      stockAvailabilityCanFilter: true,
      stockAvailabilityReady: true,
    });

    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatchObject({
      id: 'coffee-1',
      selectedSaleUnit: null,
      selectedSaleUnitId: null,
    });
    expect(entries[1]).toMatchObject({
      id: 'coffee-1',
      selectedSaleUnitId: 'box-12',
      selectedSaleUnit: {
        id: 'box-12',
        unitName: 'Caja',
        conversionFactorToBase: 12,
      },
    });
    expect(entries[2]).toMatchObject({
      id: 'coffee-1',
      selectedSaleUnitId: 'pack-6',
      selectedSaleUnit: {
        id: 'pack-6',
        unitName: 'Paquete',
        conversionFactorToBase: 6,
      },
    });
  });

  it('does not duplicate the default base unit or inactive sale units', () => {
    const product: ProductRecord = {
      id: 'rice-1',
      name: 'Arroz',
      amountToBuy: 4,
      baseQuantity: 4,
      selectedSaleUnit: {
        id: 'old',
        unitName: 'Caja',
        quantity: 12,
        pricing: { price: 500 },
      },
      saleUnits: [
        {
          id: 'default',
          unitName: 'Unidad',
          quantity: 1,
          pricing: { price: 50 },
        },
        {
          id: 'inactive-box',
          unitName: 'Caja',
          quantity: 12,
          active: false,
          pricing: { price: 500 },
        },
      ],
    };

    const entries = buildSaleUnitProductEntries(product);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      id: 'rice-1',
      selectedSaleUnit: null,
      selectedSaleUnitId: null,
    });
    expect(entries[0]).not.toHaveProperty('amountToBuy');
    expect(entries[0]).not.toHaveProperty('baseQuantity');
  });

  it('hides derived sale units that cannot be fulfilled from one physical stock record', () => {
    const product: ProductRecord = {
      id: 'granola-1',
      name: 'Granola sin Azucar',
      restrictSaleWithoutStock: true,
      stock: 12,
      saleUnits: [
        {
          id: 'box-12',
          unitName: 'Caja',
          quantity: 12,
          pricing: { price: 6372 },
        },
        {
          id: 'pack-6',
          unitName: 'Paquete',
          quantity: 6,
          pricing: { price: 3186 },
        },
      ],
    };

    const entries = buildSaleUnitProductEntries(product, {
      stockAvailabilityByProductId: {
        'granola-1': {
          maxPhysicalStockQuantity: 6,
          stockCount: 2,
          totalPhysicalStockQuantity: 12,
        },
      },
      stockAvailabilityCanFilter: true,
      stockAvailabilityReady: true,
    });

    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.selectedSaleUnitId)).toEqual([
      null,
      'pack-6',
    ]);
  });

  it('hides stock-restricted derived sale units while physical stock availability is unknown', () => {
    const product: ProductRecord = {
      id: 'granola-1',
      name: 'Granola sin Azucar',
      restrictSaleWithoutStock: true,
      stock: 12,
      saleUnits: [
        {
          id: 'box-12',
          unitName: 'Caja',
          quantity: 12,
          pricing: { price: 6372 },
        },
      ],
    };

    const entries = buildSaleUnitProductEntries(product, {
      stockAvailabilityByProductId: {},
      stockAvailabilityCanFilter: true,
      stockAvailabilityReady: false,
    });

    expect(entries.map((entry) => entry.selectedSaleUnitId)).toEqual([null]);
  });
});
