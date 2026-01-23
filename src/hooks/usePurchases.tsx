import { useEffect, useMemo, useState } from 'react';
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

export const useListenPurchases = (filterState?: PurchaseFilterState) => {
  const dispatch = useDispatch();
  const purchases = useSelector(selectPurchaseList) as PurchaseRecord[];
  const user = useSelector(selectUser) as UserIdentity | null;
  const [isLoading, setIsLoading] = useState(false);

  const sortedPurchases = useMemo(() => {
    if (!purchases) return [];
    return filterState?.isAscending !== undefined
      ? sortPurchases(purchases, filterState.isAscending)
      : purchases;
  }, [purchases, filterState?.isAscending]);

  useEffect(() => {
    if (!user?.businessID) return;

    setIsLoading(true);

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
        } finally {
          setIsLoading(false);
        }
      },
    );

    return () => {
      unsubscribe();
      setIsLoading(false);
    };
  }, [user?.businessID, filterState?.filters, dispatch]);

  return {
    purchases: sortedPurchases,
    isLoading,
  };
};

export const useListenPurchase = (purchaseId: string | null | undefined) => {
  const [purchase, setPurchase] = useState<PurchaseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const user = useSelector(selectUser) as UserIdentity | null;

  useEffect(() => {
    if (!user?.businessID || !purchaseId) return;

    setIsLoading(true);

    const unsubscribe = subscribeSinglePurchase(
      user.businessID,
      purchaseId,
      async (snapshot) => {
        try {
          if (!snapshot.exists()) {
            setPurchase(null);
            return;
          }

          const purchaseData = snapshot.data() as PurchaseRecord;
          const processedData = convertTimestamps(purchaseData);

          setPurchase(processedData);
        } catch (error) {
          console.error('Error fetching single purchase:', error);
          setPurchase(null);
        } finally {
          setIsLoading(false);
        }
      },
    );

    return () => {
      unsubscribe();
      setIsLoading(false);
    };
  }, [user?.businessID, purchaseId]);

  return {
    purchase,
    isLoading,
  };
};
