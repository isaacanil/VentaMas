import { useEffect, useMemo, useReducer } from 'react';

import { subscribeToVendorBillControlEvents } from '@/modules/accountsPayable/repositories/vendorBillControlEvents.repository';
import type { VendorBillControlEvent } from '@/domain/accountsPayable/vendorBills/types';
import { toMillis } from '@/utils/date/toMillis';

const convertTimestamps = <T>(data: T): T => {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map((item) => convertTimestamps(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const converted = { ...(data as Record<string, unknown>) };

    Object.keys(converted).forEach((key) => {
      const value = converted[key] as { toMillis?: () => number } | undefined;
      if (value && typeof value.toMillis === 'function') {
        converted[key] = value.toMillis();
        return;
      }

      if (typeof value === 'object' && value !== null) {
        converted[key] = convertTimestamps(value);
      }
    });

    return converted as T;
  }

  return data;
};

const normalizeControlEvent = (
  id: string,
  value: unknown,
): VendorBillControlEvent =>
  convertTimestamps({
    id,
    ...(value as Record<string, unknown>),
  }) as VendorBillControlEvent;

const sortControlEvents = (
  events: VendorBillControlEvent[],
): VendorBillControlEvent[] =>
  [...events].sort(
    (left, right) =>
      (toMillis(right.createdAt) ?? 0) - (toMillis(left.createdAt) ?? 0),
  );

interface UseVendorBillControlEventsOptions {
  limit?: number;
}

interface VendorBillControlEventsState {
  error: Error | null;
  events: VendorBillControlEvent[];
  resolvedQueryKey: string | null;
}

type VendorBillControlEventsAction = {
  type: 'resolveQuery';
  error: Error | null;
  events: VendorBillControlEvent[];
  queryKey: string;
};

const initialState: VendorBillControlEventsState = {
  error: null,
  events: [],
  resolvedQueryKey: null,
};

const reducer = (
  state: VendorBillControlEventsState,
  action: VendorBillControlEventsAction,
): VendorBillControlEventsState => {
  switch (action.type) {
    case 'resolveQuery':
      return {
        error: action.error,
        events: action.events,
        resolvedQueryKey: action.queryKey,
      };
    default:
      return state;
  }
};

export const useVendorBillControlEvents = (
  businessId: string | null | undefined,
  vendorBillId: string | null | undefined,
  isOpen: boolean,
  options: UseVendorBillControlEventsOptions = {},
) => {
  const [state, dispatchState] = useReducer(reducer, initialState);
  const currentQueryKey =
    businessId && vendorBillId && isOpen
      ? `${businessId}:${vendorBillId}`
      : null;
  const hasResolvedCurrentQuery =
    currentQueryKey !== null && state.resolvedQueryKey === currentQueryKey;
  const loading =
    currentQueryKey !== null && state.resolvedQueryKey !== currentQueryKey;

  const visibleEvents = useMemo(() => {
    if (!hasResolvedCurrentQuery) return [];

    const sortedEvents = sortControlEvents(state.events);
    return options.limit ? sortedEvents.slice(0, options.limit) : sortedEvents;
  }, [hasResolvedCurrentQuery, options.limit, state.events]);

  useEffect(() => {
    if (!businessId || !vendorBillId || !isOpen || !currentQueryKey) {
      return undefined;
    }

    return subscribeToVendorBillControlEvents(
      businessId,
      vendorBillId,
      (snapshot) => {
        dispatchState({
          type: 'resolveQuery',
          error: null,
          events: snapshot.docs.map((docSnap) =>
            normalizeControlEvent(docSnap.id, docSnap.data()),
          ),
          queryKey: currentQueryKey,
        });
      },
      (error) => {
        console.error('Error fetching vendor bill control events:', error);
        dispatchState({
          type: 'resolveQuery',
          error: error instanceof Error ? error : new Error(String(error)),
          events: [],
          queryKey: currentQueryKey,
        });
      },
      { limit: options.limit },
    );
  }, [businessId, currentQueryKey, isOpen, options.limit, vendorBillId]);

  return {
    error: hasResolvedCurrentQuery ? state.error : null,
    events: visibleEvents,
    loading,
  };
};
