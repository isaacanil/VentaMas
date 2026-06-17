import { describe, expect, it } from 'vitest';

import { resolveProductDisplayName } from './display';

describe('resolveProductDisplayName', () => {
  it('uses name, productName, id, then fallback in order', () => {
    expect(
      resolveProductDisplayName(
        { id: 'product-1', name: '  Acetaminofen  ', productName: 'Ibuprofeno' },
        'este producto',
      ),
    ).toBe('Acetaminofen');

    expect(
      resolveProductDisplayName(
        { id: 'product-1', productName: 'Ibuprofeno' },
        'este producto',
      ),
    ).toBe('Ibuprofeno');

    expect(resolveProductDisplayName({ id: 'product-1' }, 'este producto')).toBe(
      'product-1',
    );

    expect(resolveProductDisplayName({}, 'este producto')).toBe('este producto');
  });
});
