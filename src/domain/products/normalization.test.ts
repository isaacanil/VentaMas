import { describe, expect, it } from 'vitest';

import { normalizeItemType, parseBooleanValue } from './normalization';

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
