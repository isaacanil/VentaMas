// @ts-nocheck
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { getLocationName } from '@/firebase/warehouse/locationService';
import type { LocationNamesMap } from '@/utils/inventory/types';

type LocationCacheEntry = {
  name?: string;
  timestamp?: number;
};

const CACHE_KEY = 'locationNamesCache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

// Cargar caché desde localStorage
const loadCacheFromStorage = (): Map<string, string> => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return new Map();

    const parsed = JSON.parse(stored) as Record<string, LocationCacheEntry>;
    const now = Date.now();
    const cache = new Map<string, string>();

    Object.entries(parsed).forEach(([key, value]) => {
      if (
        typeof value?.timestamp === 'number' &&
        now - value.timestamp < CACHE_EXPIRY &&
        typeof value.name === 'string'
      ) {
        cache.set(key, value.name);
      }
    });

    return cache;
  } catch (error) {
    console.error('Error loading location cache:', error);
    return new Map();
  }
};

// Guardar caché en localStorage
const saveCacheToStorage = (cache: Map<string, string>) => {
  try {
    const obj: Record<string, { name: string; timestamp: number }> = {};
    cache.forEach((name, key) => {
      obj[key] = {
        name,
        timestamp: Date.now(),
      };
    });
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch (error) {
    console.error('Error saving location cache:', error);
  }
};

const locationCache = loadCacheFromStorage();

interface UseLocationNamesResult {
  locationNames: LocationNamesMap;
  fetchLocationName: (locationId: string | null | undefined) => Promise<void>;
}

export const useLocationNames = (): UseLocationNamesResult => {
  const user = useSelector(selectUser);
  const [locationNames, setLocationNames] = useState<LocationNamesMap>(() => {
    // Inicializar con los valores del caché al montar
    const cached: LocationNamesMap = {};
    locationCache.forEach((value, key) => {
      cached[key] = value;
    });
    return cached;
  });
  const canFetchLocations = useMemo(
    () => Boolean(user?.businessID),
    [user?.businessID],
  );
  const pendingLocationsRef = useRef<Set<string>>(new Set());
  const isFetchingRef = useRef<Set<string>>(new Set());

  const getLocationNameCached = useCallback(
    async (locationId: string | null | undefined) => {
      if (!locationId) return 'N/A';

      if (locationCache.has(locationId)) {
        return locationCache.get(locationId) ?? null;
      }

      if (!canFetchLocations) {
        return null;
      }

      try {
        const name = await getLocationName(user, locationId);

        if (name && name !== 'Error al obtener ubicación') {
          locationCache.set(locationId, name);
          // Guardar en localStorage
          saveCacheToStorage(locationCache);
        }

        return name;
      } catch (error) {
        console.error('Error fetching location name:', error);
        return null;
      }
    },
    [canFetchLocations, user],
  );

  const fetchLocationName = useCallback(
    async (locationId: string | null | undefined) => {
      if (!locationId) {
        return;
      }

      // Si ya está en el caché, actualizar el estado inmediatamente
      if (locationCache.has(locationId)) {
        const cachedName = locationCache.get(locationId);
        if (cachedName) {
          setLocationNames((prev) => ({
            ...prev,
            [locationId]: cachedName,
          }));
        }
        return;
      }

      // Si ya se está obteniendo, no hacer nada
      if (isFetchingRef.current.has(locationId)) {
        return;
      }

      if (!canFetchLocations) {
        pendingLocationsRef.current.add(locationId);
        return;
      }

      // Marcar como en proceso
      isFetchingRef.current.add(locationId);

      try {
        const name = await getLocationNameCached(locationId);

        if (name) {
          setLocationNames((prev) => ({
            ...prev,
            [locationId]: name,
          }));
        }
      } catch (error) {
        console.error('Error in fetchLocationName:', error);
      } finally {
        // Desmarcar como en proceso
        isFetchingRef.current.delete(locationId);
        pendingLocationsRef.current.delete(locationId);
      }
    },
    [canFetchLocations, getLocationNameCached],
  );

  useEffect(() => {
    if (!canFetchLocations || pendingLocationsRef.current.size === 0) {
      return;
    }

    const pending = Array.from(pendingLocationsRef.current);
    pending.forEach((locationId) => {
      fetchLocationName(locationId);
    });
  }, [canFetchLocations, fetchLocationName]);

  return { locationNames, fetchLocationName };
};
