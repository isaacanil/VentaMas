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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

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

  // ✅ “Key” reactiva para detectar cambios (business/range/scope)
  const queryKey = `${user?.businessID ?? ''}|${rangeStart}|${rangeEnd}|${scope}`;
  const [prevKey, setPrevKey] = useState(queryKey);

  // ✅ Patrón de la doc: setState condicional basado en “prev vs current”
  if (queryKey !== prevKey) {
    setPrevKey(queryKey);
    setError(null);

    if (!user?.businessID) {
      setLoading(false);
      if (scope === LOCAL_SCOPE) setLocalExpenses([]);
    } else {
      setLoading(true);
    }
  }

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
        setError(null);
        setLoading(false);
      },
      (listenerError) => {
        console.error('Error fetching expenses: ', listenerError);
        setError(listenerError);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user?.businessID, rangeStart, rangeEnd, setExpensesByScope]);

  const expenses = scope === SHARED_SCOPE ? sharedExpenses : localExpenses;

  // ✅ si no hay business, no “toques” estado: solo devuelve vacío
  const hasBusiness = Boolean(user?.businessID);
  return {
    expenses: hasBusiness ? (loading ? [] : expenses) : [],
    loading: hasBusiness ? loading : false,
    error: hasBusiness ? error : null,
  };
};

export const useLocalFbGetExpenses = (range?: ExpenseRange): UseExpensesResult =>
  useFbGetExpenses(range, { scope: LOCAL_SCOPE });
