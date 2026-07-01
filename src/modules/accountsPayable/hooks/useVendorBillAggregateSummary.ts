import { useEffect, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
  fetchVendorBillAgingAggregateSummary,
  type VendorBillAgingAggregateSummary,
  type VendorBillFilters,
} from '@/modules/accountsPayable/repositories/vendorBills.repository';
import type {
  VendorBillPaymentControlStatus,
  VendorBillStatus,
} from '@/domain/accountsPayable/vendorBills/types';
import type { UserIdentity } from '@/types/users';
import { resolveUserIdentityBusinessId } from '@/utils/users/userIdentityAccess';

type VendorBillAggregateFilterState = {
  filters?: {
    condition?: string | null;
    dueAtDirection?: 'asc' | 'desc' | null;
    limit?: number | null;
    paymentControlStatus?: VendorBillPaymentControlStatus | null;
    providerId?: string | null;
    statuses?: readonly VendorBillStatus[] | null;
  } | null;
};

interface VendorBillAggregateHookOptions {
  enabled?: boolean;
}

interface VendorBillAggregateState {
  errorMessage: string | null;
  isLoading: boolean;
  queryKey: string | null;
  summary: VendorBillAgingAggregateSummary | null;
}

type VendorBillAggregateAction =
  | { queryKey: string; type: 'start' }
  | {
      queryKey: string;
      summary: VendorBillAgingAggregateSummary;
      type: 'resolve';
    }
  | { errorMessage: string; queryKey: string; type: 'fail' }
  | { type: 'reset' };

const initialVendorBillAggregateState: VendorBillAggregateState = {
  errorMessage: null,
  isLoading: false,
  queryKey: null,
  summary: null,
};

const vendorBillAggregateReducer = (
  state: VendorBillAggregateState,
  action: VendorBillAggregateAction,
): VendorBillAggregateState => {
  switch (action.type) {
    case 'start':
      return {
        errorMessage: null,
        isLoading: true,
        queryKey: action.queryKey,
        summary: null,
      };
    case 'resolve':
      return {
        errorMessage: null,
        isLoading: false,
        queryKey: action.queryKey,
        summary: action.summary,
      };
    case 'fail':
      return {
        errorMessage: action.errorMessage,
        isLoading: false,
        queryKey: action.queryKey,
        summary: null,
      };
    case 'reset':
      return initialVendorBillAggregateState;
    default:
      return state;
  }
};

const resolveVendorBillAggregateErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== 'object') {
    return 'No se pudieron calcular los agregados de CxP.';
  }

  const typedError = error as { code?: unknown };
  switch (typedError.code) {
    case 'failed-precondition':
      return 'Falta un indice de Firestore para calcular los agregados de CxP.';
    case 'permission-denied':
      return 'Tu usuario no tiene permisos para calcular agregados de CxP.';
    case 'unavailable':
      return 'La conexion con Firestore no esta disponible para los agregados de CxP.';
    default:
      return 'No se pudieron calcular los agregados de CxP.';
  }
};

const normalizeAggregateFilters = (
  filters: VendorBillAggregateFilterState['filters'],
): VendorBillFilters | null => {
  if (!filters) return null;

  const normalized: VendorBillFilters = {};

  if (filters.condition) normalized.condition = filters.condition;
  if (filters.paymentControlStatus) {
    normalized.paymentControlStatus = filters.paymentControlStatus;
  }
  if (filters.providerId) normalized.providerId = filters.providerId;
  if (filters.statuses != null) normalized.statuses = filters.statuses;

  return Object.keys(normalized).length ? normalized : null;
};

export const useVendorBillAggregateSummary = (
  filterState?: VendorBillAggregateFilterState,
  options?: VendorBillAggregateHookOptions,
) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const businessId = resolveUserIdentityBusinessId(user);
  const enabled = options?.enabled !== false;
  const rawFiltersKey = JSON.stringify(filterState?.filters ?? null);
  const aggregateFilters = useMemo(() => {
    const parsedFilters = JSON.parse(
      rawFiltersKey,
    ) as VendorBillAggregateFilterState['filters'] | null;

    return normalizeAggregateFilters(parsedFilters);
  }, [rawFiltersKey]);
  const filtersKey = JSON.stringify(aggregateFilters);
  const currentQueryKey =
    enabled && businessId ? `${businessId}:${filtersKey}` : null;
  const [state, dispatchState] = useReducer(
    vendorBillAggregateReducer,
    initialVendorBillAggregateState,
  );

  useEffect(() => {
    if (!currentQueryKey || !businessId) {
      dispatchState({ type: 'reset' });
      return;
    }

    let isActive = true;
    dispatchState({ queryKey: currentQueryKey, type: 'start' });

    fetchVendorBillAgingAggregateSummary(businessId, aggregateFilters)
      .then((summary) => {
        if (!isActive) return;
        dispatchState({ queryKey: currentQueryKey, summary, type: 'resolve' });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        console.error('accounts-payable-aggregate-summary-failed', error);
        dispatchState({
          errorMessage: resolveVendorBillAggregateErrorMessage(error),
          queryKey: currentQueryKey,
          type: 'fail',
        });
      });

    return () => {
      isActive = false;
    };
  }, [aggregateFilters, businessId, currentQueryKey]);

  const hasCurrentQuery = state.queryKey === currentQueryKey;

  return {
    errorMessage: hasCurrentQuery ? state.errorMessage : null,
    isLoading: hasCurrentQuery ? state.isLoading : Boolean(currentQueryKey),
    summary: hasCurrentQuery ? state.summary : null,
  };
};
