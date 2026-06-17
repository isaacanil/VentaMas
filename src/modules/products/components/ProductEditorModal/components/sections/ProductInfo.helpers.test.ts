import { describe, expect, it } from 'vitest';

import { getProductBrandFieldMeta } from './ProductInfo.helpers';

describe('ProductInfo.helpers', () => {
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
});
