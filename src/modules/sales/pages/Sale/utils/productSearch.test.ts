import { describe, expect, it } from 'vitest';

import {
  buildProductSearchIndex,
  normalizeProductSearchTerm,
} from './productSearch';

describe('productSearch', () => {
  it('normaliza acentos y encuentra valores anidados', () => {
    const searchIndex = buildProductSearchIndex({
      name: 'Té Verde',
      barcode: '12345',
      category: 'Bebidas',
      pricing: {
        description: 'Infusión natural',
      },
    });

    expect(searchIndex).toContain('te verde');
    expect(searchIndex).toContain('12345');
    expect(searchIndex).toContain('infusion natural');
    expect(searchIndex.includes(normalizeProductSearchTerm('infusión'))).toBe(
      true,
    );
  });

  it('tolera referencias circulares sin lanzar errores', () => {
    const source: Record<string, unknown> = {
      name: 'Producto Circular',
    };
    source.self = source;

    expect(() => buildProductSearchIndex(source)).not.toThrow();
    expect(buildProductSearchIndex(source)).toContain('producto circular');
  });
});
