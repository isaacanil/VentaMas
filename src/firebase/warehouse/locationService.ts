import { doc, getDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { normalizeLocationKey } from '@/utils/inventory/locations';

import type { InventoryUser } from '@/utils/inventory/types';

const LOCATION_NOT_FOUND = 'Ubicación no encontrada';
const LOCATION_ERROR = 'Error al obtener ubicación';

const locationNameCache = new Map<
  string,
  { value: string | null; timestamp: number }
>();
const CACHE_TTL_MS = 10 * 60 * 1000;

const MAX_CONCURRENT_REQUESTS = 10;
let activeRequests = 0;
const requestQueue: {
  fn: () => Promise<string | null>;
  resolve: (value: string | null) => void;
  reject: (reason?: unknown) => void;
}[] = [];

function getCacheKey(businessID: string, pathParts: string[]) {
  return `${businessID}:${pathParts.join('/')}`;
}

function getCachedName(businessID: string, pathParts: string[]) {
  const key = getCacheKey(businessID, pathParts);
  const cached = locationNameCache.get(key);
  if (!cached) return undefined;
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    locationNameCache.delete(key);
    return undefined;
  }
  return cached.value;
}

function setCachedName(
  businessID: string,
  pathParts: string[],
  value: string | null,
) {
  const key = getCacheKey(businessID, pathParts);
  locationNameCache.set(key, { value, timestamp: Date.now() });
}

async function processQueue() {
  while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    const entry = requestQueue.shift();
    if (!entry) return;
    const { fn, resolve, reject } = entry;
    activeRequests++;
    try {
      const result = await fn();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      activeRequests--;
      if (requestQueue.length > 0) {
        processQueue();
      }
    }
  }
}

function enqueueRequest(fn: () => Promise<string | null>) {
  return new Promise<string | null>((resolve, reject) => {
    requestQueue.push({ fn, resolve, reject });
    processQueue();
  });
}

async function fetchFriendlyNameCached(
  businessID: string,
  pathParts: string[],
): Promise<string | null> {
  const cached = getCachedName(businessID, pathParts);
  if (cached !== undefined) {
    return cached;
  }

  return enqueueRequest(async () => {
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
      setCachedName(businessID, pathParts, name);
      return name;
    } catch {
      setCachedName(businessID, pathParts, null);
      return null;
    }
  });
}

export async function resolveLocationLabel(
  businessID: string,
  locKey: string,
): Promise<string | null> {
  try {
    if (!locKey) return '';
    const normalized = normalizeLocationKey(String(locKey));
    if (!normalized) return '';
    const ids = normalized.split('/').filter(Boolean);
    const [warehouseId, shelfId, rowId, segmentId] = ids;

    const fetchPromises: Promise<string | null>[] = [];

    if (warehouseId) {
      fetchPromises.push(
        fetchFriendlyNameCached(businessID, ['warehouses', warehouseId])
          .then((name) =>
            name ? name : fetchFriendlyNameCached(businessID, ['locations', warehouseId]),
          )
          .then((name) =>
            name ? name : fetchFriendlyNameCached(businessID, ['branches', warehouseId]),
          ),
      );
    }

    if (shelfId) {
      fetchPromises.push(
        fetchFriendlyNameCached(businessID, ['shelves', shelfId])
          .then((name) =>
            name
              ? name
              : fetchFriendlyNameCached(businessID, [
                  'warehouses',
                  warehouseId,
                  'shelves',
                  shelfId,
                ]),
          )
          .then((name) =>
            name
              ? name
              : fetchFriendlyNameCached(businessID, [
                  'locations',
                  warehouseId,
                  'shelves',
                  shelfId,
                ]),
          ),
      );
    }

    if (rowId) {
      fetchPromises.push(
        fetchFriendlyNameCached(businessID, ['rows', rowId])
          .then((name) =>
            name
              ? name
              : fetchFriendlyNameCached(businessID, [
                  'warehouses',
                  warehouseId,
                  'shelves',
                  shelfId,
                  'rows',
                  rowId,
                ]),
          )
          .then((name) =>
            name
              ? name
              : fetchFriendlyNameCached(businessID, [
                  'locations',
                  warehouseId,
                  'shelves',
                  shelfId,
                  'rows',
                  rowId,
                ]),
          ),
      );
    }

    if (segmentId) {
      fetchPromises.push(
        fetchFriendlyNameCached(businessID, ['segments', segmentId])
          .then((name) =>
            name
              ? name
              : fetchFriendlyNameCached(businessID, [
                  'warehouses',
                  warehouseId,
                  'shelves',
                  shelfId,
                  'rows',
                  rowId,
                  'segments',
                  segmentId,
                ]),
          )
          .then((name) =>
            name
              ? name
              : fetchFriendlyNameCached(businessID, [
                  'locations',
                  warehouseId,
                  'shelves',
                  shelfId,
                  'rows',
                  rowId,
                  'segments',
                  segmentId,
                ]),
          ),
      );
    }

    if (fetchPromises.length === 0) return null;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 15000),
    );

    const results = await Promise.race([
      Promise.all(fetchPromises),
      timeoutPromise,
    ]).catch(() => null);

    if (!Array.isArray(results)) {
      return null;
    }

    const parts = results.filter(Boolean);
    if (!parts.length) return null;
    return parts.join(' / ');
  } catch {
    return null;
  }
}

export const getLocationName = async (
  user: InventoryUser,
  locationId?: string | null,
) => {
  if (!locationId) return 'N/A';
  try {
    const businessID = user?.businessID;
    if (!businessID) return 'N/A';
    const label = await resolveLocationLabel(businessID, locationId);
    return label || LOCATION_NOT_FOUND;
  } catch (error) {
    console.error('Error getting location name:', error);
    return LOCATION_ERROR;
  }
};
