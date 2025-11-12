import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '../../../features/auth/userSlice';
import {
  selectExpenseList,
  setExpenseList,
} from '../../../features/expense/expensesListSlice';
import { toMillis } from '../../../utils/date/toMillis';
import { db } from '../../firebaseconfig';

const SHARED_SCOPE = 'shared';
const LOCAL_SCOPE = 'local';

export const useFbGetExpenses = (range, options = {}) => {
  const { scope = SHARED_SCOPE } = options;

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const sharedExpenses = useSelector(selectExpenseList);

  const [localExpenses, setLocalExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const rangeStart = useMemo(
    () => toMillis(range?.startDate),
    [range?.startDate],
  );
  const rangeEnd = useMemo(() => toMillis(range?.endDate), [range?.endDate]);

  const setSharedExpenses = useCallback(
    (list) => {
      dispatch(setExpenseList(list));
    },
    [dispatch],
  );

  const setExpensesByScope = useCallback(
    (list) => {
      if (scope === SHARED_SCOPE) {
        setSharedExpenses(list);
      } else {
        setLocalExpenses(list);
      }
    },
    [scope, setSharedExpenses],
  );

  useEffect(() => {
    if (!user?.businessID) {
      setLoading(false);
      setError(null);
      setExpensesByScope([]);
      return undefined;
    }

    const expensesRef = collection(
      db,
      'businesses',
      user.businessID,
      'expenses',
    );

    const constraints = [];
    if (Number.isFinite(rangeStart) && Number.isFinite(rangeEnd)) {
      constraints.push(
        where('expense.dates.expenseDate', '>=', rangeStart),
        where('expense.dates.expenseDate', '<=', rangeEnd),
      );
    }

    const expensesQuery = constraints.length
      ? query(expensesRef, ...constraints)
      : query(expensesRef);

    if (scope === LOCAL_SCOPE) {
      setLocalExpenses([]);
    }
    setLoading(true);

    const normalizeDate = (...candidates) => {
      for (const candidate of candidates) {
        const millis = toMillis(candidate);
        if (Number.isFinite(millis)) {
          return millis;
        }
      }
      return null;
    };

    const unsubscribe = onSnapshot(
      expensesQuery,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => {
          const expense = doc.data()?.expense ?? {};
          const dates = expense.dates ?? {};

          return {
            id: doc.id,
            expense: {
              ...expense,
              dates: {
                ...dates,
                createdAt: normalizeDate(
                  dates.createdAt,
                  expense.createdAt,
                  expense.updatedAt,
                ),
                expenseDate: normalizeDate(
                  dates.expenseDate,
                  dates.createdAt,
                  expense.expenseDate,
                  expense.createdAt,
                  doc.createTime?.toMillis?.(),
                ),
              },
            },
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

    return () => {
      unsubscribe();
    };
  }, [user?.businessID, rangeStart, rangeEnd, scope, setExpensesByScope]);

  const expenses = scope === SHARED_SCOPE ? sharedExpenses : localExpenses;

  return { expenses, loading, error };
};

export const useLocalFbGetExpenses = (range) =>
  useFbGetExpenses(range, { scope: LOCAL_SCOPE });
