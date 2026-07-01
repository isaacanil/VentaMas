import { useEffect, useMemo, useReducer } from 'react';

import {
  DEFAULT_PAYMENT_RUNS_LIMIT,
  subscribeToAccountsPayablePaymentRunEvents,
  type AccountsPayablePaymentRunEvent,
  type PaymentRunsSnapshotMetadata,
  resolvePaymentRunsLimit,
} from '@/modules/accountsPayable/repositories/paymentRuns.repository';
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

const normalizePaymentRunEvent = (
  id: string,
  value: unknown,
): AccountsPayablePaymentRunEvent =>
  convertTimestamps({
    id,
    ...(value as Record<string, unknown>),
  }) as AccountsPayablePaymentRunEvent;

const sortPaymentRunEvents = (
  events: AccountsPayablePaymentRunEvent[],
): AccountsPayablePaymentRunEvent[] =>
  [...events].sort(
    (left, right) =>
      (toMillis(right.createdAt) ?? 0) - (toMillis(left.createdAt) ?? 0),
  );

const groupEventsByRunId = (
  events: AccountsPayablePaymentRunEvent[],
): Record<string, AccountsPayablePaymentRunEvent[]> =>
  sortPaymentRunEvents(events).reduce<
    Record<string, AccountsPayablePaymentRunEvent[]>
  >((groups, event) => {
    const paymentRunId =
      typeof event.paymentRunId === 'string' ? event.paymentRunId.trim() : '';
    if (!paymentRunId) return groups;

    groups[paymentRunId] = [...(groups[paymentRunId] ?? []), event];
    return groups;
  }, {});

interface UseAccountsPayablePaymentRunEventsOptions {
  limit?: number;
}

interface PaymentRunEventsState {
  error: Error | null;
  events: AccountsPayablePaymentRunEvent[];
  hasMore: boolean;
  queryLimit: number;
  rawDocCount: number;
  resolvedQueryKey: string | null;
}

type PaymentRunEventsAction = {
  type: 'resolveQuery';
  error: Error | null;
  events: AccountsPayablePaymentRunEvent[];
  hasMore: boolean;
  queryKey: string;
  queryLimit: number;
  rawDocCount: number;
};

const initialState: PaymentRunEventsState = {
  error: null,
  events: [],
  hasMore: false,
  queryLimit: DEFAULT_PAYMENT_RUNS_LIMIT,
  rawDocCount: 0,
  resolvedQueryKey: null,
};

const reducer = (
  state: PaymentRunEventsState,
  action: PaymentRunEventsAction,
): PaymentRunEventsState => {
  switch (action.type) {
    case 'resolveQuery':
      return {
        error: action.error,
        events: action.events,
        hasMore: action.hasMore,
        queryLimit: action.queryLimit,
        rawDocCount: action.rawDocCount,
        resolvedQueryKey: action.queryKey,
      };
    default:
      return state;
  }
};

export const useAccountsPayablePaymentRunEvents = (
  businessId: string | null | undefined,
  isOpen: boolean,
  options: UseAccountsPayablePaymentRunEventsOptions = {},
) => {
  const [state, dispatchState] = useReducer(reducer, initialState);
  const currentQueryLimit = resolvePaymentRunsLimit(options.limit);
  const currentQueryKey =
    businessId && isOpen
      ? `${businessId}:${currentQueryLimit}`
      : null;
  const hasResolvedCurrentQuery =
    currentQueryKey !== null && state.resolvedQueryKey === currentQueryKey;
  const loading =
    currentQueryKey !== null && state.resolvedQueryKey !== currentQueryKey;
  const visibleEvents = useMemo(
    () => (hasResolvedCurrentQuery ? sortPaymentRunEvents(state.events) : []),
    [hasResolvedCurrentQuery, state.events],
  );
  const eventsByPaymentRunId = useMemo(
    () => groupEventsByRunId(visibleEvents),
    [visibleEvents],
  );

  useEffect(() => {
    if (!businessId || !isOpen || !currentQueryKey) {
      return undefined;
    }

    return subscribeToAccountsPayablePaymentRunEvents(
      businessId,
      (snapshot, metadata?: PaymentRunsSnapshotMetadata) => {
        const nextEvents = snapshot.docs.map((docSnap) =>
          normalizePaymentRunEvent(docSnap.id, docSnap.data()),
        );
        const readDocCount = metadata?.rawDocCount ?? nextEvents.length;

        dispatchState({
          type: 'resolveQuery',
          error: null,
          events: nextEvents,
          hasMore: metadata?.hasMore ?? readDocCount > currentQueryLimit,
          queryKey: currentQueryKey,
          queryLimit: currentQueryLimit,
          rawDocCount: readDocCount,
        });
      },
      (error) => {
        console.error('Error fetching accounts payable payment run events:', error);
        dispatchState({
          type: 'resolveQuery',
          error: error instanceof Error ? error : new Error(String(error)),
          events: [],
          hasMore: false,
          queryKey: currentQueryKey,
          queryLimit: currentQueryLimit,
          rawDocCount: 0,
        });
      },
      { limit: currentQueryLimit },
    );
  }, [businessId, currentQueryKey, currentQueryLimit, isOpen]);

  return {
    error: hasResolvedCurrentQuery ? state.error : null,
    events: visibleEvents,
    eventsByPaymentRunId,
    hasMore: hasResolvedCurrentQuery ? state.hasMore : false,
    loading,
    queryLimit: currentQueryLimit,
    rawDocCount: hasResolvedCurrentQuery ? state.rawDocCount : 0,
  };
};
