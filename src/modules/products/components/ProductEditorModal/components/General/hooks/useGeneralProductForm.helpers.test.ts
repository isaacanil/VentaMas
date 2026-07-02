import { describe, expect, it } from 'vitest';

import {
  buildInventoryRoleChangePatchForModal,
  buildItemTypeChangePatchForModal,
  normalizeComboChangeForModal,
  normalizeSaleUnitsChangeForModal,
  withComboInventoryPolicyForSubmit,
} from './useGeneralProductForm.helpers';

describe('normalizeSaleUnitsChangeForModal', () => {
  it('usa allValues para no perder filas completas cuando Form.List emite cambios parciales', () => {
    const result = normalizeSaleUnitsChangeForModal(
      {
        saleUnits: [
          {
            pricing: {
              listPrice: 250,
            },
          },
        ],
      } as any,
      {
        saleUnits: [
          {
            id: 'box',
            unitName: 'Caja',
            conversionFactorToBase: 12,
            pricing: {
              listPrice: 250,
            },
            barcode: '123',
            active: true,
          },
          {
            id: 'half',
            unitName: 'Media libra',
            conversionFactorToBase: 0.5,
            allowFractional: true,
            pricing: {
              listPrice: 40,
            },
            active: true,
          },
        ],
      } as any,
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'box',
      unitName: 'Caja',
      conversionFactorToBase: 12,
      quantity: 12,
      barcode: '123',
      active: true,
    });
    expect(result[1]).toMatchObject({
      id: 'half',
      unitName: 'Media libra',
      conversionFactorToBase: 0.5,
      quantity: 0.5,
      allowFractional: true,
    });
  });
});

describe('normalizeComboChangeForModal', () => {
  it('usa allValues para conservar filas completas y fuerza inventario por componentes', () => {
    const result = normalizeComboChangeForModal(
      {
        combo: {
          components: [
            {
              quantity: 2,
            },
          ],
        },
      } as any,
      {
        combo: {
          inventoryPolicy: 'self',
          components: [
            {
              id: 'line-1',
              productId: 'product-1',
              productName: 'Producto 1',
              quantity: 2,
            },
            {
              productId: 'product-2',
              quantity: 0,
            },
          ],
        },
      } as any,
    );

    expect(result).toEqual({
      enabled: true,
      inventoryPolicy: 'components',
      components: [
        {
          id: 'line-1',
          productId: 'product-1',
          productName: 'Producto 1',
          quantity: 2,
        },
      ],
    });
  });
});

describe('withComboInventoryPolicyForSubmit', () => {
  it('deja los combos con politica components antes de guardar', () => {
    const result = withComboInventoryPolicyForSubmit({
      id: 'combo-1',
      itemType: 'combo',
      combo: {
        inventoryPolicy: 'self',
        components: [{ productId: 'product-1', quantity: 1 }],
      },
    } as any);

    expect(result.combo).toMatchObject({
      enabled: true,
      inventoryPolicy: 'components',
      components: [{ productId: 'product-1', quantity: 1 }],
    });
  });

  it('limpia recetas viejas cuando el producto ya no es combo', () => {
    const product = {
      id: 'product-1',
      itemType: 'product',
      combo: {
        inventoryPolicy: 'self',
        components: [{ productId: 'component-1', quantity: 1 }],
      },
    } as any;

    expect(withComboInventoryPolicyForSubmit(product)).toMatchObject({
      id: 'product-1',
      itemType: 'product',
      combo: null,
    });
  });
});

describe('buildItemTypeChangePatchForModal', () => {
  it('prepara un contrato minimo cuando el usuario selecciona combo', () => {
    const result = buildItemTypeChangePatchForModal('combo', {
      trackInventory: false,
      brand: 'Marca vieja',
      brandId: 'brand-1',
      netContent: '500 ml',
      size: 'Grande',
      activeIngredients: 'Cafeina',
      measurement: 'Unidad',
      footer: 'Texto viejo',
      weightDetail: { isSoldByWeight: true, weight: 2, weightUnit: 'lb' },
      warranty: { status: true, quantity: 3, unit: 'months' },
      combo: {
        components: [{ productId: 'component-1', quantity: 2 }],
      },
      saleUnits: [{ id: 'box' }],
    } as any);

    expect(result).toMatchObject({
      itemType: 'combo',
      brand: 'Sin marca',
      brandId: null,
      netContent: '',
      size: '',
      activeIngredients: '',
      measurement: '',
      footer: '',
      trackInventory: true,
      stock: 0,
      packSize: 1,
      isVisible: true,
      saleUnits: [],
      selectedSaleUnit: null,
      selectedSaleUnitId: null,
      restrictSaleWithoutStock: true,
      weightDetail: { isSoldByWeight: false },
      warranty: { status: false },
      combo: {
        enabled: true,
        inventoryPolicy: 'components',
        components: [{ productId: 'component-1', quantity: 2 }],
      },
    });
  });

  it('preserva el tipo comercial al salir de combo hacia producto', () => {
    const result = buildItemTypeChangePatchForModal('product', {
      itemType: 'combo',
      type: 'Combo',
      trackInventory: true,
    } as any);

    expect(result).toMatchObject({
      itemType: 'product',
      combo: null,
      trackInventory: true,
    });
    expect(result).not.toHaveProperty('type');
  });

  it('prepara un contrato de servicio sin campos de inventario fisico', () => {
    const result = buildItemTypeChangePatchForModal('service', {
      itemType: 'product',
      stock: 12,
      totalUnits: 120,
      packSize: 10,
      trackInventory: true,
      restrictSaleWithoutStock: true,
      productStockId: 'stock-1',
      batchId: 'batch-1',
      weightDetail: { isSoldByWeight: true, weight: 2, weightUnit: 'lb' },
      warranty: { status: true, quantity: 3, unit: 'months' },
      combo: {
        components: [{ productId: 'component-1', quantity: 2 }],
      },
      saleUnits: [{ id: 'box' }],
      selectedSaleUnit: { id: 'box' },
      selectedSaleUnitId: 'box',
    } as any);

    expect(result).toMatchObject({
      itemType: 'service',
      trackInventory: false,
      stock: 0,
      totalUnits: null,
      packSize: 1,
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
});

describe('buildInventoryRoleChangePatchForModal', () => {
  it('prepara materia prima como producto inventariable no vendible', () => {
    const result = buildInventoryRoleChangePatchForModal('raw_material', {
      itemType: 'product',
      isVisible: true,
      isSellable: true,
      trackInventory: false,
      restrictSaleWithoutStock: false,
      pricing: {
        currency: 'DOP',
        cost: 35,
        listPrice: 80,
        price: 80,
      },
      saleUnits: [{ id: 'box' }],
      selectedSaleUnit: { id: 'box' },
      selectedSaleUnitId: 'box',
      qrcode: 'QR-RAW',
      barcode: 'BAR-RAW',
      warranty: { status: true },
      weightDetail: { isSoldByWeight: true },
    } as any);

    expect(result).toMatchObject({
      itemType: 'product',
      inventoryRole: 'raw_material',
      isSellable: false,
      isVisible: false,
      trackInventory: true,
      restrictSaleWithoutStock: true,
      pricing: {
        cost: 35,
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

  it('restaura flags comerciales cuando se vuelve a producto vendible', () => {
    expect(
      buildInventoryRoleChangePatchForModal('sellable', {
        itemType: 'product',
        inventoryRole: 'raw_material',
        trackInventory: true,
      } as any),
    ).toEqual({
      inventoryRole: null,
      isSellable: true,
      isVisible: true,
      trackInventory: true,
      restrictSaleWithoutStock: false,
    });
  });
});
