import { describe, expect, it } from 'vitest';

import type { InvoiceProduct } from '@/types/invoice';

import {
  filterAndSortProducts,
  getCategoryStats,
  getSafeCategoryFilter,
  PRODUCT_SORT_OPTIONS,
} from './productDataUtils';

const products: InvoiceProduct[] = [
  {
    id: 'banana',
    name: 'Banana',
    category: { name: 'Frutas' },
    stock: 3,
    amountToBuy: 1,
    pricing: { price: 20, tax: 0 },
  },
  {
    id: 'arroz',
    name: 'Arroz',
    category: 'Granos',
    stock: 7,
    amountToBuy: 1,
    pricing: { price: 5, tax: 0 },
  },
  {
    id: 'cafe',
    name: 'Cafe',
    category: { name: 'Granos' },
    stock: 1,
    amountToBuy: 1,
    pricing: { price: 15, tax: 0 },
  },
];

describe('productDataUtils', () => {
  it('exposes the shared product sort options', () => {
    expect(PRODUCT_SORT_OPTIONS).toEqual([
      { label: 'Producto', value: 'name' },
      { label: 'Precio', value: 'price' },
      { label: 'Stock', value: 'stock' },
    ]);
  });

  it('falls back to all when the selected category is no longer available', () => {
    const categoryStats = getCategoryStats(products);

    expect(getSafeCategoryFilter('Granos', categoryStats)).toBe('Granos');
    expect(getSafeCategoryFilter('Lacteos', categoryStats)).toBe('all');
    expect(getSafeCategoryFilter('all', categoryStats)).toBe('all');
  });

  it('filters by search and category before sorting by total price', () => {
    const result = filterAndSortProducts({
      products,
      searchTerm: ' a ',
      categoryFilter: 'Granos',
      sortField: 'price',
      sortDirection: 'desc',
    });

    expect(result.map((product) => product.id)).toEqual(['cafe', 'arroz']);
  });

  it('sorts by stock without mutating the original list', () => {
    const result = filterAndSortProducts({
      products,
      searchTerm: '',
      categoryFilter: 'all',
      sortField: 'stock',
      sortDirection: 'desc',
    });

    expect(result.map((product) => product.id)).toEqual([
      'arroz',
      'banana',
      'cafe',
    ]);
    expect(products.map((product) => product.id)).toEqual([
      'banana',
      'arroz',
      'cafe',
    ]);
  });

  it('uses name ordering when the sort field is unknown', () => {
    const result = filterAndSortProducts({
      products,
      searchTerm: '',
      categoryFilter: 'all',
      sortField: 'unknown',
      sortDirection: 'asc',
    });

    expect(result.map((product) => product.id)).toEqual([
      'arroz',
      'banana',
      'cafe',
    ]);
  });
});
