import type { ProductItemType } from '@/types/products';

import {
  normalizeItemType,
  normalizeTrackInventoryValue,
  parseBooleanValue,
} from './normalization';

type ProductInventoryLike = {
  itemType?: unknown;
  type?: unknown;
  trackInventory?: unknown;
  restrictSaleWithoutStock?: unknown;
};

const toProductInventoryRecord = (
  product: unknown,
): ProductInventoryLike | null => {
  if (!product || typeof product !== 'object') return null;
  return product as ProductInventoryLike;
};

export function resolveProductInventoryItemType(
  product: unknown,
): ProductItemType {
  const record = toProductInventoryRecord(product);
  return normalizeItemType(record?.itemType, record?.type);
}

export function isServiceProduct(product: unknown): boolean {
  return resolveProductInventoryItemType(product) === 'service';
}

export function resolveProductInventoryTracking(product: unknown): boolean {
  const record = toProductInventoryRecord(product);
  if (!record) return false;
  return normalizeTrackInventoryValue(
    record.trackInventory,
    resolveProductInventoryItemType(record),
  );
}

export function isProductExplicitlyInventoryTracked(product: unknown): boolean {
  const record = toProductInventoryRecord(product);
  if (!record) return false;
  return record.trackInventory === true;
}

export function isProductExplicitlyNotInventoryTracked(
  product: unknown,
): boolean {
  const record = toProductInventoryRecord(product);
  if (!record) return false;
  return record.trackInventory === false;
}

export function isProductInventoryTrackingEnabled(product: unknown): boolean {
  const record = toProductInventoryRecord(product);
  if (!record) return false;
  return parseBooleanValue(record.trackInventory) === true;
}

export function isProductInventoryTrackingDisabled(product: unknown): boolean {
  const record = toProductInventoryRecord(product);
  if (!record) return false;
  return parseBooleanValue(record.trackInventory) === false;
}

export function shouldResolveProductPhysicalStock(product: unknown): boolean {
  const record = toProductInventoryRecord(product);
  if (!record) return false;
  if (record.restrictSaleWithoutStock === true) return true;
  if (isProductExplicitlyNotInventoryTracked(record)) return false;
  if (isServiceProduct(record)) return false;
  return true;
}

export function isInventoriableProduct(product: unknown): boolean {
  return resolveProductInventoryTracking(product);
}

export function filterInventoriableProducts<T>(products: T[]): T[] {
  if (!Array.isArray(products)) return [];
  return products.filter(isInventoriableProduct);
}

