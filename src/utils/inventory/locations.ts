export function normalizeLocationId(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

const LOCATION_COLLECTIONS = new Set([
  'businesses',
  'warehouses',
  'locations',
  'branches',
  'shelves',
  'rows',
  'segments',
  'rowShelves',
  'rowShelf',
]);

export function normalizeLocationKey(value: string) {
  if (!value || typeof value !== 'string') return '';
  const parts = value.split('/').filter(Boolean);
  if (!parts.length) return '';
  const hasCollections = parts.some((part) => LOCATION_COLLECTIONS.has(part));
  if (!hasCollections) return parts.join('/');
  const pickAfter = (collection: string) => {
    const idx = parts.lastIndexOf(collection);
    if (idx === -1) return '';
    return parts[idx + 1] ? String(parts[idx + 1]) : '';
  };
  const warehouseId =
    pickAfter('warehouses') ||
    pickAfter('locations') ||
    pickAfter('branches');
  const shelfId = pickAfter('shelves');
  const rowId = pickAfter('rows') || pickAfter('rowShelves') || pickAfter('rowShelf');
  const segmentId = pickAfter('segments');
  return [warehouseId, shelfId, rowId, segmentId].filter(Boolean).join('/');
}
