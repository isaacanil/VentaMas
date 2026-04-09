export function isInventoriableProduct(product: unknown): boolean {
  if (!product || typeof product !== 'object') return false;
  const record = product as Record<string, unknown>;

  // Keep existing semantics in UI: "trackInventory !== false" means included.
  return record.trackInventory !== false;
}

export function filterInventoriableProducts<T>(products: T[]): T[] {
  if (!Array.isArray(products)) return [];
  return products.filter(isInventoriableProduct);
}

