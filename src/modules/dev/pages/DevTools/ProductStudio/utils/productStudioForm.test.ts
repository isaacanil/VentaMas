import { describe, expect, it } from 'vitest';

import {
  getProductStudioBusinessId,
  getChangedProductPatch,
  hasBusinessId,
  hasUserUid,
  isFormValidationError,
  normalizePricingForForm,
  normalizePricingForUpdate,
  normalizeProductForStudioSubmit,
} from './productStudioForm';

describe('productStudioForm guards', () => {
  it('accepts only records with clean user and business identifiers', () => {
    expect(hasBusinessId({ businessID: ' business-1 ' })).toBe(true);
    expect(hasBusinessId({ businessID: '   ' })).toBe(false);
    expect(hasBusinessId([])).toBe(false);
    expect(getProductStudioBusinessId({ businessId: ' business-2 ' })).toBe(
      'business-2',
    );

    expect(hasUserUid({ uid: ' user-1 ' })).toBe(true);
    expect(hasUserUid({ uid: '' })).toBe(false);
    expect(hasUserUid(null)).toBe(false);
  });

  it('detects form validation errors without accepting arbitrary objects', () => {
    expect(isFormValidationError({ errorFields: [] })).toBe(true);
    expect(isFormValidationError({ errorFields: null })).toBe(false);
    expect(isFormValidationError('error')).toBe(false);
  });

  it('ignores array payloads when building object patches', () => {
    expect(
      getChangedProductPatch({
        key: 'warranty',
        product: { warranty: { enabled: true } } as never,
        value: ['not-a-warranty-object'],
      }),
    ).toEqual({
      warranty: { enabled: true },
    });
  });

  it('normalizes combo patches from ProductStudio form changes', () => {
    expect(
      getChangedProductPatch({
        key: 'combo',
        product: { itemType: 'combo' } as never,
        value: {
          inventoryPolicy: 'self',
          components: [
            {
              productId: ' component-1 ',
              productName: '  Producto base  ',
              quantity: '2',
            },
            { productId: '', quantity: 1 },
          ],
        },
      }),
    ).toEqual({
      combo: {
        enabled: true,
        inventoryPolicy: 'components',
        components: [
          {
            productId: 'component-1',
            productName: 'Producto base',
            quantity: 2,
          },
        ],
      },
    });
  });

  it('prepares a minimal component-tracked combo patch when item type changes', () => {
    expect(
      getChangedProductPatch({
        key: 'itemType',
        product: {
          itemType: 'product',
          brand: 'Marca vieja',
          brandId: 'brand-1',
          netContent: '500 ml',
          size: 'Grande',
          activeIngredients: 'Cafeina',
          measurement: 'Unidad',
          footer: 'Texto viejo',
          stock: 12,
          saleUnits: [{ id: 'box' }],
          weightDetail: { isSoldByWeight: true, weight: 2 },
          warranty: { status: true, quantity: 3 },
        } as never,
        value: 'combo',
      }),
    ).toMatchObject({
      itemType: 'combo',
      brand: 'Sin marca',
      brandId: null,
      netContent: '',
      size: '',
      activeIngredients: '',
      measurement: '',
      footer: '',
      stock: 0,
      totalUnits: null,
      packSize: 1,
      trackInventory: true,
      restrictSaleWithoutStock: true,
      saleUnits: [],
      selectedSaleUnit: null,
      selectedSaleUnitId: null,
      weightDetail: { isSoldByWeight: false },
      warranty: { status: false },
      combo: {
        enabled: true,
        inventoryPolicy: 'components',
        components: [],
      },
    });
  });

  it('prepares a service patch without physical inventory fields', () => {
    expect(
      getChangedProductPatch({
        key: 'itemType',
        product: {
          itemType: 'product',
          stock: 12,
          totalUnits: 120,
          packSize: 10,
          trackInventory: true,
          restrictSaleWithoutStock: true,
          productStockId: 'stock-1',
          batchId: 'batch-1',
          saleUnits: [{ id: 'box' }],
          selectedSaleUnit: { id: 'box' },
          selectedSaleUnitId: 'box',
          weightDetail: { isSoldByWeight: true, weight: 2, weightUnit: 'lb' },
          warranty: { status: true, quantity: 3 },
          combo: {
            components: [{ productId: 'component-1', quantity: 2 }],
          },
        } as never,
        value: 'service',
      }),
    ).toMatchObject({
      itemType: 'service',
      stock: 0,
      totalUnits: null,
      packSize: 1,
      trackInventory: false,
      restrictSaleWithoutStock: false,
      productStockId: null,
      batchId: null,
      saleUnits: [],
      selectedSaleUnit: null,
      selectedSaleUnitId: null,
      weightDetail: { isSoldByWeight: false },
      warranty: { status: false },
      combo: null,
    });
  });

  it('prepares a raw material patch as inventory-only product', () => {
    expect(
      getChangedProductPatch({
        key: 'inventoryRole',
        product: {
          itemType: 'product',
          isVisible: true,
          isSellable: true,
          trackInventory: false,
          restrictSaleWithoutStock: false,
          pricing: {
            currency: 'DOP',
            cost: 40,
            listPrice: 75,
            price: 75,
          },
          saleUnits: [{ id: 'box' }],
          selectedSaleUnit: { id: 'box' },
          selectedSaleUnitId: 'box',
          qrcode: 'QR-1',
          barcode: 'BAR-1',
          warranty: { status: true },
          weightDetail: { isSoldByWeight: true },
        } as never,
        value: 'raw_material',
      }),
    ).toMatchObject({
      itemType: 'product',
      inventoryRole: 'raw_material',
      isSellable: false,
      isVisible: false,
      trackInventory: true,
      restrictSaleWithoutStock: true,
      pricing: {
        cost: 40,
        listPrice: 0,
        price: 0,
      },
      saleUnits: [],
      selectedSaleUnit: null,
      selectedSaleUnitId: null,
      qrcode: '',
      barcode: '',
      warranty: { status: false },
      weightDetail: { isSoldByWeight: false },
    });
  });

  it('restores sellable product flags when raw material role is cleared', () => {
    expect(
      getChangedProductPatch({
        key: 'inventoryRole',
        product: {
          itemType: 'product',
          inventoryRole: 'raw_material',
          trackInventory: true,
        } as never,
        value: 'sellable',
      }),
    ).toEqual({
      inventoryRole: null,
      isSellable: true,
      isVisible: true,
      trackInventory: true,
      restrictSaleWithoutStock: false,
    });
  });

  it('preserves supported product pricing currency through form and update normalization', () => {
    expect(
      normalizePricingForForm({
        currency: 'USD',
        avgPrice: 12,
        cost: 8,
        listPrice: 15,
        tax: '18',
      }),
    ).toEqual({
      currency: 'USD',
      cost: 8,
      listPrice: 15,
      tax: 18,
      midPrice: 12,
    });

    expect(
      normalizePricingForUpdate({
        currency: 'USD',
        cost: '8',
        listPrice: '15',
        midPrice: '12',
        tax: '18',
      }),
    ).toEqual({
      currency: 'USD',
      tax: 18,
      avgPrice: 12,
      cost: 8,
      listPrice: 15,
      price: 15,
    });
  });

  it('keeps ProductStudio list price as the operational price when a stale zero price is present', () => {
    expect(
      normalizePricingForUpdate({
        currency: 'DOP',
        cost: '9',
        listPrice: '15',
        price: 0,
        tax: 0,
      } as never),
    ).toEqual({
      currency: 'DOP',
      tax: 0,
      cost: 9,
      listPrice: 15,
      price: 15,
    });
  });

  it('repairs stale operational price before ProductStudio submit', () => {
    expect(
      normalizeProductForStudioSubmit({
        name: 'Codex prueba',
        pricing: {
          currency: 'DOP',
          cost: 9,
          price: 0,
          listPrice: 15,
          tax: 0,
        },
      })?.pricing,
    ).toEqual({
      currency: 'DOP',
      tax: 0,
      cost: 9,
      listPrice: 15,
      price: 15,
    });
  });

  it('cleans physical product fields before submitting a ProductStudio combo', () => {
    const result = normalizeProductForStudioSubmit({
      itemType: 'combo',
      brand: 'Marca vieja',
      stock: 8,
      trackInventory: false,
      restrictSaleWithoutStock: undefined,
      saleUnits: [{ id: 'box' }],
      combo: {
        inventoryPolicy: 'self',
        components: [{ productId: 'component-1', quantity: 2 }],
      },
      pricing: {
        currency: 'DOP',
        listPrice: 250,
        price: 0,
        tax: 18,
      },
      warranty: { status: true },
      weightDetail: { isSoldByWeight: true },
    } as never);

    expect(result).toMatchObject({
      itemType: 'combo',
      brand: 'Sin marca',
      stock: 0,
      trackInventory: true,
      restrictSaleWithoutStock: true,
      saleUnits: [],
      selectedSaleUnit: null,
      selectedSaleUnitId: null,
      combo: {
        enabled: true,
        inventoryPolicy: 'components',
        components: [{ productId: 'component-1', quantity: 2 }],
      },
      pricing: {
        currency: 'DOP',
        listPrice: 250,
        price: 250,
        tax: 18,
      },
      warranty: { status: false },
      weightDetail: { isSoldByWeight: false },
    });
  });

  it('cleans physical product fields before submitting a ProductStudio service', () => {
    const result = normalizeProductForStudioSubmit({
      itemType: 'service',
      stock: 8,
      trackInventory: true,
      restrictSaleWithoutStock: true,
      saleUnits: [{ id: 'box' }],
      selectedSaleUnit: { id: 'box' },
      selectedSaleUnitId: 'box',
      productStockId: 'stock-1',
      batchId: 'batch-1',
      combo: {
        inventoryPolicy: 'components',
        components: [{ productId: 'component-1', quantity: 2 }],
      },
      pricing: {
        currency: 'DOP',
        listPrice: 250,
        price: 0,
        tax: 18,
      },
      warranty: { status: true },
      weightDetail: { isSoldByWeight: true, weight: 2, weightUnit: 'lb' },
    } as never);

    expect(result).toMatchObject({
      itemType: 'service',
      stock: 0,
      trackInventory: false,
      restrictSaleWithoutStock: false,
      saleUnits: [],
      selectedSaleUnit: null,
      selectedSaleUnitId: null,
      productStockId: null,
      batchId: null,
      combo: null,
      pricing: {
        currency: 'DOP',
        listPrice: 250,
        price: 250,
        tax: 18,
      },
      warranty: { status: false },
      weightDetail: { isSoldByWeight: false },
    });
  });

  it('cleans sale fields before submitting a ProductStudio raw material', () => {
    const result = normalizeProductForStudioSubmit({
      itemType: 'product',
      inventoryRole: 'raw_material',
      isVisible: true,
      isSellable: true,
      stock: 18,
      trackInventory: false,
      restrictSaleWithoutStock: false,
      saleUnits: [{ id: 'box' }],
      selectedSaleUnit: { id: 'box' },
      selectedSaleUnitId: 'box',
      pricing: {
        currency: 'DOP',
        cost: 25,
        listPrice: 50,
        price: 0,
        tax: 18,
      },
      warranty: { status: true },
      weightDetail: { isSoldByWeight: true, weight: 2, weightUnit: 'lb' },
      qrcode: 'QR-RAW',
      barcode: 'BAR-RAW',
    } as never);

    expect(result).toMatchObject({
      itemType: 'product',
      inventoryRole: 'raw_material',
      isVisible: false,
      isSellable: false,
      stock: 18,
      trackInventory: true,
      restrictSaleWithoutStock: true,
      saleUnits: [],
      selectedSaleUnit: null,
      selectedSaleUnitId: null,
      pricing: {
        currency: 'DOP',
        cost: 25,
        listPrice: 0,
        price: 0,
        tax: 18,
      },
      warranty: { status: false },
      weightDetail: { isSoldByWeight: false },
      qrcode: '',
      barcode: '',
    });
  });

  it('defaults ProductStudio pricing currency to DOP when the value is missing or unsupported', () => {
    expect(normalizePricingForForm({ currency: 'EUR', tax: 0 })?.currency).toBe(
      'DOP',
    );
    expect(normalizePricingForUpdate({ tax: 0 }).currency).toBe('DOP');
  });
});
