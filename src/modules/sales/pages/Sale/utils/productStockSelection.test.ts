import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  analyzeAvailableProductStocks,
  buildMissingPhysicalSelectionMessage,
  resolveProductStockSelection,
  shouldResolveProductStockSelection,
} from './productStockSelection';

const getLocationNameMock = vi.fn();
const getProductStockByProductIdMock = vi.fn();

vi.mock('@/firebase/warehouse/locationService', () => ({
  getLocationName: (...args: unknown[]) => getLocationNameMock(...args),
}));

vi.mock('@/firebase/warehouse/productStockService', () => ({
  getProductStockByProductId: (...args: unknown[]) =>
    getProductStockByProductIdMock(...args),
}));

describe('productStockSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('counts only positive stock and unique locations', () => {
    expect(
      analyzeAvailableProductStocks([
        { id: 's1', quantity: 2, location: 'segment-1-row-1-shelf-1' },
        { id: 's2', quantity: 1, location: 'segment-1-row-1-shelf-1' },
        { id: 's3', quantity: 0, location: 'segment-1-row-2-shelf-1' },
        { id: 's4', quantity: 3, location: 'segment-2-row-1-shelf-1' },
      ] as never),
    ).toEqual({
      availableStocks: [
        { id: 's1', quantity: 2, location: 'segment-1-row-1-shelf-1' },
        { id: 's2', quantity: 1, location: 'segment-1-row-1-shelf-1' },
        { id: 's4', quantity: 3, location: 'segment-2-row-1-shelf-1' },
      ],
      availableStockCount: 3,
      availableLocationCount: 2,
      totalPhysicalStockQuantity: 6,
    });
  });

  it('filters physical stocks below the required base quantity', () => {
    expect(
      analyzeAvailableProductStocks(
        [
          { id: 's1', quantity: 6, location: 'segment-1-row-1-shelf-1' },
          { id: 's2', quantity: 11, location: 'segment-2-row-1-shelf-1' },
          { id: 's3', quantity: 12, location: 'segment-3-row-1-shelf-1' },
          { id: 's4', quantity: 24, location: 'segment-4-row-1-shelf-1' },
        ] as never,
        { minQuantity: 12 },
      ),
    ).toEqual({
      availableStocks: [
        { id: 's3', quantity: 12, location: 'segment-3-row-1-shelf-1' },
        { id: 's4', quantity: 24, location: 'segment-4-row-1-shelf-1' },
      ],
      availableStockCount: 2,
      availableLocationCount: 2,
      totalPhysicalStockQuantity: 53,
    });
  });

  it('builds a message based on availability summary', () => {
    expect(
      buildMissingPhysicalSelectionMessage({
        availableLocationCount: 2,
        availableStockCount: 3,
        product: { name: 'Acetaminofen' } as never,
      }),
    ).toContain('2 ubicaciones');

    expect(
      buildMissingPhysicalSelectionMessage({
        availableLocationCount: 1,
        availableStockCount: 0,
        product: { name: 'Ibuprofeno' } as never,
      }),
    ).toContain('no tiene existencias físicas disponibles');
  });

  it('keeps the product display fallback text in stock-selection messages', () => {
    expect(
      buildMissingPhysicalSelectionMessage({
        availableLocationCount: 0,
        availableStockCount: 0,
        product: { productName: '  Acetaminofen  ' } as never,
      }),
    ).toBe(
      'El producto "Acetaminofen" no tiene existencias físicas disponibles.',
    );

    expect(
      buildMissingPhysicalSelectionMessage({
        availableLocationCount: 0,
        availableStockCount: 0,
        product: null,
      }),
    ).toBe(
      'El producto "este producto" no tiene existencias físicas disponibles.',
    );
  });

  it('returns needs-selection when the product has multiple valid stocks', async () => {
    getProductStockByProductIdMock.mockResolvedValue([
      {
        id: 's1',
        batchId: 'b1',
        quantity: 2,
        location: 'segment-1-row-1-shelf-1',
      },
      {
        id: 's2',
        batchId: 'b2',
        quantity: 1,
        location: 'segment-2-row-1-shelf-1',
      },
    ]);

    const result = await resolveProductStockSelection({
      product: {
        id: 'product-1',
        name: 'Acetaminofen',
        restrictSaleWithoutStock: true,
      } as never,
      user: { uid: 'user-1', businessID: 'business-1' } as never,
    });

    expect(result).toEqual(
      expect.objectContaining({
        kind: 'needs-selection',
        reason: 'multiple-options',
        availableStockCount: 2,
        availableLocationCount: 2,
      }),
    );
  });

  it('auto-selects the single available stock when it is not expired', async () => {
    getProductStockByProductIdMock.mockResolvedValue([
      {
        id: 's1',
        batchId: 'b1',
        batchNumberId: 'LOT-01',
        quantity: 4,
        location: 'segment-1-row-1-shelf-1',
        expirationDate: Date.now() + 86400000,
      },
    ]);
    getLocationNameMock.mockResolvedValue('Pasillo A');

    const result = await resolveProductStockSelection({
      product: {
        id: 'product-1',
        name: 'Acetaminofen',
        restrictSaleWithoutStock: true,
      } as never,
      user: { uid: 'user-1', businessID: 'business-1' } as never,
    });

    expect(result).toEqual(
      expect.objectContaining({
        kind: 'direct',
        availableStockCount: 1,
        availableLocationCount: 1,
        product: expect.objectContaining({
          productStockId: 's1',
          batchId: 'b1',
          batchInfo: expect.objectContaining({
            batchNumber: 'LOT-01',
            locationName: 'Pasillo A',
          }),
        }),
      }),
    );
  });

  it('skips Firestore stock lookup for non-inventory services', async () => {
    const result = await resolveProductStockSelection({
      product: {
        id: 'service-1',
        name: 'Consulta',
        itemType: 'service',
        trackInventory: false,
      } as never,
      user: { uid: 'user-1', businessID: 'business-1' } as never,
    });

    expect(getProductStockByProductIdMock).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        kind: 'direct',
        availableStockCount: 0,
        availableLocationCount: 0,
      }),
    );
  });

  it('keeps strict stock products on the physical stock resolution path', () => {
    expect(
      shouldResolveProductStockSelection({
        id: 'product-1',
        itemType: 'product',
        restrictSaleWithoutStock: true,
      } as never),
    ).toBe(true);
  });

  it('does not require parent physical stock for component-tracked combos', async () => {
    const combo = {
      id: 'combo-1',
      name: 'Combo desayuno',
      itemType: 'combo',
      trackInventory: true,
      restrictSaleWithoutStock: true,
      combo: {
        inventoryPolicy: 'components',
        components: [{ productId: 'coffee', quantity: 2 }],
      },
    } as never;

    expect(shouldResolveProductStockSelection(combo)).toBe(false);

    const result = await resolveProductStockSelection({
      product: combo,
      user: { uid: 'user-1', businessID: 'business-1' } as never,
    });

    expect(getProductStockByProductIdMock).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        kind: 'direct',
        availableStockCount: 0,
        availableLocationCount: 0,
      }),
    );
  });

  it('returns unavailable for strict products without available stock', async () => {
    getProductStockByProductIdMock.mockResolvedValue([]);

    const result = await resolveProductStockSelection({
      product: {
        id: 'product-1',
        name: 'Acetaminofen',
        restrictSaleWithoutStock: true,
      } as never,
      user: { uid: 'user-1', businessID: 'business-1' } as never,
    });

    expect(result).toEqual(
      expect.objectContaining({
        kind: 'unavailable',
        availableStockCount: 0,
        availableLocationCount: 0,
      }),
    );
  });

  it('blocks a sale unit when no single physical stock can fulfill its base quantity', async () => {
    getProductStockByProductIdMock.mockResolvedValue([
      {
        id: 's1',
        batchId: 'b1',
        quantity: 1,
        location: 'segment-1-row-1-shelf-1',
      },
      {
        id: 's2',
        batchId: 'b2',
        quantity: 5,
        location: 'segment-2-row-1-shelf-1',
      },
      {
        id: 's3',
        batchId: 'b3',
        quantity: 6,
        location: 'segment-3-row-1-shelf-1',
      },
    ]);

    const result = await resolveProductStockSelection({
      product: {
        id: 'product-1',
        name: 'Granola sin Azucar',
        restrictSaleWithoutStock: true,
        selectedSaleUnit: {
          id: 'caja-x12',
          unitName: 'Caja',
          quantity: 12,
          conversionFactorToBase: 12,
        },
      } as never,
      user: { uid: 'user-1', businessID: 'business-1' } as never,
    });

    expect(result).toEqual(
      expect.objectContaining({
        kind: 'unavailable',
        availableStockCount: 0,
        availableLocationCount: 0,
        availableStocks: [],
        totalPhysicalStockQuantity: 12,
        message:
          'El producto "Granola sin Azucar" tiene 12 unidades en total, pero ninguna ubicación o lote tiene 12 unidades juntas para Caja x 12.',
      }),
    );
    expect(getLocationNameMock).not.toHaveBeenCalled();
  });

  it('filters weighted stock using base kilograms instead of visible pounds', async () => {
    getProductStockByProductIdMock.mockResolvedValue([
      {
        id: 's1',
        batchId: 'b1',
        quantity: 1,
        location: 'segment-1-row-1-shelf-1',
      },
    ]);
    getLocationNameMock.mockResolvedValue('Pasillo A');

    await expect(
      resolveProductStockSelection({
        product: {
          id: 'product-1',
          name: 'Carne',
          restrictSaleWithoutStock: true,
          weightDetail: {
            isSoldByWeight: true,
            weight: 2,
            weightUnit: 'lb',
          },
        } as never,
        user: { uid: 'user-1', businessID: 'business-1' } as never,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        kind: 'direct',
        product: expect.objectContaining({
          productStockId: 's1',
        }),
      }),
    );

    await expect(
      resolveProductStockSelection({
        product: {
          id: 'product-1',
          name: 'Carne',
          restrictSaleWithoutStock: true,
          weightDetail: {
            isSoldByWeight: true,
            weight: 3,
            weightUnit: 'lb',
          },
        } as never,
        user: { uid: 'user-1', businessID: 'business-1' } as never,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        kind: 'unavailable',
        availableStockCount: 0,
      }),
    );
  });

  it('returns needs-selection when the only available stock is expired', async () => {
    getProductStockByProductIdMock.mockResolvedValue([
      {
        id: 's1',
        batchId: 'b1',
        quantity: 4,
        location: 'segment-1-row-1-shelf-1',
        expirationDate: Date.now() - 86400000,
      },
    ]);

    const result = await resolveProductStockSelection({
      product: {
        id: 'product-1',
        name: 'Acetaminofen',
        restrictSaleWithoutStock: true,
      } as never,
      user: { uid: 'user-1', businessID: 'business-1' } as never,
    });

    expect(result).toEqual(
      expect.objectContaining({
        kind: 'needs-selection',
        reason: 'single-expired',
        availableStockCount: 1,
        availableLocationCount: 1,
      }),
    );
    expect(getLocationNameMock).not.toHaveBeenCalled();
  });
});
