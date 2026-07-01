import { describe, expect, it, vi } from 'vitest';

vi.mock('./fbAddProduct', () => ({
  fbAddProduct: vi.fn(),
}));

import { validateProductPricing } from './fbAddProducts';

describe('validateProductPricing', () => {
  it('keeps imported price aligned to listPrice when both are present', () => {
    expect(
      validateProductPricing({
        name: 'Producto importado',
        pricing: {
          price: 150,
          listPrice: 120,
        },
      }).pricing,
    ).toMatchObject({
      price: 120,
      listPrice: 120,
    });
  });

  it('backfills missing listPrice from legacy price values', () => {
    expect(
      validateProductPricing({
        name: 'Producto legacy',
        pricing: {
          price: 80,
          listPrice: 0,
        },
      }).pricing,
    ).toMatchObject({
      price: 80,
      listPrice: 80,
    });
  });
});
