import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  analyzeAvailableProductStocks,
  buildMissingPhysicalSelectionMessage,
  resolveProductStockSelection,
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

  it('returns needs-selection when the product has multiple valid stocks', async () => {
    getProductStockByProductIdMock.mockResolvedValue([
      { id: 's1', batchId: 'b1', quantity: 2, location: 'segment-1-row-1-shelf-1' },
      { id: 's2', batchId: 'b2', quantity: 1, location: 'segment-2-row-1-shelf-1' },
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
});
