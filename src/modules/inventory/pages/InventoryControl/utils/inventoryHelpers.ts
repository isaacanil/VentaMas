// Helper utilities extracted from InventoryControl.tsx for reuse and to reduce file size
// Pure / side-effect free helpers.

import {
  resolveInventoryItemLocationPath,
  resolveInventoryLocationPath,
} from '@/utils/inventory/locations';

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
  return resolveInventoryLocationPath(location, { normalize: true });
}

export function getItemLocationKey(
  item: Partial<InventoryStockItem> | null | undefined,
) {
  return resolveInventoryItemLocationPath(item, { normalize: true });
}

export function buildLocations(
  items: Partial<InventoryStockItem>[],
  locationNamesMap: LocationNamesMap = {},
): InventoryLocation[] {
  const map = new Map<string, number>();
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
    } else if (
      typeof d === 'object' &&
      d &&
      'toDate' in d &&
      typeof (d as { toDate?: () => Date }).toDate === 'function'
    ) {
      date = (d as { toDate: () => Date }).toDate();
    } else if (typeof d === 'object' && typeof d.seconds === 'number') {
      date = new Date((d as { seconds: number }).seconds * 1000);
    } else {
      date = new Date(d as string | number);
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
