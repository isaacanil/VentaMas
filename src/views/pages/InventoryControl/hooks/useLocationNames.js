import { useEffect, useMemo, useRef, useState } from 'react';

import { getItemLocationKey, resolveLocationLabel } from '../utils/inventoryHelpers';

const FAILED_TTL_MS = 5 * 60 * 1000;

/**
 * Resuelve etiquetas legibles de ubicaciones para un conjunto de items filtrados.
 */
export function useLocationNames({ businessID, filteredItems }) {
  const [locationNames, setLocationNames] = useState({});
  const [resolvingLocations, setResolvingLocations] = useState({});
  const locationNamesRef = useRef(locationNames);
  const inFlightRef = useRef(new Set());
  const failedRef = useRef(new Map());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true; // Reset on mount (needed for React StrictMode remount)
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    locationNamesRef.current = locationNames;
  }, [locationNames]);

  const locationKeys = useMemo(() => {
    const uniqueKeys = new Set();
    for (const it of filteredItems || []) {
      const key = getItemLocationKey(it);
      if (key) uniqueKeys.add(key);
    }
    return Array.from(uniqueKeys);
  }, [filteredItems]);

  useEffect(() => {
    if (!businessID || locationKeys.length === 0) return;

    const cache = locationNamesRef.current || {};
    const inFlight = inFlightRef.current;
    const failed = failedRef.current;
    const now = Date.now();
    const isFailedRecently = (key) => {
      const ts = failed.get(key);
      if (!ts) return false;
      if (now - ts < FAILED_TTL_MS) return true;
      failed.delete(key);
      return false;
    };
    const toLoad = locationKeys.filter(
      (k) => !cache[k] && !inFlight.has(k) && !isFailedRecently(k),
    );
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
        const resolvedEntries = entries.filter(([, label]) => !!label);
        const failedKeys = entries
          .filter(([, label]) => !label)
          .map(([key]) => key);
        if (isMountedRef.current && resolvedEntries.length) {
          setLocationNames((prev) => {
            let changed = false;
            const next = { ...prev };
            for (const [k, v] of resolvedEntries) {
              if (next[k] !== v) {
                next[k] = v;
                changed = true;
              }
            }
            return changed ? next : prev;
          });
        }
        if (failedKeys.length) {
          failedKeys.forEach((key) => {
            failedRef.current.set(key, Date.now());
          });
        }
      } finally {
        toLoad.forEach((k) => inFlight.delete(k));
        if (isMountedRef.current) {
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
  }, [businessID, locationKeys]);

  return { locationNames, resolvingLocations };
}

export default useLocationNames;
