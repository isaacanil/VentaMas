import { describe, expect, it } from 'vitest';

import { transformConfig } from './transformFunctions';

const transformField = (field: string, value: unknown) => {
  const entry = transformConfig.find((candidate) => candidate.field === field);
  if (!entry?.transform) {
    throw new Error(`Missing transform for ${field}`);
  }
  return entry.transform(value, {});
};

describe('product import transformConfig', () => {
  it('uses canonical item type aliases from the product domain', () => {
    expect(transformField('itemType', 'productos')).toBe('product');
    expect(transformField('itemType', 'servicios')).toBe('service');
    expect(transformField('itemType', 'combinados')).toBe('combo');
  });

  it('keeps product import boolean defaults while sharing the parser', () => {
    expect(transformField('isVisible', '')).toBe(true);
    expect(transformField('isVisible', 'no')).toBe(false);
    expect(transformField('trackInventory', '')).toBeNull();
    expect(transformField('trackInventory', 'sí')).toBe(true);
    expect(transformField('restrictSaleWithoutStock', '')).toBe(false);
    expect(transformField('restrictSaleWithoutStock', '1')).toBe(true);
  });

  it('parses localized currency and percent values', () => {
    expect(transformField('pricing.price', '$1,234.56')).toBe(1234.56);
    expect(transformField('pricing.price', 'RD$ 1,234.56')).toBe(1234.56);
    expect(transformField('pricing.cost', '$ 1.234,56')).toBe(1234.56);
    expect(transformField('pricing.cost', 'DOP 1.234,56')).toBe(1234.56);
    expect(transformField('pricing.tax', '18%')).toBe(18);
    expect(transformField('pricing.tax', '0,18')).toBe(18);
  });

  it('keeps product currency fallback behavior for accounting parentheses', () => {
    expect(transformField('pricing.price', '(1,234.56)')).toBe(0);
  });
});
