import { describe, expect, it } from 'vitest';

import {
  filterInventoriableProducts,
  filterSellableProducts,
  isInventoriableProduct,
  isComponentTrackedCombo,
  isProductExplicitlyInventoryTracked,
  isProductExplicitlyNotInventoryTracked,
  isProductInventoryTrackingEnabled,
  isProductVisibleForSale,
  isRawMaterialProduct,
  isServiceProduct,
  isSellableProduct,
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
    ).toBe(false);
    expect(
      shouldResolveProductPhysicalStock({
        itemType: 'combo',
        trackInventory: true,
        restrictSaleWithoutStock: true,
        combo: { inventoryPolicy: 'components' },
      }),
    ).toBe(false);
    expect(
      shouldResolveProductPhysicalStock({
        itemType: 'combo',
        trackInventory: true,
        combo: { inventoryPolicy: 'self' },
      }),
    ).toBe(true);
  });

  it('identifies raw materials as inventory products that are not sellable', () => {
    const rawMaterial = {
      itemType: 'product',
      inventoryRole: 'raw_material',
      isSellable: true,
      isVisible: true,
    };

    expect(isRawMaterialProduct(rawMaterial)).toBe(true);
    expect(isSellableProduct(rawMaterial)).toBe(false);
    expect(isProductVisibleForSale(rawMaterial)).toBe(false);
    expect(resolveProductInventoryTracking(rawMaterial)).toBe(true);
    expect(shouldResolveProductPhysicalStock(rawMaterial)).toBe(true);
  });

  it('keeps services and combos sellable by default while honoring explicit blocks', () => {
    expect(isSellableProduct({ itemType: 'service' })).toBe(true);
    expect(isSellableProduct({ itemType: 'combo' })).toBe(true);
    expect(isSellableProduct({ itemType: 'product', isSellable: false })).toBe(
      false,
    );
    expect(isProductVisibleForSale({ itemType: 'product', isVisible: false }))
      .toBe(false);
  });

  it('identifies component-tracked combos as virtual parent stock items', () => {
    expect(
      isComponentTrackedCombo({
        itemType: 'combo',
        combo: { inventoryPolicy: 'components' },
      }),
    ).toBe(true);
    expect(
      isComponentTrackedCombo({
        itemType: 'combo',
        combo: { inventoryPolicy: 'self' },
      }),
    ).toBe(false);
    expect(isComponentTrackedCombo({ itemType: 'product' })).toBe(false);
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

  it('filters sale-visible products without dropping services and combos', () => {
    const products = [
      { id: 'product-default' },
      { id: 'service', itemType: 'service' },
      { id: 'combo', itemType: 'combo' },
      { id: 'hidden', itemType: 'product', isVisible: false },
      { id: 'blocked', itemType: 'product', isSellable: false },
      { id: 'raw', itemType: 'product', inventoryRole: 'raw_material' },
    ];

    expect(filterSellableProducts(products).map((product) => product.id)).toEqual(
      ['product-default', 'service', 'combo'],
    );
  });
});
