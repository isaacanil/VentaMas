import { useEffect, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../features/auth/userSlice';
import { subscribeToVendorBills } from '../firebase/vendorBills/fbGetVendorBills';
import type { UserIdentity } from '@/types/users';
import type { VendorBill } from '@/utils/vendorBills/types';

const convertTimestamps = <T,>(data: T): T => {
  if (!data) return data;

  const timestampFields = [
    'createdAt',
    'updatedAt',
    'deliveryAt',
    'paymentAt',
    'completedAt',
    'expirationDate',
    'issueAt',
    'dueAt',
    'postedAt',
    'lastPaymentAt',
    'nextPaymentAt',
    'occurredAt',
  ];

  if (Array.isArray(data)) {
    return data.map((item) => convertTimestamps(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const converted = { ...(data as Record<string, unknown>) };

    timestampFields.forEach((field) => {
      const value = converted[field] as { toMillis?: () => number } | undefined;
      if (value && typeof value.toMillis === 'function') {
        converted[field] = value.toMillis();
      }
    });

    Object.keys(converted).forEach((key) => {
      if (typeof converted[key] === 'object' && converted[key] !== null) {
        converted[key] = convertTimestamps(converted[key]);
      }
    });

    return converted as T;
  }

  return data;
};

type VendorBillFilterState = {
  filters?: {
    condition?: string | null;
    providerId?: string | null;
  } | null;
  isAscending?: boolean;
};

interface VendorBillsState {
  vendorBills: VendorBill[];
  resolvedQueryKey: string | null;
}

type VendorBillsAction =
  | {
      type: 'resolveQuery';
      queryKey: string | null;
      vendorBills: VendorBill[];
    }
  | { type: 'reset' };

const initialVendorBillsState: VendorBillsState = {
  vendorBills: [],
  resolvedQueryKey: null,
};

const vendorBillsReducer = (
  state: VendorBillsState,
  action: VendorBillsAction,
): VendorBillsState => {
  switch (action.type) {
    case 'resolveQuery':
      return {
        vendorBills: action.vendorBills,
        resolvedQueryKey: action.queryKey,
      };
    case 'reset':
      return initialVendorBillsState;
    default:
      return state;
  }
};

export const useListenVendorBills = (filterState?: VendorBillFilterState) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const [state, dispatchState] = useReducer(
    vendorBillsReducer,
    initialVendorBillsState,
  );
  const { vendorBills, resolvedQueryKey } = state;
  const filtersKey = JSON.stringify(filterState?.filters ?? null);
  const currentQueryKey = user?.businessID
    ? `${user.businessID}:${filtersKey}`
    : null;
  const isLoading =
    currentQueryKey !== null && resolvedQueryKey !== currentQueryKey;

  const sortedVendorBills = useMemo(() => {
    if (filterState?.isAscending == null) return vendorBills;

    return [...vendorBills].sort((left, right) => {
      const leftReference = Number(left.reference ?? 0);
      const rightReference = Number(right.reference ?? 0);
      if (Number.isFinite(leftReference) && Number.isFinite(rightReference)) {
        return filterState.isAscending
          ? leftReference - rightReference
          : rightReference - leftReference;
      }

      return filterState.isAscending
        ? String(left.reference ?? '').localeCompare(String(right.reference ?? ''))
        : String(right.reference ?? '').localeCompare(String(left.reference ?? ''));
    });
  }, [filterState?.isAscending, vendorBills]);

  useEffect(() => {
    if (!user?.businessID) {
      dispatchState({ type: 'reset' });
      return;
    }

    const unsubscribe = subscribeToVendorBills(
      user.businessID,
      filterState?.filters ?? null,
      (snapshot) => {
        const nextVendorBills = snapshot.docs.map((snapshotDoc) =>
          convertTimestamps({
            id: snapshotDoc.id,
            ...snapshotDoc.data(),
          }) as VendorBill,
        );

        dispatchState({
          type: 'resolveQuery',
          queryKey: currentQueryKey,
          vendorBills: nextVendorBills,
        });
      },
    );

    return unsubscribe;
  }, [currentQueryKey, filterState?.filters, user?.businessID]);

  return {
    vendorBills: sortedVendorBills,
    isLoading,
  };
};
