import { useEffect, useMemo, useReducer, useRef } from 'react';

import { resolveLocationLabel } from '@/firebase/warehouse/locationService';
import { getItemLocationKey } from '../utils/inventoryHelpers';

import type {
  InventoryStockItem,
  LocationNamesMap,
  ResolvingMap,
} from '@/utils/inventory/types';

const FAILED_TTL_MS = 5 * 60 * 1000;
const EMPTY_LOCATION_NAMES: LocationNamesMap = {};
const EMPTY_RESOLVING_LOCATIONS: ResolvingMap = {};

interface InventoryLocationNamesState {
  businessID: string | null;
  locationNames: LocationNamesMap;
  resolvingLocations: ResolvingMap;
}

type InventoryLocationNamesAction =
  | {
      type: 'locationsResolving';
      businessID: string;
      locationKeys: string[];
    }
  | {
      type: 'locationsResolved';
      businessID: string;
      locationKeys: string[];
      resolvedEntries: Array<[string, string]>;
    };

const initialLocationNamesState: InventoryLocationNamesState = {
  businessID: null,
  locationNames: EMPTY_LOCATION_NAMES,
  resolvingLocations: EMPTY_RESOLVING_LOCATIONS,
};

const createLocationRequestKey = (businessID: string, locationKey: string) =>
  JSON.stringify([businessID, locationKey]);

const locationNamesReducer = (
  state: InventoryLocationNamesState,
  action: InventoryLocationNamesAction,
): InventoryLocationNamesState => {
  if (action.type === 'locationsResolving') {
    const businessChanged = state.businessID !== action.businessID;
    const nextResolvingLocations = {
      ...(businessChanged
        ? EMPTY_RESOLVING_LOCATIONS
        : state.resolvingLocations),
    };
    let changed = businessChanged;

    for (const key of action.locationKeys) {
      if (nextResolvingLocations[key] === true) continue;
      nextResolvingLocations[key] = true;
      changed = true;
    }

    return changed
      ? {
          businessID: action.businessID,
          locationNames: businessChanged
            ? EMPTY_LOCATION_NAMES
            : state.locationNames,
          resolvingLocations: nextResolvingLocations,
        }
      : state;
  }

  if (state.businessID !== action.businessID) {
    return state;
  }

  const nextLocationNames = { ...state.locationNames };
  const nextResolvingLocations = { ...state.resolvingLocations };
  let changed = false;

  for (const [key, label] of action.resolvedEntries) {
    if (nextLocationNames[key] === label) continue;
    nextLocationNames[key] = label;
    changed = true;
  }

  for (const key of action.locationKeys) {
    if (!(key in nextResolvingLocations)) continue;
    delete nextResolvingLocations[key];
    changed = true;
  }

  return changed
    ? {
        ...state,
        locationNames: nextLocationNames,
        resolvingLocations: nextResolvingLocations,
      }
    : state;
};

/**
 * Resuelve etiquetas legibles de ubicaciones para un conjunto de items filtrados.
 */
interface UseInventoryLocationNamesParams {
  businessID?: string | null;
  filteredItems: InventoryStockItem[];
}

interface UseInventoryLocationNamesResult {
  locationNames: LocationNamesMap;
  resolvingLocations: ResolvingMap;
}

export function useInventoryLocationNames({
  businessID,
  filteredItems,
}: UseInventoryLocationNamesParams): UseInventoryLocationNamesResult {
  const [state, dispatch] = useReducer(
    locationNamesReducer,
    initialLocationNamesState,
  );
  const inFlightRef = useRef<Set<string>>(new Set());
  const failedRef = useRef<Map<string, number>>(new Map());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true; // Reset on mount (needed for React StrictMode remount)
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const locationKeys = useMemo(() => {
    const uniqueKeys = new Set<string>();
    for (const it of filteredItems || []) {
      const key = getItemLocationKey(it);
      if (key) uniqueKeys.add(key);
    }
    return Array.from(uniqueKeys);
  }, [filteredItems]);

  const locationNames =
    businessID && state.businessID === businessID
      ? state.locationNames
      : EMPTY_LOCATION_NAMES;
  const resolvingLocations =
    businessID && state.businessID === businessID
      ? state.resolvingLocations
      : EMPTY_RESOLVING_LOCATIONS;

  useEffect(() => {
    if (!businessID || locationKeys.length === 0) return;

    const inFlight = inFlightRef.current;
    const failed = failedRef.current;
    const now = Date.now();
    const isFailedRecently = (requestKey: string) => {
      const ts = failed.get(requestKey);
      if (!ts) return false;
      if (now - ts < FAILED_TTL_MS) return true;
      failed.delete(requestKey);
      return false;
    };
    const toLoad = locationKeys.filter((key) => {
      const requestKey = createLocationRequestKey(businessID, key);
      return (
        !locationNames[key] &&
        !inFlight.has(requestKey) &&
        !isFailedRecently(requestKey)
      );
    });
    if (toLoad.length === 0) return;

    const requestKeys = toLoad.map((key) =>
      createLocationRequestKey(businessID, key),
    );
    requestKeys.forEach((requestKey) => inFlight.add(requestKey));

    const run = async () => {
      let resolvedEntries: Array<[string, string]> = [];

      try {
        await Promise.resolve();
        if (isMountedRef.current) {
          dispatch({
            type: 'locationsResolving',
            businessID,
            locationKeys: toLoad,
          });
        }

        const entries = await Promise.all(
          toLoad.map(async (key) => {
            const label = await resolveLocationLabel(businessID, key);
            return [key, label] as [string, string | null];
          }),
        );
        resolvedEntries = entries.filter(
          (entry): entry is [string, string] => Boolean(entry[1]),
        );
        const failedKeys = entries
          .filter(([, label]) => !label)
          .map(([key]) => key);
        if (failedKeys.length) {
          failedKeys.forEach((key) => {
            failedRef.current.set(
              createLocationRequestKey(businessID, key),
              Date.now(),
            );
          });
        }
      } finally {
        requestKeys.forEach((requestKey) => inFlight.delete(requestKey));
        if (isMountedRef.current) {
          dispatch({
            type: 'locationsResolved',
            businessID,
            locationKeys: toLoad,
            resolvedEntries,
          });
        }
      }
    };
    void run();
  }, [businessID, locationKeys, locationNames]);

  return { locationNames, resolvingLocations };
}

export default useInventoryLocationNames;
