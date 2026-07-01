import { describe, expect, it } from 'vitest';

import {
  buildSaleBarcodeIndex,
  findSaleBarcodeMatch,
} from './saleBarcodeIndex';

describe('saleBarcodeIndex', () => {
  it('matches an active sale-unit barcode without replacing the base product barcode', () => {
    const product = {
      id: 'product-1',
      barcode: '000111',
      saleUnits: [
        {
          id: 'box-12',
          name: 'Caja',
          quantity: 12,
          conversionFactorToBase: 12,
          barcode: 'BOX-000111',
          active: true,
        },
      ],
    };

    const index = buildSaleBarcodeIndex([product]);

    expect(findSaleBarcodeMatch(index, '000111')).toEqual({ product });
    expect(findSaleBarcodeMatch(index, 'BOX-000111')).toEqual({
      product,
      saleUnit: product.saleUnits[0],
    });
  });

  it('indexes QR, legacy QR and SKU aliases for sale units', () => {
    const product = {
      id: 'product-1',
      saleUnits: [
        {
          id: 'pack-6',
          name: 'Paquete',
          quantity: 6,
          qrcode: 'QR-6',
          qrCode: 'QR-LEGACY-6',
          sku: 'SKU-6',
        },
      ],
    };

    const index = buildSaleBarcodeIndex([product]);

    expect(findSaleBarcodeMatch(index, 'QR-6')?.saleUnit?.id).toBe('pack-6');
    expect(findSaleBarcodeMatch(index, 'QR-LEGACY-6')?.saleUnit?.id).toBe(
      'pack-6',
    );
    expect(findSaleBarcodeMatch(index, 'SKU-6')?.saleUnit?.id).toBe('pack-6');
  });

  it('ignores inactive sale units and keeps the first matching barcode', () => {
    const firstProduct = {
      id: 'product-1',
      barcode: 'DUP-1',
      saleUnits: [
        {
          id: 'inactive-box',
          name: 'Caja vieja',
          quantity: 12,
          barcode: 'INACTIVE-12',
          active: false,
        },
      ],
    };
    const secondProduct = {
      id: 'product-2',
      barcode: 'DUP-1',
    };

    const index = buildSaleBarcodeIndex([firstProduct, secondProduct]);

    expect(findSaleBarcodeMatch(index, 'INACTIVE-12')).toBeUndefined();
    expect(findSaleBarcodeMatch(index, 'DUP-1')?.product.id).toBe('product-1');
  });
});
