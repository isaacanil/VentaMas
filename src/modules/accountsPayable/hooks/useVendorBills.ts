import { useEffect, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
  DEFAULT_VENDOR_BILL_QUERY_LIMIT,
  MAX_VENDOR_BILL_QUERY_LIMIT,
  subscribeToVendorBills,
} from '@/modules/accountsPayable/repositories/vendorBills.repository';
import type {
  VendorBillFilters,
  VendorBillSnapshotMetadata,
} from '@/modules/accountsPayable/repositories/vendorBills.repository';
import { resolveVendorBillDueAtMillis } from '@/domain/accountsPayable/vendorBills/fromPurchase';
import type { UserIdentity } from '@/types/users';
import { resolveUserIdentityBusinessId } from '@/utils/users/userIdentityAccess';
import type {
  VendorBill,
  VendorBillPaymentControlStatus,
  VendorBillStatus,
} from '@/domain/accountsPayable/vendorBills/types';

const convertTimestamps = <T>(data: T): T => {
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
    dueAtDirection?: 'asc' | 'desc' | null;
    limit?: number | null;
    paymentControlStatus?: VendorBillPaymentControlStatus | null;
    providerId?: string | null;
    statuses?: readonly VendorBillStatus[] | null;
  } | null;
  isAscending?: boolean;
};

interface VendorBillsState {
  errorMessage: string | null;
  isClientFilteredQuery: boolean;
  isQueryLimitReached: boolean;
  queryLimit: number;
  rawDocCount: number;
  vendorBills: VendorBill[];
  resolvedQueryKey: string | null;
}

type VendorBillsAction =
  | {
      type: 'failQuery';
      errorMessage: string;
      isClientFilteredQuery?: boolean;
      queryKey: string | null;
      queryLimit: number;
      rawDocCount?: number;
    }
  | {
      isClientFilteredQuery: boolean;
      type: 'resolveQuery';
      isQueryLimitReached: boolean;
      queryKey: string | null;
      queryLimit: number;
      rawDocCount: number;
      vendorBills: VendorBill[];
    }
  | { type: 'reset' };

const initialVendorBillsState: VendorBillsState = {
  errorMessage: null,
  isClientFilteredQuery: false,
  isQueryLimitReached: false,
  queryLimit: DEFAULT_VENDOR_BILL_QUERY_LIMIT,
  rawDocCount: 0,
  vendorBills: [],
  resolvedQueryKey: null,
};

const vendorBillsReducer = (
  state: VendorBillsState,
  action: VendorBillsAction,
): VendorBillsState => {
  switch (action.type) {
    case 'failQuery':
      return {
        errorMessage: action.errorMessage,
        isClientFilteredQuery: action.isClientFilteredQuery ?? false,
        isQueryLimitReached: false,
        queryLimit: action.queryLimit,
        rawDocCount: action.rawDocCount ?? 0,
        vendorBills: [],
        resolvedQueryKey: action.queryKey,
      };
    case 'resolveQuery':
      return {
        errorMessage: null,
        isClientFilteredQuery: action.isClientFilteredQuery,
        isQueryLimitReached: action.isQueryLimitReached,
        queryLimit: action.queryLimit,
        rawDocCount: action.rawDocCount,
        vendorBills: action.vendorBills,
        resolvedQueryKey: action.queryKey,
      };
    case 'reset':
      return initialVendorBillsState;
    default:
      return state;
  }
};

const resolveVendorBillQueryLimit = (value: number | null | undefined) => {
  if (value == null) return DEFAULT_VENDOR_BILL_QUERY_LIMIT;

  const parsed = Math.trunc(Number(value));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_VENDOR_BILL_QUERY_LIMIT;
  }

  return Math.min(parsed, MAX_VENDOR_BILL_QUERY_LIMIT);
};

const resolveVendorBillSubscriptionErrorMessage = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return 'No se pudo completar la consulta de cuentas por pagar.';
  }

  const typedError = error as { code?: unknown };
  switch (typedError.code) {
    case 'failed-precondition':
      return 'Falta el índice de Firestore.';
    case 'permission-denied':
      return 'Tu usuario no tiene permisos para leer cuentas por pagar de este negocio.';
    case 'unavailable':
      return 'La conexión con Firestore no está disponible en este momento.';
    default:
      return 'No se pudo completar la consulta de cuentas por pagar.';
  }
};

const compareVendorBillReferences = (
  left: VendorBill,
  right: VendorBill,
  isAscending: boolean,
) => {
  const leftReference = Number(left.reference ?? 0);
  const rightReference = Number(right.reference ?? 0);
  if (Number.isFinite(leftReference) && Number.isFinite(rightReference)) {
    return isAscending
      ? leftReference - rightReference
      : rightReference - leftReference;
  }

  return isAscending
    ? String(left.reference ?? '').localeCompare(String(right.reference ?? ''))
    : String(right.reference ?? '').localeCompare(String(left.reference ?? ''));
};

const compareVendorBillsByDueAt = (
  left: VendorBill,
  right: VendorBill,
  isAscending: boolean,
) => {
  const leftDueAt = resolveVendorBillDueAtMillis(left);
  const rightDueAt = resolveVendorBillDueAtMillis(right);

  if (leftDueAt == null && rightDueAt == null) {
    return compareVendorBillReferences(left, right, isAscending);
  }
  if (leftDueAt == null) return 1;
  if (rightDueAt == null) return -1;

  const dueAtComparison = isAscending
    ? leftDueAt - rightDueAt
    : rightDueAt - leftDueAt;

  return (
    dueAtComparison || compareVendorBillReferences(left, right, isAscending)
  );
};

export const useListenVendorBills = (filterState?: VendorBillFilterState) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const businessId = resolveUserIdentityBusinessId(user);
  const [state, dispatchState] = useReducer(
    vendorBillsReducer,
    initialVendorBillsState,
  );
  const {
    errorMessage,
    isClientFilteredQuery,
    isQueryLimitReached,
    queryLimit,
    rawDocCount,
    vendorBills,
    resolvedQueryKey,
  } = state;
  const normalizedFilters = useMemo<VendorBillFilters | null>(() => {
    const baseFilters = filterState?.filters ?? null;
    if (filterState?.isAscending == null) {
      return baseFilters;
    }

    const dueAtDirection = filterState.isAscending ? 'asc' : 'desc';

    return baseFilters
      ? {
          ...baseFilters,
          dueAtDirection,
        }
      : { dueAtDirection };
  }, [filterState?.filters, filterState?.isAscending]);
  const filtersKey = JSON.stringify(normalizedFilters);
  const currentQueryKey = businessId ? `${businessId}:${filtersKey}` : null;
  const isLoading =
    currentQueryKey !== null && resolvedQueryKey !== currentQueryKey;
  const activeErrorMessage =
    resolvedQueryKey === currentQueryKey ? errorMessage : null;
  const isAscending = filterState?.isAscending;
  const currentQueryLimit = resolveVendorBillQueryLimit(
    filterState?.filters?.limit,
  );

  const sortedVendorBills = useMemo(() => {
    if (isAscending == null) return vendorBills;

    return [...vendorBills].sort((left, right) =>
      compareVendorBillsByDueAt(left, right, isAscending),
    );
  }, [isAscending, vendorBills]);

  useEffect(() => {
    if (!businessId) {
      dispatchState({ type: 'reset' });
      return;
    }

    const unsubscribe = subscribeToVendorBills(
      businessId,
      normalizedFilters,
      (snapshot, metadata?: VendorBillSnapshotMetadata) => {
        const nextVendorBills = snapshot.docs.map(
          (snapshotDoc) =>
            convertTimestamps({
              id: snapshotDoc.id,
              ...snapshotDoc.data(),
            }) as VendorBill,
        );
        const readDocCount = metadata?.rawDocCount ?? nextVendorBills.length;

        dispatchState({
          type: 'resolveQuery',
          isClientFilteredQuery: metadata?.isClientFiltered === true,
          isQueryLimitReached:
            metadata?.hasMore ?? readDocCount > currentQueryLimit,
          queryKey: currentQueryKey,
          queryLimit: currentQueryLimit,
          rawDocCount: readDocCount,
          vendorBills: nextVendorBills,
        });
      },
      (error) => {
        console.error(
          'accounts-payable-vendor-bills-subscription-failed',
          error,
        );
        dispatchState({
          type: 'failQuery',
          errorMessage: resolveVendorBillSubscriptionErrorMessage(error),
          queryKey: currentQueryKey,
          queryLimit: currentQueryLimit,
        });
      },
    );

    return unsubscribe;
  }, [
    currentQueryKey,
    currentQueryLimit,
    normalizedFilters,
    businessId,
  ]);

  return {
    errorMessage: activeErrorMessage,
    isClientFilteredQuery,
    isQueryLimitReached,
    isLoading,
    queryLimit,
    rawDocCount,
    vendorBills: sortedVendorBills,
  };
};
