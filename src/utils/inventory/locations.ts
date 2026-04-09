import type { LocationPathParts, LocationRefLike } from './types';

const toPathPart = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id;
    return toPathPart(id);
  }
  return null;
};

export function normalizeLocationId(value: unknown): string {
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

export function normalizeLocationKey(value: string): string {
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
    pickAfter('warehouses') || pickAfter('locations') || pickAfter('branches');
  const shelfId = pickAfter('shelves');
  const rowId =
    pickAfter('rows') || pickAfter('rowShelves') || pickAfter('rowShelf');
  const segmentId = pickAfter('segments');
  return [warehouseId, shelfId, rowId, segmentId].filter(Boolean).join('/');
}

export function buildLocationPath(
  rawLocation: LocationRefLike | LocationPathParts | string | null | undefined,
): string {
  if (!rawLocation) return '';
  if (typeof rawLocation === 'string') {
    const normalized = normalizeLocationKey(rawLocation);
    return normalized || rawLocation.trim();
  }
  if (typeof rawLocation === 'object') {
    if ('path' in rawLocation && typeof rawLocation.path === 'string') {
      return rawLocation.path.trim();
    }
    if (
      'pathSegments' in rawLocation &&
      Array.isArray(rawLocation.pathSegments)
    ) {
      const normalizedSegments = rawLocation.pathSegments
        .map((segment) => toPathPart(segment))
        .filter(Boolean);
      return normalizedSegments.join('/');
    }
    const location = rawLocation as LocationRefLike & LocationPathParts;
    const warehouse = toPathPart(location.warehouse ?? location.warehouseId);
    const shelf = toPathPart(location.shelf ?? location.shelfId);
    const row = toPathPart(
      location.row ??
        location.rowId ??
        location.rowShelf ??
        location.rowShelfId,
    );
    const segment = toPathPart(location.segment ?? location.segmentId);
    return [warehouse, shelf, row, segment].filter(Boolean).join('/');
  }
  return '';
}

export function parseLocationPath(value: string): {
  warehouseId?: string;
  shelfId?: string;
  rowId?: string;
  segmentId?: string;
} {
  const normalized = normalizeLocationKey(value);
  if (!normalized) return {};
  const [warehouseId, shelfId, rowId, segmentId] = normalized
    .split('/')
    .filter(Boolean);
  return { warehouseId, shelfId, rowId, segmentId };
}
