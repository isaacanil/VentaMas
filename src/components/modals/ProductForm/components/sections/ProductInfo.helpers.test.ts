import { describe, expect, it } from 'vitest';

import {
  getProductBrandFieldMeta,
  getProductOptionText,
  matchesProductOptionText,
} from './ProductInfo.helpers';

describe('ProductInfo helpers', () => {
  it('resuelve meta de marca segun familia de producto', () => {
    expect(getProductBrandFieldMeta('Farmacia')).toMatchObject({
      label: 'Marca / Laboratorio',
    });
    expect(getProductBrandFieldMeta('Bebidas')).toMatchObject({
      label: 'Marca / Casa comercial',
    });
    expect(getProductBrandFieldMeta('Cosméticos')).toMatchObject({
      label: 'Marca / Línea',
    });
    expect(getProductBrandFieldMeta('Electrónica')).toMatchObject({
      label: 'Marca',
    });
  });

  it('normaliza texto de opciones simples y compuestas', () => {
    expect(getProductOptionText('Categoría')).toBe('Categoría');
    expect(getProductOptionText(['Marca', 'Demo', 2026])).toBe(
      'Marca Demo 2026',
    );
    expect(getProductOptionText(null)).toBe('');
  });

  it('filtra opciones con la misma regla para Select label y children', () => {
    expect(matchesProductOptionText('demo', 'Marca Demo')).toBe(true);
    expect(matchesProductOptionText('2026', ['Marca', 2026])).toBe(true);
    expect(matchesProductOptionText('otro', 'Marca Demo')).toBe(false);
  });
});
