import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
  selectExpenseList,
  setExpenseList,
} from '@/features/expense/expensesListSlice';
import { db } from '@/firebase/firebaseconfig';
import { toMillis } from '@/utils/date/toMillis';
import type { TimestampLike } from '@/utils/date/types';
import { normalizeExpenseDates } from '@/utils/expenses/normalize';
import type { ExpenseDoc } from '@/utils/expenses/types';

const SHARED_SCOPE = 'shared';
const LOCAL_SCOPE = 'local';

type ExpensesScope = typeof SHARED_SCOPE | typeof LOCAL_SCOPE;

interface ExpenseRange {
  startDate?: TimestampLike | Date | number | null;
  endDate?: TimestampLike | Date | number | null;
}

interface UseExpensesOptions {
  scope?: ExpensesScope;
}

interface UseExpensesResult {
  expenses: ExpenseDoc[];
  loading: boolean;
  error: unknown;
}

export const useFbGetExpenses = (
  range?: ExpenseRange,
  options: UseExpensesOptions = {},
): UseExpensesResult => {
  const { scope = SHARED_SCOPE } = options;
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const sharedExpenses = useSelector(selectExpenseList) as ExpenseDoc[];

  const [localExpenses, setLocalExpenses] = useState<ExpenseDoc[]>([]);
  const [snapshotState, setSnapshotState] = useState<{
    loadedKey: string | null;
    error: unknown;
  }>({
    loadedKey: null,
    error: null,
  });

  const rangeStart = useMemo(
    () => toMillis(range?.startDate),
    [range?.startDate],
  );
  const rangeEnd = useMemo(() => toMillis(range?.endDate), [range?.endDate]);

  const setSharedExpenses = useCallback(
    (list: ExpenseDoc[]) => {
      dispatch(setExpenseList(list));
    },
    [dispatch],
  );

  const setExpensesByScope = useCallback(
    (list: ExpenseDoc[]) => {
      if (scope === SHARED_SCOPE) setSharedExpenses(list);
      else setLocalExpenses(list);
    },
    [scope, setSharedExpenses],
  );

  const queryKey = `${user?.businessID ?? ''}|${rangeStart}|${rangeEnd}|${scope}`;

  useEffect(() => {
    if (!user?.businessID) return;

    const expensesRef = collection(
      db,
      'businesses',
      user.businessID,
      'expenses',
    );

    const constraints = [] as Array<ReturnType<typeof where>>;
    if (Number.isFinite(rangeStart) && Number.isFinite(rangeEnd)) {
      constraints.push(
        where('expense.dates.expenseDate', '>=', rangeStart),
        where('expense.dates.expenseDate', '<=', rangeEnd),
      );
    }

    const expensesQuery = constraints.length
      ? query(expensesRef, ...constraints)
      : query(expensesRef);

    // ✅ setState solo dentro del callback del listener (external system)
    const unsubscribe = onSnapshot(
      expensesQuery,
      (snapshot) => {
        const list: ExpenseDoc[] = snapshot.docs.map((docSnapshot) => {
          const expense = docSnapshot.data()?.expense ?? {};
          const normalized = normalizeExpenseDates(expense);

          return {
            id: docSnapshot.id,
            expense: normalized,
          };
        });

        setExpensesByScope(list);
        setSnapshotState({
          loadedKey: queryKey,
          error: null,
        });
      },
      (listenerError) => {
        console.error('Error fetching expenses: ', listenerError);
        setSnapshotState({
          loadedKey: queryKey,
          error: listenerError,
        });
      },
    );

    return unsubscribe;
  }, [user?.businessID, rangeStart, rangeEnd, setExpensesByScope, queryKey]);

  const expenses = scope === SHARED_SCOPE ? sharedExpenses : localExpenses;

  const hasBusiness = Boolean(user?.businessID);
  const loading = hasBusiness && snapshotState.loadedKey !== queryKey;
  const error =
    hasBusiness && snapshotState.loadedKey === queryKey
      ? snapshotState.error
      : null;

  return {
    expenses: hasBusiness ? (loading ? [] : expenses) : [],
    loading: hasBusiness ? loading : false,
    error,
  };
};

export const useLocalFbGetExpenses = (
  range?: ExpenseRange,
): UseExpensesResult => useFbGetExpenses(range, { scope: LOCAL_SCOPE });
