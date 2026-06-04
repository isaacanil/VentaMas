import { describe, expect, it } from 'vitest';

import { PRODUCT_BRAND_DEFAULT } from '@/features/updateProduct/updateProductSlice';

import {
  BRAND_DEFAULT_OPTION_VALUE,
  BRAND_LEGACY_OPTION_VALUE,
} from '../constants/brandOptions';
import {
  buildBrandOptions,
  normalizeProductBrandName,
  resolveBrandSelection,
} from './brandSelection';

describe('brandSelection', () => {
  it('normaliza marca libre con espacios y fallback por defecto', () => {
    expect(normalizeProductBrandName('  Marca   Demo  ')).toBe('Marca Demo');
    expect(normalizeProductBrandName('   ')).toBe(PRODUCT_BRAND_DEFAULT);
    expect(normalizeProductBrandName(null)).toBe(PRODUCT_BRAND_DEFAULT);
  });

  it('construye opciones con default, marcas validas y marca legacy', () => {
    expect(
      buildBrandOptions(
        [
          { id: 'brand-1', name: '  Genfar ' },
          { id: 'brand-empty', name: '   ' },
          { id: null, name: 'Sin id' },
        ],
        { brand: 'Legacy Brand', brandId: null },
      ),
    ).toEqual([
      { value: BRAND_DEFAULT_OPTION_VALUE, label: PRODUCT_BRAND_DEFAULT },
      { value: 'brand-1', label: 'Genfar' },
      { value: BRAND_LEGACY_OPTION_VALUE, label: 'Legacy Brand' },
    ]);
  });

  it('resuelve brandId hacia nombre de marca catalogada', () => {
    expect(
      resolveBrandSelection({
        value: ' brand-1 ',
        productBrands: [{ id: 'brand-1', name: '  Pfizer  ' }],
      }),
    ).toEqual({ brandId: 'brand-1', brand: 'Pfizer' });
  });

  it('resuelve default y legacy conservando el contrato previo', () => {
    expect(
      resolveBrandSelection({
        value: BRAND_DEFAULT_OPTION_VALUE,
        product: { brand: 'Legacy Brand', brandId: null },
      }),
    ).toEqual({
      brandId: BRAND_DEFAULT_OPTION_VALUE,
      brand: PRODUCT_BRAND_DEFAULT,
    });

    expect(
      resolveBrandSelection({
        value: BRAND_LEGACY_OPTION_VALUE,
        product: { brand: 'Legacy Brand', brandId: null },
      }),
    ).toEqual({
      brandId: BRAND_LEGACY_OPTION_VALUE,
      brand: 'Legacy Brand',
    });
  });
});
