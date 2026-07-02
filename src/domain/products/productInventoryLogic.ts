import type { ProductInventoryRole, ProductItemType } from '@/types/products';

import {
  normalizeItemType,
  normalizeProductInventoryRole,
  normalizeTrackInventoryValue,
  parseBooleanValue,
} from './normalization';

type ProductInventoryLike = {
  itemType?: unknown;
  inventoryRole?: unknown;
  isSellable?: unknown;
  isVisible?: unknown;
  type?: unknown;
  trackInventory?: unknown;
  restrictSaleWithoutStock?: unknown;
  combo?: unknown;
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

export function resolveProductInventoryRole(
  product: unknown,
): ProductInventoryRole | null {
  const record = toProductInventoryRecord(product);
  if (!record) return null;
  return normalizeProductInventoryRole(
    record.inventoryRole,
    resolveProductInventoryItemType(record),
  );
}

export function isRawMaterialProduct(product: unknown): boolean {
  return resolveProductInventoryRole(product) === 'raw_material';
}

export function isSellableProduct(product: unknown): boolean {
  const record = toProductInventoryRecord(product);
  if (!record) return false;
  if (isRawMaterialProduct(record)) return false;
  return parseBooleanValue(record.isSellable) !== false;
}

export function isProductVisibleForSale(product: unknown): boolean {
  const record = toProductInventoryRecord(product);
  if (!record) return false;
  if (!isSellableProduct(record)) return false;
  return parseBooleanValue(record.isVisible) !== false;
}

export function isComponentTrackedCombo(product: unknown): boolean {
  const record = toProductInventoryRecord(product);
  if (!record) return false;
  if (resolveProductInventoryItemType(record) !== 'combo') return false;
  if (!record.combo || typeof record.combo !== 'object') return true;

  const inventoryPolicy = (record.combo as { inventoryPolicy?: unknown })
    .inventoryPolicy;
  return inventoryPolicy !== 'self';
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
  if (isComponentTrackedCombo(record)) return false;
  if (isServiceProduct(record)) return false;
  if (record.restrictSaleWithoutStock === true) return true;
  if (isProductExplicitlyNotInventoryTracked(record)) return false;
  return true;
}

export function isInventoriableProduct(product: unknown): boolean {
  return resolveProductInventoryTracking(product);
}

export function filterInventoriableProducts<T>(products: T[]): T[] {
  if (!Array.isArray(products)) return [];
  return products.filter(isInventoriableProduct);
}

export function filterSellableProducts<T>(products: T[]): T[] {
  if (!Array.isArray(products)) return [];
  return products.filter(isProductVisibleForSale);
}

