import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getLocationKey,
  resolveLocationLabel,
} from '../utils/inventoryHelpers';

/**
 * Resuelve etiquetas legibles de ubicaciones para un conjunto de items filtrados.
 */
export function useLocationNames({ businessID, filteredItems }) {
  const [locationNames, setLocationNames] = useState({});
  const [resolvingLocations, setResolvingLocations] = useState({});
  const locationNamesRef = useRef(locationNames);
  const inFlightRef = useRef(new Set());

  useEffect(() => {
    locationNamesRef.current = locationNames;
  }, [locationNames]);

  const locationKeys = useMemo(() => {
    const uniqueKeys = new Set();
    for (const it of filteredItems || []) {
      const key = getLocationKey(it?.location);
      if (key) uniqueKeys.add(key);
    }
    return Array.from(uniqueKeys);
  }, [filteredItems]);

  useEffect(() => {
    if (!businessID || locationKeys.length === 0) return;

    let cancelled = false;
    const cache = locationNamesRef.current || {};
    const inFlight = inFlightRef.current;
    const toLoad = locationKeys.filter((k) => !cache[k] && !inFlight.has(k));
    if (toLoad.length === 0) return;

    toLoad.forEach((k) => inFlight.add(k));
    setResolvingLocations((prev) => ({
      ...prev,
      ...Object.fromEntries(toLoad.map((k) => [k, true])),
    }));

    const run = async () => {
      try {
        const entries = await Promise.all(
          toLoad.map(async (key) => {
            const label = await resolveLocationLabel(businessID, key);
            return [key, label];
          }),
        );
        if (!cancelled) {
          setLocationNames((prev) => {
            let changed = false;
            const next = { ...prev };
            for (const [k, v] of entries) {
              if (next[k] !== v) {
                next[k] = v;
                changed = true;
              }
            }
            return changed ? next : prev;
          });
        }
      } finally {
        toLoad.forEach((k) => inFlight.delete(k));
        if (!cancelled) {
          setResolvingLocations((prev) => {
            const next = { ...prev };
            toLoad.forEach((k) => {
              delete next[k];
            });
            return next;
          });
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [businessID, locationKeys]);

  return { locationNames, resolvingLocations };
}

export default useLocationNames;