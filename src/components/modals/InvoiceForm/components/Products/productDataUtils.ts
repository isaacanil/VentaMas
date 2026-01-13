import type { InvoiceProduct } from '@/types/invoice';

export type CategoryLike =
  | string
  | { name?: string | null }
  | null
  | undefined;
type ActiveIngredientLike =
  | string
  | { name?: string | null }
  | Array<string | { name?: string | null }>
  | null
  | undefined;

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

export const getCategoryStats = (products: InvoiceProduct[]) => {
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
