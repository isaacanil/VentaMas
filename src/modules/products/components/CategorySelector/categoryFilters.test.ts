import { describe, expect, it } from 'vitest';

import { filterFavoriteProductCategories } from './categoryFilters';

describe('CategorySelector category filters', () => {
  it('keeps only categories whose nested category id is marked as favorite', () => {
    const categories = [
      { category: { id: 'cat-1', name: 'General' } },
      { category: { id: 'cat-2', name: 'Medicinas' } },
      { category: { id: 'cat-3', name: 'Servicios' } },
    ];

    expect(filterFavoriteProductCategories(categories, ['cat-2'])).toEqual([
      { category: { id: 'cat-2', name: 'Medicinas' } },
    ]);
  });
});
