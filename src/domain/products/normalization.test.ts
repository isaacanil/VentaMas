import { describe, expect, it } from 'vitest';

import {
  buildSanitizedProductForSubmit,
  normalizeItemType,
  normalizeProductForRead,
  normalizePricingForPersistence,
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
});
