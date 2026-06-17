import { describe, expect, it } from 'vitest';

import { buildProductStockPath } from './ProductStockTab.utils';

describe('buildProductStockPath', () => {
  it('uses the mounted product stock route', () => {
    expect(buildProductStockPath('product-123')).toBe(
      '/inventory/warehouses/products-stock/product-123',
    );
  });
});
