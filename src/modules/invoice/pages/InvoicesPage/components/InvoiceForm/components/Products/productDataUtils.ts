import type { InvoiceProduct } from '@/types/invoice';
import { getTotalPrice } from '@/utils/pricing';
import { normalizedIncludes } from '@/utils/searchText';

export type CategoryLike = string | { name?: string | null } | null | undefined;
type ActiveIngredientLike =
  | string
  | { name?: string | null }
  | Array<string | { name?: string | null }>
  | null
  | undefined;

export type ProductSortDirection = 'asc' | 'desc';
export type ProductSortField = 'name' | 'price' | 'stock';

export interface ProductSortOption {
  label: string;
  value: ProductSortField;
}

export interface CategoryStatEntry {
  name: string;
  count: number;
}

export interface CategoryStats {
  total: number;
  entries: CategoryStatEntry[];
}

interface FilterAndSortProductsOptions {
  products: InvoiceProduct[] | null | undefined;
  searchTerm: string;
  categoryFilter: string;
  sortField: string;
  sortDirection: ProductSortDirection;
}

export const PRODUCT_SORT_OPTIONS: ProductSortOption[] = [
  { label: 'Producto', value: 'name' },
  { label: 'Precio', value: 'price' },
  { label: 'Stock', value: 'stock' },
];

export const getCategoryName = (categoryRaw: CategoryLike) => {
  if (!categoryRaw) return null;

  if (typeof categoryRaw === 'string') {
    const trimmed = categoryRaw.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (
    typeof categoryRaw === 'object' &&
    typeof categoryRaw?.name === 'string'
  ) {
    const trimmed = categoryRaw.name.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
};

export const getPrimaryActiveIngredient = (
  activeIngredientRaw: ActiveIngredientLike,
) => {
  if (!activeIngredientRaw) return null;

  if (Array.isArray(activeIngredientRaw)) {
    const firstItem = activeIngredientRaw[0];
    if (!firstItem) return null;
    if (typeof firstItem === 'string') {
      const trimmed = firstItem.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    if (typeof firstItem === 'object' && typeof firstItem?.name === 'string') {
      const trimmed = firstItem.name.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return null;
  }

  if (typeof activeIngredientRaw === 'string') {
    const trimmed = activeIngredientRaw.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (
    typeof activeIngredientRaw === 'object' &&
    typeof activeIngredientRaw?.name === 'string'
  ) {
    const trimmed = activeIngredientRaw.name.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
};

export const getCategoryStats = (products: InvoiceProduct[]): CategoryStats => {
  const list = Array.isArray(products) ? products : [];

  const counts = list.reduce<Record<string, number>>((accumulator, product) => {
    const categoryName = getCategoryName(product?.category);
    if (!categoryName) return accumulator;
    accumulator[categoryName] = (accumulator[categoryName] ?? 0) + 1;
    return accumulator;
  }, {});

  const entries = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    total: list.length,
    entries,
  };
};

export const getSafeCategoryFilter = (
  categoryFilter: string,
  categoryStats: CategoryStats,
) => {
  if (categoryFilter === 'all') return 'all';
  const hasSelectedCategory = categoryStats.entries.some(
    (entry) => entry.name === categoryFilter,
  );
  return hasSelectedCategory ? categoryFilter : 'all';
};

export const filterAndSortProducts = ({
  products,
  searchTerm,
  categoryFilter,
  sortField,
  sortDirection,
}: FilterAndSortProductsOptions) => {
  const list = Array.isArray(products) ? products : [];

  const filteredBySearch = list.filter((product) =>
    normalizedIncludes(product?.name ?? '', searchTerm),
  );

  const filtered =
    categoryFilter === 'all'
      ? filteredBySearch
      : filteredBySearch.filter(
          (product) =>
            getCategoryName(product?.category as CategoryLike) ===
            categoryFilter,
        );

  const directionMultiplier = sortDirection === 'desc' ? -1 : 1;

  return [...filtered].sort((a, b) => {
    switch (sortField) {
      case 'price':
        return (getTotalPrice(a) - getTotalPrice(b)) * directionMultiplier;
      case 'stock':
        return ((a?.stock ?? 0) - (b?.stock ?? 0)) * directionMultiplier;
      case 'name':
      default:
        return (
          (a?.name ?? '').localeCompare(b?.name ?? '') * directionMultiplier
        );
    }
  });
};
