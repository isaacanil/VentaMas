import { useEffect, useMemo, useReducer } from 'react';

import {
  DEFAULT_PAYMENT_RUNS_LIMIT,
  subscribeToAccountsPayablePaymentRuns,
  type AccountsPayablePaymentRun,
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

const normalizePaymentRun = (
  id: string,
  value: unknown,
): AccountsPayablePaymentRun =>
  convertTimestamps({
    id,
    ...(value as Record<string, unknown>),
  }) as AccountsPayablePaymentRun;

const sortPaymentRuns = (
  runs: AccountsPayablePaymentRun[],
): AccountsPayablePaymentRun[] =>
  [...runs].sort(
    (left, right) =>
      (toMillis(right.createdAt) ?? 0) - (toMillis(left.createdAt) ?? 0),
  );

interface UseAccountsPayablePaymentRunsOptions {
  limit?: number;
}

interface AccountsPayablePaymentRunsState {
  error: Error | null;
  hasMore: boolean;
  queryLimit: number;
  rawDocCount: number;
  resolvedQueryKey: string | null;
  runs: AccountsPayablePaymentRun[];
}

type AccountsPayablePaymentRunsAction = {
  type: 'resolveQuery';
  error: Error | null;
  hasMore: boolean;
  queryKey: string;
  queryLimit: number;
  rawDocCount: number;
  runs: AccountsPayablePaymentRun[];
};

const initialState: AccountsPayablePaymentRunsState = {
  error: null,
  hasMore: false,
  queryLimit: DEFAULT_PAYMENT_RUNS_LIMIT,
  rawDocCount: 0,
  resolvedQueryKey: null,
  runs: [],
};

const reducer = (
  state: AccountsPayablePaymentRunsState,
  action: AccountsPayablePaymentRunsAction,
): AccountsPayablePaymentRunsState => {
  switch (action.type) {
    case 'resolveQuery':
      return {
        error: action.error,
        hasMore: action.hasMore,
        queryLimit: action.queryLimit,
        rawDocCount: action.rawDocCount,
        resolvedQueryKey: action.queryKey,
        runs: action.runs,
      };
    default:
      return state;
  }
};

export const useAccountsPayablePaymentRuns = (
  businessId: string | null | undefined,
  isOpen: boolean,
  options: UseAccountsPayablePaymentRunsOptions = {},
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
  const visibleRuns = useMemo(
    () => (hasResolvedCurrentQuery ? sortPaymentRuns(state.runs) : []),
    [hasResolvedCurrentQuery, state.runs],
  );

  useEffect(() => {
    if (!businessId || !isOpen || !currentQueryKey) {
      return undefined;
    }

    return subscribeToAccountsPayablePaymentRuns(
      businessId,
      (snapshot, metadata?: PaymentRunsSnapshotMetadata) => {
        const nextRuns = snapshot.docs.map((docSnap) =>
          normalizePaymentRun(docSnap.id, docSnap.data()),
        );
        const readDocCount = metadata?.rawDocCount ?? nextRuns.length;

        dispatchState({
          type: 'resolveQuery',
          error: null,
          hasMore: metadata?.hasMore ?? readDocCount > currentQueryLimit,
          queryKey: currentQueryKey,
          queryLimit: currentQueryLimit,
          rawDocCount: readDocCount,
          runs: nextRuns,
        });
      },
      (error) => {
        console.error('Error fetching accounts payable payment runs:', error);
        dispatchState({
          type: 'resolveQuery',
          error: error instanceof Error ? error : new Error(String(error)),
          hasMore: false,
          queryKey: currentQueryKey,
          queryLimit: currentQueryLimit,
          rawDocCount: 0,
          runs: [],
        });
      },
      { limit: currentQueryLimit },
    );
  }, [businessId, currentQueryKey, currentQueryLimit, isOpen]);

  return {
    error: hasResolvedCurrentQuery ? state.error : null,
    hasMore: hasResolvedCurrentQuery ? state.hasMore : false,
    loading,
    queryLimit: currentQueryLimit,
    rawDocCount: hasResolvedCurrentQuery ? state.rawDocCount : 0,
    runs: visibleRuns,
  };
};
