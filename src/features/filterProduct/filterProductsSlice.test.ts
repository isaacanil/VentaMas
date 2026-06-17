import { describe, expect, it, vi } from 'vitest';

import reducer, {
  DEFAULT_FILTERS,
  resetInventoryDerivedFilters,
  setInventariable,
  setStockAlertLevel,
  setStockAvailability,
  setStockLocations,
  setStockRequirement,
} from './filterProductsSlice';

vi.mock('@/firebase/Settings/filterPreferences', () => ({
  fetchUserFilterPreferences: vi.fn(),
  saveUserFilterPreferences: vi.fn(),
}));

describe('filterProductsSlice', () => {
  it('clears inventory-only filters when an item is marked as not inventariable', () => {
    const context = 'inventory-test';
    const stateWithInventoryFilters = [
      setStockAvailability({ context, value: 'available' }),
      setStockAlertLevel({ context, value: 'low-stock' }),
      setStockRequirement({ context, value: 'required' }),
      setStockLocations({ context, value: ['warehouse-a'] }),
    ].reduce(reducer, undefined);

    const state = reducer(
      stateWithInventoryFilters,
      setInventariable({ context, value: 'no' }),
    );

    expect(state.contexts[context]).toMatchObject({
      inventariable: 'no',
      stockAvailability: DEFAULT_FILTERS.stockAvailability,
      stockAlertLevel: DEFAULT_FILTERS.stockAlertLevel,
      stockRequirement: DEFAULT_FILTERS.stockRequirement,
      stockLocations: DEFAULT_FILTERS.stockLocations,
    });
    expect(state.meta.dirtyContexts[context]).toBe(true);
  });

  it('keeps the explicit derived-filter reset action for existing callers', () => {
    const context = 'inventory-reset-test';
    const stateWithInventoryFilters = [
      setStockAvailability({ context, value: 'available' }),
      setStockAlertLevel({ context, value: 'low-stock' }),
      setStockRequirement({ context, value: 'required' }),
      setStockLocations({ context, value: ['warehouse-a'] }),
    ].reduce(reducer, undefined);

    const state = reducer(
      stateWithInventoryFilters,
      resetInventoryDerivedFilters({ context }),
    );

    expect(state.contexts[context]).toMatchObject({
      stockAvailability: DEFAULT_FILTERS.stockAvailability,
      stockAlertLevel: DEFAULT_FILTERS.stockAlertLevel,
      stockRequirement: DEFAULT_FILTERS.stockRequirement,
      stockLocations: DEFAULT_FILTERS.stockLocations,
    });
  });
});
