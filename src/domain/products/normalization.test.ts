import { describe, expect, it } from 'vitest';

import {
  buildSanitizedProductForSubmit,
  normalizeItemType,
  normalizeProductInventoryRole,
  normalizeProductForRead,
  normalizePricingForPersistence,
  normalizeComboComponents,
  parseBooleanValue,
  resolveCanonicalListPrice,
} from './normalization';

describe('normalizeItemType', () => {
  it('normalizes singular and plural product item type aliases', () => {
    expect(normalizeItemType('productos')).toBe('product');
    expect(normalizeItemType('services')).toBe('service');
    expect(normalizeItemType('combinados')).toBe('combo');
  });

  it('falls back to raw type hints when itemType is missing', () => {
    expect(normalizeItemType('', 'Servicio de instalacion')).toBe('service');
    expect(normalizeItemType(null, 'Kit promocional')).toBe('combo');
  });
});

describe('parseBooleanValue', () => {
  it('parses localized boolean-like values without applying defaults', () => {
    expect(parseBooleanValue('sí')).toBe(true);
    expect(parseBooleanValue('s\uFFFD')).toBe(true);
    expect(parseBooleanValue('no')).toBe(false);
    expect(parseBooleanValue('')).toBeNull();
  });
});

describe('normalizeProductInventoryRole', () => {
  it('normalizes raw material aliases only for physical products', () => {
    expect(normalizeProductInventoryRole('materia prima', 'product')).toBe(
      'raw_material',
    );
    expect(normalizeProductInventoryRole('raw-material', 'product')).toBe(
      'raw_material',
    );
    expect(normalizeProductInventoryRole('raw_material', 'service')).toBeNull();
  });
});

describe('normalizePricingForPersistence', () => {
  it('treats listPrice as the canonical persisted sale price', () => {
    expect(
      normalizePricingForPersistence({
        price: 150,
        listPrice: 120,
        avgPrice: undefined,
        minPrice: undefined,
      }),
    ).toMatchObject({
      price: 120,
      listPrice: 120,
      avgPrice: 120,
      minPrice: 120,
    });
  });

  it('backfills legacy listPrice from price before enforcing the invariant', () => {
    expect(
      normalizePricingForPersistence({
        price: 85,
        listPrice: 0,
      }),
    ).toMatchObject({
      price: 85,
      listPrice: 85,
    });
  });
});

describe('normalizeProductForRead', () => {
  it('normalizes legacy read snapshots without mutating the source object', () => {
    const source = {
      id: 'product-1',
      pricing: {
        price: 75,
        listPrice: 0,
      },
      saleUnits: [
        {
          id: 'box',
          pricing: {
            price: 1000,
            listPrice: 900,
          },
        },
      ],
    } as any;

    const normalized = normalizeProductForRead(source);

    expect(normalized.pricing).toMatchObject({
      price: 75,
      listPrice: 75,
    });
    expect(normalized.saleUnits?.[0]?.pricing).toMatchObject({
      price: 900,
      listPrice: 900,
    });
    expect(source.pricing).toEqual({
      price: 75,
      listPrice: 0,
    });
  });
});

describe('normalizeComboComponents', () => {
  it('keeps only valid component rows with a product id and positive quantity', () => {
    expect(
      normalizeComboComponents([
        {
          id: 'line-1',
          productId: ' product-1 ',
          productName: '  Producto base  ',
          quantity: '2',
          unitName: 'Unidad',
        },
        { productId: 'product-2', quantity: 0 },
        { productName: 'Sin producto', quantity: 1 },
        null,
      ]),
    ).toEqual([
      {
        id: 'line-1',
        productId: 'product-1',
        productName: 'Producto base',
        quantity: 2,
        unitName: 'Unidad',
      },
    ]);
  });

  it('consolidates repeated component products by summing quantities', () => {
    expect(
      normalizeComboComponents([
        {
          id: 'line-1',
          productId: 'coffee',
          productName: 'Cafe',
          quantity: 2,
          sku: 'CAF-1',
        },
        {
          id: 'line-2',
          productId: ' coffee ',
          productName: 'Cafe duplicado',
          quantity: '1.5',
        },
      ]),
    ).toEqual([
      {
        id: 'line-1',
        productId: 'coffee',
        productName: 'Cafe',
        quantity: 3.5,
        sku: 'CAF-1',
      },
    ]);
  });
});

describe('resolveCanonicalListPrice', () => {
  it('prefers listPrice and falls back to legacy price', () => {
    expect(resolveCanonicalListPrice({ price: 20, listPrice: 30 })).toBe(30);
    expect(resolveCanonicalListPrice({ price: 20, listPrice: 0 })).toBe(20);
    expect(resolveCanonicalListPrice({ price: 0, listPrice: 0 })).toBe(0);
  });
});

describe('buildSanitizedProductForSubmit', () => {
  it('normaliza presentaciones de venta antes de persistir', () => {
    const sanitized = buildSanitizedProductForSubmit({
      id: 'product-1',
      name: 'Producto prueba',
      stock: 10,
      packSize: 1,
      pricing: {
        currency: 'DOP',
        price: 100,
        listPrice: 100,
        tax: 18,
      },
      saleUnits: [
        {
          id: 'box',
          unitName: 'Caja',
          conversionFactorToBase: 12,
          pricing: {
            listPrice: 950,
            tax: 18,
          },
          allowFractional: true,
          active: true,
        },
      ],
    } as any);

    expect(sanitized?.saleUnits?.[0]).toMatchObject({
      id: 'box',
      unitName: 'Caja',
      conversionFactorToBase: 12,
      quantity: 12,
      allowFractional: true,
      active: true,
      pricing: {
        price: 950,
        listPrice: 950,
      },
    });
  });

  it('persists combo recipes as component-tracked kits', () => {
    const sanitized = buildSanitizedProductForSubmit({
      id: 'combo-1',
      name: 'Combo desayuno',
      itemType: 'combo',
      stock: 12,
      packSize: 1,
      pricing: {
        currency: 'DOP',
        price: 250,
        listPrice: 250,
        tax: 18,
      },
      combo: {
        components: [
          {
            productId: 'coffee',
            productName: 'Cafe',
            quantity: 1,
          },
        ],
      },
    } as any);

    expect(sanitized).toMatchObject({
      itemType: 'combo',
      stock: 0,
      trackInventory: true,
      combo: {
        enabled: true,
        inventoryPolicy: 'components',
        components: [
          {
            productId: 'coffee',
            productName: 'Cafe',
            quantity: 1,
          },
        ],
      },
    });
  });

  it('clears stale combo recipes when the item is no longer a combo', () => {
    const sanitized = buildSanitizedProductForSubmit({
      id: 'product-1',
      name: 'Producto normal',
      itemType: 'product',
      stock: 1,
      packSize: 1,
      combo: {
        inventoryPolicy: 'components',
        components: [{ productId: 'component-1', quantity: 1 }],
      },
    } as any);

    expect(sanitized?.combo).toBeNull();
  });

  it('clears physical inventory fields for services before submit', () => {
    const sanitized = buildSanitizedProductForSubmit({
      id: 'service-1',
      name: 'Instalacion',
      itemType: 'service',
      stock: 8,
      totalUnits: 80,
      packSize: 10,
      trackInventory: true,
      restrictSaleWithoutStock: true,
      productStockId: 'stock-1',
      batchId: 'batch-1',
      saleUnits: [{ id: 'box' }],
      selectedSaleUnit: { id: 'box' },
      selectedSaleUnitId: 'box',
      weightDetail: { isSoldByWeight: true, weight: 2, weightUnit: 'lb' },
      warranty: { status: true, quantity: 1, unit: 'months' },
      combo: {
        inventoryPolicy: 'components',
        components: [{ productId: 'component-1', quantity: 1 }],
      },
    } as any);

    expect(sanitized).toMatchObject({
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

  it('persists raw materials as inventory-only products', () => {
    const sanitized = buildSanitizedProductForSubmit({
      id: 'raw-1',
      name: 'Harina',
      itemType: 'product',
      inventoryRole: 'materia prima',
      isSellable: true,
      isVisible: true,
      stock: 25,
      totalUnits: 25,
      packSize: 1,
      trackInventory: false,
      restrictSaleWithoutStock: false,
      qrcode: 'QR-RAW',
      qrCode: 'QR-RAW',
      barcode: 'BAR-RAW',
      pricing: {
        currency: 'DOP',
        cost: 45,
        price: 80,
        listPrice: 80,
        avgPrice: 75,
        minPrice: 70,
        cardPrice: 85,
        offerPrice: 65,
        tax: 18,
      },
      saleUnits: [{ id: 'box', pricing: { listPrice: 900 } }],
      selectedSaleUnit: { id: 'box', pricing: { listPrice: 900 } },
      selectedSaleUnitId: 'box',
      weightDetail: { isSoldByWeight: true, weight: 1, weightUnit: 'lb' },
      warranty: { status: true, quantity: 1, unit: 'months' },
      combo: {
        inventoryPolicy: 'components',
        components: [{ productId: 'component-1', quantity: 1 }],
      },
    } as any);

    expect(sanitized).toMatchObject({
      itemType: 'product',
      inventoryRole: 'raw_material',
      isSellable: false,
      isVisible: false,
      stock: 25,
      totalUnits: 25,
      trackInventory: true,
      restrictSaleWithoutStock: true,
      qrcode: '',
      qrCode: '',
      barcode: '',
      pricing: {
        cost: 45,
        price: 0,
        listPrice: 0,
        avgPrice: 0,
        minPrice: 0,
        cardPrice: 0,
        offerPrice: 0,
      },
      saleUnits: [],
      selectedSaleUnit: null,
      selectedSaleUnitId: null,
      weightDetail: { isSoldByWeight: false },
      warranty: { status: false },
      combo: null,
    });
  });
});
