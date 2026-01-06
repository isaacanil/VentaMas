import {
  and,
  collection,
  limit,
  onSnapshot,
  or,
  orderBy,
  query,
  Timestamp,
  where,
  type QueryConstraint,
  type QueryFilterConstraint,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { MovementReason, MovementType } from '@/models/Warehouse/Movement';
import { normalizeLocationKey } from '@/utils/inventory/locations';

import { db } from '../firebaseconfig';

import { getLocationName } from './locationService';

import type { InventoryUser } from '@/utils/inventory/types';

type MovementDoc = Record<string, unknown> & {
  id: string;
  sourceLocation?: string | null;
  destinationLocation?: string | null;
  createdAt?: { seconds?: number } | Date | null;
  productId?: string | null;
  productName?: string | null;
  batchId?: string | null;
  movementType?: MovementType | 'in' | 'out' | string;
  movementReason?: MovementReason | string | null;
};

type MovementWithLocations = MovementDoc & {
  sourceLocationName?: string | null;
  destinationLocationName?: string | null;
};

export interface MovementsParams {
  locationId?: string | null;
  movementType?: MovementType | 'in' | 'out' | null;
  movementReason?: MovementReason | string | null;
  productId?: string | null;
  batchId?: string | null;
  startDate?: number | null;
  endDate?: number | null;
  limit?: number | null;
  includeDeleted?: boolean;
}

interface UseListenMovementsResult {
  data: MovementWithLocations[];
  loading: boolean;
}

export const useListenMovementsByParams = (
  user: InventoryUser | null | undefined,
  params: MovementsParams = {},
): UseListenMovementsResult => {
  const {
    locationId,
    movementType,
    movementReason,
    productId,
    batchId,
    startDate,
    endDate,
    limit: limitParam,
    includeDeleted,
  } = params;

  const normalizedLocation = useMemo(
    () => (locationId ? normalizeLocationKey(String(locationId)) : ''),
    [locationId],
  );
  const limitValue = useMemo(() => {
    if (typeof limitParam !== 'number') return null;
    if (!Number.isFinite(limitParam)) return null;
    if (limitParam <= 0) return null;
    return Math.floor(limitParam);
  }, [limitParam]);

  const hasDateFilter =
    (typeof startDate === 'number' && !Number.isNaN(startDate)) ||
    (typeof endDate === 'number' && !Number.isNaN(endDate));
  const hasFilters = Boolean(
    normalizedLocation ||
      movementType ||
      movementReason ||
      productId ||
      batchId ||
      hasDateFilter,
  );
  const shouldListen = Boolean(user?.businessID && (hasFilters || limitValue));

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        businessID: user?.businessID || '',
        location: normalizedLocation,
        movementType: movementType || '',
        movementReason: movementReason || '',
        productId: productId || '',
        batchId: batchId || '',
        startDate: typeof startDate === 'number' ? startDate : null,
        endDate: typeof endDate === 'number' ? endDate : null,
        limit: limitValue ?? null,
        includeDeleted: Boolean(includeDeleted),
      }),
    [
      user?.businessID,
      normalizedLocation,
      movementType,
      movementReason,
      productId,
      batchId,
      startDate,
      endDate,
      limitValue,
      includeDeleted,
    ],
  );

  const [data, setData] = useState<MovementWithLocations[]>([]);
  const [lastSnapshotKey, setLastSnapshotKey] = useState(queryKey);

  const loading = shouldListen && queryKey !== lastSnapshotKey;

  useEffect(() => {
    if (!shouldListen || !user?.businessID) {
      return undefined;
    }

    const movementsRef = collection(
      db,
      'businesses',
      user.businessID,
      'movements',
    );
    const filters: QueryFilterConstraint[] = [];

    if (!includeDeleted) {
      filters.push(where('isDeleted', '==', false));
    }
    if (typeof startDate === 'number' && !Number.isNaN(startDate)) {
      filters.push(where('createdAt', '>=', Timestamp.fromMillis(startDate)));
    }
    if (typeof endDate === 'number' && !Number.isNaN(endDate)) {
      filters.push(where('createdAt', '<=', Timestamp.fromMillis(endDate)));
    }
    if (movementType) {
      filters.push(where('movementType', '==', movementType));
    }
    if (movementReason) {
      filters.push(where('movementReason', '==', movementReason));
    }
    if (productId) {
      filters.push(where('productId', '==', productId));
    }
    if (batchId) {
      filters.push(where('batchId', '==', batchId));
    }

    const clauses: QueryFilterConstraint[] = [];
    if (normalizedLocation) {
      clauses.push(
        or(
          where('sourceLocation', '==', normalizedLocation),
          where('destinationLocation', '==', normalizedLocation),
        ) as QueryFilterConstraint,
      );
    }
    clauses.push(...filters);

    const queryArgs: QueryConstraint[] = [];
    if (clauses.length === 1) {
      queryArgs.push(clauses[0] as unknown as QueryConstraint);
    } else if (clauses.length > 1) {
      queryArgs.push(and(...clauses) as unknown as QueryConstraint);
    }
    queryArgs.push(orderBy('createdAt', 'desc'));
    if (limitValue) {
      queryArgs.push(limit(limitValue));
    }

    const movementsQuery = query(movementsRef, ...queryArgs);

    const unsubscribe = onSnapshot(
      movementsQuery,
      async (snapshot) => {
        try {
          const movementsPromises = snapshot.docs.map(async (movementDoc) => {
            const mv = movementDoc.data() as MovementDoc;
            const [sourceName, destName] = await Promise.all([
              getLocationName(user, mv.sourceLocation || ''),
              getLocationName(user, mv.destinationLocation || ''),
            ]);
            return {
              ...mv,
              id: movementDoc.id,
              sourceLocationName: sourceName,
              destinationLocationName: destName,
            } as MovementWithLocations;
          });
          const movements = await Promise.all(movementsPromises);
          setData(movements);
        } catch (error) {
          console.error('Error al mapear movimientos:', error);
          setData([]);
        } finally {
          setLastSnapshotKey(queryKey);
        }
      },
      (error) => {
        console.error('Error al escuchar movimientos:', error);
        setData([]);
        setLastSnapshotKey(queryKey);
      },
    );

    return () => unsubscribe();
  }, [
    shouldListen,
    user,
    user?.businessID,
    normalizedLocation,
    movementType,
    movementReason,
    productId,
    batchId,
    startDate,
    endDate,
    includeDeleted,
    limitValue,
    queryKey,
  ]);

  return { data: loading ? [] : data, loading };
};
