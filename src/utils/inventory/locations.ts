import type {
  InventoryStockItem,
  LocationPathParts,
  LocationRefLike,
} from './types';

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

type ResolveInventoryLocationPathOptions = {
  normalize?: boolean;
};

export function resolveInventoryLocationPath(
  rawLocation: LocationRefLike | LocationPathParts | string | null | undefined,
  options: ResolveInventoryLocationPathOptions = {},
): string {
  if (!rawLocation) return '';

  let path = '';
  if (typeof rawLocation === 'string') {
    path = rawLocation.trim();
  } else if (typeof rawLocation === 'object') {
    if ('path' in rawLocation && typeof rawLocation.path === 'string') {
      path = rawLocation.path.trim();
    } else if (
      'pathSegments' in rawLocation &&
      Array.isArray(rawLocation.pathSegments)
    ) {
      path = rawLocation.pathSegments
        .map((segment) => toPathPart(segment))
        .filter(Boolean)
        .join('/');
    } else {
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
      path = [warehouse, shelf, row, segment].filter(Boolean).join('/');
    }
  }

  if (!path) return '';
  return options.normalize ? normalizeLocationKey(path) : path;
}

export function resolveInventoryItemLocationPath(
  item: Partial<InventoryStockItem> | null | undefined,
  options: ResolveInventoryLocationPathOptions = {},
): string {
  if (!item) return '';

  if (typeof item.location === 'object' && item.location) {
    const key = resolveInventoryLocationPath(item.location, options);
    if (key) return key;
  }

  if (typeof item.location === 'string' && item.location.includes('/')) {
    return resolveInventoryLocationPath(item.location, options);
  }

  if (item.shelfId || item.rowId || item.rowShelfId || item.segmentId) {
    const { warehouseId, shelfId, rowId, rowShelfId, segmentId } = item;
    let resolvedWarehouseId = warehouseId;
    if (!resolvedWarehouseId && typeof item.location === 'string') {
      resolvedWarehouseId = item.location;
    }
    return resolveInventoryLocationPath(
      {
        warehouseId: resolvedWarehouseId,
        shelfId,
        rowId,
        rowShelfId,
        segmentId,
      },
      options,
    );
  }

  if (typeof item.location === 'string' && item.location) {
    return resolveInventoryLocationPath(item.location, options);
  }

  if (item.warehouseId) {
    return resolveInventoryLocationPath(item.warehouseId, options);
  }

  return '';
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
    return resolveInventoryLocationPath(rawLocation);
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

export function shortenLocationPath(path?: string) {
  if (!path || typeof path !== 'string') return path;
  if (!path.includes('/')) return path;
  const parts = path.split('/').filter(Boolean);
  if (parts.length <= 1) return truncateLocationSegment(parts[0]);
  const MAX_SEGMENT_LENGTH = 14;
  const first = truncateLocationSegment(parts[0], MAX_SEGMENT_LENGTH);
  const last = truncateLocationSegment(
    parts[parts.length - 1],
    MAX_SEGMENT_LENGTH,
  );
  if (parts.length <= 2) return `${first}/${last}`;
  return `${first}/.../${last}`;
}

function truncateLocationSegment(segment: string, limit = 14) {
  if (!segment) return '';
  if (segment.length <= limit) return segment;
  if (limit <= 1) return '…';
  return `${segment.slice(0, limit - 1)}…`;
}
