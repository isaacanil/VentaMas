import { describe, expect, it } from 'vitest';

import {
  buildSaleUnitsCacheBackfill,
  normalizeSaleUnitForProductCache,
  normalizeSubcollectionSaleUnitsForCache,
} from './saleUnitsCacheBackfill.util.js';

describe('saleUnitsCacheBackfill.util', () => {
  it('normalizes a legacy sale unit with explicit conversion factor', () => {
    expect(
      normalizeSaleUnitForProductCache({
        id: 'box-12',
        unitName: ' Caja ',
        quantity: 6,
        conversionFactorToBase: '12',
        allowFractional: true,
        price: '500',
      }),
    ).toEqual(
      expect.objectContaining({
        id: 'box-12',
        unitName: 'Caja',
        quantity: 12,
        conversionFactorToBase: 12,
        allowFractional: true,
        active: true,
        pricing: expect.objectContaining({
          price: 500,
          listPrice: 500,
        }),
      }),
    );
  });

  it('deduplicates subcollection units by id and reports invalid units', () => {
    const result = normalizeSubcollectionSaleUnitsForCache([
      { id: 'box', unitName: 'Caja', quantity: 12 },
      { id: 'bad', unitName: 'Sin factor' },
      { id: 'box', unitName: 'Caja nueva', quantity: 24 },
    ]);

    expect(result.saleUnits).toHaveLength(1);
    expect(result.saleUnits[0]).toEqual(
      expect.objectContaining({
        id: 'box',
        unitName: 'Caja nueva',
        conversionFactorToBase: 24,
      }),
    );
    expect(result.duplicateIds).toEqual(['box']);
    expect(result.invalidUnits).toEqual([
      {
        index: 1,
        id: 'bad',
        reason: 'missing_id_or_positive_factor',
      },
    ]);
  });

  it('builds a backfill patch when embedded saleUnits are empty', () => {
    const result = buildSaleUnitsCacheBackfill({
      product: { id: 'product-1', saleUnits: [], saleUnitsCount: 1 },
      subcollectionSaleUnits: [
        {
          id: 'box-12',
          unitName: 'Caja',
          quantity: 12,
          pricing: { price: '480' },
        },
      ],
    });

    expect(result).toEqual(
      expect.objectContaining({
        shouldUpdate: true,
        reason: 'backfill_from_subcollection',
      }),
    );
    expect(result.patch).toEqual({
      saleUnits: [
        expect.objectContaining({
          id: 'box-12',
          unitName: 'Caja',
          quantity: 12,
          conversionFactorToBase: 12,
          pricing: expect.objectContaining({ price: 480 }),
        }),
      ],
      saleUnitsCount: 1,
    });
  });

  it('keeps embedded saleUnits canonical and only repairs stale counts', () => {
    const result = buildSaleUnitsCacheBackfill({
      product: {
        id: 'product-1',
        saleUnitsCount: 8,
        saleUnits: [{ id: 'box-12', quantity: 12 }],
      },
      subcollectionSaleUnits: [{ id: 'box-12', quantity: 6 }],
    });

    expect(result).toEqual(
      expect.objectContaining({
        shouldUpdate: true,
        reason: 'sale_units_count_mismatch',
        patch: { saleUnitsCount: 1 },
      }),
    );
  });

  it('skips products without embedded or valid subcollection saleUnits', () => {
    expect(
      buildSaleUnitsCacheBackfill({
        product: { id: 'product-1' },
        subcollectionSaleUnits: [{ id: 'box-12', quantity: 0 }],
      }),
    ).toEqual(
      expect.objectContaining({
        shouldUpdate: false,
        reason: 'no_valid_subcollection_sale_units',
      }),
    );
  });
});
