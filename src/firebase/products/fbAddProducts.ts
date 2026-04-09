import type { ProductPricing, ProductRecord } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';

import { fbAddProduct } from './fbAddProduct';

type UserWithBusinessAndUid = UserWithBusiness & { uid: string };

type ProductImport = ProductRecord & {
  id?: string;
  name?: string;
  stock?: number;
  pricing?: ProductPricing;
  category?: string;
  activeIngredients?: string[] | string | null;
  barcode?: string | number;
};

type ImportStats = {
  totalProducts: number;
  processedProducts: number;
  updatedProducts: number;
  newProducts: number;
  newCategories: number;
  newIngredients: number;
  updatedIngredients: number;
  batchOperations: number;
};

class ImportProgress {
  stats: ImportStats;

  constructor() {
    this.stats = {
      totalProducts: 0,
      processedProducts: 0,
      updatedProducts: 0,
      newProducts: 0,
      newCategories: 0,
      newIngredients: 0,
      updatedIngredients: 0,
      batchOperations: 0,
    };
  }

  updateProgress(field: keyof ImportStats, value = 1) {
    this.stats[field] += value;
  }
}

export function validateProductPricing(product: ProductImport): ProductImport {
  const toNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const next = { ...product };
  if (!next.pricing) {
    next.pricing = {
      price: 0,
      listPrice: 0,
      avgPrice: 0,
      minPrice: 0,
      cardPrice: 0,
      offerPrice: 0,
    };
    return next;
  }

  const price = toNumber(next.pricing.price);
  const listPrice = toNumber(next.pricing.listPrice);
  const hasPrice = price > 0;
  const hasListPrice = listPrice > 0;

  const resolvedListPrice = hasListPrice ? listPrice : hasPrice ? price : 0;
  const resolvedPrice = hasPrice ? price : resolvedListPrice;

  next.pricing = {
    ...next.pricing,
    listPrice: resolvedListPrice,
    price: resolvedPrice,
  };
  return next;
}

const normalizeActiveIngredients = (
  activeIngredients: ProductImport['activeIngredients'],
): string[] => {
  if (Array.isArray(activeIngredients)) {
    return activeIngredients
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }

  if (typeof activeIngredients === 'string') {
    return activeIngredients
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const sanitizeProduct = (product: ProductImport): ProductImport => {
  const next = validateProductPricing(product);
  const normalizedName =
    typeof next.name === 'string' ? next.name.trim() : '';

  return {
    ...next,
    name: normalizedName,
    activeIngredients: normalizeActiveIngredients(next.activeIngredients),
    stock: Number(next.stock || 0),
  };
};

export const fbAddProducts = async (
  user: UserWithBusinessAndUid,
  products: ProductImport[],
  maxProducts = 10000,
  onProgress?: (progress: ImportProgress) => void,
): Promise<void> => {
  const progress = new ImportProgress();
  const limitedProducts = products.slice(0, Math.min(maxProducts, 10000));
  progress.stats.totalProducts = limitedProducts.length;
  onProgress?.(progress);

  for (const rawProduct of limitedProducts) {
    const product = sanitizeProduct(rawProduct);

    if (!product.name) {
      progress.updateProgress('processedProducts');
      onProgress?.(progress);
      continue;
    }

    await fbAddProduct(product, user);
    progress.updateProgress('processedProducts');
    progress.updateProgress('newProducts');
    progress.updateProgress('batchOperations');
    onProgress?.(progress);
  }
};
