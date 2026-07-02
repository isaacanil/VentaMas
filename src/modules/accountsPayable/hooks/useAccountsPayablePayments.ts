import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useReducer } from 'react';

import { db } from '@/firebase/firebaseconfig';
import type { AccountsPayablePayment } from '@/types/payments';
import { toMillis } from '@/utils/date/toMillis';

import {
  shouldShowAccountsPayablePayment,
  type AccountsPayablePaymentVisibilityOptions,
} from '../utils/accountsPayablePaymentStatus';

export { shouldShowAccountsPayablePayment } from '../utils/accountsPayablePaymentStatus';

const normalizeAccountsPayablePayment = (
  id: string,
  value: unknown,
): AccountsPayablePayment => ({
  ...(value as AccountsPayablePayment),
  id,
});

interface AccountsPayablePaymentsState {
  error: Error | null;
  payments: AccountsPayablePayment[];
  resolvedQueryKey: string | null;
}

type AccountsPayablePaymentsAction = {
  type: 'resolveQuery';
  error: Error | null;
  payments: AccountsPayablePayment[];
  queryKey: string;
};

const initialState: AccountsPayablePaymentsState = {
  error: null,
  payments: [],
  resolvedQueryKey: null,
};

const reducer = (
  state: AccountsPayablePaymentsState,
  action: AccountsPayablePaymentsAction,
): AccountsPayablePaymentsState => {
  switch (action.type) {
    case 'resolveQuery':
      return {
        error: action.error,
        payments: action.payments,
        resolvedQueryKey: action.queryKey,
      };
    default:
      return state;
  }
};

const sortAccountsPayablePayments = (
  payments: AccountsPayablePayment[],
): AccountsPayablePayment[] =>
  [...payments].sort(
    (left, right) =>
      (toMillis(right.occurredAt) ?? toMillis(right.createdAt) ?? 0) -
      (toMillis(left.occurredAt) ?? toMillis(left.createdAt) ?? 0),
  );

export const useAccountsPayablePayments = (
  businessId: string | null | undefined,
  purchaseId: string | null | undefined,
  isOpen: boolean,
  options: AccountsPayablePaymentVisibilityOptions = {},
) => {
  const [state, dispatchState] = useReducer(reducer, initialState);
  const includeVoided = options.includeVoided === true;
  const currentQueryKey =
    businessId && purchaseId && isOpen
      ? `${businessId}:${purchaseId}:${includeVoided ? 'with-voided' : 'open'}`
      : null;
  const hasResolvedCurrentQuery =
    currentQueryKey !== null && state.resolvedQueryKey === currentQueryKey;
  const loading =
    currentQueryKey !== null && state.resolvedQueryKey !== currentQueryKey;
  const visiblePayments = useMemo(
    () => (hasResolvedCurrentQuery ? state.payments : []),
    [hasResolvedCurrentQuery, state.payments],
  );

  useEffect(() => {
    if (!businessId || !purchaseId || !isOpen || !currentQueryKey) {
      return undefined;
    }

    const paymentsRef = collection(
      db,
      'businesses',
      businessId,
      'accountsPayablePayments',
    );
    const paymentsQuery = query(
      paymentsRef,
      where('purchaseId', '==', purchaseId),
    );

    const unsubscribe = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        const nextPayments = snapshot.docs
          .map((docSnap) =>
            normalizeAccountsPayablePayment(docSnap.id, docSnap.data()),
          )
          .filter((payment) =>
            shouldShowAccountsPayablePayment(payment, { includeVoided }),
          );

        dispatchState({
          type: 'resolveQuery',
          error: null,
          payments: sortAccountsPayablePayments(nextPayments),
          queryKey: currentQueryKey,
        });
      },
      (error) => {
        console.error('Error fetching accounts payable payments:', error);
        dispatchState({
          type: 'resolveQuery',
          error: error instanceof Error ? error : new Error(String(error)),
          payments: [],
          queryKey: currentQueryKey,
        });
      },
    );

    return unsubscribe;
  }, [businessId, currentQueryKey, includeVoided, isOpen, purchaseId]);

  return {
    error: hasResolvedCurrentQuery ? state.error : null,
    payments: visiblePayments,
    loading,
  };
};
