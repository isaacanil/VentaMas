// Helper utilities extracted from InventoryControl.jsx for reuse and to reduce file size
// Pure / side-effect free helpers.

import { normalizeLocationKey } from '@/utils/inventory/locations';

import type {
  InventoryChild,
  InventoryGroup,
  InventoryLocation,
  InventoryStockItem,
  LocationNamesMap,
  LocationRefLike,
  TimestampLike,
} from '@/utils/inventory/types';

export function sum(arr: (number | null | undefined)[]) {
  return (arr || []).reduce((acc, n) => acc + Number(n ?? 0), 0);
}

export function getLocationKey(
  location: LocationRefLike | string | null | undefined,
) {
  if (!location) return '';
  if (typeof location === 'string') return normalizeLocationKey(location);
  if (typeof location !== 'object') return '';
  if (typeof location.path === 'string')
    return normalizeLocationKey(location.path);
  if (Array.isArray(location.pathSegments)) {
    return normalizeLocationKey(location.pathSegments.filter(Boolean).join('/'));
  }
  const {
    warehouse,
    warehouseId,
    shelf,
    shelfId,
    row,
    rowId,
    rowShelf,
    rowShelfId,
    segment,
    segmentId,
  } = location || {};
  const pickId = (value) => {
    if (!value) return '';
    if (typeof value === 'string' || typeof value === 'number')
      return String(value);
    if (
      typeof value === 'object' &&
      (typeof value.id === 'string' || typeof value.id === 'number')
    ) {
      return String(value.id);
    }
    return '';
  };
  const w = pickId(warehouse || warehouseId);
  const s = pickId(shelf || shelfId);
  const r = pickId(row || rowId || rowShelf || rowShelfId);
  const seg = pickId(segment || segmentId);
  return normalizeLocationKey([w, s, r, seg].filter(Boolean).join('/'));
}

export function getItemLocationKey(
  item: Partial<InventoryStockItem> | null | undefined,
) {
  if (!item) return '';
  // 1. Object
  if (typeof item.location === 'object' && item.location) {
    const key = getLocationKey(item.location);
    if (key) return key;
  }
  // 2. String Path
  if (typeof item.location === 'string' && item.location.includes('/')) {
    return normalizeLocationKey(item.location);
  }
  // 3. Flat Fields (Deep)
  if (item.shelfId || item.rowId || item.rowShelfId || item.segmentId) {        
    const { warehouseId, shelfId, rowId, rowShelfId, segmentId } = item;        
    let w = warehouseId;
    if (!w && typeof item.location === 'string') w = item.location;
    return normalizeLocationKey(
      [w, shelfId, rowId || rowShelfId, segmentId].filter(Boolean).join('/'),
    );
  }
  // 4. Simple String
  if (typeof item.location === 'string' && item.location) {
    return normalizeLocationKey(item.location);
  }
  // 5. Warehouse ID
  if (item.warehouseId) return normalizeLocationKey(item.warehouseId);

  return '';
}

export function buildLocations(
  items: Partial<InventoryStockItem>[],
  locationNamesMap: LocationNamesMap = {},
): InventoryLocation[] {
  const map = new Map();
  for (const it of items || []) {
    const locKey = getItemLocationKey(it);
    const qty = Number(it.quantity ?? it.stock ?? 0);
    if (!locKey || !isFinite(qty) || qty <= 0) continue;
    const prev = map.get(locKey) || 0;
    map.set(locKey, prev + qty);
  }
  return Array.from(map.entries())
    .filter(([, quantity]) => quantity > 0)
    .map(([locKey, quantity]) => ({
      location: locKey,
      locationKey: locKey,
      locationLabel: locationNamesMap[locKey] || '',
      quantity,
    }));
}

export function normalizeDateKey(d: TimestampLike) {
  if (!d) return 'no-date';
  try {
    let date;
    if (d instanceof Date) {
      date = d;
    } else if (d?.toDate) {
      date = d.toDate();
    } else if (typeof d === 'object' && typeof d.seconds === 'number') {
      date = new Date(d.seconds * 1000);
    } else {
      date = new Date(d);
    }
    if (Number.isNaN(date.getTime())) return 'no-date';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return 'no-date';
  }
}

export function findChildByKey(
  groups: InventoryGroup[] | null | undefined,
  key: string,
): InventoryChild | null {
  if (!Array.isArray(groups)) return null;
  for (const g of groups) {
    const found = g._children?.find((c) => c.key === key);
    if (found) return found;
  }
  return null;
}

export default {
  sum,
  buildLocations,
  normalizeDateKey,
  findChildByKey,
  getLocationKey,
  getItemLocationKey,
};
