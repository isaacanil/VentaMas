import { describe, expect, it } from 'vitest';

import {
  filterInventoriableProducts,
  isInventoriableProduct,
  isProductExplicitlyInventoryTracked,
  isProductExplicitlyNotInventoryTracked,
  isProductInventoryTrackingEnabled,
  isServiceProduct,
  resolveProductInventoryTracking,
  shouldResolveProductPhysicalStock,
} from './productInventoryLogic';

describe('productInventoryLogic', () => {
  it('resolves item types with the shared product normalization rules', () => {
    expect(isServiceProduct({ itemType: 'service' })).toBe(true);
    expect(isServiceProduct({ type: 'Servicio de instalacion' })).toBe(true);
    expect(isServiceProduct({ itemType: 'product' })).toBe(false);
  });

  it('defaults inventory tracking by normalized item type', () => {
    expect(resolveProductInventoryTracking({ itemType: 'product' })).toBe(true);
    expect(resolveProductInventoryTracking({ itemType: 'combo' })).toBe(true);
    expect(resolveProductInventoryTracking({ itemType: 'service' })).toBe(false);
    expect(resolveProductInventoryTracking({ type: 'Servicio medico' })).toBe(
      false,
    );
  });

  it('keeps explicit tracking flags strict for filter controls', () => {
    expect(isProductExplicitlyInventoryTracked({ trackInventory: true })).toBe(
      true,
    );
    expect(isProductExplicitlyInventoryTracked({ trackInventory: 'si' })).toBe(
      false,
    );
    expect(
      isProductExplicitlyNotInventoryTracked({ trackInventory: false }),
    ).toBe(true);
    expect(isProductExplicitlyNotInventoryTracked({ trackInventory: 'no' })).toBe(
      false,
    );
    expect(isProductExplicitlyInventoryTracked({ itemType: 'product' })).toBe(
      false,
    );
    expect(
      isProductExplicitlyNotInventoryTracked({ itemType: 'service' }),
    ).toBe(false);
  });

  it('keeps legacy-like boolean parsing separate from strict flags', () => {
    expect(isProductInventoryTrackingEnabled({ trackInventory: 'si' })).toBe(
      true,
    );
    expect(isProductInventoryTrackingEnabled({ trackInventory: 'SI' })).toBe(
      true,
    );
    expect(isProductInventoryTrackingEnabled({ trackInventory: 1 })).toBe(true);
    expect(isProductInventoryTrackingEnabled({ trackInventory: 'no' })).toBe(
      false,
    );
  });

  it('centralizes physical stock resolution rules for sales flows', () => {
    expect(shouldResolveProductPhysicalStock(null)).toBe(false);
    expect(shouldResolveProductPhysicalStock({ itemType: 'product' })).toBe(true);
    expect(
      shouldResolveProductPhysicalStock({
        itemType: 'product',
        trackInventory: false,
      }),
    ).toBe(false);
    expect(
      shouldResolveProductPhysicalStock({
        itemType: 'service',
        trackInventory: false,
      }),
    ).toBe(false);
    expect(
      shouldResolveProductPhysicalStock({
        itemType: 'service',
        trackInventory: false,
        restrictSaleWithoutStock: true,
      }),
    ).toBe(true);
  });

  it('filters inventoriable products with item type fallbacks', () => {
    const products = [
      { id: 'product-default' },
      { id: 'service-type', type: 'Servicio de consulta' },
      { id: 'service-explicit', itemType: 'service' },
      { id: 'product-disabled', itemType: 'product', trackInventory: false },
      { id: 'combo-enabled', itemType: 'combo' },
    ];

    expect(
      filterInventoriableProducts(products).map((product) => product.id),
    ).toEqual(['product-default', 'combo-enabled']);
    expect(isInventoriableProduct({ itemType: 'service' })).toBe(false);
  });
});
