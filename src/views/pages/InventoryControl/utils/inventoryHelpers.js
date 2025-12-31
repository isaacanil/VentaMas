// Helper utilities extracted from InventoryControl.jsx for reuse and to reduce file size
// Pure / side-effect free helpers or helpers that only depend on Firestore SDK directly

import { doc, getDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export function sum(arr) {
  return (arr || []).reduce((acc, n) => acc + Number(n ?? 0), 0);
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

function normalizeLocationKey(value) {
  if (!value || typeof value !== 'string') return '';
  const parts = value.split('/').filter(Boolean);
  if (!parts.length) return '';
  const hasCollections = parts.some((part) => LOCATION_COLLECTIONS.has(part));
  if (!hasCollections) return parts.join('/');
  const pickAfter = (collection) => {
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

export function getLocationKey(location) {
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

export function getItemLocationKey(item) {
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

export function buildLocations(items, locationNamesMap = {}) {
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

export function normalizeDateKey(d) {
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

export function findChildByKey(groups, key) {
  if (!Array.isArray(groups)) return null;
  for (const g of groups) {
    const found = g._children?.find((c) => c.key === key);
    if (found) return found;
  }
  return null;
}

// Global cache for location names to avoid repeated Firestore calls
// Cache expires after 10 minutes (increased from 5 for better performance)
const locationNameCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

// Request queue to limit concurrent Firestore requests
const MAX_CONCURRENT_REQUESTS = 10;
let activeRequests = 0;
const requestQueue = [];

function getCacheKey(businessID, pathParts) {
  return `${businessID}:${pathParts.join('/')}`;
}

function getCachedName(businessID, pathParts) {
  const key = getCacheKey(businessID, pathParts);
  const cached = locationNameCache.get(key);
  if (!cached) return undefined;
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    locationNameCache.delete(key);
    return undefined;
  }
  return cached.value;
}

function setCachedName(businessID, pathParts, value) {
  const key = getCacheKey(businessID, pathParts);
  locationNameCache.set(key, { value, timestamp: Date.now() });
}

// Throttled queue processor
async function processQueue() {
  while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    const { fn, resolve, reject } = requestQueue.shift();
    activeRequests++;
    try {
      const result = await fn();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      activeRequests--;
      // Process next in queue
      if (requestQueue.length > 0) {
        processQueue();
      }
    }
  }
}

// Enqueue a request to be processed when capacity is available
function enqueueRequest(fn) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ fn, resolve, reject });
    processQueue();
  });
}

export async function resolveLocationLabel(businessID, locKey) {
  try {
    if (!locKey) return '';
    const ids = String(locKey).split('/').filter(Boolean);
    const [warehouseId, shelfId, rowId, segmentId] = ids;

    // Build all fetch promises in parallel
    // Strategy: Try FLAT collections first (faster), then nested as fallback
    const fetchPromises = [];

    if (warehouseId) {
      // Try 'warehouses' (flat) -> 'locations' -> 'branches'
      fetchPromises.push(
        fetchFriendlyNameCached(businessID, ['warehouses', warehouseId])
          .then(name => name || fetchFriendlyNameCached(businessID, ['locations', warehouseId]))
          .then(name => name || fetchFriendlyNameCached(businessID, ['branches', warehouseId]))
      );
    }

    if (shelfId) {
      // Try flat 'shelves' FIRST (most common), then nested as fallback
      fetchPromises.push(
        fetchFriendlyNameCached(businessID, ['shelves', shelfId])
          .then(name => name || fetchFriendlyNameCached(businessID, ['warehouses', warehouseId, 'shelves', shelfId]))
          .then(name => name || fetchFriendlyNameCached(businessID, ['locations', warehouseId, 'shelves', shelfId]))
      );
    }

    if (rowId) {
      // Try flat 'rows' FIRST, then nested as fallback
      fetchPromises.push(
        fetchFriendlyNameCached(businessID, ['rows', rowId])
          .then(name => name || fetchFriendlyNameCached(businessID, ['warehouses', warehouseId, 'shelves', shelfId, 'rows', rowId]))
          .then(name => name || fetchFriendlyNameCached(businessID, ['locations', warehouseId, 'shelves', shelfId, 'rows', rowId]))
      );
    }

    if (segmentId) {
      // Try flat 'segments' FIRST, then nested as fallback
      fetchPromises.push(
        fetchFriendlyNameCached(businessID, ['segments', segmentId])
          .then(name => name || fetchFriendlyNameCached(businessID, ['warehouses', warehouseId, 'shelves', shelfId, 'rows', rowId, 'segments', segmentId]))
          .then(name => name || fetchFriendlyNameCached(businessID, ['locations', warehouseId, 'shelves', shelfId, 'rows', rowId, 'segments', segmentId]))
      );
    }

    // Increased timeout from 5s to 15s to handle large datasets
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 15000)
    );

    // Fetch all in parallel with timeout
    const results = await Promise.race([
      Promise.all(fetchPromises),
      timeoutPromise
    ]).catch(() => null);

    // If timed out or failed, return null to allow retries without showing IDs
    if (!results) {
      return null;
    }

    // Build final label (only resolved names, no IDs)
    const parts = results.filter(Boolean);
    if (!parts.length) return null;
    return parts.join(' / ');
  } catch {
    return null;
  }
}

async function fetchFriendlyNameCached(businessID, pathParts) {
  // Check cache first
  const cached = getCachedName(businessID, pathParts);
  if (cached !== undefined) {
    return cached;
  }

  // Use the queue to throttle requests
  return enqueueRequest(async () => {
    // Double-check cache after waiting in queue
    const cachedAfterWait = getCachedName(businessID, pathParts);
    if (cachedAfterWait !== undefined) {
      return cachedAfterWait;
    }

    try {
      if (!businessID) {
        setCachedName(businessID, pathParts, null);
        return null;
      }

      const ref = doc(db, 'businesses', businessID, ...pathParts);
      const snap = await getDoc(ref);
      let name = null;
      if (snap.exists()) {
        const data = snap.data() || {};
        name = data.name || data.shortName || data.title || null;
      }
      // Cache even null results to avoid re-fetching missing docs
      setCachedName(businessID, pathParts, name);
      return name;
    } catch {
      // Cache null on error to avoid hammering failing paths
      setCachedName(businessID, pathParts, null);
      return null;
    }
  });
}

export default {
  sum,
  buildLocations,
  normalizeDateKey,
  findChildByKey,
  getLocationKey,
  getItemLocationKey,
  resolveLocationLabel,
};
