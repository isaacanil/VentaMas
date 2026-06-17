import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/features/auth/userSlice';
import { fbLoadExpensesForCashCount } from '@/firebase/cashCount/fbLoadExpensesForCashCount';
import type { CashCountExpense } from '@/utils/cashCount/types';

interface ExpensesSnapshotState {
  key: string | null;
  count: number;
  data: CashCountExpense[];
  error: string | null;
}

export const useExpensesForCashCount = (cashCountId?: string | null) => {
  const [snapshot, setSnapshot] = useState<ExpensesSnapshotState>({
    key: null,
    count: 0,
    data: [],
    error: null,
  });
  const user = useSelector(selectUser);

  const queryKey = useMemo(() => {
    if (!user?.businessID || !cashCountId) return null;
    return `${user.businessID}:${cashCountId}`;
  }, [user?.businessID, cashCountId]);

  const loading = Boolean(queryKey) && snapshot.key !== queryKey;

  useEffect(() => {
    if (!queryKey) return;

    const abort = new AbortController();

    void fbLoadExpensesForCashCount(user, cashCountId).then(
      (data) => {
        if (abort.signal.aborted) return;
        setSnapshot({
          key: queryKey,
          count: data.count,
          data: data.data,
          error: data.error ?? null,
        });
      },
      (err) => {
        if (abort.signal.aborted) return;
        const message = err instanceof Error ? err.message : String(err);
        setSnapshot({
          key: queryKey,
          count: 0,
          data: [],
          error: message,
        });
      },
    );

    return () => abort.abort();
  }, [cashCountId, queryKey, user]);

  return {
    count: snapshot.count,
    data: snapshot.data,
    loading,
    error: snapshot.error,
  };
};
