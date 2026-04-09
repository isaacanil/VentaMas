import { useEffect, useMemo, useReducer } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '../features/auth/userSlice';
import {
  selectPurchaseList,
  updatePurchases,
} from '../features/purchase/purchasesSlice';
import { subscribeSinglePurchase } from '../firebase/purchase/fbGetPurchase';
import {
  subscribeToPurchase,
  processPurchase,
  type PurchaseFilters,
} from '../firebase/purchase/fbGetPurchases';
import { sortPurchases } from '../utils/filterUtils';
import type { UserIdentity } from '@/types/users';
import { enrichPurchaseWorkflow } from '@/utils/purchase/workflow';

// Función auxiliar para convertir timestamps
const convertTimestamps = <T,>(data: T): T => {
  if (!data) return data;

  const timestampFields = [
    'createdAt',
    'updatedAt',
    'deliveryAt',
    'paymentAt',
    'completedAt',
    'expirationDate',
  ];

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => convertTimestamps(item)) as unknown as T;
  }

  // Handle objects
  if (typeof data === 'object') {
    const converted = { ...(data as Record<string, unknown>) };

    // Convert direct timestamp fields
    timestampFields.forEach((field) => {
      const value = converted[field] as { toMillis?: () => number } | undefined;
      if (value && typeof value.toMillis === 'function') {
        converted[field] = value.toMillis();
      }
    });

    // Recursively convert nested objects/arrays
    Object.keys(converted).forEach((key) => {
      if (typeof converted[key] === 'object' && converted[key] !== null) {
        converted[key] = convertTimestamps(converted[key]);
      }
    });

    return converted as T;
  }

  return data;
};

type PurchaseRecord = Record<string, unknown>;

type PurchaseFilterState = {
  isAscending?: boolean;
  filters?: PurchaseFilters | null;
};

interface PurchasesListState {
  resolvedQueryKey: string | null;
}

type PurchasesListAction =
  | { type: 'resolveQuery'; queryKey: string | null }
  | { type: 'reset' };

const initialPurchasesListState: PurchasesListState = {
  resolvedQueryKey: null,
};

const purchasesListReducer = (
  state: PurchasesListState,
  action: PurchasesListAction,
): PurchasesListState => {
  switch (action.type) {
    case 'resolveQuery':
      return {
        resolvedQueryKey: action.queryKey,
      };
    case 'reset':
      return initialPurchasesListState;
    default:
      return state;
  }
};

interface PurchaseDetailState {
  purchase: PurchaseRecord | null;
  resolvedPurchaseKey: string | null;
}

type PurchaseDetailAction =
  | {
      type: 'resolvePurchase';
      purchase: PurchaseRecord | null;
      purchaseKey: string | null;
    }
  | { type: 'reset' };

const initialPurchaseDetailState: PurchaseDetailState = {
  purchase: null,
  resolvedPurchaseKey: null,
};

const purchaseDetailReducer = (
  state: PurchaseDetailState,
  action: PurchaseDetailAction,
): PurchaseDetailState => {
  switch (action.type) {
    case 'resolvePurchase':
      return {
        purchase: action.purchase,
        resolvedPurchaseKey: action.purchaseKey,
      };
    case 'reset':
      return initialPurchaseDetailState;
    default:
      return state;
  }
};

export const useListenPurchases = (filterState?: PurchaseFilterState) => {
  const dispatch = useDispatch();
  const purchases = useSelector(selectPurchaseList) as PurchaseRecord[];
  const user = useSelector(selectUser) as UserIdentity | null;
  const [state, dispatchState] = useReducer(
    purchasesListReducer,
    initialPurchasesListState,
  );
  const { resolvedQueryKey } = state;
  const isAscending = filterState?.isAscending;
  const filtersKey = JSON.stringify(filterState?.filters ?? null);
  const currentQueryKey = user?.businessID
    ? `${user.businessID}:${filtersKey}`
    : null;

  const sortedPurchases = useMemo(() => {
    if (!purchases) return [];
    return isAscending !== undefined
      ? sortPurchases(purchases, isAscending)
      : purchases;
  }, [purchases, isAscending]);

  const isLoading =
    currentQueryKey !== null && resolvedQueryKey !== currentQueryKey;

  useEffect(() => {
    if (!user?.businessID) {
      dispatchState({ type: 'reset' });
      return;
    }

    const unsubscribe = subscribeToPurchase(
      user.businessID,
      filterState?.filters ?? null,
      async (snapshot) => {
        try {
          const purchasesList = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const purchaseData = doc.data() as PurchaseRecord;
              const processedData = convertTimestamps(purchaseData);
              return processPurchase(processedData, user.businessID);
            }),
          );

          dispatch(updatePurchases(purchasesList));
        } catch (error) {
          console.error('Error fetching purchases:', error);
        }
        dispatchState({
          type: 'resolveQuery',
          queryKey: currentQueryKey,
        });
      },
    );

    return unsubscribe;
  }, [currentQueryKey, dispatch, filterState?.filters, user?.businessID]);

  return {
    purchases: sortedPurchases,
    isLoading,
  };
};

export const useListenPurchase = (purchaseId: string | null | undefined) => {
  const [state, dispatchState] = useReducer(
    purchaseDetailReducer,
    initialPurchaseDetailState,
  );
  const { purchase, resolvedPurchaseKey } = state;
  const user = useSelector(selectUser) as UserIdentity | null;
  const currentPurchaseKey =
    user?.businessID && purchaseId ? `${user.businessID}:${purchaseId}` : null;
  const isLoading =
    currentPurchaseKey !== null &&
    resolvedPurchaseKey !== currentPurchaseKey;

  useEffect(() => {
    if (!user?.businessID || !purchaseId) {
      dispatchState({ type: 'reset' });
      return;
    }

    const unsubscribe = subscribeSinglePurchase(
      user.businessID,
      purchaseId,
      async (snapshot) => {
        try {
          if (!snapshot.exists()) {
            dispatchState({
              type: 'resolvePurchase',
              purchase: null,
              purchaseKey: currentPurchaseKey,
            });
            return;
          }

          const purchaseData = snapshot.data() as PurchaseRecord;
          const processedData = convertTimestamps(purchaseData);

          dispatchState({
            type: 'resolvePurchase',
            purchase: enrichPurchaseWorkflow(processedData),
            purchaseKey: currentPurchaseKey,
          });
        } catch (error) {
          console.error('Error fetching single purchase:', error);
          dispatchState({
            type: 'resolvePurchase',
            purchase: null,
            purchaseKey: currentPurchaseKey,
          });
        }
      },
    );

    return unsubscribe;
  }, [currentPurchaseKey, purchaseId, user?.businessID]);

  return {
    purchase,
    isLoading,
  };
};
